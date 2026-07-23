from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Any

from app.db.database import get_db
from app.db.models.user import User
from app.core.security import verify_password, get_password_hash, create_access_token
from pydantic import BaseModel, EmailStr

router = APIRouter()

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str | None = None
    is_active: bool = True
    is_superuser: bool = False
    wallet_balance: int = 0
    loyalty_tier: str = 'BRONZE'
    stars: int = 0

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

@router.post("/login", response_model=Token)
async def login_access_token(
    db: AsyncSession = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalars().first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    return {
        "access_token": create_access_token(user.id),
        "token_type": "bearer",
        "user": user,
    }

@router.post("/register", response_model=Token)
async def register(
    user_in: UserCreate, db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Create new user.
    """
    result = await db.execute(select(User).where(User.email == user_in.email))
    user = result.scalars().first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return {
        "access_token": create_access_token(user.id),
        "token_type": "bearer",
        "user": user,
    }
