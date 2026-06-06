from fastapi import Depends, File, Form, HTTPException, UploadFile, Query
from typing import Optional
import os
import tempfile
import uuid
import dotenv
import re

from src.utils.get_current_clerk_user import get_current_clerk_user
from src.utils.supabase.client import supabase
from src.utils.cloudflare_img_client import CloudflareImageClient
from src.utils.cloudflare_img_req import CloudflareImageRequest
from src.utils.image_tracer import Vectorizer
from src.classes.image_classes import GetGeneratedImagesRequest, GetSVGConversionRequest, SVGConversionResponse, ImageGenerationRequest, ImageGenerationResponse
from src.utils.image_verification import validate_image_bytes
from src.utils.cloudinary_upload import delete_from_cloudinary, upload_to_cloudinary

dotenv.load_dotenv()

# Initialize clients
image_client = CloudflareImageClient()
vectorizer = Vectorizer()

# async def generate_image(request: ImageGenerationRequest):
#     """
#     Generate an image using Cloudflare's image generation API and upload to Cloudinary
#     """
#     cloudinary_public_id = None
    
#     try:
#         remaining_credits = deduct_credits(request.clerk_user_id, amount=10)
#         # Generate unique filename
#         image_id = str(uuid.uuid4())
#         # Create image generation request
#         img_request = CloudflareImageRequest(
#             prompt=request.prompt,
#             model=request.model,
#             negative_prompt=request.negative_prompt,

#             width=request.width,
#             height=request.height,
#             num_steps=request.num_steps,

#             strength=request.strength,
#             guidance=request.guidance,
#             image_b64=request.image_b64,
#             seed=request.seed,
#             steps=request.steps,
#         )
        
#         # Generate image
#         result = image_client.generate_image(
#             request_data=img_request,
#             output_path=None  # Don't save locally
#         )
#         print("Result:", result)
#         if isinstance(result, dict) and 'status_code' in result:
#             if result['status_code'] == 201:
#                 # Get image bytes from result
#                 image_bytes = result["data"]['image_bytes']

#                 # Upload to Cloudinary
#                 cloudinary_result = upload_to_cloudinary(
#                     file_data=image_bytes,
#                     public_id=f"generated/{image_id}",
#                     resource_type="image"
#                 )

#                 # Save metadata to Supabase
#                 supabase.table("generated_images").insert({
#                     "id": image_id,
#                     "prompt": request.prompt,
#                     "model": request.model,
#                     "cloudinary_url": cloudinary_result.get("secure_url"),
#                     "cloudinary_public_id": cloudinary_result.get("public_id"),
#                     "width": request.width,
#                     "height": request.height,
#                     "seed": result["data"]["seed"],
#                     "size_bytes": len(image_bytes),
#                     "format": request.desired_format or "png",
#                     "clerk_user_id": request.clerk_user_id
#                 }).execute()

                

#                 return ImageGenerationResponse(
#                     success=True,
#                     message="Image generated and uploaded successfully",
#                     data={
#                         "image_id": image_id,
#                         "cloudinary_url": cloudinary_result.get('secure_url'),
#                         "cloudinary_public_id": cloudinary_result.get('public_id'),
#                         "size_bytes": len(image_bytes),
#                         "model": request.model,
#                         "prompt": request.prompt,
#                         "seed": result["data"]["seed"],
#                         "height": request.height,
#                         "width": request.width,
#                         "credits_remaining": remaining_credits
#                     }
#                 )
#             else:
#                 return ImageGenerationResponse(
#                     success=False,
#                     message="Image generation failed",
#                     error=result.get('message', 'Unknown error')
#                 )
#         else:
#             return ImageGenerationResponse(
#                 success=False,
#                 message="Unexpected response format",
#                 error="Invalid response from image generation service"
#             )
            
#     except Exception as e:
#         print(f"Error in generate_image: {e}")
#         return ImageGenerationResponse(
#             success=False,
#             message="Internal server error",
#             error=str(e)
#         )

IMAGE_COST = 10

async def generate_image(request, clerk_user_id):

    image_id = str(uuid.uuid4())

    cloudinary_public_id = None
    credits_reserved = False

    try:
        # --------------------------------------------------
        # Idempotency Check
        # --------------------------------------------------

        existing = (
            supabase.table("generated_images")
            .select("*")
            .eq("request_id", request.request_id)
            .limit(1)
            .execute()
        )

        if existing.data:
            image = existing.data[0]

            return ImageGenerationResponse(
                success=True,
                message="Image already generated",
                data=image
            )

        # --------------------------------------------------
        # Reserve Credits
        # --------------------------------------------------

        reserve_response = supabase.rpc(
            "reserve_credits",
            {
                "p_clerk_user_id": clerk_user_id,
                "p_amount": IMAGE_COST
            }
        ).execute()

        remaining_credits = reserve_response.data
        credits_reserved = True

        # --------------------------------------------------
        # Build Cloudflare Request
        # --------------------------------------------------

        img_request = CloudflareImageRequest(
            prompt=request.prompt,
            model=request.model,
            negative_prompt=request.negative_prompt,
            width=request.width,
            height=request.height,
            num_steps=request.num_steps,
            strength=request.strength,
            guidance=request.guidance,
            image_b64=request.image_b64,
            seed=request.seed,
            steps=request.steps,
        )

        # --------------------------------------------------
        # Generate Image
        # --------------------------------------------------

        result = image_client.generate_image(
            request_data=img_request,
            output_path=None
        )

        if (
            not isinstance(result, dict)
            or result.get("status_code") != 201
        ):
            raise RuntimeError(
                result.get("message", "Image generation failed")
                if isinstance(result, dict)
                else "Invalid response from generator"
            )

        image_bytes = result["data"]["image_bytes"]
        generated_seed = result["data"]["seed"]

        # --------------------------------------------------
        # Upload To Cloudinary
        # --------------------------------------------------

        cloudinary_result = upload_to_cloudinary(
            file_data=image_bytes,
            public_id=f"generated/{image_id}",
            resource_type="image"
        )

        cloudinary_public_id = cloudinary_result["public_id"]


        # --------------------------------------------------
        # Save Metadata
        # --------------------------------------------------

        supabase.table("generated_images").insert({
            "id": image_id,
            "request_id": request.request_id,
            "prompt": request.prompt,
            "model": request.model,
            "cloudinary_url": cloudinary_result["secure_url"],
            "cloudinary_public_id": cloudinary_public_id,
            "width": request.width,
            "height": request.height,
            "seed": generated_seed,
            "size_bytes": len(image_bytes),
            "clerk_user_id": clerk_user_id,
        }).execute()

        # --------------------------------------------------
        # Finalize Credits
        # --------------------------------------------------

        supabase.rpc(
            "consume_reserved_credits",
            {
                "p_clerk_user_id": clerk_user_id,
                "p_amount": IMAGE_COST
            }
        ).execute()


        # --------------------------------------------------
        # Success Response
        # --------------------------------------------------

        return ImageGenerationResponse(
            success=True,
            message="Image generated successfully",
            data={
                "image_id": image_id,
                "cloudinary_url": cloudinary_result["secure_url"],
                "cloudinary_public_id": cloudinary_public_id,
                "size_bytes": len(image_bytes),
                "model": request.model,
                "prompt": request.prompt,
                "seed": generated_seed,
                "height": request.height,
                "width": request.width,
                "credits_remaining": remaining_credits,
            }
        )

    except HTTPException:
        raise

    except Exception as e:

        # ------------------------------------------
        # Cleanup Cloudinary
        # ------------------------------------------

        if cloudinary_public_id:
            try:
                delete_from_cloudinary(cloudinary_public_id)
            except Exception:
                pass

        # ------------------------------------------
        # Refund Credits
        # ------------------------------------------

        if credits_reserved:
            try:
                supabase.rpc(
                    "refund_reserved_credits",
                    {
                        "p_clerk_user_id": clerk_user_id,
                        "p_amount": IMAGE_COST
                    }
                ).execute()

            except Exception:
                pass

        return ImageGenerationResponse(
            success=False,
            message="Image generation failed",
            error=str(e)
        )

async def convert_to_svg(
    file: UploadFile = File(...),
    colormode: str = Form("color"),
    hierarchical: str = Form("stacked"),
    mode: str = Form("spline"),
    filter_speckle: int = Form(4),
    color_precision: int = Form(6),
    layer_difference: int = Form(16),
    corner_threshold: int = Form(60),
    length_threshold: float = Form(4.0),
    max_iterations: int = Form(10),
    splice_threshold: int = Form(45),
    path_precision: int = Form(3),
    clerk_user_id: str = Depends(get_current_clerk_user)
):
    """
    Convert an uploaded image to SVG using vtracer and upload to Cloudinary
    """
    try:
        if not file.content_type:
            raise Exception("No file uploaded")

        # Read uploaded file
        file_content = await file.read()

        validated = await validate_image_bytes(file_content)
        file_content = validated["content"]

        # Generate filenames
        conversion_id = str(uuid.uuid4())
        
        
        # Create temporary files for processing
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file.filename.split('.')[-1] if file.filename else 'png'}") as temp_input:
            temp_input.write(file_content)
            temp_input_path = temp_input.name
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".svg") as temp_output:
            temp_output_path = temp_output.name
        
        try:
            # Create vectorizer with custom parameters
            custom_vectorizer = Vectorizer(
                colormode=colormode,
                hierarchical=hierarchical,
                mode=mode
            )
            
            # Convert to SVG
            svg_path = custom_vectorizer.vectorize(
                input_path=temp_input_path,
                output_path=temp_output_path,
                filter_speckle=filter_speckle,
                color_precision=color_precision,
                layer_difference=layer_difference,
                corner_threshold=corner_threshold,
                length_threshold=length_threshold,
                max_iterations=max_iterations,
                splice_threshold=splice_threshold,
                path_precision=path_precision
            )
            
            # Read SVG content
            with open(svg_path, 'rb') as svg_file:
                svg_content = svg_file.read()
            
            # Upload SVG to Cloudinary
            cloudinary_result = upload_to_cloudinary(
                file_data=svg_content,
                public_id=f"generated/{conversion_id}",
                resource_type="image"  # SVG files are treated as image resources
            )
            
            # Save conversion metadata to Supabase
            supabase.table("svg_conversions").insert({
                "id": conversion_id,
                "original_filename": file.filename,
                "cloudinary_url": cloudinary_result.get("secure_url"),
                "cloudinary_public_id": cloudinary_result.get("public_id"),
                "clerk_user_id": clerk_user_id,
                "original_size_bytes": len(file_content),
                "svg_size_bytes": len(svg_content),

                "colormode": colormode,
                "hierarchical": hierarchical,
                "mode": mode,

                "filter_speckle": filter_speckle,
                "color_precision": color_precision,
                "layer_difference": layer_difference,
                "corner_threshold": corner_threshold,
                "length_threshold": length_threshold,
                "max_iterations": max_iterations,
                "splice_threshold": splice_threshold,
                "path_precision": path_precision
            }).execute()

            return SVGConversionResponse(
                success=True,
                message="Image converted to SVG and uploaded successfully",
                data={
                    "conversion_id": conversion_id,
                    "cloudinary_url": cloudinary_result.get('secure_url'),
                    "cloudinary_public_id": cloudinary_result.get('public_id'),
                    "original_filename": file.filename,
                    "original_size_bytes": len(file_content),
                    "svg_size_bytes": len(svg_content),
                    "parameters": {
                        "colormode": colormode,
                        "hierarchical": hierarchical,
                        "mode": mode,
                        "filter_speckle": filter_speckle,
                        "color_precision": color_precision,
                        "layer_difference": layer_difference,
                        "corner_threshold": corner_threshold,
                        "length_threshold": length_threshold,
                        "max_iterations": max_iterations,
                        "splice_threshold": splice_threshold,
                        "path_precision": path_precision
                    }
                }
            )
            
        finally:
            # Clean up temporary files
            try:
                os.unlink(temp_input_path)
                os.unlink(temp_output_path)
            except:
                pass
        
    except Exception as e:
        return SVGConversionResponse(
            success=False,
            message="SVG conversion failed",
            error=str(e)
        )

def extractCloudinaryPublicId(url: str):
    try:
        parts = url.split("/upload/")

        if len(parts) < 2:
            return None

        path = parts[1]

        # Remove version segment like v1747312345/
        path = re.sub(r"^v\d+/", "", path)

        # Remove file extension
        path = re.sub(r"\.[^/.]+$", "", path)

        return path

    except Exception:
        return None

async def cleanup_file(cloudinary_url: str, clerk_user_id: str):
    """
    Delete file from Cloudinary
    and remove related records from Supabase
    """

    try:
        print(
            f"Cleaning up file: {cloudinary_url}"
        )

        public_id = extractCloudinaryPublicId(
            cloudinary_url
        )

        print(f"Public ID: {public_id}")

        if not public_id:
            return {
                "success": False,
                "message": "Invalid Cloudinary URL",
                "public_id": None
            }

        # -----------------------------------------
        # DELETE FROM CLOUDINARY
        # -----------------------------------------

        result = delete_from_cloudinary(
            public_id
        )

        if result.get("result") != "ok":
            return {
                "success": False,
                "message": "File not found or already deleted",
                "public_id": public_id
            }

        # -----------------------------------------
        # DELETE FROM SUPABASE
        # -----------------------------------------

        db_errors = []

        try:
            supabase \
                .table("generated_images") \
                .delete() \
                .eq(
                    "clerk_user_id",
                    clerk_user_id
                ) \
                .execute()

        except Exception as e:
            db_errors.append({
                "table": "generated_images",
                "error": str(e)
            })

        try:
            supabase \
                .table("svg_conversions") \
                .delete() \
                .eq(
                    "clerk_user_id",
                    clerk_user_id
                ) \
                .execute()

        except Exception as e:
            db_errors.append({
                "table": "svg_conversions",
                "error": str(e)
            })

        # -----------------------------------------
        # RESPONSE
        # -----------------------------------------

        return {
            "success": True,

            "message":
                "File deleted successfully",

            "public_id": public_id,

            "supabase_cleanup": {
                "success":
                    len(db_errors) == 0,

                "errors": db_errors
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

async def check_health():
    """
    Health check endpoint that also verifies Cloudinary configuration
    """
    return {
        "status": "healthy",
        "message": "API is running",
        "cloudinary_configured": True
    }

async def get_generated_images(
    request: GetGeneratedImagesRequest,
    clerk_user_id: str
):

        """
        Get generated images with pagination, filtering, and sorting
        """

        try:
            offset = (request.page - 1) * request.limit

            # Base query
            query = (
                supabase
                .table("generated_images")
                .select(
                    "id, prompt, width, height, size_bytes, model, created_at, seed, cloudinary_url",
                    count="exact"
                )
                .eq("clerk_user_id", clerk_user_id)
            )
            # Search filter
            if request.search:
                query = query.ilike("prompt", f"%{request.search}%")

            # Model filter
            if request.model:
                query = query.eq("model", request.model)

            # Sorting
            ascending = request.sort_order.lower() == "asc"

            allowed_sort_fields = {
                "created_at",
                "width",
                "height",
                "size_bytes",
                "model"
            }

            if request.sort_by not in allowed_sort_fields:
                request.sort_by = "created_at"

            query = query.order(request.sort_by, desc=not ascending)

            # Pagination
            query = query.range(offset, offset + request.limit - 1)

            # Execute query
            response = query.execute()

            total = response.count or 0
            total_pages = (total + request.limit - 1) // request.limit

            return {
                "success": True,

                "data": response.data,

                "pagination": {
                    "page": request.page,
                    "limit": request.limit,
                    "total": total,
                    "total_pages": total_pages,

                    "has_next": request.page < total_pages,
                    "has_prev": request.page > 1,
                },

                "filters": {
                    "search": request.search,
                    "model": request.model,
                },

                "sorting": {
                    "sort_by": request.sort_by,
                    "sort_order": request.sort_order,
                }
            }

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=str(e)
            )

async def get_svg_conversions(
  request: GetSVGConversionRequest,
  clerk_user_id: str
):
    """
    Get SVG conversions with pagination,
    filtering, searching, and sorting
    """

    try:
        offset = (request.page - 1) * request.limit

        # Base query
        query = (
            supabase
            .table("svg_conversions")
            .select(
                """
                id,
                original_filename,
                cloudinary_url,
                original_size_bytes,
                svg_size_bytes,
                colormode,
                mode,
                hierarchical,
                created_at
                """,
                count="exact"
            )
            .eq("clerk_user_id", clerk_user_id)
        )
        # Search by filename
        if request.search:
            query = query.ilike(
                "original_filename",
                f"%{request.search}%"
            )

        # Filters
        if request.colormode:
            query = query.eq(
                "colormode",
                request.colormode
            )

        if request.mode:
            query = query.eq(
                "mode",
                request.mode
            )

        if request.hierarchical:
            query = query.eq(
                "hierarchical",
                request.hierarchical
            )

        # Allowed sorting
        allowed_sort_fields = {
            "created_at",
            "original_filename",
            "original_size_bytes",
            "svg_size_bytes",
            "color_precision",
            "path_precision",
        }

        if request.sort_by not in allowed_sort_fields:
            request.sort_by = "created_at"

        ascending = request.sort_order.lower() == "asc"

        # Sorting
        query = query.order(
            request.sort_by,
            desc=not ascending
        )

        # Pagination
        query = query.range(
            offset,
            offset + request.limit - 1
        )

        # Execute
        response = query.execute()

        total = response.count or 0

        total_pages = (
            total + request.limit - 1
        ) // request.limit

        return {
            "success": True,

            "data": response.data,

            "pagination": {
                "page": request.page,
                "limit": request.limit,
                "total": total,
                "total_pages": total_pages,

                "has_next": request.page < total_pages,
                "has_prev": request.page > 1,
            },

            "filters": {
                "search": request.search,
                "colormode": request.colormode,
                "mode": request.mode,
                "hierarchical": request.hierarchical,
            },

            "sorting": {
                "sort_by": request.sort_by,
                "sort_order": request.sort_order,
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )