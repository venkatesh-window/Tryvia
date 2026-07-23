from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List

from app.db.database import get_db
from app.db.models.product import Product, Brand, Category
from pydantic import BaseModel

router = APIRouter()

class BrandResponse(BaseModel):
    id: int
    name: str
    description: str | None = None

    class Config:
        from_attributes = True

class CategoryResponse(BaseModel):
    id: int
    name: str
    description: str | None = None

    class Config:
        from_attributes = True

class ProductResponse(BaseModel):
    id: int
    name: str
    description: str | None = None
    full_price: int
    tester_price: int
    stock_full: int
    stock_tester: int
    image_url: str | None = None
    category_id: int | None = None
    brand_id: int | None = None
    
    brand: BrandResponse | None = None
    category: CategoryResponse | None = None

    class Config:
        from_attributes = True

@router.get("/", response_model=List[ProductResponse])
async def get_products(limit: int = 10, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.brand), selectinload(Product.category))
        .limit(limit)
    )
    products = result.scalars().all()
    return products

@router.get("/testers", response_model=List[ProductResponse])
async def get_testers(limit: int = 10, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.brand), selectinload(Product.category))
        .where(Product.stock_tester > 0)
        .limit(limit)
    )
    products = result.scalars().all()
    return products

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.brand), selectinload(Product.category))
        .where(Product.id == product_id)
    )
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
