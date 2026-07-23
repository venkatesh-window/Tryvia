import enum
from sqlalchemy import Column, Integer, String, Boolean, Enum, Numeric, DateTime
from sqlalchemy.sql import func
from app.db.database import Base

class LoyaltyTier(str, enum.Enum):
    BRONZE = "BRONZE"
    SILVER = "SILVER"
    GOLD = "GOLD"
    PLATINUM = "PLATINUM"
    DIAMOND = "DIAMOND"
    ELITE = "ELITE"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Gamification & Wallet
    loyalty_tier = Column(Enum(LoyaltyTier), default=LoyaltyTier.BRONZE)
    wallet_balance = Column(Numeric(10, 2), default=0.00)
    stars = Column(Integer, default=0)
    
    # Audit
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
