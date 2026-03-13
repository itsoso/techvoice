from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.admin import Admin
from app.models.executive import Executive
from app.models.tenant_admin import TenantAdmin

bearer_scheme = HTTPBearer()


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Admin:
    try:
        payload = decode_access_token(credentials.credentials)
    except Exception as exc:  # pragma: no cover - exercised via auth failure handling
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid token") from exc

    username = payload.get("sub")
    admin = db.scalar(select(Admin).where(Admin.username == username))
    if admin is None or not admin.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid token")
    return admin


def get_current_tenant_admin(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> TenantAdmin:
    try:
        payload = decode_access_token(credentials.credentials)
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid token") from exc

    if payload.get("role") != "tenant_admin":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid token")

    subject = payload.get("sub", "")
    if not subject.startswith("tenant_admin:"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid token")

    admin_id = int(subject.split(":", 1)[1])
    admin = db.scalar(select(TenantAdmin).where(TenantAdmin.id == admin_id))
    if admin is None or not admin.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid token")
    return admin


def get_current_executive(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Executive:
    try:
        payload = decode_access_token(credentials.credentials)
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid token") from exc

    if payload.get("role") != "executive":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid token")

    subject = payload.get("sub", "")
    if not subject.startswith("executive:"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid token")

    executive_id = int(subject.split(":", 1)[1])
    executive = db.scalar(select(Executive).where(Executive.id == executive_id))
    if executive is None or not executive.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid token")
    return executive
