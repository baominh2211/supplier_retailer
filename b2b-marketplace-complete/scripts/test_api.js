#!/usr/bin/env node
/**
 * B2B Marketplace API Test Script (Node.js)
 * ==========================================
 * 
 * Cài đặt:
 *   npm install node-fetch@2
 * 
 * Sử dụng:
 *   node test_api.js              # Chạy tất cả tests
 *   node test_api.js --auth       # Test authentication only
 *   node test_api.js --products   # Test products only
 */

const fetch = require('node-fetch') || globalThis.fetch;

// ==================== CONFIG ====================

const CONFIG = {
  baseUrl: process.env.API_URL || 'http://localhost:3001/api',
  timeout: 30000,
  
  // Test accounts
  admin: {
    email: 'admin@b2bmarket.com',
    password: 'Admin123!@#'
  },
  supplier: {
    email: 'supplier@techcorp.com',
    password: 'Supplier123!@#'
  },
  shop: {
    email: 'buyer@retailplus.com',
    password: 'Shop123!@#'
  }
};

// ==================== API CLIENT ====================

class B2BApiClient {
  constructor(baseUrl = CONFIG.baseUrl) {
    this.baseUrl = baseUrl;
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;
  }

  _headers(auth = true) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    if (auth && this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    return headers;
  }

  async _request(method, endpoint, data = null, params = null, auth = true) {
    let url = `${this.baseUrl}${endpoint}`;
    
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const options = {
      method,
      headers: this._headers(auth),
      timeout: CONFIG.timeout
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();
      result._statusCode = response.status;
      return result;
    } catch (error) {
      return {
        success: false,
        error: { message: error.message },
        _statusCode: 0
      };
    }
  }

  // ==================== AUTH ====================

  async login(email, password) {
    const result = await this._request('POST', '/auth/login', { email, password }, null, false);
    
    if (result.success) {
      this.accessToken = result.data.accessToken;
      this.refreshToken = result.data.refreshToken;
      this.user = result.data.user;
    }
    
    return result;
  }

  async register(email, password, role, extraData = {}) {
    return this._request('POST', '/auth/register', { email, password, role, ...extraData }, null, false);
  }

  async getMe() {
    return this._request('GET', '/auth/me');
  }

  async refreshTokens() {
    const result = await this._request('POST', '/auth/refresh', { refreshToken: this.refreshToken }, null, false);
    
    if (result.success) {
      this.accessToken = result.data.accessToken;
      this.refreshToken = result.data.refreshToken;
    }
    
    return result;
  }

  async logout() {
    const result = await this._request('POST', '/auth/logout', { refreshToken: this.refreshToken });
    if (result.success) {
      this.accessToken = null;
      this.refreshToken = null;
      this.user = null;
    }
    return result;
  }

  // ==================== PRODUCTS ====================

  async listProducts(params = {}) {
    return this._request('GET', '/products', null, { page: 1, limit: 20, ...params }, false);
  }

  async getProduct(id) {
    return this._request('GET', `/products/${id}`, null, null, false);
  }

  async createProduct(data) {
    return this._request('POST', '/products', data);
  }

  async updateProduct(id, data) {
    return this._request('PUT', `/products/${id}`, data);
  }

  async deleteProduct(id) {
    return this._request('DELETE', `/products/${id}`);
  }

  async getFeaturedProducts() {
    return this._request('GET', '/products/featured', null, null, false);
  }

  // ==================== SUPPLIERS ====================

  async listSuppliers(params = {}) {
    return this._request('GET', '/suppliers', null, { page: 1, limit: 20, ...params }, false);
  }

  async getSupplier(id) {
    return this._request('GET', `/suppliers/${id}`, null, null, false);
  }

  async getMySupplierProfile() {
    return this._request('GET', '/suppliers/me/profile');
  }

  async getSupplierStats(id) {
    return this._request('GET', `/suppliers/${id}/stats`, null, null, false);
  }

  // ==================== CATEGORIES ====================

  async getCategories() {
    return this._request('GET', '/categories', null, null, false);
  }

  async getCategoryBySlug(slug) {
    return this._request('GET', `/categories/slug/${slug}`, null, null, false);
  }

  // ==================== NEGOTIATIONS ====================

  async listNegotiations(params = {}) {
    return this._request('GET', '/negotiations', null, { page: 1, limit: 20, ...params });
  }

  async getNegotiation(id) {
    return this._request('GET', `/negotiations/${id}`);
  }

  async createNegotiation(productId, supplierId, message) {
    return this._request('POST', '/negotiations', {
      productId,
      supplierId,
      initialMessage: message
    });
  }

  async sendMessage(negotiationId, content, type = 'TEXT') {
    return this._request('POST', `/negotiations/${negotiationId}/messages`, { type, content });
  }

  async getMessages(negotiationId, page = 1) {
    return this._request('GET', `/negotiations/${negotiationId}/messages`, null, { page });
  }

  // ==================== HEALTH ====================

  async healthCheck() {
    try {
      const response = await fetch(this.baseUrl.replace('/api', '/health'));
      return { success: true, status: await response.text() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async healthReady() {
    try {
      const response = await fetch(this.baseUrl.replace('/api', '/health/ready'));
      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// ==================== TEST RUNNER ====================

class TestRunner {
  constructor() {
    this.client = new B2BApiClient();
    this.results = [];
    this.passed = 0;
    this.failed = 0;
  }

  printHeader(text) {
    console.log('\n' + '='.repeat(60));
    console.log(`  ${text}`);
    console.log('='.repeat(60));
  }

  printTest(name, success, details = '') {
    const status = success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} | ${name}`);
    if (details && !success) {
      console.log(`       └─ ${details}`);
    }
    
    this.results.push({ name, success, details });
    
    if (success) {
      this.passed++;
    } else {
      this.failed++;
    }
  }

  async runTest(name, testFunc) {
    try {
      const result = await testFunc();
      const success = result.success === true;
      const details = success ? '' : (result.error?.message || 'Unknown error');
      this.printTest(name, success, details);
      return result;
    } catch (error) {
      this.printTest(name, false, error.message);
      return { success: false, error: { message: error.message } };
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('  TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`  Total:  ${this.passed + this.failed}`);
    console.log(`  Passed: ${this.passed} ✅`);
    console.log(`  Failed: ${this.failed} ❌`);
    console.log('='.repeat(60));
  }

  // ==================== TEST SUITES ====================

  async testHealth() {
    this.printHeader('HEALTH CHECK');
    
    await this.runTest('Health Check', () => this.client.healthCheck());
    await this.runTest('Health Ready', () => this.client.healthReady());
  }

  async testAuth() {
    this.printHeader('AUTHENTICATION');
    
    // Login supplier
    let result = await this.runTest(
      'Login (Supplier)',
      () => this.client.login(CONFIG.supplier.email, CONFIG.supplier.password)
    );
    
    if (result.success) {
      await this.runTest('Get Current User', () => this.client.getMe());
      await this.runTest('Refresh Token', () => this.client.refreshTokens());
      await this.runTest('Logout', () => this.client.logout());
    }
    
    // Login shop
    await this.runTest(
      'Login (Shop)',
      () => this.client.login(CONFIG.shop.email, CONFIG.shop.password)
    );
    
    await this.client.logout();
    
    // Invalid login
    result = await this.runTest(
      'Login (Invalid - should fail)',
      () => this.client.login('invalid@email.com', 'wrongpassword')
    );
    
    if (!result.success) {
      this.passed++;
      this.failed--;
    }
  }

  async testProducts() {
    this.printHeader('PRODUCTS');
    
    let result = await this.runTest('List Products', () => this.client.listProducts({ limit: 5 }));
    
    const products = result.data || [];
    if (products.length > 0) {
      const productId = products[0].id;
      await this.runTest('Get Product Detail', () => this.client.getProduct(productId));
    }
    
    await this.runTest('Search Products', () => this.client.listProducts({ search: 'phone' }));
    await this.runTest('Get Featured Products', () => this.client.getFeaturedProducts());
    
    // Create product (requires auth)
    await this.client.login(CONFIG.supplier.email, CONFIG.supplier.password);
    
    const categories = await this.client.getCategories();
    const categoryId = categories.data?.[0]?.id;
    
    if (categoryId) {
      const testProduct = {
        name: `Test Product ${Date.now()}`,
        sku: `TEST-${Date.now()}`,
        shortDescription: 'Test product created by API test',
        description: 'Full description of test product',
        basePrice: 99.99,
        currency: 'USD',
        moq: 10,
        categoryId
      };
      
      const createResult = await this.runTest('Create Product', () => this.client.createProduct(testProduct));
      
      if (createResult.success) {
        const newProductId = createResult.data.id;
        
        await this.runTest('Update Product', () => this.client.updateProduct(newProductId, { basePrice: 149.99 }));
        await this.runTest('Delete Product', () => this.client.deleteProduct(newProductId));
      }
    }
    
    await this.client.logout();
  }

  async testSuppliers() {
    this.printHeader('SUPPLIERS');
    
    let result = await this.runTest('List Suppliers', () => this.client.listSuppliers());
    
    const suppliers = result.data || [];
    if (suppliers.length > 0) {
      const supplierId = suppliers[0].id;
      await this.runTest('Get Supplier Detail', () => this.client.getSupplier(supplierId));
      await this.runTest('Get Supplier Stats', () => this.client.getSupplierStats(supplierId));
    }
    
    await this.client.login(CONFIG.supplier.email, CONFIG.supplier.password);
    await this.runTest('Get My Profile', () => this.client.getMySupplierProfile());
    await this.client.logout();
  }

  async testCategories() {
    this.printHeader('CATEGORIES');
    
    const result = await this.runTest('Get Category Tree', () => this.client.getCategories());
    
    const categories = result.data || [];
    if (categories.length > 0 && categories[0].slug) {
      await this.runTest('Get Category by Slug', () => this.client.getCategoryBySlug(categories[0].slug));
    }
  }

  async testNegotiations() {
    this.printHeader('NEGOTIATIONS');
    
    await this.client.login(CONFIG.shop.email, CONFIG.shop.password);
    
    await this.runTest('List Negotiations', () => this.client.listNegotiations());
    
    const products = await this.client.listProducts({ limit: 1 });
    const suppliers = await this.client.listSuppliers();
    
    if (products.data?.length && suppliers.data?.length) {
      const product = products.data[0];
      const supplier = suppliers.data[0];
      
      const createResult = await this.runTest(
        'Create Negotiation',
        () => this.client.createNegotiation(
          product.id,
          supplier.id,
          "Hello, I'm interested in your product. What's the best price for 100 units?"
        )
      );
      
      if (createResult.success) {
        const negotiationId = createResult.data.id;
        
        await this.runTest('Get Negotiation Detail', () => this.client.getNegotiation(negotiationId));
        await this.runTest('Get Messages', () => this.client.getMessages(negotiationId));
        await this.runTest('Send Message', () => this.client.sendMessage(negotiationId, 'Looking forward to your response!'));
      }
    }
    
    await this.client.logout();
  }

  async runAll() {
    console.log('\n' + '🚀 '.repeat(20));
    console.log('  B2B MARKETPLACE API TEST SUITE');
    console.log('🚀 '.repeat(20));
    console.log(`\nBase URL: ${this.client.baseUrl}`);
    console.log(`Time: ${new Date().toISOString()}`);
    
    await this.testHealth();
    await this.testAuth();
    await this.testCategories();
    await this.testSuppliers();
    await this.testProducts();
    await this.testNegotiations();
    
    this.printSummary();
    
    return this.failed === 0;
  }
}

// ==================== MAIN ====================

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--url')) {
    const urlIndex = args.indexOf('--url');
    if (args[urlIndex + 1]) {
      CONFIG.baseUrl = args[urlIndex + 1];
    }
  }
  
  const runner = new TestRunner();
  
  if (args.includes('--auth')) {
    await runner.testHealth();
    await runner.testAuth();
  } else if (args.includes('--products')) {
    await runner.testHealth();
    await runner.testProducts();
  } else if (args.includes('--suppliers')) {
    await runner.testHealth();
    await runner.testSuppliers();
  } else if (args.includes('--negotiations')) {
    await runner.testHealth();
    await runner.testNegotiations();
  } else {
    const success = await runner.runAll();
    process.exit(success ? 0 : 1);
  }
  
  runner.printSummary();
}

main().catch(console.error);
