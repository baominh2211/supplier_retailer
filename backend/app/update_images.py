"""
Update existing products with sample images
Run: python -m app.update_images
"""
import asyncio
from sqlalchemy import select, update
from app.database import AsyncSessionLocal, engine
from app.models import Product

# Sample images from Unsplash (free to use)
PRODUCT_IMAGES = {
    "Laptop": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400",
    "iPhone": "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400",
    "Samsung": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400",
    "Galaxy": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400",
    "Tab": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400",
    "Cà phê": "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400",
    "Coffee": "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400",
    "Trà": "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400",
    "Tea": "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400",
    "Nước": "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400",
    "Juice": "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400",
    "Áo": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400",
    "Shirt": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400",
    "Váy": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400",
    "Dress": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400",
    "Giày": "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=400",
    "Shoes": "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=400",
}

# Category-based fallback images
CATEGORY_IMAGES = {
    "Điện tử": "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400",
    "Electronics": "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400",
    "Thực phẩm": "https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=400",
    "Food": "https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=400",
    "Đồ uống": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400",
    "Beverages": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400",
    "Thời trang": "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400",
    "Fashion": "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400",
    "Giày dép": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
    "Footwear": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
}

# Default image if nothing matches
DEFAULT_IMAGE = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"


def get_image_for_product(name: str, category: str) -> str:
    """Find best matching image for a product"""
    # First, try to match by product name
    for keyword, image_url in PRODUCT_IMAGES.items():
        if keyword.lower() in name.lower():
            return image_url
    
    # Then, try to match by category
    if category and category in CATEGORY_IMAGES:
        return CATEGORY_IMAGES[category]
    
    # Return default image
    return DEFAULT_IMAGE


async def update_images():
    async with AsyncSessionLocal() as db:
        # Get all products without images
        result = await db.execute(
            select(Product).where(
                (Product.image_url == None) | (Product.image_url == "")
            )
        )
        products = result.scalars().all()
        
        if not products:
            print("✅ All products already have images!")
            return
        
        print(f"Found {len(products)} products without images...")
        
        updated = 0
        for product in products:
            image_url = get_image_for_product(product.name, product.category)
            product.image_url = image_url
            updated += 1
            print(f"  Updated: {product.name} -> {image_url[:50]}...")
        
        await db.commit()
        print(f"\n✅ Updated {updated} products with images!")


if __name__ == "__main__":
    asyncio.run(update_images())
