from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import Any, List
from pydantic import BaseModel
from datetime import datetime, timezone

from app.db.database import get_db
from app.api.deps import get_current_user
from app.db.models.user import User
from app.db.models.experience import TesterExperience, Review, ExperienceStatus
from app.db.models.wallet_core import WalletCredit, WalletCreditStatus, WalletRule, WalletCoreTransaction, WalletTransactionType

router = APIRouter()

class ReviewInput(BaseModel):
    rating: int
    content: str | None = None

class ExperienceSchema(BaseModel):
    id: int
    order_item_id: int
    product_id: int
    status: str
    experienced_at: datetime | None = None
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[ExperienceSchema])
async def get_experiences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all tester experiences for current user"""
    result = await db.execute(
        select(TesterExperience)
        .where(TesterExperience.user_id == current_user.id)
        .order_by(TesterExperience.created_at.desc())
    )
    return result.scalars().all()

@router.post("/{experience_id}/mark-experienced")
async def mark_experienced(
    experience_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    result = await db.execute(select(TesterExperience).where(TesterExperience.id == experience_id, TesterExperience.user_id == current_user.id))
    experience = result.scalars().first()
    if not experience:
        raise HTTPException(status_code=404, detail="Experience not found")
        
    if experience.status == ExperienceStatus.EXPERIENCED:
        return {"message": "Already experienced"}
        
    experience.status = ExperienceStatus.EXPERIENCED
    experience.experienced_at = datetime.now(timezone.utc)
    
    # Check if we should unlock wallet credit early (if review is not required)
    rule_result = await db.execute(select(WalletRule).where(WalletRule.is_active == True).order_by(WalletRule.id.desc()))
    rule = rule_result.scalars().first()
    if rule and not rule.requires_review:
        # Unlock credit
        credit_result = await db.execute(select(WalletCredit).where(WalletCredit.tester_order_id == experience.order_item.order_id, WalletCredit.eligible_product_id == experience.product_id))
        credit = credit_result.scalars().first()
        if credit and credit.status == WalletCreditStatus.LOCKED:
            credit.status = WalletCreditStatus.ACTIVE
            db.add(WalletCoreTransaction(
                user_id=current_user.id,
                wallet_credit_id=credit.id,
                transaction_type=WalletTransactionType.CREDIT_EARNED,
                amount=0,
                description="Credit unlocked after experience"
            ))
            
    await db.commit()
    return {"message": "Marked as experienced"}

@router.post("/{experience_id}/review")
async def add_review(
    experience_id: int,
    review_in: ReviewInput,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    # Need to load the order_item to get order_id for credit lookup
    result = await db.execute(
        select(TesterExperience).options(selectinload(TesterExperience.order_item))
        .where(TesterExperience.id == experience_id, TesterExperience.user_id == current_user.id)
    )
    experience = result.scalars().first()
    
    if not experience:
        raise HTTPException(status_code=404, detail="Experience not found")
        
    if review_in.rating < 1 or review_in.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
        
    # Check if review already exists
    existing = await db.execute(select(Review).where(Review.experience_id == experience.id))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Review already submitted")
        
    # Auto-mark experienced if not already
    if experience.status != ExperienceStatus.EXPERIENCED:
        experience.status = ExperienceStatus.EXPERIENCED
        experience.experienced_at = datetime.now(timezone.utc)
        
    review = Review(
        user_id=current_user.id,
        product_id=experience.product_id,
        experience_id=experience.id,
        rating=review_in.rating,
        content=review_in.content
    )
    db.add(review)
    
    # Unlock credit
    credit_result = await db.execute(
        select(WalletCredit)
        .where(
            WalletCredit.tester_order_id == experience.order_item.order_id, 
            WalletCredit.eligible_product_id == experience.product_id
        )
    )
    credit = credit_result.scalars().first()
    
    if credit and credit.status == WalletCreditStatus.LOCKED:
        credit.status = WalletCreditStatus.ACTIVE
        db.add(WalletCoreTransaction(
            user_id=current_user.id,
            wallet_credit_id=credit.id,
            transaction_type=WalletTransactionType.CREDIT_EARNED,
            amount=0,
            description="Credit unlocked after review"
        ))
        
    await db.commit()
    return {"message": "Review submitted and wallet credit unlocked (if applicable)"}
