from sqlalchemy import Column, Integer, String, Boolean, Numeric, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    
    products = relationship("Product", back_populates="category")

class Brand(Base):
    __tablename__ = "brands"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    
    products = relationship("Product", back_populates="brand")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    brand_id = Column(Integer, ForeignKey("brands.id"))
    category_id = Column(Integer, ForeignKey("categories.id"))
    
    description = Column(Text, nullable=False)
    
    # Pricing
    full_price = Column(Numeric(10, 2), nullable=False)
    tester_price = Column(Numeric(10, 2), nullable=True)
    
    # Tester flow
    tester_available = Column(Boolean, default=True)
    stock_full = Column(Integer, default=0)
    stock_tester = Column(Integer, default=0)
    image_url = Column(String, nullable=True)
    
    # Audit
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    brand = relationship("Brand", back_populates="products")
    category = relationship("Category", back_populates="products")
