export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MenuPage from "@/components/MenuPage";

interface Props {
  params: Promise<{ tableId: string }>;
}

export default async function TableMenuPage({ params }: Props) {
  const { tableId } = await params;

  const [table, menuItems] = await Promise.all([
    prisma.table.findUnique({ where: { qrToken: tableId } }),
    prisma.menuItem.findMany({
      where: { available: true },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    }),
  ]);

  if (!table || !table.active) notFound();

  return (
    <MenuPage
      menuItems={menuItems}
      tableToken={table.qrToken}
      tableName={table.name}
    />
  );
}
