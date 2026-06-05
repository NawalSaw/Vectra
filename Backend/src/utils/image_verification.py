from fastapi import HTTPException
from PIL import Image, ImageOps, UnidentifiedImageError
from io import BytesIO


ALLOWED_FORMATS = {
    "PNG": "image/png",
    "JPEG": "image/jpeg",
    "WEBP": "image/webp",
    "BMP": "image/bmp",
}


async def validate_image_bytes(content: bytes):
    """
    Validate and normalize uploaded image.

    Returns:
        {
            "content": fixed_image_bytes,
            "format": actual_format,
            "mime_type": mime_type,
            "extension": extension,
            "width": width,
            "height": height,
        }
    """

    try:
        # Open image from raw bytes
        img = Image.open(BytesIO(content))

        # Detect actual binary format
        actual_format = img.format

        if actual_format not in ALLOWED_FORMATS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported image format: {actual_format}"
            )

        # Force image decoding
        img.load()

        # Auto-fix EXIF rotation issues
        img = ImageOps.exif_transpose(img)

        # Convert unsupported modes safely
        if img.mode in ("RGBA", "LA") and actual_format == "JPEG":
            # JPEG doesn't support transparency
            background = Image.new("RGB", img.size, (255, 255, 255))
            background.paste(img, mask=img.split()[-1])
            img = background

        elif img.mode not in ("RGB", "RGBA"):
            img = img.convert("RGB")

        # Re-encode image to clean/fix corruption
        output = BytesIO()

        save_format = "JPEG" if actual_format == "JPEG" else actual_format

        save_kwargs = {}

        if save_format == "JPEG":
            save_kwargs["quality"] = 95
            save_kwargs["optimize"] = True

        img.save(output, format=save_format, **save_kwargs)

        fixed_bytes = output.getvalue()

        return {
            "content": fixed_bytes,
            "format": actual_format,
            "mime_type": ALLOWED_FORMATS[actual_format],
            "extension": actual_format.lower(),
            "width": img.width,
            "height": img.height,
        }

    except UnidentifiedImageError:
        raise HTTPException(
            status_code=400,
            detail="Invalid image file"
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Corrupted image file: {str(e)}"
        )