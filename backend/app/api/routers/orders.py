from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.db.database import get_db
from app.api.deps import get_current_user
from app.db.models.user import User
from app.db.models.order import Order, OrderItem, OrderStatus, OrderItemType
from app.db.models.product import Product
from app.services.wallet_service import WalletService

router = APIRouter()

class OrderItemInput(BaseModel):
    product_id: int
    item_type: str # "FULL" or "TESTER"
    quantity: int
    unit_price: float

class CreateOrderInput(BaseModel):
    items: List[OrderItemInput]
    apply_wallet_credit_id: Optional[int] = None

class OrderItemSchema(BaseModel):
    product_id: int
    item_type: str
    quantity: int
    unit_price: float
    total_price: float
    product_name: Optional[str] = None
    product_image_url: Optional[str] = None
    product_brand: Optional[str] = None
    
    class Config:
        from_attributes = True

class OrderSchema(BaseModel):
    id: int
    subtotal: float
    wallet_discount: float
    platform_fee: float
    total_amount: float
    status: str
    created_at: datetime
    items: List[OrderItemSchema]
    
    class Config:
        from_attributes = True

@router.post("/", response_model=OrderSchema)
async def create_order(
    order_in: CreateOrderInput,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Create a new order and securely process wallet redemptions and credits.
    """
    if not order_in.items:
        raise HTTPException(status_code=400, detail="Order must contain items")
        
    subtotal = 0.0
    order_items = []
    
    for item in order_in.items:
        total_price = item.quantity * item.unit_price
        subtotal += total_price
        
        # Note: In a real app we must verify unit_price against the database Product here!
        # Assuming trusted for demo purposes based on requirements
        
        order_items.append(
            OrderItem(
                product_id=item.product_id,
                item_type=OrderItemType.FULL if item.item_type == "full" else OrderItemType.TESTER,
                quantity=item.quantity,
                unit_price=item.unit_price,
                total_price=total_price
            )
        )
        
    wallet_discount = 0.0
    platform_fee = 0.0
    total_amount = subtotal
    
    # Process Wallet Redemption if requested
    if order_in.apply_wallet_credit_id:
        # Check if the credit is valid for any FULL items in the order
        full_items = [i for i in order_items if i.item_type == OrderItemType.FULL]
        if not full_items:
            raise HTTPException(status_code=400, detail="Cannot redeem wallet credit without a full size product")
            
        # We assume one credit applies to one product. For simplicity, check the first full item.
        # In a robust system, we would match credit eligible_product_id with the items.
        target_product_id = full_items[0].product_id
        
        eligible_credit = await WalletService.get_eligible_credit_for_product(db, current_user.id, target_product_id)
        if not eligible_credit or eligible_credit.id != order_in.apply_wallet_credit_id:
            raise HTTPException(status_code=400, detail="Invalid or ineligible wallet credit")
            
        wallet_discount = float(eligible_credit.redeemable_amount)
        platform_fee = float(eligible_credit.platform_fee)
        total_amount = subtotal - wallet_discount
        
    # Create the Order
    db_order = Order(
        user_id=current_user.id,
        subtotal=subtotal,
        wallet_discount=wallet_discount,
        platform_fee=platform_fee,
        total_amount=total_amount,
        status=OrderStatus.PAID,  # Auto paid for mock gateway
        items=order_items
    )
    db.add(db_order)
    await db.flush() # Get order ID
    
    # Process Wallet Earn/Redeem logic
    if order_in.apply_wallet_credit_id:
        await WalletService.redeem_credit(db, current_user.id, order_in.apply_wallet_credit_id, db_order.id)
        
    # Process potential new credits from this order (if they bought testers)
    await WalletService.process_tester_purchase(db, current_user.id, db_order)
    
    await db.commit()
    
    # Eagerly load the items and products
    from sqlalchemy.future import select
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Order).where(Order.id == db_order.id).options(
            selectinload(Order.items).selectinload(OrderItem.product).selectinload(Product.brand)
        )
    )
    final_order = result.scalars().first()
    
    # Map product info to order items for schema
    for item in final_order.items:
        if item.product:
            item.product_name = item.product.name
            item.product_image_url = item.product.image_url
            item.product_brand = item.product.brand.name if item.product.brand else 'TRYVIA'
    
    return final_order

@router.get("/", response_model=List[OrderSchema])
async def get_orders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get all orders for the current user.
    """
    from sqlalchemy.future import select
    from sqlalchemy.orm import selectinload
    
    result = await db.execute(
        select(Order)
        .where(Order.user_id == current_user.id)
        .options(selectinload(Order.items).selectinload(OrderItem.product).selectinload(Product.brand))
        .order_by(Order.created_at.desc())
    )
    orders = result.scalars().all()
    
    for order in orders:
        for item in order.items:
            if item.product:
                item.product_name = item.product.name
                item.product_image_url = item.product.image_url
                item.product_brand = item.product.brand.name if item.product.brand else 'TRYVIA'
                
    return orders
