from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func

from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.models.client import Client
from backend.app.models.project import Project
from backend.app.schemas.client import ClientCreate, ClientUpdate, ClientOut
from backend.app.api.deps import get_current_user

router = APIRouter()

@router.get("", response_model=List[ClientOut])
async def list_clients(
    q: Optional[str] = Query(None, description="Search by company or contact name"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List clients owned by the current user (or all if admin)."""
    stmt = select(Client)
    if current_user.role != "admin":
        stmt = stmt.where(Client.owner_id == current_user.id)
    
    if q:
        search_filter = or_(
            Client.company_name.ilike(f"%{q}%"),
            Client.primary_contact_name.ilike(f"%{q}%"),
            Client.contact_email.ilike(f"%{q}%"),
            Client.industry.ilike(f"%{q}%")
        )
        stmt = stmt.where(search_filter)

    stmt = stmt.order_by(Client.created_at.desc())
    res = await db.execute(stmt)
    clients = list(res.scalars().all())

    # Attach project count
    result = []
    for c in clients:
        p_count_query = select(func.count(Project.id)).where(Project.client_id == c.id)
        p_count_res = await db.execute(p_count_query)
        count = p_count_res.scalar_one() or 0
        
        c_out = ClientOut.model_validate(c)
        c_out.project_count = count
        result.append(c_out)

    return result

@router.post("", response_model=ClientOut, status_code=status.HTTP_201_CREATED)
async def create_client(
    payload: ClientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new client record."""
    new_client = Client(
        owner_id=current_user.id,
        **payload.model_dump()
    )
    db.add(new_client)
    await db.commit()
    await db.refresh(new_client)
    
    out = ClientOut.model_validate(new_client)
    out.project_count = 0
    return out

@router.get("/{client_id}", response_model=ClientOut)
async def get_client(
    client_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get specific client details (tenant isolated)."""
    stmt = select(Client).where(Client.id == client_id)
    if current_user.role != "admin":
        stmt = stmt.where(Client.owner_id == current_user.id)
    
    res = await db.execute(stmt)
    client = res.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found or access denied.")

    p_count_res = await db.execute(select(func.count(Project.id)).where(Project.client_id == client.id))
    out = ClientOut.model_validate(client)
    out.project_count = p_count_res.scalar_one() or 0
    return out

@router.put("/{client_id}", response_model=ClientOut)
async def update_client(
    client_id: str,
    payload: ClientUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update client record."""
    stmt = select(Client).where(Client.id == client_id)
    if current_user.role != "admin":
        stmt = stmt.where(Client.owner_id == current_user.id)
    
    res = await db.execute(stmt)
    client = res.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found or access denied.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(client, field, val)

    await db.commit()
    await db.refresh(client)
    return ClientOut.model_validate(client)

@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a client and all linked projects & proposals (cascade)."""
    stmt = select(Client).where(Client.id == client_id)
    if current_user.role != "admin":
        stmt = stmt.where(Client.owner_id == current_user.id)
    
    res = await db.execute(stmt)
    client = res.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found or access denied.")

    await db.delete(client)
    await db.commit()
    return None
