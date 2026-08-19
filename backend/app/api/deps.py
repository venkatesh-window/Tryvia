from fastapi import Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.database import get_db
from app.db.models.user import User

async def get_current_user(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User))
    user = result.scalars().first()
    if not user:
        # Create a default user if none exists
        user = User(email="venkatesh@tryvia.luxury", hashed_password="mock", full_name="Venkatesh S")
        db.add(user)
        await db.commit()
        await db.refresh(user)
    return user
