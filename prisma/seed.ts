import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const rawUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!;
const connectionString = rawUrl.replace(/[&?]channel_binding=[^&]*/g, "");
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // ── Super Admin ────────────────────────────────────────────────────────────
  const superAdminEmail = "superadmin@platform.com";
  const existingSuper = await prisma.admin.findUnique({ where: { email: superAdminEmail } });
  if (!existingSuper) {
    const passwordHash = await bcrypt.hash("superadmin123", 12);
    await prisma.admin.create({
      data: {
        email: superAdminEmail,
        passwordHash,
        name: "Platform Super Admin",
        role: "SUPER_ADMIN",
        orgId: null,
      },
    });
    console.log("Super admin created: superadmin@platform.com / superadmin123");
  }

  // ── Default Org ───────────────────────────────────────────────────────────
  let org = await prisma.organization.findUnique({ where: { slug: "my-hotel" } });
  if (!org) {
    org = await prisma.organization.create({
      data: { id: "default-org-seed-id-000001", name: "My Hotel", slug: "my-hotel" },
    });
    console.log("Default org created: my-hotel");
  }

  // ── Hotel Admin ───────────────────────────────────────────────────────────
  const adminEmail = "admin@hotel.com";
  const existingAdmin = await prisma.admin.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("admin123", 12);
    await prisma.admin.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: "Hotel Admin",
        role: "HOTEL_ADMIN",
        orgId: org.id,
      },
    });
    console.log("Hotel admin created: admin@hotel.com / admin123");
  } else if (!existingAdmin.orgId) {
    // Backfill orgId for existing admin
    await prisma.admin.update({
      where: { email: adminEmail },
      data: { orgId: org.id, role: "HOTEL_ADMIN" },
    });
    console.log("Backfilled orgId for existing admin");
  }

  // ── Tables ────────────────────────────────────────────────────────────────
  const tableNames = ["Table 1", "Table 2", "Table 3", "Table 4", "VIP Room"];
  for (const name of tableNames) {
    const exists = await prisma.table.findFirst({ where: { name, orgId: org.id } });
    if (!exists) {
      await prisma.table.create({
        data: { name, capacity: name === "VIP Room" ? 8 : 4, orgId: org.id },
      });
    }
  }
  console.log("Tables created");

  // ── Menu Items ────────────────────────────────────────────────────────────
  const menuItems = [
    { name: "Butter Chicken", description: "Creamy tomato-based curry with tender chicken", price: 320, category: "Main Course" },
    { name: "Paneer Tikka Masala", description: "Cottage cheese in spiced tomato gravy", price: 280, category: "Main Course" },
    { name: "Dal Makhani", description: "Slow-cooked black lentils with cream and butter", price: 220, category: "Main Course" },
    { name: "Garlic Naan", description: "Leavened bread with garlic and butter", price: 60, category: "Breads" },
    { name: "Butter Roti", description: "Whole wheat bread with butter", price: 40, category: "Breads" },
    { name: "Steamed Rice", description: "Plain basmati rice", price: 80, category: "Rice" },
    { name: "Biryani (Chicken)", description: "Fragrant rice layered with spiced chicken", price: 380, category: "Rice" },
    { name: "Veg Biryani", description: "Fragrant rice with mixed vegetables and spices", price: 280, category: "Rice" },
    { name: "Mango Lassi", description: "Refreshing yogurt drink with mango", price: 120, category: "Beverages" },
    { name: "Masala Chai", description: "Spiced Indian tea with milk", price: 60, category: "Beverages" },
    { name: "Cold Coffee", description: "Chilled coffee with milk and ice cream", price: 140, category: "Beverages" },
    { name: "Gulab Jamun", description: "Soft milk-solid dumplings in rose-water syrup (2 pcs)", price: 120, category: "Desserts" },
    { name: "Kulfi", description: "Traditional Indian ice cream — pistachio flavour", price: 140, category: "Desserts" },
    { name: "Chicken Tikka", description: "Marinated chicken pieces grilled in tandoor", price: 340, category: "Starters" },
    { name: "Veg Manchurian", description: "Crispy vegetable balls in spicy Indo-Chinese sauce", price: 220, category: "Starters" },
  ];

  for (let i = 0; i < menuItems.length; i++) {
    const item = menuItems[i];
    const exists = await prisma.menuItem.findFirst({ where: { name: item.name, orgId: org.id } });
    if (!exists) {
      await prisma.menuItem.create({ data: { ...item, sortOrder: i, orgId: org.id } });
    }
  }
  console.log("Menu items created");

  console.log("\nSeed complete!");
  console.log("─────────────────────────────────────────");
  console.log("Super Admin:  superadmin@platform.com / superadmin123");
  console.log("Hotel Admin:  admin@hotel.com / admin123");
  console.log("Customer URL: /{your-domain}/my-hotel/menu/parcel");
  console.log("─────────────────────────────────────────");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
