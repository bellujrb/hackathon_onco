"""
Cache Service usando Redis (opcional) ou memória

POR QUE PRECISAMOS DE CACHE:
1. Frontend analisa áudio e recebe resultado
2. Usuário volta para WhatsApp
3. WhatsApp IA precisa buscar o mesmo resultado para explicar via LLM
4. Cache mantém o resultado disponível entre as requisições

Redis é OPCIONAL - serve apenas para escalar em produção.
Em desenvolvimento, cache em memória funciona perfeitamente!
"""

import json
import os
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

# Tenta usar Redis, se falhar usa cache em memória (funciona perfeitamente!)
try:
    import redis
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    USE_REDIS = True
    print("✓ Redis conectado - Cache distribuído ativo")
except:
    USE_REDIS = False
    MEMORY_CACHE = {}
    print("✓ Cache em memória ativo (desenvolvimento/single instance)")

CACHE_EXPIRY_HOURS = int(os.getenv("CACHE_EXPIRY_HOURS", 24))


class CacheService:
    """Serviço de cache para resultados de análise"""
    
    def save_result(self, session_id: str, result: Dict[str, Any]) -> bool:
        """Salva resultado no cache"""
        try:
            data = {
                'session_id': session_id,
                'result': result,
                'timestamp': datetime.now().isoformat(),
                'expires_at': (
                    datetime.now() + timedelta(hours=CACHE_EXPIRY_HOURS)
                ).isoformat()
            }
            
            if USE_REDIS:
                redis_client.setex(
                    f"session:{session_id}",
                    CACHE_EXPIRY_HOURS * 3600,
                    json.dumps(data)
                )
            else:
                MEMORY_CACHE[session_id] = data
            
            print(f"✓ Result cached for session: {session_id}")
            return True
            
        except Exception as e:
            print(f"Error saving to cache: {e}")
            return False
    
    def get_result(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Busca resultado do cache"""
        try:
            if USE_REDIS:
                data_json = redis_client.get(f"session:{session_id}")
                if not data_json:
                    return None
                data = json.loads(data_json)
            else:
                data = MEMORY_CACHE.get(session_id)
                if not data:
                    return None
                
                # Check expiry for memory cache
                expires_at = datetime.fromisoformat(data['expires_at'])
                if datetime.now() > expires_at:
                    del MEMORY_CACHE[session_id]
                    return None
            
            return data['result']
            
        except Exception as e:
            print(f"Error getting from cache: {e}")
            return None
    
    def delete_result(self, session_id: str) -> bool:
        """Deleta resultado do cache"""
        try:
            if USE_REDIS:
                redis_client.delete(f"session:{session_id}")
            else:
                if session_id in MEMORY_CACHE:
                    del MEMORY_CACHE[session_id]
            
            print(f"✓ Cache deleted for session: {session_id}")
            return True
            
        except Exception as e:
            print(f"Error deleting from cache: {e}")
            return False

