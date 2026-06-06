import os
from fastapi import APIRouter, Depends, Request, HTTPException
from svix.webhooks import Webhook, WebhookVerificationError

from src.utils.get_current_clerk_user import get_current_clerk_user
from src.classes.user_classes import UserResponse
from src.utils.webhook.extract_data import extract_user_data
from src.utils.supabase.client import supabase

router = APIRouter(prefix="/user", tags=["user"])

CLERK_WEBHOOK_SECRET = os.getenv("CLERK_WEBHOOK_SECRET")

@router.post('/webhooks/clerk')
async def clerk_webhook(request: Request):
    print("Clerk webhook received")
    # Get raw body
    payload = await request.body()

    # Get Svix headers
    headers = request.headers

    svix_id = headers.get("svix-id")
    svix_timestamp = headers.get("svix-timestamp")
    svix_signature = headers.get("svix-signature")

    if not svix_id or not svix_timestamp or not svix_signature:
        raise HTTPException(status_code=400, detail="Missing Svix headers")

    # Verify webhook
    wh = Webhook(CLERK_WEBHOOK_SECRET)

    try:
        event = wh.verify(
            payload,
            {
                "svix-id": svix_id,
                "svix-timestamp": svix_timestamp,
                "svix-signature": svix_signature,
            },
        )

    except WebhookVerificationError:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    # Event type
    event_type = event["type"]

    # Event data
    data = event["data"]

    print("Webhook verified")
    print("Event:", event_type)

    # USER CREATED
    if event_type == "user.created":
        user_data = await extract_user_data(data)

        print("Creating user:", user_data["clerk_user_id"])
        supabase.table("users").upsert({
            "clerk_user_id": user_data["clerk_user_id"],
            "email": user_data["email"],
            "name": user_data["name"],
            "image_url": user_data["image_url"],
            "current_credit": 200
        }).execute()

    elif event_type == "user.updated":
        user_data = await extract_user_data(data)
        supabase.table("users").update({
            "email": user_data["email"],
            "name": user_data["name"],
            "image_url": user_data["image_url"]
        }).eq(
            "clerk_user_id",
            user_data["clerk_user_id"]
        ).execute()
    
    elif event_type == "user.deleted":
       user_data = await extract_user_data(data)
       supabase.table("users").delete().eq(
           "clerk_user_id",
           user_data["clerk_user_id"]
       ).execute()

    return {
        "success": True
    }

@router.get('/me', response_model=UserResponse)
async def get_current_user(
    clerk_user_id: str = Depends(get_current_clerk_user)
):

    result = (
        supabase
        .table("users")
        .select("*")
        .eq("clerk_user_id", clerk_user_id)
        .single()
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return result.data

