import enum
from sqlalchemy import Column, Integer, String, Enum, Numeric, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class TransactionType(str, enum.Enum):
    CREDIT = "CREDIT"
    DEBIT = "DEBIT"

class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    amount = Column(Numeric(10, 2), nullable=False)
    transaction_type = Column(Enum(TransactionType), nullable=False)
    description = Column(String, nullable=True)
    
    # Wallet rules (locked to full-size product)
    locked_to_product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    
    expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Audit
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    locked_product = relationship("Product")
