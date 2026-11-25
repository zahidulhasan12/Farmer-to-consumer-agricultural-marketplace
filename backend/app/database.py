# Database engine and the per-request Session used by repositories.
from collections.abc import Iterator
from typing import Annotated

from fastapi import Depends
from sqlalchemy.pool import NullPool
from sqlmodel import Session, SQLModel, create_engine

from app.config import settings

DATABASE_URL = settings.database_url

if DATABASE_URL.startswith("sqlite"):
    # check_same_thread=False: FastAPI runs sync routes in thread pools.
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # Supabase connection pooler configuration.
    engine = create_engine(DATABASE_URL, poolclass=NullPool, connect_args={"prepare_threshold": None})


def _migrate_columns() -> None:
    """Ensure newly added columns like products.user_id and users.is_main_admin exist in existing SQLite databases."""
    try:
        with Session(engine) as session:
            # 1. Check if products table exists and has user_id
            table_check = session.connection().exec_driver_sql(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='products'"
            ).fetchone()
            if table_check:
                res = session.connection().exec_driver_sql("PRAGMA table_info(products)").fetchall()
                col_names = [r[1] for r in res]
                if "user_id" not in col_names:
                    session.connection().exec_driver_sql("ALTER TABLE products ADD COLUMN user_id CHAR(32)")
                    session.connection().exec_driver_sql("CREATE INDEX IF NOT EXISTS ix_products_user_id ON products (user_id)")
                    session.commit()

            # 2. Check if users table exists and has is_main_admin
            user_check = session.connection().exec_driver_sql(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
            ).fetchone()
            if user_check:
                res = session.connection().exec_driver_sql("PRAGMA table_info(users)").fetchall()
                col_names = [r[1] for r in res]
                if "is_main_admin" not in col_names:
                    session.connection().exec_driver_sql("ALTER TABLE users ADD COLUMN is_main_admin BOOLEAN DEFAULT 0")
                    session.connection().exec_driver_sql("CREATE INDEX IF NOT EXISTS ix_users_is_main_admin ON users (is_main_admin)")
                    session.commit()
    except Exception:
        pass


def create_db_and_tables() -> None:
    """Create missing database tables; existing tables and data remain untouched."""
    SQLModel.metadata.create_all(engine)
    if DATABASE_URL.startswith("sqlite"):
        _migrate_columns()


def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_session)]
