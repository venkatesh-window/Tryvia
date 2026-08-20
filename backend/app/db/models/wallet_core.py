import enum
from sqlalchemy import Column, Integer, String, Enum, Numeric, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
from datetime import timedelta

class WalletCreditStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    USED = "USED"
    EXPIRED = "EXPIRED"

class WalletCredit(Base):
    """
    Represents an individual wallet credit earned from a tester purchase.
    """
    __tablename__ = "wallet_credits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Link to the tester purchase that generated this credit
    tester_order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    # The full product this credit can be applied to
    eligible_product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    # Financials
    original_amount = Column(Numeric(10, 2), nullable=False)
    redeemable_amount = Column(Numeric(10, 2), nullable=False)  # e.g., 75%
    platform_fee = Column(Numeric(10, 2), nullable=False)      # e.g., 25%
    
    status = Column(Enum(WalletCreditStatus), default=WalletCreditStatus.ACTIVE)
    
    # Full product order where this was redeemed
    redeemed_order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    expiry_date = Column(DateTime(timezone=True), nullable=False)

    user = relationship("User")
    tester_order = relationship("Order", foreign_keys=[tester_order_id])
    redeemed_order = relationship("Order", foreign_keys=[redeemed_order_id])
    eligible_product = relationship("Product")

class WalletTransactionType(str, enum.Enum):
    CREDIT_EARNED = "CREDIT_EARNED"
    CREDIT_REDEEMED = "CREDIT_REDEEMED"
    CREDIT_EXPIRED = "CREDIT_EXPIRED"

class WalletCoreTransaction(Base):
    """
    Audit log of all wallet activity.
    """
    __tablename__ = "wallet_core_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    wallet_credit_id = Column(Integer, ForeignKey("wallet_credits.id"), nullable=False)
    
    transaction_type = Column(Enum(WalletTransactionType), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    description = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    wallet_credit = relationship("WalletCredit")

class WalletRule(Base):
    """
    Admin configurable rules for the wallet system.
    """
    __tablename__ = "wallet_rules"

    id = Column(Integer, primary_key=True, index=True)
    is_active = Column(Boolean, default=True)
    
    min_tester_purchase = Column(Numeric(10, 2), default=200.00)
    redeem_percentage = Column(Numeric(5, 2), default=90.00)
    platform_fee_percentage = Column(Numeric(5, 2), default=10.00)
    expiry_days = Column(Integer, default=90)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
