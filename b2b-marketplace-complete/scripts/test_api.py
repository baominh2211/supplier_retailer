#!/usr/bin/env python3
"""
B2B Marketplace API Test Script
================================
Script Python để test tất cả API endpoints

Cài đặt:
    pip install requests rich websocket-client

Sử dụng:
    python test_api.py              # Chạy tất cả tests
    python test_api.py --auth       # Test authentication only
    python test_api.py --products   # Test products only
    python test_api.py --interactive # Chế độ interactive
"""

import requests
import json
import argparse
import sys
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from datetime import datetime

# Try to import rich for better output
try:
    from rich.console import Console
    from rich.table import Table
    from rich.panel import Panel
    from rich import print as rprint
    RICH_AVAILABLE = True
    console = Console()
except ImportError:
    RICH_AVAILABLE = False
    console = None


# ==================== CONFIGURATION ====================

@dataclass
class Config:
    base_url: str = "http://localhost:3001/api"
    timeout: int = 30
    
    # Test accounts
    admin_email: str = "admin@b2bmarket.com"
    admin_password: str = "Admin123!@#"
    
    supplier_email: str = "supplier@techcorp.com"
    supplier_password: str = "Supplier123!@#"
    
    shop_email: str = "buyer@retailplus.com"
    shop_password: str = "Shop123!@#"


config = Config()


# ==================== API CLIENT ====================

class B2BApiClient:
    """Client để tương tác với B2B Marketplace API"""
    
    def __init__(self, base_url: str = None):
        self.base_url = base_url or config.base_url
        self.access_token: Optional[str] = None
        self.refresh_token: Optional[str] = None
        self.user: Optional[Dict] = None
        self.session = requests.Session()
    
    def _headers(self, auth: bool = True) -> Dict[str, str]:
        """Tạo headers cho request"""
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        if auth and self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        return headers
    
    def _request(
        self, 
        method: str, 
        endpoint: str, 
        data: Dict = None, 
        params: Dict = None,
        auth: bool = True
    ) -> Dict[str, Any]:
        """Thực hiện HTTP request"""
        url = f"{self.base_url}{endpoint}"
        headers = self._headers(auth)
        
        try:
            response = self.session.request(
                method=method,
                url=url,
                headers=headers,
                json=data,
                params=params,
                timeout=config.timeout
            )
            
            result = response.json()
            result['_status_code'] = response.status_code
            return result
            
        except requests.exceptions.ConnectionError:
            return {
                "success": False,
                "error": {"message": "Connection failed. Is the server running?"},
                "_status_code": 0
            }
        except requests.exceptions.Timeout:
            return {
                "success": False,
                "error": {"message": "Request timed out"},
                "_status_code": 0
            }
        except Exception as e:
            return {
                "success": False,
                "error": {"message": str(e)},
                "_status_code": 0
            }
    
    # ==================== AUTH ====================
    
    def login(self, email: str, password: str) -> Dict:
        """Đăng nhập và lưu tokens"""
        result = self._request(
            "POST", "/auth/login",
            {"email": email, "password": password},
            auth=False
        )
        
        if result.get("success"):
            self.access_token = result["data"]["accessToken"]
            self.refresh_token = result["data"]["refreshToken"]
            self.user = result["data"]["user"]
        
        return result
    
    def register(self, email: str, password: str, role: str, **kwargs) -> Dict:
        """Đăng ký tài khoản mới"""
        data = {
            "email": email,
            "password": password,
            "role": role,
            **kwargs
        }
        return self._request("POST", "/auth/register", data, auth=False)
    
    def get_me(self) -> Dict:
        """Lấy thông tin user hiện tại"""
        return self._request("GET", "/auth/me")
    
    def refresh_tokens(self) -> Dict:
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
    
    def logout(self) -> Dict:
        """Đăng xuất"""
        result = self._request(
            "POST", "/auth/logout",
            {"refreshToken": self.refresh_token}
        )
        if result.get("success"):
            self.access_token = None
            self.refresh_token = None
            self.user = None
        return result
    
    # ==================== PRODUCTS ====================
    
    def list_products(
        self, 
        page: int = 1, 
        limit: int = 20,
        search: str = None,
        category_id: str = None,
        min_price: float = None,
        max_price: float = None
    ) -> Dict:
        """Lấy danh sách sản phẩm"""
        params = {"page": page, "limit": limit}
        if search:
            params["search"] = search
        if category_id:
            params["categoryId"] = category_id
        if min_price:
            params["minPrice"] = min_price
        if max_price:
            params["maxPrice"] = max_price
            
        return self._request("GET", "/products", params=params, auth=False)
    
    def get_product(self, product_id: str) -> Dict:
        """Lấy chi tiết sản phẩm"""
        return self._request("GET", f"/products/{product_id}", auth=False)
    
    def create_product(self, data: Dict) -> Dict:
        """Tạo sản phẩm mới (Supplier only)"""
        return self._request("POST", "/products", data)
    
    def update_product(self, product_id: str, data: Dict) -> Dict:
        """Cập nhật sản phẩm"""
        return self._request("PUT", f"/products/{product_id}", data)
    
    def delete_product(self, product_id: str) -> Dict:
        """Xóa sản phẩm"""
        return self._request("DELETE", f"/products/{product_id}")
    
    def get_featured_products(self) -> Dict:
        """Lấy sản phẩm nổi bật"""
        return self._request("GET", "/products/featured", auth=False)
    
    # ==================== SUPPLIERS ====================
    
    def list_suppliers(self, page: int = 1, limit: int = 20) -> Dict:
        """Lấy danh sách nhà cung cấp"""
        return self._request(
            "GET", "/suppliers", 
            params={"page": page, "limit": limit}, 
            auth=False
        )
    
    def get_supplier(self, supplier_id: str) -> Dict:
        """Lấy chi tiết nhà cung cấp"""
        return self._request("GET", f"/suppliers/{supplier_id}", auth=False)
    
    def get_my_supplier_profile(self) -> Dict:
        """Lấy profile supplier của mình"""
        return self._request("GET", "/suppliers/me/profile")
    
    def get_supplier_stats(self, supplier_id: str) -> Dict:
        """Lấy thống kê của supplier"""
        return self._request("GET", f"/suppliers/{supplier_id}/stats", auth=False)
    
    # ==================== CATEGORIES ====================
    
    def get_categories(self) -> Dict:
        """Lấy cây danh mục"""
        return self._request("GET", "/categories", auth=False)
    
    def get_category_by_slug(self, slug: str) -> Dict:
        """Lấy danh mục theo slug"""
        return self._request("GET", f"/categories/slug/{slug}", auth=False)
    
    # ==================== NEGOTIATIONS ====================
    
    def list_negotiations(self, page: int = 1, limit: int = 20) -> Dict:
        """Lấy danh sách đàm phán"""
        return self._request("GET", "/negotiations", params={"page": page, "limit": limit})
    
    def get_negotiation(self, negotiation_id: str) -> Dict:
        """Lấy chi tiết đàm phán"""
        return self._request("GET", f"/negotiations/{negotiation_id}")
    
    def create_negotiation(
        self, 
        product_id: str, 
        supplier_id: str, 
        message: str
    ) -> Dict:
        """Tạo phiên đàm phán mới (Shop only)"""
        return self._request("POST", "/negotiations", {
            "productId": product_id,
            "supplierId": supplier_id,
            "initialMessage": message
        })
    
    def send_message(
        self, 
        negotiation_id: str, 
        content: str, 
        msg_type: str = "TEXT"
    ) -> Dict:
        """Gửi tin nhắn trong phiên đàm phán"""
        return self._request("POST", f"/negotiations/{negotiation_id}/messages", {
            "type": msg_type,
            "content": content
        })
    
    def get_messages(self, negotiation_id: str, page: int = 1) -> Dict:
        """Lấy tin nhắn của phiên đàm phán"""
        return self._request(
            "GET", 
            f"/negotiations/{negotiation_id}/messages",
            params={"page": page}
        )
    
    # ==================== PURCHASE INTENTS ====================
    
    def list_purchase_intents(self, page: int = 1, limit: int = 20) -> Dict:
        """Lấy danh sách purchase intents"""
        return self._request(
            "GET", "/purchase-intents", 
            params={"page": page, "limit": limit}
        )
    
    def create_purchase_intent(self, data: Dict) -> Dict:
        """Tạo purchase intent mới"""
        return self._request("POST", "/purchase-intents", data)
    
    # ==================== HEALTH ====================
    
    def health_check(self) -> Dict:
        """Kiểm tra health của server"""
        try:
            response = self.session.get(
                f"{self.base_url.replace('/api', '')}/health",
                timeout=5
            )
            return {"success": True, "status": response.text}
        except:
            return {"success": False, "status": "Server not reachable"}
    
    def health_ready(self) -> Dict:
        """Kiểm tra DB và Redis"""
        try:
            response = self.session.get(
                f"{self.base_url.replace('/api', '')}/health/ready",
                timeout=5
            )
            return response.json()
        except Exception as e:
            return {"success": False, "error": str(e)}


# ==================== TEST RUNNER ====================

class TestRunner:
    """Runner để chạy các test cases"""
    
    def __init__(self):
        self.client = B2BApiClient()
        self.results: List[Dict] = []
        self.passed = 0
        self.failed = 0
    
    def print_header(self, text: str):
        """In header"""
        print("\n" + "=" * 60)
        print(f"  {text}")
        print("=" * 60)
    
    def print_test(self, name: str, success: bool, details: str = ""):
        """In kết quả test"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} | {name}")
        if details and not success:
            print(f"       └─ {details}")
        
        self.results.append({
            "name": name,
            "success": success,
            "details": details
        })
        
        if success:
            self.passed += 1
        else:
            self.failed += 1
    
    def run_test(self, name: str, test_func):
        """Chạy một test case"""
        try:
            result = test_func()
            success = result.get("success", False)
            details = "" if success else result.get("error", {}).get("message", "Unknown error")
            self.print_test(name, success, details)
            return result
        except Exception as e:
            self.print_test(name, False, str(e))
            return {"success": False, "error": {"message": str(e)}}
    
    def print_summary(self):
        """In tổng kết"""
        print("\n" + "=" * 60)
        print("  TEST SUMMARY")
        print("=" * 60)
        print(f"  Total:  {self.passed + self.failed}")
        print(f"  Passed: {self.passed} ✅")
        print(f"  Failed: {self.failed} ❌")
        print("=" * 60)
    
    # ==================== TEST SUITES ====================
    
    def test_health(self):
        """Test health endpoints"""
        self.print_header("HEALTH CHECK")
        
        self.run_test("Health Check", lambda: self.client.health_check())
        self.run_test("Health Ready", lambda: self.client.health_ready())
    
    def test_auth(self):
        """Test authentication"""
        self.print_header("AUTHENTICATION")
        
        # Test login với supplier
        result = self.run_test(
            "Login (Supplier)", 
            lambda: self.client.login(config.supplier_email, config.supplier_password)
        )
        
        if result.get("success"):
            # Test get me
            self.run_test("Get Current User", lambda: self.client.get_me())
            
            # Test refresh token
            self.run_test("Refresh Token", lambda: self.client.refresh_tokens())
            
            # Test logout
            self.run_test("Logout", lambda: self.client.logout())
        
        # Test login với shop
        self.run_test(
            "Login (Shop)", 
            lambda: self.client.login(config.shop_email, config.shop_password)
        )
        
        # Logout để clean up
        self.client.logout()
        
        # Test invalid login
        result = self.run_test(
            "Login (Invalid - should fail)", 
            lambda: self.client.login("invalid@email.com", "wrongpassword")
        )
        # This should fail, so we flip the success
        if not result.get("success"):
            self.passed += 1
            self.failed -= 1
    
    def test_products(self):
        """Test products API"""
        self.print_header("PRODUCTS")
        
        # List products (public)
        result = self.run_test("List Products", lambda: self.client.list_products(limit=5))
        
        products = result.get("data", [])
        if products:
            product_id = products[0]["id"]
            
            # Get single product
            self.run_test(
                "Get Product Detail", 
                lambda: self.client.get_product(product_id)
            )
        
        # Test search
        self.run_test(
            "Search Products", 
            lambda: self.client.list_products(search="phone")
        )
        
        # Test featured
        self.run_test("Get Featured Products", lambda: self.client.get_featured_products())
        
        # Test create product (requires auth)
        self.client.login(config.supplier_email, config.supplier_password)
        
        # Get category first
        categories = self.client.get_categories()
        category_id = None
        if categories.get("data"):
            category_id = categories["data"][0]["id"]
        
        if category_id:
            test_product = {
                "name": f"Test Product {datetime.now().timestamp()}",
                "sku": f"TEST-{int(datetime.now().timestamp())}",
                "shortDescription": "Test product created by API test",
                "description": "Full description of test product",
                "basePrice": 99.99,
                "currency": "USD",
                "moq": 10,
                "categoryId": category_id
            }
            
            create_result = self.run_test(
                "Create Product", 
                lambda: self.client.create_product(test_product)
            )
            
            if create_result.get("success"):
                new_product_id = create_result["data"]["id"]
                
                # Update product
                self.run_test(
                    "Update Product",
                    lambda: self.client.update_product(new_product_id, {"basePrice": 149.99})
                )
                
                # Delete product
                self.run_test(
                    "Delete Product",
                    lambda: self.client.delete_product(new_product_id)
                )
        
        self.client.logout()
    
    def test_suppliers(self):
        """Test suppliers API"""
        self.print_header("SUPPLIERS")
        
        # List suppliers (public)
        result = self.run_test("List Suppliers", lambda: self.client.list_suppliers())
        
        suppliers = result.get("data", [])
        if suppliers:
            supplier_id = suppliers[0]["id"]
            
            # Get single supplier
            self.run_test(
                "Get Supplier Detail",
                lambda: self.client.get_supplier(supplier_id)
            )
            
            # Get stats
            self.run_test(
                "Get Supplier Stats",
                lambda: self.client.get_supplier_stats(supplier_id)
            )
        
        # Test authenticated endpoints
        self.client.login(config.supplier_email, config.supplier_password)
        self.run_test("Get My Profile", lambda: self.client.get_my_supplier_profile())
        self.client.logout()
    
    def test_categories(self):
        """Test categories API"""
        self.print_header("CATEGORIES")
        
        # Get category tree
        result = self.run_test("Get Category Tree", lambda: self.client.get_categories())
        
        categories = result.get("data", [])
        if categories:
            slug = categories[0].get("slug")
            if slug:
                self.run_test(
                    "Get Category by Slug",
                    lambda: self.client.get_category_by_slug(slug)
                )
    
    def test_negotiations(self):
        """Test negotiations API"""
        self.print_header("NEGOTIATIONS")
        
        # Login as shop to create negotiation
        self.client.login(config.shop_email, config.shop_password)
        
        # List negotiations
        self.run_test("List Negotiations", lambda: self.client.list_negotiations())
        
        # Get products and suppliers for creating negotiation
        products = self.client.list_products(limit=1)
        suppliers = self.client.list_suppliers()
        
        if products.get("data") and suppliers.get("data"):
            product = products["data"][0]
            supplier = suppliers["data"][0]
            
            # Create negotiation
            create_result = self.run_test(
                "Create Negotiation",
                lambda: self.client.create_negotiation(
                    product["id"],
                    supplier["id"],
                    "Hello, I'm interested in your product. What's the best price for 100 units?"
                )
            )
            
            if create_result.get("success"):
                negotiation_id = create_result["data"]["id"]
                
                # Get negotiation detail
                self.run_test(
                    "Get Negotiation Detail",
                    lambda: self.client.get_negotiation(negotiation_id)
                )
                
                # Get messages
                self.run_test(
                    "Get Messages",
                    lambda: self.client.get_messages(negotiation_id)
                )
                
                # Send message
                self.run_test(
                    "Send Message",
                    lambda: self.client.send_message(
                        negotiation_id,
                        "Looking forward to your response!"
                    )
                )
        
        self.client.logout()
    
    def run_all(self):
        """Chạy tất cả tests"""
        print("\n" + "🚀 " * 20)
        print("  B2B MARKETPLACE API TEST SUITE")
        print("🚀 " * 20)
        print(f"\nBase URL: {self.client.base_url}")
        print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        self.test_health()
        self.test_auth()
        self.test_categories()
        self.test_suppliers()
        self.test_products()
        self.test_negotiations()
        
        self.print_summary()
        
        return self.failed == 0


# ==================== INTERACTIVE MODE ====================

def interactive_mode():
    """Chế độ interactive để test API"""
    client = B2BApiClient()
    
    print("\n" + "=" * 60)
    print("  B2B MARKETPLACE API - INTERACTIVE MODE")
    print("=" * 60)
    print("\nCommands:")
    print("  login <email> <password>  - Login")
    print("  me                        - Get current user")
    print("  products                  - List products")
    print("  suppliers                 - List suppliers")
    print("  categories                - List categories")
    print("  logout                    - Logout")
    print("  exit                      - Exit")
    print()
    
    while True:
        try:
            cmd = input(">>> ").strip().split()
            if not cmd:
                continue
            
            action = cmd[0].lower()
            
            if action == "exit":
                break
            elif action == "login" and len(cmd) >= 3:
                result = client.login(cmd[1], cmd[2])
                print(json.dumps(result, indent=2))
            elif action == "me":
                result = client.get_me()
                print(json.dumps(result, indent=2))
            elif action == "products":
                result = client.list_products(limit=5)
                print(json.dumps(result, indent=2))
            elif action == "suppliers":
                result = client.list_suppliers()
                print(json.dumps(result, indent=2))
            elif action == "categories":
                result = client.get_categories()
                print(json.dumps(result, indent=2))
            elif action == "logout":
                result = client.logout()
                print(json.dumps(result, indent=2))
            else:
                print("Unknown command. Type 'exit' to quit.")
                
        except KeyboardInterrupt:
            print("\nExiting...")
            break
        except Exception as e:
            print(f"Error: {e}")


# ==================== MAIN ====================

def main():
    parser = argparse.ArgumentParser(description="B2B Marketplace API Test Script")
    parser.add_argument("--url", default="http://localhost:3001/api", help="Base URL")
    parser.add_argument("--auth", action="store_true", help="Test auth only")
    parser.add_argument("--products", action="store_true", help="Test products only")
    parser.add_argument("--suppliers", action="store_true", help="Test suppliers only")
    parser.add_argument("--negotiations", action="store_true", help="Test negotiations only")
    parser.add_argument("--interactive", "-i", action="store_true", help="Interactive mode")
    
    args = parser.parse_args()
    
    if args.url:
        config.base_url = args.url
    
    if args.interactive:
        interactive_mode()
        return
    
    runner = TestRunner()
    
    if args.auth:
        runner.test_health()
        runner.test_auth()
    elif args.products:
        runner.test_health()
        runner.test_products()
    elif args.suppliers:
        runner.test_health()
        runner.test_suppliers()
    elif args.negotiations:
        runner.test_health()
        runner.test_negotiations()
    else:
        success = runner.run_all()
        sys.exit(0 if success else 1)
    
    runner.print_summary()


if __name__ == "__main__":
    main()
