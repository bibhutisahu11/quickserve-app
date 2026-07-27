import { OrderData } from "@/types";

export function exportOrdersToCsv(orders: OrderData[]) {
  const rows: string[][] = [];

  // Header row — matches common billing software import format
  rows.push([
    "Date",
    "Time",
    "Order ID",
    "Order Type",
    "Table",
    "Customer Name",
    "Phone",
    "Items",
    "Quantities",
    "Item Prices",
    "Total (₹)",
    "Payment ID",
    "Status",
    "Notes",
  ]);

  for (const order of orders) {
    const date = new Date(order.createdAt);
    const itemNames = order.items.map((i) => i.name).join(" | ");
    const itemQtys = order.items.map((i) => i.quantity).join(" | ");
    const itemPrices = order.items.map((i) => `₹${i.price}`).join(" | ");

    rows.push([
      date.toLocaleDateString("en-IN"),
      date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      order.id.slice(-8).toUpperCase(),
      order.type,
      order.table?.name ?? "Parcel",
      order.customerName,
      order.phone ?? "",
      itemNames,
      itemQtys,
      itemPrices,
      order.total.toFixed(2),
      order.paymentId ?? "",
      order.status,
      order.notes ?? "",
    ]);
  }

  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const today = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `hotel-orders-${today}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
