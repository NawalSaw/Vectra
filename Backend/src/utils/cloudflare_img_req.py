from random import randint
from typing import Literal, Optional
import base64

from pydantic import (
    BaseModel,
    Field,
    model_validator,
)

MODEL_MAP = {
    "flux": "@cf/black-forest-labs/flux-1-schnell",
    "lightning": "@cf/bytedance/stable-diffusion-xl-lightning",
    "sdxl": "@cf/stabilityai/stable-diffusion-xl-base-1.0",
    "img2img": "@cf/runwayml/stable-diffusion-v1-5-img2img",
}


class CloudflareImageRequest(BaseModel):

    prompt: str = Field(
        ...,
        min_length=1,
        description="Text prompt for image generation",
        error="Prompt cannot be empty",
    )

    model: Literal[
        "flux",
        "lightning",
        "sdxl",
    ]

    timeout: int = Field(
        default=120,
        ge=1,
        le=600,
        description="Request timeout in seconds",
        error="Timeout must be between 1 and 600 seconds",
    )
    negative_prompt: Optional[str] = Field(
        default=None,
        description="Things to avoid in generation",
    )

    width: Optional[int] = Field(
        default=None,
        ge=256,
        le=2048,
        description="Width of the generated image",
        error="Width must be between 256 and 2048",
    )

    height: Optional[int] = Field(
        default=None,
        ge=256,
        le=2048,
        description="Height of the generated image",
        error="Height must be between 256 and 2048",
    )

    num_steps: Optional[int] = Field(
        default=None,
        ge=1,
        le=20,
        description="Number of steps for image generation",
        error="Number of steps must be between 1 and 20",
    )

    strength: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Strength for image generation",
        error="Strength must be between 0.0 and 1.0",
    )

    guidance: Optional[float] = Field(
        default=None,
        ge=1.0,
        le=20.0,
        description="Guidance scale for image generation",
        error="Guidance must be between 1.0 and 20.0",
    )

    image_b64: Optional[str] = Field(
        default=None,
        description="Base64 encoded input image",
    )

    seed: Optional[int] = Field(
        default=None,
        ge=0,
        description="Seed for reproducible generation",
        error="Seed must be a non-negative integer",
    )

    random_seed: bool = Field(
        default=True,
        description="Generate random seed if seed is not provided",
    )

    # =====================================================
    # FLUX ONLY
    # =====================================================

    steps: Optional[int] = Field(
        default=None,
        ge=1,
        le=8,
        description="Inference steps for FLUX",
        error="Inference steps must be between 1 and 8",
    )

    @staticmethod
    def base64_to_uint8_array(image_b64: str) -> list[int]:
        """
        Convert base64 image into uint8 integer array
        """

        # remove data URL prefix if present
        if "," in image_b64:
            image_b64 = image_b64.split(",", 1)[1]

        # decode base64 -> bytes
        image_bytes = base64.b64decode(image_b64)

        # convert bytes -> uint8 array
        return list(image_bytes)


    # =====================================================
    # VALIDATION
    # =====================================================

    @model_validator(mode="after")
    def validate_model_params(self):

        # -------------------------------------------------
        # FLUX VALIDATION
        # -------------------------------------------------

        if self.model == "flux":

            unsupported = []

            if self.negative_prompt is not None:
                unsupported.append("negative_prompt")

            if self.image_b64 is not None:
                unsupported.append("image_b64")

            if self.seed is not None:
                unsupported.append("seed")

            if self.width is not None:
                unsupported.append("width")

            if self.height is not None:
                unsupported.append("height")

            if self.num_steps is not None:
                unsupported.append("num_steps")

            if self.strength is not None:
                unsupported.append("strength")

            if self.guidance is not None:
                unsupported.append("guidance")

            print("Unsupported parameters for flux: ", unsupported)
            print("self: ", self)
            if unsupported:
                raise ValueError(
                    "Unsupported parameters for flux: "
                    + ", ".join(unsupported)
                )
        # -------------------------------------------------
        # SDXL / LIGHTNING VALIDATION
        # -------------------------------------------------

        else:
            if self.seed is None and self.random_seed:
                self.seed = randint(
                    0,
                    2**31 - 1,
                )

        return self

    # =====================================================
    # PAYLOAD
    # =====================================================

    def build_payload(self) -> dict:

        if self.model == "flux":
            return {
                "model": self.model,
                "prompt": self.prompt,
                "steps": self.steps,
            }

        payload = {
            "model": self.model,
            "prompt": self.prompt,
            "negative_prompt": self.negative_prompt,
            "width": self.width,
            "height": self.height,
            "num_steps": self.num_steps,
            "strength": self.strength,
            "guidance": self.guidance,
            "seed": self.seed,
        }

        # convert image_b64 -> image[]
        if self.image_b64:
            payload["image"] = self.base64_to_uint8_array(
                self.image_b64
            )
            payload["model"] = "img2img"


        return {
            key: value
            for key, value in payload.items()
            if value is not None
        }