from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.dialects.postgresql import insert
import uuid

from app.db.session import get_db
from app.db.models import User
from app.core.security import verify_jwt

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    token = credentials.credentials
    payload = verify_jwt(token)
    
    sub = payload.get("sub")
    email = payload.get("email")
    
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing sub claim"
        )
        
    try:
        user_uuid = uuid.UUID(sub)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid sub claim format"
        )

    # Upsert the user to ensure they exist locally
    stmt = insert(User).values(
        id=user_uuid,
        email=email
    ).on_conflict_do_update(
        index_elements=['id'],
        set_={'email': email}
    ).returning(User)
    
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    await db.commit()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not provision user"
        )
        
    return user
