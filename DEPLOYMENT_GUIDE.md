# 🚀 Hướng Dẫn Deploy B2B Marketplace Lên Server

## Mục Lục
1. [Yêu Cầu Hệ Thống](#1-yêu-cầu-hệ-thống)
2. [Chuẩn Bị Domain & SSL](#2-chuẩn-bị-domain--ssl)
3. [Chuẩn Bị Server](#3-chuẩn-bị-server)
4. [Cài Đặt Dependencies](#4-cài-đặt-dependencies)
5. [Clone & Cấu Hình Project](#5-clone--cấu-hình-project)
6. [Deploy với Docker](#6-deploy-với-docker)
7. [Cấu Hình Nginx & SSL](#7-cấu-hình-nginx--ssl)
8. [Quản Lý Database](#8-quản-lý-database)
9. [Monitoring & Logging](#9-monitoring--logging)
10. [Backup & Recovery](#10-backup--recovery)
11. [Troubleshooting](#11-troubleshooting)
12. [Checklist Trước Khi Go-Live](#12-checklist-trước-khi-go-live)

---

## 1. Yêu Cầu Hệ Thống

### Server Tối Thiểu
| Thành phần | Yêu cầu tối thiểu | Khuyến nghị |
|------------|-------------------|-------------|
| CPU | 2 vCPU | 4 vCPU |
| RAM | 4 GB | 8 GB |
| Storage | 40 GB SSD | 100 GB SSD |
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| Bandwidth | 1 TB/tháng | Unlimited |

### Các Nhà Cung Cấp VPS Phổ Biến
- **DigitalOcean**: $24/tháng (4GB RAM)
- **Vultr**: $24/tháng (4GB RAM)
- **Linode**: $24/tháng (4GB RAM)
- **AWS EC2**: t3.medium (~$30/tháng)
- **Google Cloud**: e2-medium (~$25/tháng)
- **Azure**: B2s (~$30/tháng)
- **Việt Nam**: VNGCLOUD, Bizfly Cloud, FPT Cloud (~500k-1tr VND/tháng)

---

## 2. Chuẩn Bị Domain & SSL

### 2.1 Trỏ Domain về Server

Đăng nhập vào trang quản lý domain của bạn (GoDaddy, Namecheap, Tenten, PA Vietnam, etc.) và thêm các bản ghi DNS:

```
Loại    Tên         Giá trị              TTL
A       @           <IP_SERVER>          300
A       www         <IP_SERVER>          300
A       api         <IP_SERVER>          300    (nếu muốn dùng subdomain cho API)
```

**Ví dụ**: Nếu domain là `b2bmarket.vn` và IP server là `123.45.67.89`:
```
A       @           123.45.67.89         300
A       www         123.45.67.89         300
A       api         123.45.67.89         300
```

### 2.2 Kiểm Tra DNS Đã Trỏ Đúng

```bash
# Trên máy local hoặc server
nslookup b2bmarket.vn
# hoặc
dig b2bmarket.vn +short
```

**Lưu ý**: DNS có thể mất 5 phút đến 48 giờ để cập nhật toàn cầu.

---

## 3. Chuẩn Bị Server

### 3.1 SSH Vào Server

```bash
# Thay YOUR_SERVER_IP bằng IP thực tế
ssh root@YOUR_SERVER_IP
```

### 3.2 Cập Nhật Hệ Thống

```bash
# Cập nhật packages
apt update && apt upgrade -y

# Cài đặt các công cụ cần thiết
apt install -y curl wget git vim htop ufw fail2ban
```

### 3.3 Tạo User Mới (Không dùng root)

```bash
# Tạo user mới
adduser deploy

# Thêm quyền sudo
usermod -aG sudo deploy

# Chuyển sang user mới
su - deploy
```

### 3.4 Cấu Hình Firewall

```bash
# Bật UFW
sudo ufw enable

# Cho phép SSH
sudo ufw allow OpenSSH

# Cho phép HTTP và HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Kiểm tra trạng thái
sudo ufw status
```

### 3.5 Cấu Hình SSH Key (Khuyến nghị)

Trên máy local của bạn:
```bash
# Tạo SSH key nếu chưa có
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy key lên server
ssh-copy-id deploy@YOUR_SERVER_IP
```

### 3.6 Bảo Mật SSH

```bash
sudo vim /etc/ssh/sshd_config
```

Thay đổi các dòng sau:
```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

Khởi động lại SSH:
```bash
sudo systemctl restart sshd
```

---

## 4. Cài Đặt Dependencies

### 4.1 Cài Đặt Docker

```bash
# Cài đặt Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Thêm user vào group docker
sudo usermod -aG docker deploy

# Đăng xuất và đăng nhập lại để áp dụng
exit
su - deploy

# Kiểm tra Docker
docker --version
docker run hello-world
```

### 4.2 Cài Đặt Docker Compose

```bash
# Cài đặt Docker Compose v2
sudo apt install docker-compose-plugin

# Kiểm tra
docker compose version
```

### 4.3 Cài Đặt Node.js (Tùy chọn - nếu không dùng Docker)

```bash
# Cài đặt Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Kiểm tra
node --version
npm --version
```

---

## 5. Clone & Cấu Hình Project

### 5.1 Clone Repository

```bash
# Di chuyển đến thư mục home
cd /home/deploy

# Clone project (thay bằng repo URL của bạn)
git clone https://github.com/your-username/b2b-marketplace.git
cd b2b-marketplace
```

Hoặc upload file ZIP:
```bash
# Upload file b2b-marketplace.zip lên server
scp b2b-marketplace.zip deploy@YOUR_SERVER_IP:/home/deploy/

# SSH vào server và giải nén
ssh deploy@YOUR_SERVER_IP
cd /home/deploy
unzip b2b-marketplace.zip -d b2b-marketplace
cd b2b-marketplace
```

### 5.2 Tạo File Cấu Hình Production

```bash
# Tạo file .env cho production
vim .env.production
```

Nội dung file `.env.production`:
```bash
# =================================
# PRODUCTION ENVIRONMENT
# =================================

# Domain Configuration
DOMAIN=b2bmarket.vn
API_URL=https://b2bmarket.vn
WS_URL=wss://b2bmarket.vn
FRONTEND_URL=https://b2bmarket.vn
CORS_ORIGIN=https://b2bmarket.vn,https://www.b2bmarket.vn

# Database - ĐỔI PASSWORD NÀY!
POSTGRES_USER=b2b_prod_user
POSTGRES_PASSWORD=THAY_BANG_PASSWORD_MANH_O_DAY_!@#$%
POSTGRES_DB=b2b_marketplace_prod

# Redis - ĐỔI PASSWORD NÀY!
REDIS_PASSWORD=THAY_BANG_REDIS_PASSWORD_MANH_!@#$%

# JWT - TẠO KEY MỚI!
# Tạo key bằng lệnh: openssl rand -hex 64
JWT_SECRET=THAY_BANG_JWT_SECRET_KEY_DAI_IT_NHAT_64_KY_TU_RANDOM

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="B2B Marketplace <noreply@b2bmarket.vn>"

# Storage
STORAGE_TYPE=local
# Hoặc dùng S3:
# STORAGE_TYPE=s3
# AWS_ACCESS_KEY_ID=your-access-key
# AWS_SECRET_ACCESS_KEY=your-secret-key
# AWS_S3_BUCKET=b2b-marketplace-uploads
# AWS_S3_REGION=ap-southeast-1
```

### 5.3 Tạo Các Password Mạnh

```bash
# Tạo password cho PostgreSQL
openssl rand -base64 32

# Tạo password cho Redis
openssl rand -base64 32

# Tạo JWT Secret
openssl rand -hex 64
```

---

## 6. Deploy với Docker

### 6.1 Cấu Hình Docker Compose Production

Tạo file `docker-compose.production.yml`:

```bash
vim docker-compose.production.yml
```

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: b2b-postgres
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups/postgres:/backups
    networks:
      - b2b-internal
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: b2b-redis
    restart: always
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - b2b-internal
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: b2b-backend
    restart: always
    environment:
      NODE_ENV: production
      PORT: 3001
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      JWT_SECRET: ${JWT_SECRET}
      CORS_ORIGIN: ${CORS_ORIGIN}
      FRONTEND_URL: ${FRONTEND_URL}
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASS: ${SMTP_PASS}
      SMTP_FROM: ${SMTP_FROM}
      STORAGE_TYPE: ${STORAGE_TYPE:-local}
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
      AWS_S3_BUCKET: ${AWS_S3_BUCKET}
      AWS_S3_REGION: ${AWS_S3_REGION:-ap-southeast-1}
    volumes:
      - backend_uploads:/app/uploads
      - ./logs/backend:/app/logs
    networks:
      - b2b-internal
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
      args:
        VITE_API_URL: ${API_URL}/api
        VITE_WS_URL: ${WS_URL}
    container_name: b2b-frontend
    restart: always
    networks:
      - b2b-internal
    depends_on:
      - backend

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: b2b-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/production.conf:/etc/nginx/nginx.conf:ro
      - ./docker/nginx/ssl:/etc/nginx/ssl:ro
      - ./logs/nginx:/var/log/nginx
      - certbot_webroot:/var/www/certbot:ro
      - certbot_certs:/etc/letsencrypt:ro
    networks:
      - b2b-internal
    depends_on:
      - frontend
      - backend

  # Certbot for SSL
  certbot:
    image: certbot/certbot
    container_name: b2b-certbot
    volumes:
      - certbot_webroot:/var/www/certbot
      - certbot_certs:/etc/letsencrypt
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"

volumes:
  postgres_data:
  redis_data:
  backend_uploads:
  certbot_webroot:
  certbot_certs:

networks:
  b2b-internal:
    driver: bridge
```

### 6.2 Tạo Nginx Config Production

```bash
mkdir -p docker/nginx
vim docker/nginx/production.conf
```

```nginx
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 2048;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time uct="$upstream_connect_time" '
                    'uht="$upstream_header_time" urt="$upstream_response_time"';

    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 50M;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript 
               application/rss+xml application/atom+xml image/svg+xml;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    limit_conn_zone $binary_remote_addr zone=conn:10m;

    # Upstream
    upstream backend {
        server backend:3001;
        keepalive 32;
    }

    upstream frontend {
        server frontend:80;
        keepalive 32;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name b2bmarket.vn www.b2bmarket.vn;

        # Certbot challenge
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    # HTTPS Server
    server {
        listen 443 ssl http2;
        server_name b2bmarket.vn www.b2bmarket.vn;

        # SSL Configuration
        ssl_certificate /etc/letsencrypt/live/b2bmarket.vn/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/b2bmarket.vn/privkey.pem;
        
        # SSL Settings
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_prefer_server_ciphers off;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_session_timeout 1d;
        ssl_session_cache shared:SSL:50m;
        ssl_session_tickets off;
        ssl_stapling on;
        ssl_stapling_verify on;

        # Security Headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # API
        location /api {
            limit_req zone=api burst=20 nodelay;
            limit_conn conn 10;

            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 90;
            proxy_connect_timeout 90;
        }

        # Login rate limiting
        location /api/auth/login {
            limit_req zone=login burst=5 nodelay;

            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebSocket
        location /socket.io {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 3600s;
            proxy_send_timeout 3600s;
        }

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # SPA routing
            proxy_intercept_errors on;
            error_page 404 = /index.html;
        }

        # Static files caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            proxy_pass http://frontend;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

### 6.3 Build và Chạy

```bash
# Tạo thư mục cần thiết
mkdir -p logs/nginx logs/backend backups/postgres docker/nginx/ssl

# Load environment variables
set -a
source .env.production
set +a

# Build images
docker compose -f docker-compose.production.yml build

# Khởi động services (không có SSL trước)
docker compose -f docker-compose.production.yml up -d postgres redis

# Đợi database sẵn sàng
sleep 10

# Chạy migrations
docker compose -f docker-compose.production.yml run --rm backend npx prisma migrate deploy

# Seed data (tùy chọn)
docker compose -f docker-compose.production.yml run --rm backend npm run db:seed

# Khởi động tất cả services
docker compose -f docker-compose.production.yml up -d
```

---

## 7. Cấu Hình Nginx & SSL

### 7.1 Lấy SSL Certificate từ Let's Encrypt

#### Bước 1: Tạo Nginx config tạm thời (HTTP only)

```bash
vim docker/nginx/temp.conf
```

```nginx
events {
    worker_connections 1024;
}

http {
    server {
        listen 80;
        server_name b2bmarket.vn www.b2bmarket.vn;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 200 'Server is running';
            add_header Content-Type text/plain;
        }
    }
}
```

#### Bước 2: Chạy Nginx với config tạm

```bash
# Stop nginx hiện tại nếu có
docker compose -f docker-compose.production.yml stop nginx

# Chạy nginx với config tạm
docker run -d --name nginx-temp \
  -p 80:80 \
  -v $(pwd)/docker/nginx/temp.conf:/etc/nginx/nginx.conf:ro \
  -v certbot_webroot:/var/www/certbot \
  nginx:alpine
```

#### Bước 3: Lấy SSL Certificate

```bash
# Thay b2bmarket.vn bằng domain của bạn
# Thay your-email@example.com bằng email của bạn
docker run -it --rm \
  -v certbot_webroot:/var/www/certbot \
  -v certbot_certs:/etc/letsencrypt \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d b2bmarket.vn \
  -d www.b2bmarket.vn
```

#### Bước 4: Dọn dẹp và khởi động lại

```bash
# Stop nginx tạm
docker stop nginx-temp && docker rm nginx-temp

# Cập nhật Nginx config với domain thực
sed -i 's/b2bmarket.vn/YOUR_DOMAIN/g' docker/nginx/production.conf

# Khởi động lại tất cả
docker compose -f docker-compose.production.yml up -d
```

### 7.2 Tự Động Gia Hạn SSL

SSL Let's Encrypt có hiệu lực 90 ngày. Cấu hình auto-renew:

```bash
# Tạo cron job
sudo crontab -e
```

Thêm dòng sau:
```
0 0 1 * * cd /home/deploy/b2b-marketplace && docker compose -f docker-compose.production.yml run --rm certbot renew && docker compose -f docker-compose.production.yml exec nginx nginx -s reload
```

---

## 8. Quản Lý Database

### 8.1 Truy Cập Database

```bash
# Truy cập PostgreSQL
docker compose -f docker-compose.production.yml exec postgres psql -U b2b_prod_user -d b2b_marketplace_prod

# Truy cập Redis
docker compose -f docker-compose.production.yml exec redis redis-cli -a YOUR_REDIS_PASSWORD
```

### 8.2 Backup Database

Tạo script backup tự động:

```bash
vim scripts/backup-db.sh
```

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/home/deploy/b2b-marketplace/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DATE}.sql.gz"
KEEP_DAYS=7

# Load environment
source /home/deploy/b2b-marketplace/.env.production

# Create backup
docker compose -f /home/deploy/b2b-marketplace/docker-compose.production.yml exec -T postgres \
  pg_dump -U ${POSTGRES_USER} ${POSTGRES_DB} | gzip > ${BACKUP_DIR}/${BACKUP_FILE}

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "Backup successful: ${BACKUP_FILE}"
    
    # Delete old backups
    find ${BACKUP_DIR} -name "backup_*.sql.gz" -mtime +${KEEP_DAYS} -delete
    echo "Deleted backups older than ${KEEP_DAYS} days"
else
    echo "Backup failed!"
    exit 1
fi
```

```bash
# Cấp quyền thực thi
chmod +x scripts/backup-db.sh

# Thêm vào crontab (backup hàng ngày lúc 2h sáng)
sudo crontab -e
```

Thêm:
```
0 2 * * * /home/deploy/b2b-marketplace/scripts/backup-db.sh >> /home/deploy/b2b-marketplace/logs/backup.log 2>&1
```

### 8.3 Restore Database

```bash
# Restore từ backup
gunzip -c backups/postgres/backup_20241201_020000.sql.gz | \
  docker compose -f docker-compose.production.yml exec -T postgres \
  psql -U b2b_prod_user -d b2b_marketplace_prod
```

---

## 9. Monitoring & Logging

### 9.1 Xem Logs

```bash
# Xem logs tất cả services
docker compose -f docker-compose.production.yml logs -f

# Xem logs của service cụ thể
docker compose -f docker-compose.production.yml logs -f backend
docker compose -f docker-compose.production.yml logs -f nginx
docker compose -f docker-compose.production.yml logs -f postgres

# Xem 100 dòng cuối
docker compose -f docker-compose.production.yml logs --tail=100 backend
```

### 9.2 Kiểm Tra Trạng Thái

```bash
# Kiểm tra tất cả containers
docker compose -f docker-compose.production.yml ps

# Kiểm tra health
curl https://b2bmarket.vn/health
curl https://b2bmarket.vn/api/health
curl https://b2bmarket.vn/api/health/ready

# Kiểm tra resources
docker stats
```

### 9.3 Cài Đặt Monitoring (Tùy chọn)

#### Portainer - Docker Management UI

```bash
docker volume create portainer_data

docker run -d \
  --name portainer \
  --restart always \
  -p 9000:9000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

Truy cập: `http://YOUR_SERVER_IP:9000`

#### Uptime Monitoring

Sử dụng các dịch vụ miễn phí:
- [UptimeRobot](https://uptimerobot.com/) - 50 monitors miễn phí
- [Freshping](https://www.freshworks.com/website-monitoring/)
- [Pingdom](https://www.pingdom.com/)

---

## 10. Backup & Recovery

### 10.1 Backup Toàn Bộ Project

```bash
vim scripts/full-backup.sh
```

```bash
#!/bin/bash

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/deploy/backups"
PROJECT_DIR="/home/deploy/b2b-marketplace"

# Create backup directory
mkdir -p ${BACKUP_DIR}

# Backup database
${PROJECT_DIR}/scripts/backup-db.sh

# Backup uploads
tar -czf ${BACKUP_DIR}/uploads_${DATE}.tar.gz ${PROJECT_DIR}/backend_uploads/

# Backup environment files
tar -czf ${BACKUP_DIR}/config_${DATE}.tar.gz \
  ${PROJECT_DIR}/.env.production \
  ${PROJECT_DIR}/docker/nginx/

# Sync to remote storage (optional)
# aws s3 sync ${BACKUP_DIR} s3://your-backup-bucket/
# rsync -avz ${BACKUP_DIR}/ backup-server:/backups/

echo "Full backup completed: ${DATE}"
```

### 10.2 Disaster Recovery

```bash
# 1. Tạo server mới
# 2. Cài đặt Docker

# 3. Clone project
git clone https://github.com/your-username/b2b-marketplace.git
cd b2b-marketplace

# 4. Copy backup files
scp -r backup-server:/backups/latest/* ./backups/

# 5. Restore config
tar -xzf backups/config_*.tar.gz

# 6. Start services
docker compose -f docker-compose.production.yml up -d postgres redis
sleep 10

# 7. Restore database
gunzip -c backups/postgres/backup_*.sql.gz | \
  docker compose -f docker-compose.production.yml exec -T postgres \
  psql -U b2b_prod_user -d b2b_marketplace_prod

# 8. Restore uploads
tar -xzf backups/uploads_*.tar.gz

# 9. Start all services
docker compose -f docker-compose.production.yml up -d
```

---

## 11. Troubleshooting

### 11.1 Các Lỗi Thường Gặp

#### Container không khởi động được
```bash
# Xem logs chi tiết
docker compose -f docker-compose.production.yml logs backend

# Kiểm tra container exit code
docker inspect b2b-backend --format='{{.State.ExitCode}}'
```

#### Database connection failed
```bash
# Kiểm tra PostgreSQL đang chạy
docker compose -f docker-compose.production.yml ps postgres

# Test connection
docker compose -f docker-compose.production.yml exec postgres pg_isready
```

#### SSL Certificate lỗi
```bash
# Kiểm tra certificate
docker compose -f docker-compose.production.yml exec nginx \
  openssl x509 -in /etc/letsencrypt/live/b2bmarket.vn/fullchain.pem -text -noout

# Renew thủ công
docker compose -f docker-compose.production.yml run --rm certbot renew --force-renewal
docker compose -f docker-compose.production.yml exec nginx nginx -s reload
```

#### Disk space đầy
```bash
# Kiểm tra disk
df -h

# Dọn dẹp Docker
docker system prune -a --volumes

# Xóa old logs
find /home/deploy/b2b-marketplace/logs -name "*.log" -mtime +30 -delete
```

### 11.2 Restart Services

```bash
# Restart một service
docker compose -f docker-compose.production.yml restart backend

# Restart tất cả
docker compose -f docker-compose.production.yml restart

# Rebuild và restart
docker compose -f docker-compose.production.yml up -d --build backend
```

### 11.3 Update Application

```bash
# Pull code mới
git pull origin main

# Rebuild và deploy
docker compose -f docker-compose.production.yml build
docker compose -f docker-compose.production.yml up -d

# Chạy migrations nếu có
docker compose -f docker-compose.production.yml exec backend npx prisma migrate deploy
```

---

## 12. Checklist Trước Khi Go-Live

### Security
- [ ] Đã đổi tất cả passwords mặc định
- [ ] JWT_SECRET đã được tạo mới và đủ dài (64+ ký tự)
- [ ] Firewall đã được cấu hình (chỉ mở 80, 443, 22)
- [ ] SSH đã disable root login và password authentication
- [ ] Fail2ban đã được cài đặt
- [ ] SSL/HTTPS đã hoạt động

### Performance
- [ ] Gzip compression đã bật
- [ ] Static files được cache
- [ ] Database indexes đã tạo
- [ ] Redis cache đang hoạt động

### Reliability
- [ ] Health check endpoints hoạt động
- [ ] Auto-restart containers đã cấu hình
- [ ] Database backup tự động đã cấu hình
- [ ] SSL auto-renew đã cấu hình
- [ ] Monitoring/alerting đã thiết lập

### Testing
- [ ] Đăng ký tài khoản mới hoạt động
- [ ] Đăng nhập hoạt động
- [ ] Email verification hoạt động
- [ ] Upload files hoạt động
- [ ] Real-time messaging hoạt động
- [ ] Mobile responsive

### Documentation
- [ ] README đã cập nhật
- [ ] API documentation có sẵn
- [ ] Contact/support info đã thêm

---

## Liên Hệ Hỗ Trợ

Nếu gặp vấn đề trong quá trình deploy, vui lòng:

1. Kiểm tra logs: `docker compose logs -f`
2. Xem troubleshooting section ở trên
3. Tìm kiếm lỗi trên Google/Stack Overflow
4. Mở issue trên GitHub repository

---

**Chúc bạn deploy thành công! 🚀**
