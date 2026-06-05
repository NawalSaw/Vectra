from pydantic import BaseModel
from typing import Optional, Dict, Any

class ImageGenerationRequest(BaseModel):
    prompt: str
    model: str

    negative_prompt: Optional[str] = None

    width: Optional[int] = None
    height: Optional[int] = None

    num_steps: Optional[int] = None

    strength: Optional[float] = None
    guidance: Optional[float] = None

    image_b64: Optional[str] = None

    seed: Optional[int] = None

    steps: Optional[int] = None
    clerk_user_id: str = None
    desired_format: str = "jpg"

class ImageGenerationResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class SVGConversionResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class CleanupResponse(BaseModel):
    success: bool
    message: str
    public_id: Optional[str] = None

class GetSVGConversionRequest(BaseModel):
    clerk_user_id: str
    page: int
    limit: int

    search: Optional[str] = None
    colormode: Optional[str] = None
    mode: Optional[str] = None
    hierarchical: Optional[str] = None

    sort_by: str
    sort_order: str 

class GetGeneratedImagesRequest(BaseModel):
    clerk_user_id: str
    page: int
    limit: int

    search: Optional[str] = None
    model: Optional[str] = None

    sort_by: str
    sort_order: str