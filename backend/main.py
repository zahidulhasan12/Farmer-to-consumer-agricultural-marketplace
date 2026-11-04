# Application entry point: initializes FastAPI, mounts product routers, handles errors, and serves the frontend build.
import logging
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sqlmodel import Session

from app.config import BACKEND_DIR
from app.database import create_db_and_tables, engine
from app.products.router import router as products_router
from app.products.service import ProductRuleError
from app.seed import seed_products_if_empty

logger = logging.getLogger("agroconnect")

app = FastAPI(
    title="AgroConnect — Farmer-to-Consumer Agricultural Marketplace API",
    description="REST API for agricultural products CRUD operations, supporting both local SQLite and Supabase PostgreSQL.",
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    redoc_url=None,
)

# Mount product routers: supports both /api/v1/products and /api/products for broad compatibility
app.include_router(products_router, prefix="/api/v1/products")
app.include_router(products_router, prefix="/api/products")


# Initialize database tables and seed sample data on startup
create_db_and_tables()
with Session(engine) as session:
    seed_products_if_empty(session)


@app.exception_handler(ProductRuleError)
async def product_rule_error_handler(request: Request, exc: ProductRuleError) -> JSONResponse:
    return JSONResponse(status_code=409, content={"detail": str(exc)})


@app.exception_handler(Exception)
async def unhandled_error_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error("Unhandled error on %s %s", request.method, request.url.path, exc_info=exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "AgroConnect Marketplace API"}


FRONTEND_DIR = BACKEND_DIR.parent / "frontend" / "dist"

# dist/ only exists after `npm run build`; in development the Vite dev server serves the UI.
if FRONTEND_DIR.is_dir():
    app.frontend("/", directory=FRONTEND_DIR, fallback="index.html")
