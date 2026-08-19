from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, List, Dict
from pydantic import BaseModel
from datetime import datetime

from app.db.database import get_db
from app.api.deps import get_current_user
from app.db.models.user import User
from app.services.wallet_service import WalletService
from app.db.models.wallet_core import WalletCreditStatus

router = APIRouter()

class WalletRuleSchema(BaseModel):
    min_tester_purchase: float
    redeem_percentage: float
    platform_fee_percentage: float
    expiry_days: int

class WalletCreditSchema(BaseModel):
    id: int
    eligible_product_id: int
    original_amount: float
    redeemable_amount: float
    platform_fee: float
    status: str
    expiry_date: datetime
    
    class Config:
        from_attributes = True

@router.get("/rules", response_model=WalletRuleSchema)
async def get_active_rules(
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get active wallet rules.
    """
    rule = await WalletService.get_active_rule(db)
    return {
        "min_tester_purchase": float(rule.min_tester_purchase),
        "redeem_percentage": float(rule.redeem_percentage),
        "platform_fee_percentage": float(rule.platform_fee_percentage),
        "expiry_days": rule.expiry_days
    }

@router.get("/balance")
async def get_wallet_balance(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get the user's wallet summary including active, used, and expired credits.
    """
    summary = await WalletService.get_user_wallet_summary(db, current_user.id)
    return {
        "total_balance": summary["total_balance"],
        "active_credits": [WalletCreditSchema.model_validate(c) for c in summary["active_credits"]],
        "used_credits": [WalletCreditSchema.model_validate(c) for c in summary["used_credits"]],
        "expired_credits": [WalletCreditSchema.model_validate(c) for c in summary["expired_credits"]]
    }

@router.get("/eligibility/{product_id}")
async def check_wallet_eligibility(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Check if the user has an eligible active wallet credit to upgrade to a specific full product.
    """
    credit = await WalletService.get_eligible_credit_for_product(db, current_user.id, product_id)
    if not credit:
        return {"eligible": False, "credit": None}
        
    return {
        "eligible": True,
        "credit": WalletCreditSchema.model_validate(credit)
    }
