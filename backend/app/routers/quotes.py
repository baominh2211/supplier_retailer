from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
from datetime import date, timedelta

from app.database import get_db
from app.models import User, Quote, QuoteStatus, RFQ, RFQStatus, Contract, ContractStatus, Shop, Supplier, Notification, NotificationType, Product
from app.schemas import QuoteResponse, QuoteWithDetails, QuoteUpdate, ContractResponse
from app.auth import get_current_user
from app.routers.notifications import create_notification

router = APIRouter()

@router.get("/", response_model=List[QuoteWithDetails])
async def list_quotes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List quotes"""
    result = await db.execute(
        select(Quote)
        .options(selectinload(Quote.supplier), selectinload(Quote.rfq))
        .order_by(Quote.created_at.desc())
    )
    return result.scalars().all()

@router.get("/{quote_id}", response_model=QuoteWithDetails)
async def get_quote(
    quote_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get quote details"""
    result = await db.execute(
        select(Quote)
        .options(selectinload(Quote.supplier), selectinload(Quote.rfq))
        .where(Quote.id == quote_id)
    )
    quote = result.scalar_one_or_none()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    return quote

@router.patch("/{quote_id}", response_model=QuoteResponse)
async def update_quote_status(
    quote_id: int,
    data: QuoteUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update quote status (accept/reject) - does NOT create contract"""
    result = await db.execute(
        select(Quote).options(selectinload(Quote.rfq)).where(Quote.id == quote_id)
    )
    quote = result.scalar_one_or_none()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    # Update quote status
    quote.status = data.status
    
    # If accepted, close RFQ and reject other quotes
    if data.status == QuoteStatus.ACCEPTED:
        # Update RFQ status to closed
        rfq = quote.rfq
        rfq.status = RFQStatus.CLOSED
        
        # Reject all other pending quotes for this RFQ
        other_quotes_result = await db.execute(
            select(Quote).where(
                Quote.rfq_id == quote.rfq_id,
                Quote.id != quote.id,
                Quote.status == QuoteStatus.PENDING
            )
        )
        other_quotes = other_quotes_result.scalars().all()
        for other_quote in other_quotes:
            other_quote.status = QuoteStatus.REJECTED
    
    await db.commit()
    await db.refresh(quote)
    return quote

@router.post("/{quote_id}/accept", response_model=ContractResponse)
async def accept_quote_and_create_contract(
    quote_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Accept quote and create contract - main flow for shop"""
    # Get quote with RFQ
    result = await db.execute(
        select(Quote)
        .options(selectinload(Quote.rfq), selectinload(Quote.supplier))
        .where(Quote.id == quote_id)
    )
    quote = result.scalar_one_or_none()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    if quote.status != QuoteStatus.PENDING:
        raise HTTPException(status_code=400, detail="Quote đã được xử lý trước đó")
    
    # Verify user is shop owner of this RFQ
    result = await db.execute(
        select(Shop).where(Shop.user_id == current_user.id)
    )
    shop = result.scalar_one_or_none()
    if not shop:
        raise HTTPException(status_code=403, detail="Chỉ shop mới có thể chấp nhận báo giá")
    
    if quote.rfq.shop_id != shop.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền chấp nhận báo giá này")
    
    # 1. Update quote status to ACCEPTED
    quote.status = QuoteStatus.ACCEPTED
    
    # 2. Update RFQ status to CLOSED
    rfq = quote.rfq
    rfq.status = RFQStatus.CLOSED
    
    # 3. Reject all other pending quotes for this RFQ
    other_quotes_result = await db.execute(
        select(Quote).where(
            Quote.rfq_id == quote.rfq_id,
            Quote.id != quote.id,
            Quote.status == QuoteStatus.PENDING
        )
    )
    other_quotes = other_quotes_result.scalars().all()
    for other_quote in other_quotes:
        other_quote.status = QuoteStatus.REJECTED
    
    # 4. Create contract
    contract = Contract(
        supplier_id=quote.supplier_id,
        shop_id=shop.id,
        product_id=rfq.product_id,
        agreed_price=quote.price,
        quantity=rfq.quantity,
        start_date=date.today(),
        end_date=date.today() + timedelta(days=365),  # Default 1 year
        status=ContractStatus.ACTIVE
    )
    db.add(contract)
    
    # Get product name for notification
    product_result = await db.execute(select(Product).where(Product.id == rfq.product_id))
    product = product_result.scalar_one_or_none()
    product_name = product.name if product else "Sản phẩm"
    
    # 5. Create notifications
    # Notify supplier - quote accepted
    await create_notification(
        db=db,
        user_id=quote.supplier.user_id,
        type=NotificationType.QUOTE_ACCEPTED,
        title="Báo giá được chấp nhận",
        message=f"Báo giá của bạn cho {product_name} đã được chấp nhận. Hợp đồng đã được tạo.",
        link="/supplier/contracts"
    )
    
    # Notify supplier - contract created
    await create_notification(
        db=db,
        user_id=quote.supplier.user_id,
        type=NotificationType.CONTRACT_CREATED,
        title="Hợp đồng mới",
        message=f"Hợp đồng mới cho {product_name} với {shop.shop_name}",
        link="/supplier/contracts"
    )
    
    # Notify shop - contract created
    await create_notification(
        db=db,
        user_id=current_user.id,
        type=NotificationType.CONTRACT_CREATED,
        title="Hợp đồng mới",
        message=f"Hợp đồng mới cho {product_name} đã được tạo thành công",
        link="/shop/contracts"
    )
    
    # Notify rejected suppliers
    for other_quote in other_quotes:
        other_supplier_result = await db.execute(
            select(Supplier).where(Supplier.id == other_quote.supplier_id)
        )
        other_supplier = other_supplier_result.scalar_one_or_none()
        if other_supplier:
            await create_notification(
                db=db,
                user_id=other_supplier.user_id,
                type=NotificationType.QUOTE_REJECTED,
                title="Báo giá không được chọn",
                message=f"Báo giá của bạn cho {product_name} không được chọn",
                link="/supplier/rfq"
            )
    
    await db.commit()
    await db.refresh(contract)
    
    return contract

@router.post("/{quote_id}/reject", response_model=QuoteResponse)
async def reject_quote(
    quote_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Reject a quote"""
    result = await db.execute(
        select(Quote).options(selectinload(Quote.rfq)).where(Quote.id == quote_id)
    )
    quote = result.scalar_one_or_none()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    if quote.status != QuoteStatus.PENDING:
        raise HTTPException(status_code=400, detail="Quote đã được xử lý trước đó")
    
    # Verify user is shop owner
    result = await db.execute(
        select(Shop).where(Shop.user_id == current_user.id)
    )
    shop = result.scalar_one_or_none()
    if not shop or quote.rfq.shop_id != shop.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền từ chối báo giá này")
    
    quote.status = QuoteStatus.REJECTED
    
    # Get product name and supplier for notification
    product_result = await db.execute(select(Product).where(Product.id == quote.rfq.product_id))
    product = product_result.scalar_one_or_none()
    product_name = product.name if product else "Sản phẩm"
    
    supplier_result = await db.execute(select(Supplier).where(Supplier.id == quote.supplier_id))
    supplier = supplier_result.scalar_one_or_none()
    
    if supplier:
        await create_notification(
            db=db,
            user_id=supplier.user_id,
            type=NotificationType.QUOTE_REJECTED,
            title="Báo giá bị từ chối",
            message=f"Báo giá của bạn cho {product_name} đã bị từ chối",
            link="/supplier/rfq"
        )
    
    await db.commit()
    await db.refresh(quote)
    return quote
