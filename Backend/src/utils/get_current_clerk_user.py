from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jwt import PyJWKClient
import jwt
import os

security = HTTPBearer()

FRONTEND_API=os.getenv('CLERK_FRONTEND_API')

JWKS_URL = (
    f"https://{FRONTEND_API}/.well-known/jwks.json"
)

jwk_client = PyJWKClient(JWKS_URL)


def get_current_clerk_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:

    token = credentials.credentials
    try:
        signing_key = jwk_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
        return payload["sub"]

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized"
        )