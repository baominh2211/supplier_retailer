import { PrismaClient, UserRole, SupplierStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin123!@#', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@b2bmarket.com' },
    update: {},
    create: {
      email: 'admin@b2bmarket.com',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      accountStatus: 'ACTIVE',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create sample supplier user
  const supplierPassword = await bcrypt.hash('Supplier123!@#', 12);
  const supplierUser = await prisma.user.upsert({
    where: { email: 'supplier@techcorp.com' },
    update: {},
    create: {
      email: 'supplier@techcorp.com',
      passwordHash: supplierPassword,
      role: UserRole.SUPPLIER,
      accountStatus: 'ACTIVE',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  // Create supplier profile
  const supplier = await prisma.supplier.upsert({
    where: { userId: supplierUser.id },
    update: {},
    create: {
      userId: supplierUser.id,
      companyName: 'TechCorp Manufacturing',
      legalName: 'TechCorp Manufacturing LLC',
      taxId: 'TC-123456789',
      businessType: 'Manufacturer',
      description: 'Leading manufacturer of electronic components and consumer electronics.',
      yearEstablished: 2010,
      employeeCountRange: '100-500',
      annualRevenueRange: '$10M-$50M',
      country: 'United States',
      city: 'San Francisco',
      stateProvince: 'California',
      phone: '+1-555-0100',
      website: 'https://techcorp.example.com',
      contactPersonName: 'John Smith',
      contactPersonEmail: 'john@techcorp.com',
      status: SupplierStatus.VERIFIED,
      verifiedAt: new Date(),
      verifiedByAdminId: admin.id,
      ratingAverage: 4.5,
      ratingCount: 25,
      totalProducts: 0,
    },
  });
  console.log('✅ Supplier created:', supplier.companyName);

  // Create sample shop user
  const shopPassword = await bcrypt.hash('Shop123!@#', 12);
  const shopUser = await prisma.user.upsert({
    where: { email: 'buyer@retailplus.com' },
    update: {},
    create: {
      email: 'buyer@retailplus.com',
      passwordHash: shopPassword,
      role: UserRole.SHOP,
      accountStatus: 'ACTIVE',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  // Create shop profile
  const shop = await prisma.shop.upsert({
    where: { userId: shopUser.id },
    update: {},
    create: {
      userId: shopUser.id,
      shopName: 'RetailPlus Electronics',
      legalName: 'RetailPlus Inc.',
      businessType: 'Retailer',
      description: 'Consumer electronics retail chain with 50+ stores nationwide.',
      country: 'United States',
      city: 'New York',
      stateProvince: 'New York',
      phone: '+1-555-0200',
      website: 'https://retailplus.example.com',
      contactPersonName: 'Jane Doe',
      contactPersonEmail: 'jane@retailplus.com',
    },
  });
  console.log('✅ Shop created:', shop.shopName);

  // Create categories
  const categories = [
    { name: 'Electronics', slug: 'electronics', description: 'Electronic devices and components' },
    { name: 'Industrial Equipment', slug: 'industrial-equipment', description: 'Industrial machinery and tools' },
    { name: 'Office Supplies', slug: 'office-supplies', description: 'Office and business supplies' },
    { name: 'Packaging', slug: 'packaging', description: 'Packaging materials and solutions' },
  ];

  const createdCategories: { [key: string]: any } = {};

  for (const cat of categories) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        isActive: true,
        level: 1,
      },
    });
    createdCategories[cat.slug] = category;
    console.log('✅ Category created:', category.name);
  }

  // Create subcategories for Electronics
  const electronicsSubcategories = [
    { name: 'Smartphones', slug: 'smartphones' },
    { name: 'Laptops', slug: 'laptops' },
    { name: 'Accessories', slug: 'accessories' },
    { name: 'Components', slug: 'components' },
  ];

  for (const subcat of electronicsSubcategories) {
    await prisma.category.upsert({
      where: { slug: subcat.slug },
      update: {},
      create: {
        name: subcat.name,
        slug: subcat.slug,
        parentId: createdCategories['electronics'].id,
        isActive: true,
        level: 2,
      },
    });
    console.log('✅ Subcategory created:', subcat.name);
  }

  // Create sample products
  const smartphonesCategory = await prisma.category.findUnique({
    where: { slug: 'smartphones' },
  });

  if (smartphonesCategory) {
    const products = [
      {
        name: 'Pro Smartphone X1',
        description: 'High-end smartphone with advanced camera system and long battery life.',
        shortDescription: 'Flagship smartphone with pro camera',
        brand: 'TechCorp',
        model: 'X1-Pro',
        sku: 'TC-X1-PRO-001',
        unitPrice: 599.99,
        minOrderQuantity: 10,
        stockQuantity: 1000,
        leadTimeDays: 14,
        originCountry: 'China',
      },
      {
        name: 'Budget Smartphone Lite',
        description: 'Affordable smartphone with essential features for everyday use.',
        shortDescription: 'Budget-friendly smartphone',
        brand: 'TechCorp',
        model: 'Lite-S',
        sku: 'TC-LITE-S-001',
        unitPrice: 199.99,
        minOrderQuantity: 50,
        stockQuantity: 5000,
        leadTimeDays: 7,
        originCountry: 'Vietnam',
      },
      {
        name: 'Business Smartphone Pro',
        description: 'Enterprise-grade smartphone with security features and productivity tools.',
        shortDescription: 'Business-class smartphone',
        brand: 'TechCorp',
        model: 'B-Pro',
        sku: 'TC-BPRO-001',
        unitPrice: 449.99,
        minOrderQuantity: 25,
        stockQuantity: 2000,
        leadTimeDays: 10,
        originCountry: 'Taiwan',
      },
    ];

    for (const productData of products) {
      const product = await prisma.product.upsert({
        where: { sku: productData.sku },
        update: {},
        create: {
          supplierId: supplier.id,
          categoryId: smartphonesCategory.id,
          ...productData,
          currency: 'USD',
          priceUnit: 'piece',
          isActive: true,
          bulkPricingTiers: [
            { minQuantity: 10, maxQuantity: 49, price: productData.unitPrice * 0.95 },
            { minQuantity: 50, maxQuantity: 99, price: productData.unitPrice * 0.90 },
            { minQuantity: 100, price: productData.unitPrice * 0.85 },
          ],
        },
      });
      console.log('✅ Product created:', product.name);
    }

    // Update supplier product count
    await prisma.supplier.update({
      where: { id: supplier.id },
      data: { totalProducts: 3 },
    });

    // Update category product count
    await prisma.category.update({
      where: { id: smartphonesCategory.id },
      data: { productCount: 3 },
    });
  }

  console.log('');
  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('📝 Test Accounts:');
  console.log('   Admin:    admin@b2bmarket.com / Admin123!@#');
  console.log('   Supplier: supplier@techcorp.com / Supplier123!@#');
  console.log('   Shop:     buyer@retailplus.com / Shop123!@#');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
