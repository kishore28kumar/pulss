// Script to add CREDIT and ONL to PaymentMethod enum
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addEnumValues() {
  try {
    console.log('Adding CREDIT and ONL to PaymentMethod enum...');
    
    // Add ONL
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum 
          WHERE enumlabel = 'ONL' 
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PaymentMethod')
        ) THEN
          ALTER TYPE "PaymentMethod" ADD VALUE 'ONL';
        END IF;
      END $$;
    `);
    console.log('✅ Added ONL to PaymentMethod enum');
    
    // Add CREDIT
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum 
          WHERE enumlabel = 'CREDIT' 
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PaymentMethod')
        ) THEN
          ALTER TYPE "PaymentMethod" ADD VALUE 'CREDIT';
        END IF;
      END $$;
    `);
    console.log('✅ Added CREDIT to PaymentMethod enum');
    
    // Verify
    const result = await prisma.$queryRawUnsafe(`
      SELECT unnest(enum_range(NULL::"PaymentMethod")) as value;
    `);
    console.log('\n📋 Current PaymentMethod enum values:');
    result.forEach(row => console.log(`  - ${row.value}`));
    
    console.log('\n✅ Enum values added successfully!');
    console.log('⚠️  Now run: npx prisma generate');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addEnumValues();

