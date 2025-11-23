import json
from typing import Any, Optional

try:
    import redis

    redis_client = redis.Redis(host="localhost", port=6379, db=0, decode_responses=True, socket_connect_timeout=2)
    REDIS_AVAILABLE = True
    redis_client.ping()
except (ImportError, redis.ConnectionError, redis.TimeoutError):
    REDIS_AVAILABLE = False
    redis_client = None


class RedisCache:
    @staticmethod
    def get(key: str) -> Optional[Any]:
        if not REDIS_AVAILABLE or not redis_client:
            return None

        try:
            data = redis_client.get(key)
            return json.loads(data) if data else None
        except Exception:
            return None

    @staticmethod
    def set(key: str, value: Any, ttl: int = 300):
        if not REDIS_AVAILABLE or not redis_client:
            return

        try:
            redis_client.setex(key, ttl, json.dumps(value, default=str))
        except Exception:
            pass

    @staticmethod
    def delete(key: str):
        if not REDIS_AVAILABLE or not redis_client:
            return

        try:
            redis_client.delete(key)
        except Exception:
            pass

    @staticmethod
    def clear_pattern(pattern: str):
        """Delete all keys matching pattern (e.g., 'ai_review:*')"""
        if not REDIS_AVAILABLE or not redis_client:
            return

        try:
            for key in redis_client.scan_iter(match=pattern):
                redis_client.delete(key)
        except Exception:
            pass


redis_cache = RedisCache()
