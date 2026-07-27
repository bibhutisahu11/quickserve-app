export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import MenuPage from "@/components/MenuPage";

export default async function ParcelMenuPage() {
  const menuItems = await prisma.menuItem.findMany({
    where: { available: true },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });

  return <MenuPage menuItems={menuItems} />;
}
