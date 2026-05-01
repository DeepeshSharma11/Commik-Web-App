from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from app.db.supabase_client import get_supabase_service
from app.db.async_db import db
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/products", tags=["Products"])

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    unit: str
    image: Optional[str] = None
    tag: Optional[str] = None
    is_active: bool = True

@router.get("/")
async def get_all_products(user=Depends(get_current_user)):
    """Fetch all active products for the E-commerce store."""
    supabase = get_supabase_service()
    
    # Only active products for regular users
    query = supabase.table("products").select("*").order("created_at")
    
    if user.get("role") != "malik":
        query = query.eq("is_active", True)
        
    res = await db(query)
    return res.data

@router.post("/")
async def create_product(product: ProductCreate, user=Depends(get_current_user)):
    """Only malik can add new products."""
    if user.get("role") != "malik":
        raise HTTPException(status_code=403, detail="Forbidden")
        
    supabase = get_supabase_service()
    res = await db(supabase.table("products").insert(product.model_dump()))
    return res.data[0]

@router.delete("/{product_id}")
async def delete_product(product_id: str, user=Depends(get_current_user)):
    """Only malik can delete/deactivate products."""
    if user.get("role") != "malik":
        raise HTTPException(status_code=403, detail="Forbidden")
        
    supabase = get_supabase_service()
    # Instead of deleting, we can deactivate it
    res = await db(supabase.table("products").update({"is_active": False}).eq("id", product_id))
    return {"message": "Product deactivated successfully"}
