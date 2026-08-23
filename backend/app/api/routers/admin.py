from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Any, List

from app.db.database import get_db
from app.db.models.order import Order
from app.db.models.wallet_core import WalletCredit

router = APIRouter()

# Note: In a real app, protect these routes with an Admin role check
# For Tryvia mockup we leave it open

@router.get("/dashboard")
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    """Simple dashboard stats"""
    orders_result = await db.execute(select(Order))
    orders = orders_result.scalars().all()
    
    credits_result = await db.execute(select(WalletCredit))
    credits = credits_result.scalars().all()
    
    total_revenue = sum(float(o.total_amount) for o in orders)
    total_credits = sum(float(c.redeemable_amount) for c in credits)
    
    return {
        "total_orders": len(orders),
        "total_revenue": total_revenue,
        "total_wallet_credits_issued": total_credits
    }

@router.post("/orders/{order_id}/status")
async def update_order_status(order_id: int, new_status: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    order.status = new_status
    await db.commit()
    return {"message": "Order status updated", "status": order.status}
