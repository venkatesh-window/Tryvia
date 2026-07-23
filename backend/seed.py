import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import AsyncSessionLocal
from app.db.models.user import User
from app.db.models.product import Category, Brand, Product
from app.core.security import get_password_hash

async def seed():
    async with AsyncSessionLocal() as session:
        # Create user
        user = User(
            email="test@tryvia.com",
            hashed_password=get_password_hash("password123"),
            full_name="Tester User",
            wallet_balance=350,
            loyalty_tier="BRONZE",
            stars=120
        )
        session.add(user)

        # Create Brands
        kiehls = Brand(name="Kiehls", description="Premium Skincare")
        mfk = Brand(name="Maison Francis Kurkdjian", description="Luxury Fragrance")
        estee = Brand(name="Estee Lauder", description="Luxury Skincare & Makeup")
        olaplex = Brand(name="Olaplex", description="Professional Haircare")
        dior = Brand(name="Dior Beauty", description="Luxury Makeup & Skincare")
        session.add_all([kiehls, mfk, estee, olaplex, dior])
        
        await session.commit()
        
        # Create Categories
        skincare = Category(name="Skincare")
        fragrance = Category(name="Fragrance")
        haircare = Category(name="Haircare")
        makeup = Category(name="Makeup")
        session.add_all([skincare, fragrance, haircare, makeup])
        
        await session.commit()

        # Create Products
        products = [
            Product(
                name="Midnight Recovery Cloud Cream",
                full_price=5200,
                tester_price=350,
                stock_full=100,
                stock_tester=50,
                image_url="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop",
                description="A luxurious, lightweight cream that visibly plumps and smooths your skin while you sleep. Formulated with our signature botanical blend to restore radiance overnight.",
                brand_id=kiehls.id,
                category_id=skincare.id
            ),
            Product(
                name="Baccarat Rouge 540",
                full_price=28500,
                tester_price=950,
                stock_full=20,
                stock_tester=100,
                image_url="https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop",
                description="Luminous and sophisticated, Baccarat Rouge 540 lays on the skin like an amber floral and woody breeze. A poetic alchemy where the aerial notes of jasmine and the radiance of saffron carry mineral facets of ambergris and woody tones of a freshly cut cedar wood.",
                brand_id=mfk.id,
                category_id=fragrance.id
            ),
            Product(
                name="Advanced Night Repair",
                full_price=8900,
                tester_price=450,
                stock_full=80,
                stock_tester=200,
                image_url="https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=600&auto=format&fit=crop",
                description="The #1 serum in the US. Experience the power of 7 serums in 1: line reduction, firmness, even tone, strengthening, hydration, radiance, and antioxidants.",
                brand_id=estee.id,
                category_id=skincare.id
            ),
            Product(
                name="Olaplex No.7 Bonding Oil",
                full_price=3200,
                tester_price=250,
                stock_full=150,
                stock_tester=0,
                image_url="https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=600&auto=format&fit=crop",
                description="A highly-concentrated, weightless reparative styling oil. Dramatically increase shine, softness, and color vibrancy. N°7 minimizes flyaways and frizz, while providing UV/heat protection of up to 450°F/232°C.",
                brand_id=olaplex.id,
                category_id=haircare.id
            ),
            Product(
                name="Dior Addict Lip Glow",
                full_price=3800,
                tester_price=300,
                stock_full=60,
                stock_tester=150,
                image_url="https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=600&auto=format&fit=crop",
                description="The iconic Dior lip balm formulated with 97% natural-origin ingredients that subtly revives the natural color of lips with a custom glow for 6h and hydrates lips for 24h.",
                brand_id=dior.id,
                category_id=makeup.id
            )
        ]
        
        session.add_all(products)
        await session.commit()
        print("Database seeded successfully with rich product data!")

if __name__ == "__main__":
    asyncio.run(seed())
