const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();

  const company = await prisma.company.create({
    data: {
      name: 'Vendocare Pvt Ltd',
      address: '123 Tech Park, Bangalore',
      phone: '+91-9876543210',
      email: 'contact@vendocare.com',
      gstNumber: '29ABCDE1234F1Z5',
      panNumber: 'ABCDE1234F',
      logo: 'https://example.com/logo.png',
      subscription: 'trial',
      subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  console.log('✅ Company created:', company.name);

  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@vendocare.com',
      password: hashedPassword,
      name: 'Admin User',
      phone: '+91-9876543211',
      avatar: 'https://example.com/avatar.png',
      role: 'ADMIN',
      companyId: company.id,
    },
  });
  console.log('✅ Admin user created:', adminUser.email);


  const financeUser = await prisma.user.create({
    data: {
      email: 'finance@vendocare.com',
      password: hashedPassword,
      name: 'Finance Manager',
      phone: '+91-9876543212',
      avatar: 'https://example.com/avatar2.png',
      role: 'FINANCE',
      companyId: company.id,
    },
  });
  console.log('✅ Finance user created:', financeUser.email);

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\nTest Credentials:');
  console.log('  Email: admin@vendocare.com');
  console.log('  Password: admin123');
  console.log('\nNote: Database is empty. Add vendors, contracts, and invoices through the dashboard.');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

