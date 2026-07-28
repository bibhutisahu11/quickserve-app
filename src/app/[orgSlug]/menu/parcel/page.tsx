export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MenuPage from "@/components/MenuPage";

interface Props {
  params: Promise<{ orgSlug: string }>;
}

export default async function ParcelMenuPage({ params }: Props) {
  const { orgSlug } = await params;

  const org = await prisma.organization.findUnique({ where: { slug: orgSlug } });
  if (!org || !org.active) notFound();

  const menuItems = await prisma.menuItem.findMany({
    where: { available: true, orgId: org.id },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });

  return <MenuPage menuItems={menuItems} orgSlug={orgSlug} />;
}
