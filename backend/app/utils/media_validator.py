from io import BytesIO
from typing import Iterable
from fastapi import HTTPException, UploadFile, status
from PIL import Image

MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_IMAGE_TYPES: set[str] = {"image/jpeg", "image/png", "image/webp"}

async def validate_image_file(
    file: UploadFile,
    allowed_types: Iterable[str] = ALLOWED_IMAGE_TYPES,
    max_size_bytes: int = MAX_IMAGE_SIZE_BYTES,
) -> bytes:
    """
    Validate an uploaded image file and return its bytes.

    - Ensures content type is allowed.
    - Ensures size is under `max_size_bytes`.
    - Attempts to open with Pillow to verify it's a real image.
    """
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Invalid file type. Only JPEG, PNG, and WebP are supported.",
        )

    data = await file.read()
    if not data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    if len(data) > max_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File is too large. Maximum size is 5MB.",
        )

    try:
        with Image.open(BytesIO(data)) as img:
            img.verify()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is not a valid image.",
        )

    return data
