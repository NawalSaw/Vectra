from pydantic import BaseModel
from datetime import datetime

class UserResponse(BaseModel):
    clerk_user_id: str
    email: str | None
    name: str | None
    image_url: str | None
    current_credit: int
    created_at: datetime