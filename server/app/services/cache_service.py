import hashlib
from typing import Any, Optional

from cachetools import TTLCache

from app.core.logging_config import security_logger


class CacheService:
    def __init__(self):
        self.cache = TTLCache(maxsize=1000, ttl=300)

    def _generate_key(self, prefix: str, **kwargs) -> str:
        key_data = f"{prefix}:" + ":".join(f"{k}={v}" for k, v in sorted(kwargs.items()))
        return hashlib.md5(key_data.encode()).hexdigest()

    def get(self, prefix: str, **kwargs) -> Optional[Any]:
        key = self._generate_key(prefix, **kwargs)
        value = self.cache.get(key)
        if value is not None:
            security_logger.info(f"[CACHE HIT] {prefix} - {kwargs}")
        return value

    def set(self, prefix: str, value: Any, ttl: int = 300, **kwargs):
        key = self._generate_key(prefix, **kwargs)
        self.cache[key] = value
        security_logger.info(f"[CACHE SET] {prefix} - {kwargs} (TTL: {ttl}s)")

    def invalidate(self, prefix: str, **kwargs):
        key = self._generate_key(prefix, **kwargs)
        if key in self.cache:
            del self.cache[key]
            security_logger.info(f"[CACHE INVALIDATE] {prefix} - {kwargs}")

    def clear_project(self, project_id: int):
        keys_to_delete = []
        for key in list(self.cache.keys()):
            try:
                if str(project_id) in str(key):
                    keys_to_delete.append(key)
            except Exception as e:
                security_logger.warning(f"Failed to process cache key: {e}")

        for key in keys_to_delete:
            del self.cache[key]

        if keys_to_delete:
            security_logger.info(f"[CACHE CLEAR] Cleared {len(keys_to_delete)} cache entries for project {project_id}")


cache_service = CacheService()
