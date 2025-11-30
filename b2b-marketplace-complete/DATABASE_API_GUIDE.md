# 🗄️ Hướng Dẫn Setup Database & Test API

## Mục Lục
1. [Cài Đặt Database Local](#1-cài-đặt-database-local)
2. [Khởi Tạo Database Schema](#2-khởi-tạo-database-schema)
3. [Seed Data Test](#3-seed-data-test)
4. [Test API với cURL](#4-test-api-với-curl)
5. [Test API với Postman](#5-test-api-với-postman)
6. [Test API với Python](#6-test-api-với-python)
7. [Test API với JavaScript](#7-test-api-với-javascript)
8. [WebSocket Testing](#8-websocket-testing)
9. [Database Management](#9-database-management)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Cài Đặt Database Local

### Option 1: Docker (Khuyến nghị)

```bash
# Tạo network cho các containers
docker network create b2b-network

# Chạy PostgreSQL
docker run -d \
  --name b2b-postgres \
  --network b2b-network \
  -e POSTGRES_USER=b2b_user \
  -e POSTGRES_PASSWORD=b2b_password \
  -e POSTGRES_DB=b2b_marketplace \
  -p 5432:5432 \
  -v b2b_postgres_data:/var/lib/postgresql/data \
  postgres:16-alpine

# Chạy Redis
docker run -d \
  --name b2b-redis \
  --network b2b-network \
  -p 6379:6379 \
  -v b2b_redis_data:/data \
  redis:7-alpine

# Kiểm tra containers đang chạy
docker ps
```

### Option 2: Cài đặt trực tiếp

#### PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib

# Khởi động PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Tạo user và database
sudo -u postgres psql

CREATE USER b2b_user WITH PASSWORD 'b2b_password';
CREATE DATABASE b2b_marketplace OWNER b2b_user;
GRANT ALL PRIVILEGES ON DATABASE b2b_marketplace TO b2b_user;
\q
```

**macOS (Homebrew):**
```bash
brew install postgresql@16
brew services start postgresql@16

createuser -P b2b_user  # Nhập password: b2b_password
createdb -O b2b_user b2b_marketplace
```

**Windows:**
1. Tải PostgreSQL từ https://www.postgresql.org/download/windows/
2. Cài đặt và mở pgAdmin
3. Tạo user và database

#### Redis

**Ubuntu/Debian:**
```bash
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Windows:**
1. Tải Redis từ https://github.com/tporadowski/redis/releases
2. Hoặc dùng WSL

---

## 2. Khởi Tạo Database Schema

### Bước 1: Cấu hình Environment

```bash
cd backend

# Copy file .env.example
cp .env.example .env

# Chỉnh sửa .env
nano .env
```

Nội dung file `.env`:
```env
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL="postgresql://b2b_user:b2b_password@localhost:5432/b2b_marketplace"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# App
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

### Bước 2: Cài đặt Dependencies

```bash
# Cài đặt packages
npm install

# Generate Prisma Client
npx prisma generate
```

### Bước 3: Chạy Migrations

```bash
# Tạo và chạy migrations
npx prisma migrate dev --name init

# Hoặc deploy migrations (production)
npx prisma migrate deploy
```

### Bước 4: Kiểm tra Database

```bash
# Mở Prisma Studio (GUI)
npx prisma studio

# Hoặc kết nối trực tiếp với psql
psql -h localhost -U b2b_user -d b2b_marketplace

# List các tables
\dt

# Xem schema của table
\d users
```

---

## 3. Seed Data Test

### Chạy Seed Script

```bash
# Seed database với dữ liệu test
npm run db:seed

# Hoặc chạy trực tiếp
npx ts-node prisma/seed.ts
```

### Dữ Liệu Test Được Tạo

| Role | Email | Password | Ghi chú |
|------|-------|----------|---------|
| Admin | admin@b2bmarket.com | Admin123!@# | Full access |
| Supplier | supplier@techcorp.com | Supplier123!@# | TechCorp Manufacturing |
| Shop | buyer@retailplus.com | Shop123!@# | RetailPlus Electronics |

### Categories
- Electronics (Smartphones, Laptops, Accessories, Components)
- Industrial Equipment
- Office Supplies
- Packaging

### Products (3 sample)
1. Smartphone Pro X1 - $599.99, MOQ: 10
2. Budget Lite Phone - $199.99, MOQ: 50
3. Business Pro Phone - $449.99, MOQ: 25

---

## 4. Test API với cURL

### Khởi động Server

```bash
cd backend
npm run dev
```

Server chạy tại: `http://localhost:3001`

### Test Health Check

```bash
# Basic health
curl http://localhost:3001/health

# Ready check (DB + Redis)
curl http://localhost:3001/health/ready

# Live check
curl http://localhost:3001/health/live
```

### Test Authentication

```bash
# === ĐĂNG KÝ ===
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "Password123!",
    "role": "SHOP",
    "shopName": "My New Shop",
    "country": "VN"
  }'

# === ĐĂNG NHẬP ===
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "supplier@techcorp.com",
    "password": "Supplier123!@#"
  }' | jq

# Lưu token (Linux/Mac)
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "supplier@techcorp.com", "password": "Supplier123!@#"}' \
  | jq -r '.data.accessToken')

echo $TOKEN

# === LẤY THÔNG TIN USER ===
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $TOKEN" | jq

# === REFRESH TOKEN ===
REFRESH_TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "supplier@techcorp.com", "password": "Supplier123!@#"}' \
  | jq -r '.data.refreshToken')

curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}" | jq

# === LOGOUT ===
curl -X POST http://localhost:3001/api/auth/logout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}"
```

### Test Products API

```bash
# === LIST PRODUCTS ===
curl "http://localhost:3001/api/products?page=1&limit=10" | jq

# Với filters
curl "http://localhost:3001/api/products?search=phone&minPrice=100&maxPrice=500" | jq

# === GET SINGLE PRODUCT ===
PRODUCT_ID="uuid-of-product"
curl "http://localhost:3001/api/products/$PRODUCT_ID" | jq

# === FEATURED PRODUCTS ===
curl "http://localhost:3001/api/products/featured" | jq

# === CREATE PRODUCT (Supplier only) ===
curl -X POST http://localhost:3001/api/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Product",
    "sku": "NP-001",
    "shortDescription": "A great new product",
    "description": "Full description here",
    "basePrice": 299.99,
    "currency": "USD",
    "moq": 20,
    "categoryId": "category-uuid"
  }' | jq

# === UPDATE PRODUCT ===
curl -X PUT "http://localhost:3001/api/products/$PRODUCT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "basePrice": 349.99,
    "moq": 15
  }' | jq

# === DELETE PRODUCT ===
curl -X DELETE "http://localhost:3001/api/products/$PRODUCT_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### Test Suppliers API

```bash
# === LIST VERIFIED SUPPLIERS ===
curl "http://localhost:3001/api/suppliers" | jq

# === GET SUPPLIER PROFILE ===
curl "http://localhost:3001/api/suppliers/$SUPPLIER_ID" | jq

# === GET MY PROFILE ===
curl "http://localhost:3001/api/suppliers/me/profile" \
  -H "Authorization: Bearer $TOKEN" | jq

# === GET SUPPLIER STATS ===
curl "http://localhost:3001/api/suppliers/$SUPPLIER_ID/stats" | jq
```

### Test Categories API

```bash
# === GET CATEGORY TREE ===
curl "http://localhost:3001/api/categories" | jq

# === GET BY SLUG ===
curl "http://localhost:3001/api/categories/slug/electronics" | jq
```

### Test Negotiations API

```bash
# Đăng nhập với tài khoản Shop
SHOP_TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "buyer@retailplus.com", "password": "Shop123!@#"}' \
  | jq -r '.data.accessToken')

# === CREATE NEGOTIATION ===
curl -X POST http://localhost:3001/api/negotiations \
  -H "Authorization: Bearer $SHOP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "product-uuid",
    "supplierId": "supplier-uuid",
    "initialMessage": "Hello, I am interested in your product. Can we discuss pricing for bulk orders?"
  }' | jq

# === LIST MY NEGOTIATIONS ===
curl "http://localhost:3001/api/negotiations" \
  -H "Authorization: Bearer $SHOP_TOKEN" | jq

# === SEND MESSAGE ===
curl -X POST "http://localhost:3001/api/negotiations/$NEGOTIATION_ID/messages" \
  -H "Authorization: Bearer $SHOP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "TEXT",
    "content": "What is the best price for 100 units?"
  }' | jq

# === GET MESSAGES ===
curl "http://localhost:3001/api/negotiations/$NEGOTIATION_ID/messages" \
  -H "Authorization: Bearer $SHOP_TOKEN" | jq
```

---

## 5. Test API với Postman

### Import Collection

1. Mở Postman
2. Click "Import" → "Raw text"
3. Paste JSON bên dưới

```json
{
  "info": {
    "name": "B2B Marketplace API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3001/api"
    },
    {
      "key": "accessToken",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Login",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "var jsonData = pm.response.json();",
                  "if (jsonData.data && jsonData.data.accessToken) {",
                  "    pm.collectionVariables.set('accessToken', jsonData.data.accessToken);",
                  "}"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"supplier@techcorp.com\",\n  \"password\": \"Supplier123!@#\"\n}"
            },
            "url": "{{baseUrl}}/auth/login"
          }
        },
        {
          "name": "Get Current User",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{accessToken}}"
              }
            ],
            "url": "{{baseUrl}}/auth/me"
          }
        }
      ]
    },
    {
      "name": "Products",
      "item": [
        {
          "name": "List Products",
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{baseUrl}}/products?page=1&limit=10",
              "host": ["{{baseUrl}}"],
              "path": ["products"],
              "query": [
                { "key": "page", "value": "1" },
                { "key": "limit", "value": "10" }
              ]
            }
          }
        },
        {
          "name": "Create Product",
          "request": {
            "method": "POST",
            "header": [
              { "key": "Authorization", "value": "Bearer {{accessToken}}" },
              { "key": "Content-Type", "value": "application/json" }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"Test Product\",\n  \"sku\": \"TEST-001\",\n  \"shortDescription\": \"Test product\",\n  \"basePrice\": 99.99,\n  \"currency\": \"USD\",\n  \"moq\": 10\n}"
            },
            "url": "{{baseUrl}}/products"
          }
        }
      ]
    },
    {
      "name": "Suppliers",
      "item": [
        {
          "name": "List Suppliers",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/suppliers"
          }
        }
      ]
    }
  ]
}
```

### Environment Setup

Tạo Environment mới với variables:
- `baseUrl`: `http://localhost:3001/api`
- `accessToken`: (để trống, sẽ tự động điền sau khi login)

---

## 6. Test API với Python

### Cài đặt

```bash
pip install requests websocket-client
```

### Script Test Đầy Đủ

```python
#!/usr/bin/env python3
"""
B2B Marketplace API Test Script
"""

import requests
import json
from typing import Optional

class B2BApiClient:
    def __init__(self, base_url: str = "http://localhost:3001/api"):
        self.base_url = base_url
        self.access_token: Optional[str] = None
        self.refresh_token: Optional[str] = None
    
    def _headers(self, auth: bool = True) -> dict:
        headers = {"Content-Type": "application/json"}
        if auth and self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        return headers
    
    def _request(self, method: str, endpoint: str, data: dict = None, auth: bool = True):
        url = f"{self.base_url}{endpoint}"
        headers = self._headers(auth)
        
        response = requests.request(
            method=method,
            url=url,
            headers=headers,
            json=data
        )
        
        return response.json()
    
    # ==================== AUTH ====================
    
    def login(self, email: str, password: str) -> dict:
        """Đăng nhập và lưu tokens"""
        result = self._request(
            "POST", "/auth/login",
            {"email": email, "password": password},
            auth=False
        )
        
        if result.get("success"):
            self.access_token = result["data"]["accessToken"]
            self.refresh_token = result["data"]["refreshToken"]
            print(f"✅ Logged in as: {result['data']['user']['email']}")
        else:
            print(f"❌ Login failed: {result.get('error', {}).get('message')}")
        
        return result
    
    def register(self, email: str, password: str, role: str, **kwargs) -> dict:
        """Đăng ký tài khoản mới"""
        data = {
            "email": email,
            "password": password,
            "role": role,
            **kwargs
        }
        return self._request("POST", "/auth/register", data, auth=False)
    
    def get_me(self) -> dict:
        """Lấy thông tin user hiện tại"""
        return self._request("GET", "/auth/me")
    
    def refresh_tokens(self) -> dict:
        """Refresh access token"""
        result = self._request(
            "POST", "/auth/refresh",
            {"refreshToken": self.refresh_token},
            auth=False
        )
        
        if result.get("success"):
            self.access_token = result["data"]["accessToken"]
            self.refresh_token = result["data"]["refreshToken"]
        
        return result
    
    # ==================== PRODUCTS ====================
    
    def list_products(self, page: int = 1, limit: int = 20, **filters) -> dict:
        """Lấy danh sách sản phẩm"""
        params = f"?page={page}&limit={limit}"
        for key, value in filters.items():
            if value:
                params += f"&{key}={value}"
        return self._request("GET", f"/products{params}", auth=False)
    
    def get_product(self, product_id: str) -> dict:
        """Lấy chi tiết sản phẩm"""
        return self._request("GET", f"/products/{product_id}", auth=False)
    
    def create_product(self, data: dict) -> dict:
        """Tạo sản phẩm mới (Supplier only)"""
        return self._request("POST", "/products", data)
    
    def update_product(self, product_id: str, data: dict) -> dict:
        """Cập nhật sản phẩm"""
        return self._request("PUT", f"/products/{product_id}", data)
    
    def delete_product(self, product_id: str) -> dict:
        """Xóa sản phẩm"""
        return self._request("DELETE", f"/products/{product_id}")
    
    # ==================== SUPPLIERS ====================
    
    def list_suppliers(self, page: int = 1, limit: int = 20) -> dict:
        """Lấy danh sách nhà cung cấp"""
        return self._request("GET", f"/suppliers?page={page}&limit={limit}", auth=False)
    
    def get_supplier(self, supplier_id: str) -> dict:
        """Lấy chi tiết nhà cung cấp"""
        return self._request("GET", f"/suppliers/{supplier_id}", auth=False)
    
    def get_my_supplier_profile(self) -> dict:
        """Lấy profile supplier của mình"""
        return self._request("GET", "/suppliers/me/profile")
    
    # ==================== CATEGORIES ====================
    
    def get_categories(self) -> dict:
        """Lấy cây danh mục"""
        return self._request("GET", "/categories", auth=False)
    
    # ==================== NEGOTIATIONS ====================
    
    def list_negotiations(self, page: int = 1, limit: int = 20) -> dict:
        """Lấy danh sách đàm phán"""
        return self._request("GET", f"/negotiations?page={page}&limit={limit}")
    
    def create_negotiation(self, product_id: str, supplier_id: str, message: str) -> dict:
        """Tạo phiên đàm phán mới"""
        return self._request("POST", "/negotiations", {
            "productId": product_id,
            "supplierId": supplier_id,
            "initialMessage": message
        })
    
    def send_message(self, negotiation_id: str, content: str, msg_type: str = "TEXT") -> dict:
        """Gửi tin nhắn trong phiên đàm phán"""
        return self._request("POST", f"/negotiations/{negotiation_id}/messages", {
            "type": msg_type,
            "content": content
        })
    
    def get_messages(self, negotiation_id: str) -> dict:
        """Lấy tin nhắn của phiên đàm phán"""
        return self._request("GET", f"/negotiations/{negotiation_id}/messages")


# ==================== DEMO SCRIPT ====================

def main():
    print("=" * 50)
    print("🚀 B2B Marketplace API Test")
    print("=" * 50)
    
    client = B2BApiClient()
    
    # Test 1: Login
    print("\n📌 Test 1: Login")
    client.login("supplier@techcorp.com", "Supplier123!@#")
    
    # Test 2: Get current user
    print("\n📌 Test 2: Get Current User")
    me = client.get_me()
    print(json.dumps(me, indent=2))
    
    # Test 3: List products
    print("\n📌 Test 3: List Products")
    products = client.list_products(limit=5)
    print(f"Found {len(products.get('data', []))} products")
    
    # Test 4: List suppliers
    print("\n📌 Test 4: List Suppliers")
    suppliers = client.list_suppliers(limit=5)
    print(f"Found {len(suppliers.get('data', []))} suppliers")
    
    # Test 5: Get categories
    print("\n📌 Test 5: Get Categories")
    categories = client.get_categories()
    for cat in categories.get('data', []):
        print(f"  - {cat['name']} ({cat.get('productCount', 0)} products)")
    
    # Test 6: Get supplier profile
    print("\n📌 Test 6: Get Supplier Profile")
    profile = client.get_my_supplier_profile()
    if profile.get('success'):
        print(f"Company: {profile['data']['companyName']}")
        print(f"Status: {profile['data']['verificationStatus']}")
    
    print("\n" + "=" * 50)
    print("✅ All tests completed!")
    print("=" * 50)


if __name__ == "__main__":
    main()
```

### Chạy Script

```bash
# Lưu file và chạy
python test_api.py
```

---

## 7. Test API với JavaScript

### Node.js Script

```javascript
/**
 * B2B Marketplace API Test Script (Node.js)
 */

const BASE_URL = 'http://localhost:3001/api';

class B2BApiClient {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
  }

  async request(method, endpoint, data = null, auth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (auth && this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const options = {
      method,
      headers,
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    return response.json();
  }

  // Auth
  async login(email, password) {
    const result = await this.request('POST', '/auth/login', { email, password }, false);
    
    if (result.success) {
      this.accessToken = result.data.accessToken;
      this.refreshToken = result.data.refreshToken;
      console.log(`✅ Logged in as: ${result.data.user.email}`);
    } else {
      console.log(`❌ Login failed: ${result.error?.message}`);
    }
    
    return result;
  }

  async getMe() {
    return this.request('GET', '/auth/me');
  }

  // Products
  async listProducts(params = {}) {
    const query = new URLSearchParams({ page: 1, limit: 20, ...params }).toString();
    return this.request('GET', `/products?${query}`, null, false);
  }

  async getProduct(id) {
    return this.request('GET', `/products/${id}`, null, false);
  }

  async createProduct(data) {
    return this.request('POST', '/products', data);
  }

  // Suppliers
  async listSuppliers() {
    return this.request('GET', '/suppliers', null, false);
  }

  async getSupplier(id) {
    return this.request('GET', `/suppliers/${id}`, null, false);
  }

  // Categories
  async getCategories() {
    return this.request('GET', '/categories', null, false);
  }

  // Negotiations
  async listNegotiations() {
    return this.request('GET', '/negotiations');
  }

  async createNegotiation(productId, supplierId, message) {
    return this.request('POST', '/negotiations', {
      productId,
      supplierId,
      initialMessage: message,
    });
  }

  async sendMessage(negotiationId, content, type = 'TEXT') {
    return this.request('POST', `/negotiations/${negotiationId}/messages`, {
      type,
      content,
    });
  }
}

// Demo
async function main() {
  console.log('='.repeat(50));
  console.log('🚀 B2B Marketplace API Test');
  console.log('='.repeat(50));

  const client = new B2BApiClient();

  // Test 1: Login
  console.log('\n📌 Test 1: Login');
  await client.login('supplier@techcorp.com', 'Supplier123!@#');

  // Test 2: Get current user
  console.log('\n📌 Test 2: Get Current User');
  const me = await client.getMe();
  console.log(JSON.stringify(me, null, 2));

  // Test 3: List products
  console.log('\n📌 Test 3: List Products');
  const products = await client.listProducts({ limit: 5 });
  console.log(`Found ${products.data?.length || 0} products`);

  // Test 4: List suppliers
  console.log('\n📌 Test 4: List Suppliers');
  const suppliers = await client.listSuppliers();
  console.log(`Found ${suppliers.data?.length || 0} suppliers`);

  // Test 5: Get categories
  console.log('\n📌 Test 5: Get Categories');
  const categories = await client.getCategories();
  categories.data?.forEach(cat => {
    console.log(`  - ${cat.name} (${cat.productCount || 0} products)`);
  });

  console.log('\n' + '='.repeat(50));
  console.log('✅ All tests completed!');
  console.log('='.repeat(50));
}

main().catch(console.error);
```

### Browser Console Script

```javascript
// Paste này vào Browser Console để test

const API = 'http://localhost:3001/api';

// Login
fetch(`${API}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'supplier@techcorp.com',
    password: 'Supplier123!@#'
  })
})
.then(r => r.json())
.then(data => {
  console.log('Login:', data);
  window.TOKEN = data.data?.accessToken;
});

// Sau khi login, test các API khác:
// Get user info
fetch(`${API}/auth/me`, {
  headers: { 'Authorization': `Bearer ${TOKEN}` }
}).then(r => r.json()).then(console.log);

// List products
fetch(`${API}/products`).then(r => r.json()).then(console.log);
```

---

## 8. WebSocket Testing

### Node.js WebSocket Client

```javascript
const { io } = require('socket.io-client');

const socket = io('http://localhost:3001', {
  auth: {
    token: 'YOUR_ACCESS_TOKEN'
  }
});

socket.on('connect', () => {
  console.log('✅ Connected to WebSocket');
  
  // Join negotiation room
  socket.emit('join:negotiation', { sessionId: 'negotiation-uuid' });
});

socket.on('new:message', (message) => {
  console.log('📩 New message:', message);
});

socket.on('user:typing', (data) => {
  console.log('⌨️ User typing:', data);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected');
});

// Send message
function sendMessage(sessionId, content) {
  socket.emit('send:message', {
    sessionId,
    type: 'TEXT',
    content
  });
}

// Mark as read
function markAsRead(sessionId) {
  socket.emit('mark:read', { sessionId });
}

// Typing indicator
function startTyping(sessionId) {
  socket.emit('typing', { sessionId, isTyping: true });
}
```

### Browser WebSocket Test

```html
<!DOCTYPE html>
<html>
<head>
  <title>WebSocket Test</title>
  <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
</head>
<body>
  <h1>WebSocket Test</h1>
  <div id="messages"></div>
  <input type="text" id="messageInput" placeholder="Type message...">
  <button onclick="sendMessage()">Send</button>

  <script>
    const TOKEN = 'YOUR_ACCESS_TOKEN';
    const SESSION_ID = 'negotiation-uuid';

    const socket = io('http://localhost:3001', {
      auth: { token: TOKEN }
    });

    socket.on('connect', () => {
      console.log('Connected');
      socket.emit('join:negotiation', { sessionId: SESSION_ID });
    });

    socket.on('new:message', (msg) => {
      document.getElementById('messages').innerHTML += 
        `<p><strong>${msg.sender.email}:</strong> ${msg.content}</p>`;
    });

    function sendMessage() {
      const input = document.getElementById('messageInput');
      socket.emit('send:message', {
        sessionId: SESSION_ID,
        type: 'TEXT',
        content: input.value
      });
      input.value = '';
    }
  </script>
</body>
</html>
```

---

## 9. Database Management

### Prisma Commands

```bash
# Generate client
npx prisma generate

# Create migration
npx prisma migrate dev --name your_migration_name

# Deploy migrations
npx prisma migrate deploy

# Reset database
npx prisma migrate reset

# Open Studio
npx prisma studio

# Format schema
npx prisma format

# Validate schema
npx prisma validate
```

### Direct PostgreSQL Commands

```bash
# Connect
psql -h localhost -U b2b_user -d b2b_marketplace

# Common commands
\dt                    # List tables
\d table_name          # Describe table
\du                    # List users
\l                     # List databases

# Queries
SELECT * FROM users LIMIT 10;
SELECT * FROM products WHERE "isActive" = true;
SELECT COUNT(*) FROM negotiations;
```

### Backup & Restore

```bash
# Backup
pg_dump -h localhost -U b2b_user -d b2b_marketplace > backup.sql

# Restore
psql -h localhost -U b2b_user -d b2b_marketplace < backup.sql

# Docker backup
docker exec b2b-postgres pg_dump -U b2b_user b2b_marketplace > backup.sql
```

---

## 10. Troubleshooting

### Lỗi thường gặp

#### Database connection failed
```bash
# Kiểm tra PostgreSQL đang chạy
pg_isready -h localhost -p 5432

# Docker
docker logs b2b-postgres
```

#### Redis connection failed
```bash
# Kiểm tra Redis
redis-cli ping

# Docker
docker logs b2b-redis
```

#### Port already in use
```bash
# Tìm process đang dùng port
lsof -i :3001

# Kill process
kill -9 <PID>
```

#### Migration failed
```bash
# Reset database
npx prisma migrate reset

# Hoặc xóa migrations và tạo lại
rm -rf prisma/migrations
npx prisma migrate dev --name init
```

#### Token expired
```bash
# Refresh token
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "your-refresh-token"}'
```

### Logs

```bash
# Backend logs
npm run dev 2>&1 | tee app.log

# Docker logs
docker logs -f b2b-backend

# PostgreSQL logs
docker logs -f b2b-postgres
```

---

## Quick Reference

### API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /auth/register | ❌ | Đăng ký |
| POST | /auth/login | ❌ | Đăng nhập |
| POST | /auth/refresh | ❌ | Refresh token |
| GET | /auth/me | ✅ | User info |
| GET | /products | ❌ | List products |
| POST | /products | ✅ | Create product |
| GET | /suppliers | ❌ | List suppliers |
| GET | /categories | ❌ | Category tree |
| GET | /negotiations | ✅ | List negotiations |
| POST | /negotiations | ✅ | Create negotiation |
| POST | /negotiations/:id/messages | ✅ | Send message |

### Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@b2bmarket.com | Admin123!@# |
| Supplier | supplier@techcorp.com | Supplier123!@# |
| Shop | buyer@retailplus.com | Shop123!@# |

---

**Happy Testing! 🧪**
