from src.utils.supabase.client import supabase

IMAGE_COST = 10

def deduct_credits(clerk_user_id: str, amount: int = IMAGE_COST):
    remaining_credits = (
    supabase
    .rpc(
        "deduct_credits",
        {
            "p_clerk_user_id": clerk_user_id,
            "p_amount": amount
        }
    )
    .execute()
)
    return remaining_credits
