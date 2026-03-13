from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import create_access_token
from app.db.session import get_db
from app.schemas.admin import AdminLoginRequest, TokenResponse
from app.services.admin_service import authenticate

router = APIRouter(tags=["admin-auth"])


@router.post("/admin/auth/login", response_model=TokenResponse)
def login(payload: AdminLoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    admin = authenticate(db, payload.username, payload.password)
    token = create_access_token(subject=admin.username)
    return TokenResponse(access_token=token)
