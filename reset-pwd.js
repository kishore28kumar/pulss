const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function resetPassword() {
  try {
    const hashedPassword = await bcrypt.hash('Test@123', 10);
    const user = await prisma.users.update({
      where: { email: 'kishore28kks@gmail.com' },
      data: { password: hashedPassword }
    });
    console.log('Password reset successfully for:', user.email);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}
resetPassword();
