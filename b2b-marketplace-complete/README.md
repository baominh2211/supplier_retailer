# 🛒 B2B Marketplace

Nền tảng B2B kết nối Nhà cung cấp (Suppliers) với Cửa hàng (Shops). Hỗ trợ gửi RFQ (Request for Quotation), đàm phán giá, và ký hợp đồng.

## 🏗️ Tech Stack

### Backend
- **FastAPI** - Python web framework
- **PostgreSQL** - Database
- **SQLAlchemy** - ORM (async)
- **JWT** - Authentication
- **Pydantic** - Validation

### Frontend
- **React 18** + TypeScript
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Zustand** - State management
- **React Router** - Routing

## 📁 Cấu trúc thư mục

```
b2b-marketplace/
├── backend/
│   ├── app/
│   │   ├── routers/      # API routes
│   │   ├── main.py       # FastAPI app
│   │   ├── models.py     # SQLAlchemy models
│   │   ├── schemas.py    # Pydantic schemas
│   │   ├── auth.py       # Authentication
│   │   ├── database.py   # DB connection
│   │   ├── config.py     # Settings
│   │   └── seed.py       # Seed data
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/        # React pages
│   │   ├── components/   # UI components
│   │   ├── api/          # API client
│   │   ├── store/        # Zustand store
│   │   └── types/        # TypeScript types
│   ├── package.json
│   └── vercel.json
└── render.yaml           # Render blueprint
```

## 🚀 Chạy Local

### 1. Database (PostgreSQL)

```bash
# Docker
docker run -d --name b2b-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=b2b_marketplace \
  -p 5432:5432 \
  postgres:16-alpine
```

### 2. Backend

```bash
cd backend

# Tạo virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Cài dependencies
pip install -r requirements.txt

# Copy env
cp .env.example .env

# Seed database
python -m app.seed

# Chạy server
uvicorn app.main:app --reload --port 8000
```

API sẽ chạy tại: http://localhost:8000
Swagger Docs: http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend

# Cài dependencies
npm install

# Copy env
cp .env.example .env

# Chạy dev server
npm run dev
```

Frontend sẽ chạy tại: http://localhost:5173

## 👤 Tài khoản Test

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@b2bmarket.com | Admin123! |
| Supplier | supplier1@techcorp.com | Supplier123! |
| Shop | shop1@retailplus.com | Shop123! |

## 🌐 Deploy Production

### Backend → Render

#### Cách 1: Dùng Blueprint (Khuyến nghị)

1. Push code lên GitHub
2. Vào [Render Dashboard](https://dashboard.render.com)
3. **New** → **Blueprint**
4. Chọn repo và branch
5. Render sẽ tự động tạo:
   - Web Service (FastAPI)
   - PostgreSQL database

#### Cách 2: Manual Setup

1. **Tạo PostgreSQL Database:**
   - Dashboard → New → PostgreSQL
   - Name: `b2b-marketplace-db`
   - Region: Singapore
   - Plan: Free

2. **Tạo Web Service:**
   - Dashboard → New → Web Service
   - Connect GitHub repo
   - Root Directory: `backend`
   - Environment: Python 3
   - Build Command: `pip install -r requirements.txt && python -m app.seed`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

3. **Environment Variables:**
   ```
   DATABASE_URL=<copy từ PostgreSQL>
   SECRET_KEY=<tự generate>
   CORS_ORIGINS=https://your-frontend.vercel.app
   DEBUG=false
   ```

### Frontend → Vercel

1. Push code lên GitHub
2. Vào [Vercel Dashboard](https://vercel.com)
3. **New Project** → Import repo
4. Settings:
   - Framework: Vite
   - Root Directory: `frontend`
5. **Environment Variables:**
   ```
   VITE_API_URL=https://your-api.onrender.com
   ```
6. Deploy!

## 📊 Database Schema

```
users
├── id, email, password_hash, full_name, role

suppliers (1-1 with users)
├── id, user_id, company_name, address, phone, description

shops (1-1 with users)  
├── id, user_id, shop_name, address, phone

products
├── id, supplier_id, name, description, price, stock, status, category

rfq (Request for Quotation)
├── id, shop_id, product_id, quantity, message, status

quotes
├── id, rfq_id, supplier_id, price, min_order_qty, lead_time, status

negotiations
├── id, rfq_id, sender_role, sender_id, message, proposed_price

contracts
├── id, supplier_id, shop_id, product_id, agreed_price, quantity, status
```

## 🔄 Business Flow

```
1. Shop tìm sản phẩm trên marketplace
2. Shop gửi RFQ (Request for Quotation) cho sản phẩm
3. Supplier nhận RFQ và gửi báo giá (Quote)
4. Hai bên có thể đàm phán qua Negotiations
5. Shop chấp nhận Quote → tạo Contract
6. Admin có thể duyệt sản phẩm trước khi hiển thị
```

## 📱 API Endpoints

### Authentication
- `POST /auth/register` - Đăng ký
- `POST /auth/login` - Đăng nhập (OAuth2)
- `POST /auth/login/json` - Đăng nhập (JSON)
- `GET /users/me` - Profile

### Products (Public)
- `GET /products` - Danh sách sản phẩm
- `GET /products/{id}` - Chi tiết sản phẩm
- `GET /products/categories` - Danh mục

### Suppliers
- `GET /suppliers` - Danh sách
- `GET /suppliers/{id}` - Chi tiết
- `GET /suppliers/products` - Sản phẩm của tôi
- `POST /suppliers/products` - Thêm sản phẩm
- `POST /suppliers/quotes` - Gửi báo giá

### Shops
- `GET /shops/products` - Tìm sản phẩm
- `POST /shops/rfq` - Gửi RFQ
- `GET /shops/rfq` - RFQ của tôi
- `POST /shops/contracts` - Tạo hợp đồng

### Admin
- `GET /admin/stats` - Thống kê
- `GET /admin/products/pending` - Sản phẩm chờ duyệt
- `PATCH /admin/products/{id}/approve` - Duyệt sản phẩm

## 🔐 Security Notes

- JWT tokens với expiry 24h
- Password được hash bằng bcrypt
- CORS được cấu hình cho từng environment
- Protected routes theo role

## 📝 License

MIT
