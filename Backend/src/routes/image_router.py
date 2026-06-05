from fastapi import APIRouter, Depends, File, Form, UploadFile

from src.classes.image_classes import CleanupResponse, GetGeneratedImagesRequest, GetSVGConversionRequest, ImageGenerationRequest, ImageGenerationResponse, SVGConversionResponse
from src.controllers.image_controller import generate_image, convert_to_svg, cleanup_file, check_health, get_svg_conversions, get_generated_images

router = APIRouter(prefix="/image", tags=["Image"])

@router.post("/generate-image", response_model=ImageGenerationResponse)
async def image_generation(request: ImageGenerationRequest):
    return await generate_image(request)

@router.post("/convert-to-svg", response_model=SVGConversionResponse)
async def svg_conversion(
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
    clerk_user_id: str = Form(""),
):
    return await convert_to_svg(
        file=file,
        colormode=colormode,
        hierarchical=hierarchical,
        mode=mode,
        filter_speckle=filter_speckle,
        color_precision=color_precision,
        layer_difference=layer_difference,
        corner_threshold=corner_threshold,
        length_threshold=length_threshold,
        max_iterations=max_iterations,
        splice_threshold=splice_threshold,
        path_precision=path_precision,
        clerk_user_id=clerk_user_id,
    )

@router.delete("/cleanup", response_model=CleanupResponse)
async def cleanup(cloudinary_url: str):
    return await cleanup_file(cloudinary_url)

@router.get("/svg-conversions")
async def get_svg_conversions_endpoint(request: GetSVGConversionRequest = Depends()):
    return await get_svg_conversions(request)

@router.get("/generated-images")
async def get_images_endpoint(
    request: GetGeneratedImagesRequest = Depends()
):
    return await get_generated_images(request)

@router.get("/health")
async def health_check():
    return await check_health()
