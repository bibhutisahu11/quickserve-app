import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const rawUrl = process.env.DATABASE_URL!;
const connectionString = rawUrl.replace(/[&?]channel_binding=[^&]*/g, "");
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create admin
  const existing = await prisma.admin.findUnique({ where: { email: "admin@hotel.com" } });
  if (!existing) {
    const passwordHash = await bcrypt.hash("admin123", 12);
    await prisma.admin.create({
      data: { email: "admin@hotel.com", passwordHash, name: "Hotel Admin" },
    });
    console.log("Admin created: admin@hotel.com / admin123");
  }

  // Create tables
  const tableNames = ["Table 1", "Table 2", "Table 3", "Table 4", "VIP Room"];
  for (const name of tableNames) {
    const exists = await prisma.table.findFirst({ where: { name } });
    if (!exists) {
      await prisma.table.create({ data: { name, capacity: name === "VIP Room" ? 8 : 4 } });
    }
  }
  console.log("Tables created");

  // Create menu items
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
    const exists = await prisma.menuItem.findFirst({ where: { name: item.name } });
    if (!exists) {
      await prisma.menuItem.create({ data: { ...item, sortOrder: i } });
    }
  }
  console.log("Menu items created");

  console.log("Seeding complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
