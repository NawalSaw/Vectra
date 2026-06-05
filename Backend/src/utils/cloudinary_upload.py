import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv
load_dotenv()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

def upload_to_cloudinary(file_data: bytes, public_id: str, resource_type: str = "image") -> dict[str, any]:
    """Upload file to Cloudinary"""
    try:
        result = cloudinary.uploader.upload(
            file_data,
            public_id=public_id,
            resource_type=resource_type,
            folder="image-service"
        )
        return result
    except Exception as e:
        raise Exception(f"Failed to upload to Cloudinary: {str(e)}")

def delete_from_cloudinary(public_id: str) -> dict[str, any]:
    """Delete file from Cloudinary"""
    try:
        result = cloudinary.uploader.destroy(public_id)
        return result
    except Exception as e:
        raise Exception(f"Failed to delete from Cloudinary: {str(e)}")