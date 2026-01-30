from typing import List
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from app.middleware.auth import get_current_user
from app.schemas.media import MediaUploadListResponse, MediaUploadResponse
from app.services.auth_service import CurrentUser
from app.services.storage_service import upload_media
from app.utils.media_validator import validate_image_file

router = APIRouter(prefix="/media", tags=["media"])

MAX_FILES_PER_UPLOAD = 4

@router.post("/upload", response_model=MediaUploadListResponse)
async def upload_media_files(
    files: List[UploadFile] = File(..., description="Image files for a post or comment (JPEG, PNG, WebP, max 5MB each; up to 4 files)"),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Upload one or more images for use in a **post** or **comment**.
    Use the returned URLs in `media_urls` when creating or editing the post/comment.
    Accepts JPEG, PNG, WebP up to 5MB each; maximum 4 files per request.
    """
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one file is required.",
        )
    if len(files) > MAX_FILES_PER_UPLOAD:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {MAX_FILES_PER_UPLOAD} files per request.",
        )
    results: List[MediaUploadResponse] = []
    for file in files:
        if not file.filename or not file.filename.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Every file must have a filename.",
            )
        file_bytes = await validate_image_file(file)
        content_type = file.content_type or "image/jpeg"
        url = upload_media(
            user_id=current_user.user_id,
            file_bytes=file_bytes,
            filename=file.filename.strip(),
            content_type=content_type,
        )
        results.append(
            MediaUploadResponse(
                url=url,
                filename=file.filename.strip(),
                content_type=content_type,
                size_bytes=len(file_bytes),
            )
        )
    return MediaUploadListResponse(uploads=results)
