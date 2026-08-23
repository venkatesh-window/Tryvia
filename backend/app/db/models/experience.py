import enum
from sqlalchemy import Column, Integer, String, Enum, Numeric, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class ExperienceStatus(str, enum.Enum):
    PENDING = "PENDING"
    EXPERIENCED = "EXPERIENCED"

class TesterExperience(Base):
    """
    Tracks the user's experience journey for a purchased tester.
    """
    __tablename__ = "tester_experiences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    order_item_id = Column(Integer, ForeignKey("order_items.id"), nullable=False, unique=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    status = Column(Enum(ExperienceStatus), default=ExperienceStatus.PENDING)
    experienced_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User")
    order_item = relationship("OrderItem")
    product = relationship("Product")
    review = relationship("Review", back_populates="experience", uselist=False)

class Review(Base):
    """
    A product review, optionally linked to a tester experience.
    """
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    experience_id = Column(Integer, ForeignKey("tester_experiences.id"), nullable=True, unique=True)
    
    rating = Column(Integer, nullable=False) # 1 to 5
    content = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User")
    product = relationship("Product")
    experience = relationship("TesterExperience", back_populates="review")
