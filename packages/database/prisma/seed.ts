import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { resolve } from 'path';
import bcrypt from 'bcryptjs';

// Load environment variables from root .env file
config({ path: resolve(__dirname, '../../../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Get or create default tenant
  let tenant = await prisma.tenants.findFirst({
    where: { slug: 'default' },
  });

  if (!tenant) {
    console.log('Creating default tenant...');
    tenant = await prisma.tenants.create({
      data: {
        id: `tenant_${Date.now()}`,
        name: 'Pulss Store',
        slug: 'default',
        status: 'ACTIVE',
        subscriptionPlan: 'PROFESSIONAL',
        email: 'admin@pulss.com',
        phone: '+1234567890',
        primaryColor: '#3B82F6',
        secondaryColor: '#8B5CF6',
        updatedAt: new Date(),
      },
    });
    console.log('✅ Default tenant created');
  }

  // Create super admin user
  console.log('Creating super admin user...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  await prisma.users.upsert({
    where: { email: 'admin@example.com' },
    update: {
      role: 'SUPER_ADMIN',
      updatedAt: new Date(),
    },
    create: {
      id: `user_admin_${Date.now()}`,
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      tenantId: tenant.id,
      isActive: true,
      emailVerified: true,
      updatedAt: new Date(),
    },
  });

  console.log('✅ Super Admin user created (admin@example.com / password123)');

  // Create categories
  console.log('Creating categories...');
  
  const pharmacyCategory = await prisma.categories.upsert({
    where: { id: 'cat_pharmacy' },
    update: {},
    create: {
      id: 'cat_pharmacy',
      name: 'Pharmacy & Health',
      slug: 'pharmacy-health',
      description: 'Healthcare products and medicines',
      tenantId: tenant.id,
      isActive: true,
      displayOrder: 1,
      updatedAt: new Date(),
    },
  });

  const groceryCategory = await prisma.categories.upsert({
    where: { id: 'cat_grocery' },
    update: {},
    create: {
      id: 'cat_grocery',
      name: 'Grocery',
      slug: 'grocery',
      description: 'Fresh groceries and daily essentials',
      tenantId: tenant.id,
      isActive: true,
      displayOrder: 2,
      updatedAt: new Date(),
    },
  });

  const electronicsCategory = await prisma.categories.upsert({
    where: { id: 'cat_electronics' },
    update: {},
    create: {
      id: 'cat_electronics',
      name: 'Electronics',
      slug: 'electronics',
      description: 'Latest electronic gadgets and devices',
      tenantId: tenant.id,
      isActive: true,
      displayOrder: 3,
      updatedAt: new Date(),
    },
  });

  const homeCategory = await prisma.categories.upsert({
    where: { id: 'cat_home' },
    update: {},
    create: {
      id: 'cat_home',
      name: 'Home & Kitchen',
      slug: 'home-kitchen',
      description: 'Everything for your home',
      tenantId: tenant.id,
      isActive: true,
      displayOrder: 4,
      updatedAt: new Date(),
    },
  });

  console.log('✅ Categories created');

  // Create products
  console.log('Creating products...');

  const products = [
    // Pharmacy Products
    {
      id: 'prod_1',
      name: 'Paracetamol 500mg',
      slug: 'paracetamol-500mg',
      description: 'Fast relief from fever and pain. Trusted brand for headaches, body aches, and cold symptoms.',
      tenantId: tenant.id,
      categoryId: pharmacyCategory.id,
      price: 12.99,
      comparePrice: 15.99,
      costPrice: 8.50,
      sku: 'MED-PAR-500',
      stock: 150,
      images: ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500'],
      thumbnail: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500',
      requiresPrescription: false,
      manufacturer: 'PharmaCo',
      isActive: true,
      isFeatured: true,
      tags: ['medicine', 'fever', 'pain relief'],
      updatedAt: new Date(),
    },
    {
      id: 'prod_2',
      name: 'Vitamin D3 Supplements',
      slug: 'vitamin-d3-supplements',
      description: 'Essential vitamin D3 for bone health and immunity. 60 capsules per bottle.',
      tenantId: tenant.id,
      categoryId: pharmacyCategory.id,
      price: 24.99,
      comparePrice: 29.99,
      costPrice: 15.00,
      sku: 'SUP-VITD3-60',
      stock: 200,
      images: ['https://images.unsplash.com/photo-1550572017-4814d2023f69?w=500'],
      thumbnail: 'https://images.unsplash.com/photo-1550572017-4814d2023f69?w=500',
      manufacturer: 'HealthPlus',
      isActive: true,
      isFeatured: true,
      tags: ['supplements', 'vitamins', 'health'],
      updatedAt: new Date(),
    },
    {
      id: 'prod_3',
      name: 'First Aid Kit',
      slug: 'first-aid-kit',
      description: 'Complete first aid kit with bandages, antiseptic, and essential medical supplies.',
      tenantId: tenant.id,
      categoryId: pharmacyCategory.id,
      price: 39.99,
      comparePrice: 49.99,
      costPrice: 25.00,
      sku: 'FAK-COMP-001',
      stock: 75,
      images: ['https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=500'],
      thumbnail: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=500',
      manufacturer: 'MediCare',
      isActive: true,
      isFeatured: false,
      tags: ['first aid', 'emergency', 'medical supplies'],
      updatedAt: new Date(),
    },
    {
      id: 'prod_4',
      name: 'Hand Sanitizer 500ml',
      slug: 'hand-sanitizer-500ml',
      description: 'Kills 99.9% of germs. Alcohol-based hand sanitizer with moisturizing agents.',
      tenantId: tenant.id,
      categoryId: pharmacyCategory.id,
      price: 8.99,
      costPrice: 5.00,
      sku: 'HYG-SAN-500',
      stock: 300,
      images: ['https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=500'],
      thumbnail: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=500',
      manufacturer: 'CleanHands',
      isActive: true,
      isFeatured: false,
      tags: ['hygiene', 'sanitizer', 'covid'],
      updatedAt: new Date(),
    },

    // Grocery Products
    {
      id: 'prod_5',
      name: 'Organic Brown Rice 5kg',
      slug: 'organic-brown-rice-5kg',
      description: 'Premium quality organic brown rice. Rich in fiber and nutrients.',
      tenantId: tenant.id,
      categoryId: groceryCategory.id,
      price: 18.99,
      comparePrice: 22.99,
      costPrice: 12.00,
      sku: 'GRO-RICE-5KG',
      stock: 120,
      images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500'],
      thumbnail: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500',
      manufacturer: 'Nature Farms',
      isActive: true,
      isFeatured: true,
      tags: ['rice', 'organic', 'grain'],
      updatedAt: new Date(),
    },
    {
      id: 'prod_6',
      name: 'Fresh Milk 1L',
      slug: 'fresh-milk-1l',
      description: 'Farm fresh full cream milk. Pasteurized and homogenized.',
      tenantId: tenant.id,
      categoryId: groceryCategory.id,
      price: 3.99,
      costPrice: 2.50,
      sku: 'DAI-MILK-1L',
      stock: 80,
      images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500'],
      thumbnail: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500',
      manufacturer: 'Daily Fresh',
      isActive: true,
      isFeatured: false,
      tags: ['dairy', 'milk', 'fresh'],
      updatedAt: new Date(),
    },
    {
      id: 'prod_7',
      name: 'Whole Wheat Bread',
      slug: 'whole-wheat-bread',
      description: 'Freshly baked whole wheat bread. High in fiber and nutrients.',
      tenantId: tenant.id,
      categoryId: groceryCategory.id,
      price: 4.49,
      costPrice: 2.80,
      sku: 'BAK-BREAD-WW',
      stock: 60,
      images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500'],
      thumbnail: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500',
      manufacturer: 'Baker\'s Delight',
      isActive: true,
      isFeatured: false,
      tags: ['bread', 'bakery', 'whole wheat'],
      updatedAt: new Date(),
    },
    {
      id: 'prod_8',
      name: 'Organic Eggs (12 pack)',
      slug: 'organic-eggs-12-pack',
      description: 'Free-range organic eggs. Rich in protein and omega-3.',
      tenantId: tenant.id,
      categoryId: groceryCategory.id,
      price: 6.99,
      comparePrice: 8.99,
      costPrice: 4.50,
      sku: 'EGG-ORG-12',
      stock: 100,
      images: ['https://images.unsplash.com/photo-1518569656558-1f25e69d93d7?w=500'],
      thumbnail: 'https://images.unsplash.com/photo-1518569656558-1f25e69d93d7?w=500',
      manufacturer: 'Farm Fresh',
      isActive: true,
      isFeatured: true,
      tags: ['eggs', 'organic', 'protein'],
      updatedAt: new Date(),
    },

    // Electronics
    {
      id: 'prod_9',
      name: 'Wireless Bluetooth Earbuds',
      slug: 'wireless-bluetooth-earbuds',
      description: 'Premium wireless earbuds with noise cancellation. 24-hour battery life.',
      tenantId: tenant.id,
      categoryId: electronicsCategory.id,
      price: 79.99,
      comparePrice: 99.99,
      costPrice: 45.00,
      sku: 'ELEC-EAR-BT01',
      stock: 50,
      images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500'],
      thumbnail: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500',
      manufacturer: 'SoundTech',
      isActive: true,
      isFeatured: true,
      tags: ['electronics', 'audio', 'wireless'],
      updatedAt: new Date(),
    },
    {
      id: 'prod_10',
      name: 'Smart Watch Pro',
      slug: 'smart-watch-pro',
      description: 'Advanced smartwatch with fitness tracking, heart rate monitor, and notifications.',
      tenantId: tenant.id,
      categoryId: electronicsCategory.id,
      price: 199.99,
      comparePrice: 249.99,
      costPrice: 120.00,
      sku: 'ELEC-WATCH-PRO',
      stock: 35,
      images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'],
      thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
      manufacturer: 'TechGear',
      isActive: true,
      isFeatured: true,
      tags: ['smartwatch', 'fitness', 'wearable'],
      updatedAt: new Date(),
    },
    {
      id: 'prod_11',
      name: 'Portable Charger 20000mAh',
      slug: 'portable-charger-20000mah',
      description: 'High-capacity power bank with fast charging. Charge multiple devices simultaneously.',
      tenantId: tenant.id,
      categoryId: electronicsCategory.id,
      price: 45.99,
      comparePrice: 59.99,
      costPrice: 28.00,
      sku: 'ELEC-PWR-20K',
      stock: 85,
      images: ['https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500'],
      thumbnail: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500',
      manufacturer: 'PowerPlus',
      isActive: true,
      isFeatured: false,
      tags: ['charger', 'power bank', 'mobile'],
      updatedAt: new Date(),
    },

    // Home & Kitchen
    {
      id: 'prod_12',
      name: 'Stainless Steel Cookware Set',
      slug: 'stainless-steel-cookware-set',
      description: '10-piece professional cookware set. Dishwasher safe and durable.',
      tenantId: tenant.id,
      categoryId: homeCategory.id,
      price: 149.99,
      comparePrice: 199.99,
      costPrice: 90.00,
      sku: 'HOME-COOK-10PC',
      stock: 40,
      images: ['https://images.unsplash.com/photo-1556911220-bff31c812dba?w=500'],
      thumbnail: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=500',
      manufacturer: 'Kitchen Pro',
      isActive: true,
      isFeatured: true,
      tags: ['cookware', 'kitchen', 'stainless steel'],
      updatedAt: new Date(),
    },
    {
      id: 'prod_13',
      name: 'Coffee Maker Machine',
      slug: 'coffee-maker-machine',
      description: 'Automatic drip coffee maker. Brew up to 12 cups. Programmable timer.',
      tenantId: tenant.id,
      categoryId: homeCategory.id,
      price: 89.99,
      comparePrice: 119.99,
      costPrice: 55.00,
      sku: 'HOME-COFFEE-12C',
      stock: 55,
      images: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500'],
      thumbnail: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500',
      manufacturer: 'BrewMaster',
      isActive: true,
      isFeatured: true,
      tags: ['coffee', 'appliance', 'kitchen'],
      updatedAt: new Date(),
    },
    {
      id: 'prod_14',
      name: 'Memory Foam Pillow Set',
      slug: 'memory-foam-pillow-set',
      description: 'Set of 2 premium memory foam pillows. Hypoallergenic and washable cover.',
      tenantId: tenant.id,
      categoryId: homeCategory.id,
      price: 54.99,
      comparePrice: 69.99,
      costPrice: 32.00,
      sku: 'HOME-PIL-MF2',
      stock: 70,
      images: ['https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=500'],
      thumbnail: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=500',
      manufacturer: 'SleepWell',
      isActive: true,
      isFeatured: false,
      tags: ['pillow', 'bedding', 'memory foam'],
      updatedAt: new Date(),
    },
    {
      id: 'prod_15',
      name: 'LED Desk Lamp',
      slug: 'led-desk-lamp',
      description: 'Adjustable LED desk lamp with USB charging port. Multiple brightness levels.',
      tenantId: tenant.id,
      categoryId: homeCategory.id,
      price: 34.99,
      costPrice: 20.00,
      sku: 'HOME-LAMP-LED',
      stock: 90,
      images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500'],
      thumbnail: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500',
      manufacturer: 'LightUp',
      isActive: true,
      isFeatured: false,
      tags: ['lamp', 'led', 'desk'],
      updatedAt: new Date(),
    },
  ];

  for (const product of products) {
    await prisma.products.upsert({
      where: { id: product.id },
      update: product,
      create: product,
    });
  }

  console.log('✅ Products created');
  console.log(`\n🎉 Seed completed successfully!`);
  console.log(`📦 Created ${products.length} products across 4 categories`);
  console.log(`\n👤 Super Admin Login Credentials:`);
  console.log(`   Email: admin@example.com`);
  console.log(`   Password: password123`);
  console.log(`   Role: SUPER_ADMIN\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

