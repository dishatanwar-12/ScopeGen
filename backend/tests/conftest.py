import pytest
import pytest_asyncio
import asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from backend.app.core.database import Base, get_db
from backend.app.core.security import hash_password, create_access_token
from backend.app.models.user import User
from backend.app.models.package import ServicePackage
from backend.app.models.template import ProposalTemplate
from backend.app.models.client import Client
from backend.app.models.project import Project
from backend.app.main import app

# In-memory test database URL
TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False}
)

TestSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

@pytest_asyncio.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()

@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestSessionLocal() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c

    app.dependency_overrides.clear()

@pytest_asyncio.fixture
async def test_admin(db_session: AsyncSession) -> User:
    admin = User(
        email="test_admin@example.com",
        full_name="Admin Test User",
        hashed_password=hash_password("AdminPass123!"),
        role="admin",
        is_active=True
    )
    db_session.add(admin)
    await db_session.commit()
    await db_session.refresh(admin)
    return admin

@pytest_asyncio.fixture
async def test_user_a(db_session: AsyncSession) -> User:
    user = User(
        email="user_a@example.com",
        full_name="Consultant User A",
        hashed_password=hash_password("Password123!"),
        role="consultant",
        is_active=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user

@pytest_asyncio.fixture
async def test_user_b(db_session: AsyncSession) -> User:
    user = User(
        email="user_b@example.com",
        full_name="Consultant User B",
        hashed_password=hash_password("Password123!"),
        role="consultant",
        is_active=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user

@pytest.fixture
def auth_headers_a(test_user_a: User) -> dict:
    token = create_access_token(subject=test_user_a.id, role=test_user_a.role)
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def auth_headers_b(test_user_b: User) -> dict:
    token = create_access_token(subject=test_user_b.id, role=test_user_b.role)
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def auth_headers_admin(test_admin: User) -> dict:
    token = create_access_token(subject=test_admin.id, role=test_admin.role)
    return {"Authorization": f"Bearer {token}"}

