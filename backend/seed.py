import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import AsyncSessionLocal
from app.db.models.user import User
from app.db.models.product import Category, Brand, Product
from app.core.security import get_password_hash

async def seed():
    from app.db.database import engine, Base
    from app.db.models import __init__  # Ensure all models are loaded
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        
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
        chanel = Brand(name="Chanel", description="Haute Couture & Luxury Beauty")
        mfk = Brand(name="Maison Francis Kurkdjian", description="Luxury Fragrance")
        estee = Brand(name="Estee Lauder", description="Luxury Skincare & Makeup")
        olaplex = Brand(name="Olaplex", description="Professional Haircare")
        dior = Brand(name="Dior Beauty", description="Luxury Makeup & Skincare")
        session.add_all([kiehls, chanel, mfk, estee, olaplex, dior])
        
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
                full_price=5200, tester_price=350, stock_full=100, stock_tester=50,
                image_url="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop",
                description="A luxurious, lightweight cream that visibly plumps and smooths your skin while you sleep.",
                brand_id=kiehls.id, category_id=skincare.id
            ),
            Product(
                name="Coco Noir Eau de Parfum",
                full_price=18500, tester_price=950, stock_full=30, stock_tester=80,
                image_url="https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop",
                description="A magnetic, luminous fragrance combining black rose and oriental patchouli in an iconic black glass flacon.",
                brand_id=chanel.id, category_id=fragrance.id
            ),
            Product(
                name="Baccarat Rouge 540",
                full_price=28500, tester_price=950, stock_full=20, stock_tester=100,
                image_url="https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=600&auto=format&fit=crop",
                description="Luminous and sophisticated, Baccarat Rouge 540 lays on the skin like an amber floral and woody breeze.",
                brand_id=mfk.id, category_id=fragrance.id
            ),
            Product(
                name="Advanced Night Repair",
                full_price=8900, tester_price=450, stock_full=80, stock_tester=200,
                image_url="https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=600&auto=format&fit=crop",
                description="The #1 serum in the US. Experience the power of 7 serums in 1.",
                brand_id=estee.id, category_id=skincare.id
            ),
            Product(
                name="Olaplex No.7 Bonding Oil",
                full_price=3200, tester_price=250, stock_full=150, stock_tester=0,
                image_url="https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=600&auto=format&fit=crop",
                description="A highly-concentrated, weightless reparative styling oil.",
                brand_id=olaplex.id, category_id=haircare.id
            ),
            Product(
                name="Dior Addict Lip Glow",
                full_price=3800, tester_price=300, stock_full=60, stock_tester=150,
                image_url="https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=600&auto=format&fit=crop",
                description="The iconic Dior lip balm formulated with 97% natural-origin ingredients.",
                brand_id=dior.id, category_id=makeup.id
            ),
            Product(
                name="Ultra Facial Cream",
                full_price=3400, tester_price=200, stock_full=200, stock_tester=100,
                image_url="https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?q=80&w=600&auto=format&fit=crop",
                description="Our #1 facial hydrating cream has a unique lightweight texture.",
                brand_id=kiehls.id, category_id=skincare.id
            ),
            Product(
                name="Grand Soir",
                full_price=21000, tester_price=850, stock_full=30, stock_tester=80,
                image_url="https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=600&auto=format&fit=crop",
                description="Dress in your finest attire and polish your look. Grand Soir invites you to perfect yourself.",
                brand_id=mfk.id, category_id=fragrance.id
            ),
            Product(
                name="Double Wear Foundation",
                full_price=4500, tester_price=250, stock_full=120, stock_tester=150,
                image_url="https://images.unsplash.com/photo-1599305090598-fe179d501227?q=80&w=600&auto=format&fit=crop",
                description="Over 55 shades. 24-hour staying power. The #1 prestige foundation in the US.",
                brand_id=estee.id, category_id=makeup.id
            ),
            Product(
                name="Olaplex No.3 Hair Perfector",
                full_price=3200, tester_price=200, stock_full=300, stock_tester=250,
                image_url="https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?q=80&w=600&auto=format&fit=crop",
                description="A weekly at-home treatment, not a conditioner, that reduces breakage and visibly strengthens hair.",
                brand_id=olaplex.id, category_id=haircare.id
            ),
            Product(
                name="Miss Dior Eau de Parfum",
                full_price=15000, tester_price=700, stock_full=85, stock_tester=100,
                image_url="https://images.unsplash.com/photo-1595425970377-c9703c48657a?q=80&w=600&auto=format&fit=crop",
                description="The new Miss Dior Eau de Parfum reveals the femininity of a sensual floral.",
                brand_id=dior.id, category_id=fragrance.id
            ),
            Product(
                name="Calendula Herbal-Extract Toner",
                full_price=3800, tester_price=250, stock_full=140, stock_tester=90,
                image_url="https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=600&auto=format&fit=crop",
                description="An effective, alcohol-free facial toner for oily and normal skin.",
                brand_id=kiehls.id, category_id=skincare.id
            ),
            Product(
                name="Oud Satin Mood",
                full_price=32000, tester_price=1200, stock_full=15, stock_tester=40,
                image_url="https://images.unsplash.com/photo-1622618991746-fe6004db3a47?q=80&w=600&auto=format&fit=crop",
                description="A free interpretation of oud wood, a rare and precious material.",
                brand_id=mfk.id, category_id=fragrance.id
            ),
            Product(
                name="Micro Essence",
                full_price=9500, tester_price=450, stock_full=60, stock_tester=100,
                image_url="https://images.unsplash.com/photo-1615397323223-b18420e6fbf4?q=80&w=600&auto=format&fit=crop",
                description="A groundbreaking essence lotion that activates and strengthens skin's foundation.",
                brand_id=estee.id, category_id=skincare.id
            ),
            Product(
                name="Olaplex No.4 Bond Maintenance Shampoo",
                full_price=3200, tester_price=250, stock_full=200, stock_tester=150,
                image_url="https://images.unsplash.com/photo-1626806787426-5910811b6325?q=80&w=600&auto=format&fit=crop",
                description="A highly moisturizing, reparative shampoo that leaves hair easy to manage, shiny, and healthier.",
                brand_id=olaplex.id, category_id=haircare.id
            ),
            Product(
                name="Dior Lip Maximizer",
                full_price=3800, tester_price=300, stock_full=180, stock_tester=200,
                image_url="https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=600&auto=format&fit=crop",
                description="The signature lip plumping gloss from the House of Dior.",
                brand_id=dior.id, category_id=makeup.id
            ),
            Product(
                name="Clearly Corrective Dark Spot Solution",
                full_price=6500, tester_price=400, stock_full=75, stock_tester=85,
                image_url="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop",
                description="A highly-efficacious dark spot corrector that helps visibly reduce dark spots and discolorations.",
                brand_id=kiehls.id, category_id=skincare.id
            ),
            Product(
                name="Aqua Universalis",
                full_price=18000, tester_price=750, stock_full=45, stock_tester=70,
                image_url="https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=600&auto=format&fit=crop",
                description="A luminous fragrance that bridges the gap between skin and clothing.",
                brand_id=mfk.id, category_id=fragrance.id
            ),
            Product(
                name="Pure Color Envy Lipstick",
                full_price=3400, tester_price=200, stock_full=250, stock_tester=120,
                image_url="https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=600&auto=format&fit=crop",
                description="Color with the power to transform your lips, your look, your attitude.",
                brand_id=estee.id, category_id=makeup.id
            ),
            Product(
                name="Olaplex No.5 Bond Maintenance Conditioner",
                full_price=3200, tester_price=250, stock_full=190, stock_tester=140,
                image_url="https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=600&auto=format&fit=crop",
                description="A highly-moisturizing, reparative conditioner that protects and repairs damaged hair.",
                brand_id=olaplex.id, category_id=haircare.id
            ),
            Product(
                name="Dior Forever Skin Glow Foundation",
                full_price=5200, tester_price=350, stock_full=95, stock_tester=110,
                image_url="https://images.unsplash.com/photo-1599305090598-fe179d501227?q=80&w=600&auto=format&fit=crop",
                description="A radiant foundation that gives the complexion a high-perfection finish with 24h wear.",
                brand_id=dior.id, category_id=makeup.id
            ),
            Product(
                name="Creamy Eye Treatment with Avocado",
                full_price=3200, tester_price=200, stock_full=160, stock_tester=130,
                image_url="https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=600&auto=format&fit=crop",
                description="A hydrating eye cream that is clinically demonstrated to de-puff and brighten.",
                brand_id=kiehls.id, category_id=skincare.id
            ),
            Product(
                name="Amyris Femme",
                full_price=19500, tester_price=800, stock_full=40, stock_tester=60,
                image_url="https://images.unsplash.com/photo-1595425970377-c9703c48657a?q=80&w=600&auto=format&fit=crop",
                description="A luminous fragrance born from the flamboyant encounter between Jamaican Amyris and Florentine Iris.",
                brand_id=mfk.id, category_id=fragrance.id
            ),
            Product(
                name="Revitalizing Supreme+ Creme",
                full_price=9800, tester_price=500, stock_full=85, stock_tester=90,
                image_url="https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?q=80&w=600&auto=format&fit=crop",
                description="A multi-action moisturizer that significantly improves skin's firmness, density, and elasticity.",
                brand_id=estee.id, category_id=skincare.id
            ),
            Product(
                name="Olaplex No.6 Bond Smoother",
                full_price=3200, tester_price=250, stock_full=140, stock_tester=100,
                image_url="https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?q=80&w=600&auto=format&fit=crop",
                description="A leave-in reparative styling creme that eliminates frizz, hydrates & protects all hair types.",
                brand_id=olaplex.id, category_id=haircare.id
            ),
            Product(
                name="Rouge Dior",
                full_price=3600, tester_price=200, stock_full=210, stock_tester=180,
                image_url="https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=600&auto=format&fit=crop",
                description="The iconic long-wearing Dior lipstick in 4 couture finishes.",
                brand_id=dior.id, category_id=makeup.id
            )
        ]
        
        session.add_all(products)
        await session.commit()
        
        # Create default Wallet Rule
        from app.db.models.wallet_core import WalletRule
        default_rule = WalletRule(
            min_tester_purchase=200.00,
            redeem_percentage=90.00,
            platform_fee_percentage=10.00,
            expiry_days=90
        )
        session.add(default_rule)
        await session.commit()

        print("Database seeded successfully with rich product data and wallet rules!")

if __name__ == "__main__":
    asyncio.run(seed())
