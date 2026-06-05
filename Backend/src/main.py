import os
from fastapi import FastAPI
from .routes.image_router import router as image_router
from .routes.user_router import router as user_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Image Service API", description="API for generating images and converting to SVG")

FRONTEND_ALLOWED_ORIGINS = os.getenv("FRONTEND_URL")

# MUST COME BEFORE ROUTES
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_ALLOWED_ORIGINS
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(image_router)
app.include_router(user_router)

@app.get("/")
async def root():
    return {"message": "Image Service API is running"}

@app.get("/health")
async def health():
    return {"status": "ok"}
# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)
