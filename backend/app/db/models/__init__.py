from app.db.database import Base
from app.db.models.user import User, LoyaltyTier
from app.db.models.product import Product, Category, Brand
from app.db.models.wallet import WalletTransaction, TransactionType

# This file imports all the models so that Alembic can easily discover them
# by importing Base from app.db.models
