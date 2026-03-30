const { prisma } = require("../config/db");
const bcrypt = require("bcryptjs");

async function seed() {
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash("Admin@12345", salt);

 await prisma.user.upsert({
  where: { email: process.env.ADMIN_EMAIL },
  update: {},
  create: {
    firstName: "System",
    lastName: "Admin",
    email: process.env.ADMIN_EMAIL,
    phone: process.env.ADMIN_PHONE,
    password: hashedPassword,
    role: "ADMIN",
    status: "ACTIVE",
    emailVerified: true,
  },
});

  console.log("Admin seeded successfully");
}

seed();
