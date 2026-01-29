from __future__ import annotations
import hashlib
import logging
from dataclasses import dataclass
from typing import Optional
import httpx
from fastapi import Request

logger = logging.getLogger("pageshare.geolocation")

@dataclass
class GeoInfo:
    ip: str
    ip_hash: str
    country: Optional[str] = None
    country_code: Optional[str] = None
    region: Optional[str] = None
    city: Optional[str] = None
    timezone: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

def extract_client_ip(request: Request) -> Optional[str]:
    """
    Extract client IP from common headers or connection info.
    """
    x_forwarded_for = request.headers.get("x-forwarded-for")
    if x_forwarded_for:
        # Use the first IP in the list
        return x_forwarded_for.split(",")[0].strip()

    x_real_ip = request.headers.get("x-real-ip")
    if x_real_ip:
        return x_real_ip.strip()

    client_host = request.client.host if request.client else None
    return client_host

async def lookup_ip(ip: str) -> Optional[GeoInfo]:
    """
    Look up geolocation info for an IP address using ip-api.com (used for onboarding only).

    Returns None if lookup fails; callers should handle missing data gracefully.
    """
    ip_hash = hashlib.sha256(ip.encode("utf-8")).hexdigest()

    # ip-api.com free tier (no API key required)
    url = f"http://ip-api.com/json/{ip}"
    params = {"fields": "status,country,countryCode,regionName,city,lat,lon,timezone"}
    headers = {"User-Agent": "PageShareBackend/1.0"}

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(url, params=params, headers=headers)
            resp.raise_for_status()
            data = resp.json()
    except Exception as exc:
        logger.warning("Geolocation lookup failed for %s: %s", ip, exc)
        return GeoInfo(ip=ip, ip_hash=ip_hash)

    # ip-api.com returns: country, countryCode, regionName, city, lat, lon, timezone
    country = data.get("country")
    country_code = data.get("countryCode")
    region = data.get("regionName")
    city = data.get("city")
    timezone = data.get("timezone")
    latitude = data.get("lat")
    longitude = data.get("lon")

    return GeoInfo(
        ip=ip,
        ip_hash=ip_hash,
        country=country,
        country_code=country_code,
        region=region,
        city=city,
        timezone=timezone,
        latitude=float(latitude) if latitude is not None else None,
        longitude=float(longitude) if longitude is not None else None,
    )
