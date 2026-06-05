async def extract_user_data(data: dict) -> dict:
    clerk_user_id = data["id"]

    email = None

    if data["email_addresses"]:
        email = data["email_addresses"][0]["email_address"]

    first_name = data.get("first_name") or ""
    last_name = data.get("last_name") or ""

    name = f"{first_name} {last_name}".strip()

    image_url = data.get("image_url")

    return {
        "clerk_user_id": clerk_user_id,
        "email": email,
        "name": name,
        "image_url": image_url
    }
