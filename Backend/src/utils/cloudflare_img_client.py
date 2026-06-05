import base64
import os
import random
from typing import Optional

import requests

from .api_helper.api_response import ApiResponse
from .api_helper.api_error import ApiError
from .cloudflare_img_req import CloudflareImageRequest
from dotenv import load_dotenv

load_dotenv()

# CLIENT

class CloudflareImageClient:

    def __init__(
        self,
        base_url: str = "https://steep-silence-8ded.mksaw19.workers.dev",
        api_key: Optional[str] = None,
    ):

        self.base_url = base_url.rstrip("/")
        self.api_key = api_key or os.getenv(
            "API_KEY_CLOUDFLARE"
        )

        if not self.api_key:
            raise ValueError(
                "Missing API_KEY_CLOUDFLARE"
            )

        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {self.api_key}",
        })

    def generate_image(
        self,
        request_data: CloudflareImageRequest,
        output_path: Optional[str] = None,
    ) -> dict:

        try:
            if output_path and output_path.split('.')[-1] != 'jpg':
                raise ValueError("Output path must be a jpg file")
            
            payload = request_data.build_payload()
            print("Payload:", payload)
            response = self.session.post(
                    self.base_url,
                    json=payload,
                    timeout=request_data.timeout,
                )

            if response.status_code != 200:
                try:
                    error_data = response.json()
                except Exception:
                    error_data = {
                        "error": response.text
                    }

                return ApiError(
                    message=f"Cloudflare API request failed: "
                            f"{error_data.get('details'), error_data.get('error', 'Unknown error')}",
                    status_code=response.status_code,
                )

            image_bytes = response.content

            if output_path:
                os.makedirs(
                    os.path.dirname(output_path) or ".",
                    exist_ok=True,
                )
                with open(output_path, "wb") as f:
                    f.write(image_bytes)

            response = ApiResponse(
                status_code=201,
                message="Image generated successfully",
                data={
                    "model": request_data.model,
                    "prompt": request_data.prompt,
                    "seed": payload.get("seed"),
                    "saved_to": output_path,
                    "size_bytes": len(image_bytes),
                    "image_bytes": image_bytes,
                },
            )
            return response.to_dict()

        except requests.Timeout:
            print("Request timed out")
            return ApiError(
                message="Request timed out",
                status_code=408,
            )

        except requests.ConnectionError:
            print("Connection error")
            return ApiError(
                message="Connection error",
                status_code=503,
            )

        except Exception as e:
            print(f"Unexpected error: {e}")
            return ApiError(
                message="Unexpected error",
                status_code=500,
            )

# HELPERS

def image_to_base64(path: str) -> str:

    with open(path, "rb") as f:
        return base64.b64encode(
            f.read()
        ).decode("utf-8")

# request_payload = CloudflareImageRequest(
#         prompt="A vector style ninja",
#         model="flux",
#     )

# client = CloudflareImageClient()
# client.generate_image(
#         request_payload,
#         "Output.jpg",
#     )