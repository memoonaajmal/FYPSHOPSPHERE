# Fashion Backend (Complete)

## Quickstart

1. unzip
2. cd backend
3. npm install
4. cp .env.example .env
5. edit .env to point CSV_PATH and IMAGES_DIR
6. npm run seed:drop
7. npm run dev

API:
- GET /api/health
- GET /api/docs
- GET /api/products
- GET /api/facets
- Auth: /api/auth/register /login /me

Notes:
- Uses MONGO_URL + DB_NAME from .env
- CORS_ORIGINS can be "*" or a comma-separated list
