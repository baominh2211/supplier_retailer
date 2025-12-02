"""
Seed database with test data
Run: python -m app.seed
"""
import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal, engine, Base
from app.models import User, Supplier, Shop, Product, UserRole, ProductStatus
from app.auth import get_password_hash

async def seed():
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncSessionLocal() as db:
        # Check if data exists
        result = await db.execute(select(User).limit(1))
        if result.scalar_one_or_none():
            print("Database already seeded!")
            return
        
        print("Seeding database...")
        
        # Create Admin
        admin = User(
            email="admin@b2bmarket.com",
            password_hash=get_password_hash("Admin123!"),
            full_name="Admin User",
            role=UserRole.ADMIN
        )
        db.add(admin)
        
        # Create Suppliers
        suppliers_data = [
            {"email": "supplier1@techcorp.com", "name": "Tech Corp Vietnam", "company": "Tech Corp", "desc": "Nhà cung cấp linh kiện điện tử hàng đầu"},
            {"email": "supplier2@foodco.com", "name": "Food Co", "company": "Food & Beverage Co", "desc": "Thực phẩm và đồ uống chất lượng cao"},
            {"email": "supplier3@fashion.com", "name": "Fashion Style", "company": "Fashion Style Ltd", "desc": "Thời trang nam nữ cao cấp"},
        ]
        
        created_suppliers = []
        for s in suppliers_data:
            user = User(
                email=s["email"],
                password_hash=get_password_hash("Supplier123!"),
                full_name=s["name"],
                role=UserRole.SUPPLIER
            )
            db.add(user)
            await db.flush()
            
            supplier = Supplier(
                user_id=user.id,
                company_name=s["company"],
                description=s["desc"],
                address="123 Business Street, HCM",
                phone="0901234567"
            )
            db.add(supplier)
            await db.flush()
            created_suppliers.append(supplier)
        
        # Create Shops
        shops_data = [
            {"email": "shop1@retailplus.com", "name": "Retail Plus", "shop": "Retail Plus Store"},
            {"email": "shop2@minimart.com", "name": "Mini Mart", "shop": "Mini Mart Chain"},
        ]
        
        for s in shops_data:
            user = User(
                email=s["email"],
                password_hash=get_password_hash("Shop123!"),
                full_name=s["name"],
                role=UserRole.SHOP
            )
            db.add(user)
            await db.flush()
            
            shop = Shop(
                user_id=user.id,
                shop_name=s["shop"],
                address="456 Retail Street, HCM",
                phone="0909876543"
            )
            db.add(shop)
        
        # Create Products
        products_data = [
            # Tech Corp products
            {"name": "Laptop Dell XPS 15", "desc": "Laptop cao cấp cho doanh nghiệp", "price": 35000000, "stock": 50, "category": "Điện tử", "supplier_idx": 0},
            {"name": "iPhone 15 Pro", "desc": "Điện thoại flagship Apple", "price": 28000000, "stock": 100, "category": "Điện tử", "supplier_idx": 0},
            {"name": "Samsung Galaxy Tab S9", "desc": "Máy tính bảng Android cao cấp", "price": 18000000, "stock": 75, "category": "Điện tử", "supplier_idx": 0},
            # Food Co products
            {"name": "Cà phê Arabica Premium", "desc": "Cà phê nguyên chất 100%", "price": 250000, "stock": 500, "category": "Thực phẩm", "supplier_idx": 1},
            {"name": "Trà Oolong Đài Loan", "desc": "Trà cao cấp nhập khẩu", "price": 180000, "stock": 300, "category": "Thực phẩm", "supplier_idx": 1},
            {"name": "Nước ép trái cây hữu cơ", "desc": "100% trái cây tự nhiên", "price": 45000, "stock": 1000, "category": "Đồ uống", "supplier_idx": 1},
            # Fashion products
            {"name": "Áo sơ mi nam cao cấp", "desc": "Vải cotton Ai Cập", "price": 850000, "stock": 200, "category": "Thời trang", "supplier_idx": 2},
            {"name": "Váy đầm nữ công sở", "desc": "Thiết kế Hàn Quốc", "price": 1200000, "stock": 150, "category": "Thời trang", "supplier_idx": 2},
            {"name": "Giày da nam Italy", "desc": "Da bò thật 100%", "price": 2500000, "stock": 80, "category": "Giày dép", "supplier_idx": 2},
        ]
        
        for p in products_data:
            product = Product(
                supplier_id=created_suppliers[p["supplier_idx"]].id,
                name=p["name"],
                description=p["desc"],
                price=p["price"],
                stock=p["stock"],
                category=p["category"],
                status=ProductStatus.ACTIVE
            )
            db.add(product)
        
        await db.commit()
        print("✅ Database seeded successfully!")
        print("\n📧 Test Accounts:")
        print("  Admin: admin@b2bmarket.com / Admin123!")
        print("  Supplier: supplier1@techcorp.com / Supplier123!")
        print("  Shop: shop1@retailplus.com / Shop123!")

if __name__ == "__main__":
    asyncio.run(seed())
