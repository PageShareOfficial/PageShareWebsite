from __future__ import annotations
import logging
import os
import time
from functools import lru_cache
from typing import Optional
from supabase import Client, create_client
from app.config import get_settings

logger = logging.getLogger("pageshare.storage")
settings = get_settings()

@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise RuntimeError("Supabase URL and SUPABASE_SERVICE_ROLE_KEY must be configured")
    url = settings.supabase_url.rstrip("/") + "/"
    return create_client(url, settings.supabase_service_role_key)

def _profile_picture_path(user_id: str, filename: str) -> str:
    ts = int(time.time())
    name = os.path.basename(filename).replace(" ", "_")
    return f"user_{user_id}/{ts}_{name}"

def _media_path(user_id: str, filename: str) -> str:
    """Path for post/comment media: media/user_{user_id}/{ts}_{name}."""
    ts = int(time.time())
    name = os.path.basename(filename).replace(" ", "_")
    return f"media/user_{user_id}/{ts}_{name}"

def upload_profile_picture(
    *,
    user_id: str,
    file_bytes: bytes,
    filename: str,
    content_type: str,
    bucket: Optional[str] = None,
) -> str:
    """
    Upload a profile picture to Supabase Storage and return its public URL.
    """
    client = get_supabase_client()
    bucket_name = bucket or settings.supabase_storage_bucket
    path = _profile_picture_path(user_id, filename)

    logger.info("Uploading profile picture for user %s to %s/%s", user_id, bucket_name, path)

    # supabase-py v2: storage.from_("bucket").upload(path, file)
    storage_bucket = client.storage.from_(bucket_name)
    storage_bucket.upload(path, file_bytes, {"content-type": content_type})

    public_url = storage_bucket.get_public_url(path)
    return public_url

def delete_profile_picture(
    *,
    url: str,
    bucket: Optional[str] = None,
) -> None:
    """
    Best-effort deletion of a profile picture given its public URL.
    """
    client = get_supabase_client()
    bucket_name = bucket or settings.supabase_storage_bucket
    storage_bucket = client.storage.from_(bucket_name)

    # Public URLs from Supabase look like:
    # https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
    prefix = f"/storage/v1/object/public/{bucket_name}/"
    try:
        path_index = url.index(prefix)
    except ValueError:
        # Not a recognized Supabase URL; nothing to delete.
        logger.warning("Could not parse storage path from URL: %s", url)
        return

    object_path = url[path_index + len(prefix) :]
    try:
        storage_bucket.remove([object_path])
    except Exception as exc:
        logger.warning("Failed to delete profile picture %s from bucket %s: %s", object_path, bucket_name, exc)

def upload_media(
    *,
    user_id: str,
    file_bytes: bytes,
    filename: str,
    content_type: str,
    bucket: Optional[str] = None,
) -> str:
    """
    Upload a media file (for posts/comments) to the media bucket and return its public URL.
    """
    client = get_supabase_client()
    bucket_name = bucket or settings.supabase_media_bucket
    path = _media_path(user_id, filename)

    logger.info("Uploading media for user %s to %s/%s", user_id, bucket_name, path)
    storage_bucket = client.storage.from_(bucket_name)
    storage_bucket.upload(path, file_bytes, {"content-type": content_type})
    return storage_bucket.get_public_url(path)
