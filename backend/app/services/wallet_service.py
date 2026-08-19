from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, and_
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from app.db.models.wallet_core import WalletCredit, WalletCoreTransaction, WalletRule, WalletCreditStatus, WalletTransactionType
from app.db.models.order import Order, OrderItem, OrderItemType

class WalletService:
    
    @staticmethod
    async def get_active_rule(db: AsyncSession) -> WalletRule:
        result = await db.execute(select(WalletRule).where(WalletRule.is_active == True).order_by(WalletRule.id.desc()))
        rule = result.scalars().first()
        if not rule:
            # Fallback safe defaults if no rule exists in db
            rule = WalletRule(
                min_tester_purchase=200.00,
                redeem_percentage=75.00,
                platform_fee_percentage=25.00,
                expiry_days=90
            )
        return rule

    @staticmethod
    async def process_tester_purchase(db: AsyncSession, user_id: int, order: Order) -> List[WalletCredit]:
        """
        Evaluate an order for tester items and generate wallet credits if eligible.
        """
        rule = await WalletService.get_active_rule(db)
        
        # Calculate total tester purchase amount in this order
        tester_items = [item for item in order.items if item.item_type == OrderItemType.TESTER]
        
        if not tester_items:
            return []
            
        total_tester_amount = sum(float(item.total_price) for item in tester_items)
        
        if total_tester_amount < float(rule.min_tester_purchase):
            # Not eligible for wallet credit
            return []
            
        credits_created = []
        for item in tester_items:
            original_amount = float(item.total_price)
            redeemable_amount = original_amount * (float(rule.redeem_percentage) / 100.0)
            platform_fee = original_amount * (float(rule.platform_fee_percentage) / 100.0)
            
            credit = WalletCredit(
                user_id=user_id,
                tester_order_id=order.id,
                eligible_product_id=item.product_id,
                original_amount=original_amount,
                redeemable_amount=redeemable_amount,
                platform_fee=platform_fee,
                status=WalletCreditStatus.ACTIVE,
                expiry_date=datetime.now(timezone.utc) + timedelta(days=rule.expiry_days)
            )
            db.add(credit)
            await db.flush() # flush to get credit.id
            
            # Create audit transaction
            transaction = WalletCoreTransaction(
                user_id=user_id,
                wallet_credit_id=credit.id,
                transaction_type=WalletTransactionType.CREDIT_EARNED,
                amount=original_amount,
                description=f"Earned wallet credit for purchasing tester of product {item.product_id}"
            )
            db.add(transaction)
            credits_created.append(credit)
            
        await db.commit()
        return credits_created

    @staticmethod
    async def get_eligible_credit_for_product(db: AsyncSession, user_id: int, product_id: int) -> Optional[WalletCredit]:
        """
        Finds the highest value active wallet credit for a specific full product.
        """
        now = datetime.now(timezone.utc)
        result = await db.execute(
            select(WalletCredit)
            .where(
                WalletCredit.user_id == user_id,
                WalletCredit.eligible_product_id == product_id,
                WalletCredit.status == WalletCreditStatus.ACTIVE,
                WalletCredit.expiry_date > now
            )
            .order_by(WalletCredit.original_amount.desc(), WalletCredit.id.desc())
        )
        return result.scalars().first()

    @staticmethod
    async def redeem_credit(db: AsyncSession, user_id: int, credit_id: int, full_order_id: int) -> bool:
        """
        Marks a credit as used during a full product purchase.
        """
        result = await db.execute(
            select(WalletCredit).where(WalletCredit.id == credit_id, WalletCredit.user_id == user_id)
        )
        credit = result.scalars().first()
        
        if not credit or credit.status != WalletCreditStatus.ACTIVE:
            return False
            
        credit.status = WalletCreditStatus.USED
        credit.redeemed_order_id = full_order_id
        credit.updated_at = datetime.now(timezone.utc)
        
        # Create audit transaction
        transaction = WalletCoreTransaction(
            user_id=user_id,
            wallet_credit_id=credit.id,
            transaction_type=WalletTransactionType.CREDIT_REDEEMED,
            amount=credit.redeemable_amount,
            description=f"Redeemed credit for full product upgrade (Order {full_order_id})"
        )
        db.add(transaction)
        await db.commit()
        return True

    @staticmethod
    async def get_user_wallet_summary(db: AsyncSession, user_id: int):
        """
        Fetch summary for profile wallet UI.
        """
        now = datetime.now(timezone.utc)
        
        # Mark expired first (lazy cleanup)
        expired_result = await db.execute(
            select(WalletCredit)
            .where(
                WalletCredit.user_id == user_id,
                WalletCredit.status == WalletCreditStatus.ACTIVE,
                WalletCredit.expiry_date <= now
            )
        )
        expired_credits = expired_result.scalars().all()
        for c in expired_credits:
            c.status = WalletCreditStatus.EXPIRED
            tx = WalletCoreTransaction(
                user_id=user_id,
                wallet_credit_id=c.id,
                transaction_type=WalletTransactionType.CREDIT_EXPIRED,
                amount=c.original_amount,
                description="Credit expired"
            )
            db.add(tx)
        
        if expired_credits:
            await db.commit()
            
        # Fetch all credits
        all_result = await db.execute(
            select(WalletCredit)
            .where(WalletCredit.user_id == user_id)
            .order_by(WalletCredit.created_at.desc())
        )
        all_credits = all_result.scalars().all()
        
        active = [c for c in all_credits if c.status == WalletCreditStatus.ACTIVE]
        used = [c for c in all_credits if c.status == WalletCreditStatus.USED]
        expired = [c for c in all_credits if c.status == WalletCreditStatus.EXPIRED]
        
        total_balance = sum(float(c.redeemable_amount) for c in active)
        
        return {
            "total_balance": total_balance,
            "active_credits": active,
            "used_credits": used,
            "expired_credits": expired
        }
