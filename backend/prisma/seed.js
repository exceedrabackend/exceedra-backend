const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const path = require("path");

// Load environment variables from the root directory
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const prisma = new PrismaClient();

async function main() {
  // Create sample users
  const hashedPassword = await bcrypt.hash("winterfell", 10);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: "exceedrasolutions@gmail.com" },
    update: {},
    create: {
      email: "exceedrasolutions@gmail.com",
      name: "Admin User",
      phone: "+923096901928",
      role: "ADMIN",
      password: hashedPassword,
    },
  });

  // Create claim team member
  const claimTeam = await prisma.user.upsert({
    where: { email: "claims@company.com" },
    update: {},
    create: {
      email: "claims@company.com",
      name: "Claims Team Lead",
      phone: "+1234567891",
      role: "CLAIM_TEAM",
      password: hashedPassword,
    },
  });

  // Create cleaner
  const cleaner = await prisma.user.upsert({
    where: { email: "cleaner@company.com" },
    update: {},
    create: {
      email: "cleaner@company.com",
      name: "John Cleaner",
      phone: "+1234567892",
      role: "CLEANER",
      password: hashedPassword,
    },
  });

  console.log("Seed data created successfully!");
  console.log("Users created:", { admin, claimTeam, cleaner });
  console.log("\nDefault login credentials:");
  console.log("Admin: mshoaibkhansumbal@gmail.com / password123");
  console.log("Claims Team: claims@company.com / password123");
  console.log("Cleaner: cleaner@company.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
