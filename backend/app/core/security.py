import jwt
from jwt import PyJWKClient
from fastapi import HTTPException, status
from app.core.config import settings

# Construct the JWKS URL dynamically from the project URL
# Example: https://xyz.supabase.co -> https://xyz.supabase.co/auth/v1/.well-known/jwks.json
if not settings.SUPABASE_URL:
    # Allow fallback for tests
    jwks_url = "https://mock.supabase.co/auth/v1/.well-known/jwks.json"
else:
    jwks_url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"

# PyJWKClient internally caches the keys
jwks_client = PyJWKClient(jwks_url)

def verify_jwt(token: str) -> dict:
    try:
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256", "ES256"],
            audience=settings.SUPABASE_AUDIENCE,
            options={"require": ["exp", "iss", "aud", "sub"]}
        )
        return payload
        
    except jwt.PyJWKClientError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unable to fetch signing keys",
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except jwt.InvalidAudienceError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid audience",
        )
    except jwt.InvalidIssuerError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid issuer",
        )
    except jwt.InvalidAlgorithmError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unsupported algorithm",
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
        )
