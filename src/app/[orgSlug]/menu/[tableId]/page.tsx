export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MenuPage from "@/components/MenuPage";

interface Props {
  params: Promise<{ orgSlug: string; tableId: string }>;
}

export default async function TableMenuPage({ params }: Props) {
  const { orgSlug, tableId } = await params;

  const org = await prisma.organization.findUnique({ where: { slug: orgSlug } });
  if (!org || !org.active) notFound();

  const [table, menuItems] = await Promise.all([
    prisma.table.findUnique({
      where: { qrToken: tableId, orgId: org.id },
    }),
    prisma.menuItem.findMany({
      where: { orgId: org.id },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    }),
  ]);

  if (!table || !table.active) notFound();

  return (
    <MenuPage
      menuItems={menuItems}
      tableToken={table.qrToken}
      tableName={table.name}
      orgSlug={orgSlug}
      orgName={org.name}
      orgUpiId={org.upiId ?? null}
    />
  );
}
