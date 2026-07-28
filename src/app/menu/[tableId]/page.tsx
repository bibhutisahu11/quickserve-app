import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ tableId: string }>;
}

// Legacy redirect → table QR codes now use /{orgSlug}/menu/{tableId}
// Look up the table's org slug and redirect
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function LegacyTableMenuPage({ params }: Props) {
  const { tableId } = await params;

  const table = await prisma.table.findUnique({
    where: { qrToken: tableId },
    include: { org: true },
  });

  if (!table || !table.active) notFound();

  const slug = table.org?.slug ?? "my-hotel";
  redirect(`/${slug}/menu/${tableId}`);
}
