import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "admin@demo.test";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Demo admin already exists (${email}), skipping seed.`);
    return;
  }

  const passwordHash = await bcrypt.hash("password123", 12);

  const organization = await prisma.organization.create({
    data: { name: "Demo Property Management", slug: "demo-property-management" },
  });

  const user = await prisma.user.create({
    data: { name: "Demo Admin", email, passwordHash },
  });

  await prisma.orgMembership.create({
    data: { userId: user.id, organizationId: organization.id, role: "ORG_ADMIN" },
  });

  console.log(`Seeded demo org admin: ${email} / password123 (org: ${organization.name})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
