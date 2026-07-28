import { OrderData } from "@/types";

export function printOrder(order: OrderData, hotelName = "My Hotel") {
  const time = new Date(order.createdAt).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const itemRows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:3px 0;font-size:13px;">${item.name}</td>
        <td style="padding:3px 0;text-align:center;font-size:13px;">x${item.quantity}</td>
        <td style="padding:3px 0;text-align:right;font-size:13px;">&#8377;${(item.price * item.quantity).toFixed(0)}</td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Order #${order.id.slice(-6).toUpperCase()}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      width: 80mm;
      padding: 8px 10px;
      color: #111;
      font-size: 13px;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .divider {
      border: none;
      border-top: 1px dashed #555;
      margin: 6px 0;
    }
    table { width: 100%; border-collapse: collapse; }
    .total-row td {
      font-weight: bold;
      font-size: 14px;
      padding-top: 4px;
      border-top: 1px solid #111;
    }
    @media print {
      body { margin: 0; }
      @page { margin: 4mm; size: 80mm auto; }
    }
  </style>
</head>
<body>
  <div class="center bold" style="font-size:16px;letter-spacing:1px;">${hotelName.toUpperCase()}</div>
  <div class="center" style="font-size:11px;color:#555;margin-top:2px;">Order Receipt</div>
  <hr class="divider"/>

  <div style="display:flex;justify-content:space-between;">
    <span class="bold">#${order.id.slice(-6).toUpperCase()}</span>
    <span>${order.type === "TABLE" ? `Table: ${order.table?.name ?? "?"}` : "Parcel / Takeaway"}</span>
  </div>
  <div style="font-size:12px;color:#444;margin-top:2px;">${time}</div>
  <hr class="divider"/>

  <div><span class="bold">Customer:</span> ${order.customerName}</div>
  ${order.phone ? `<div><span class="bold">Phone:</span> ${order.phone}</div>` : ""}
  ${order.notes ? `<div style="margin-top:4px;font-size:12px;font-style:italic;">Note: ${order.notes}</div>` : ""}
  <hr class="divider"/>

  <table>
    <thead>
      <tr>
        <th style="text-align:left;font-size:12px;padding-bottom:3px;">Item</th>
        <th style="text-align:center;font-size:12px;">Qty</th>
        <th style="text-align:right;font-size:12px;">Amt</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td colspan="2">TOTAL</td>
        <td style="text-align:right;">&#8377;${order.total.toFixed(0)}</td>
      </tr>
    </tfoot>
  </table>

  <hr class="divider"/>
  <div class="center" style="font-size:11px;margin-top:4px;color:#555;">Thank you for your order!</div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=400,height=600");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 300);
}

export function printAllOrders(orders: OrderData[], hotelName = "My Hotel", date?: string) {
  const label = date ?? new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const total = orders.reduce((s, o) => s + o.total, 0);

  const orderRows = orders
    .map(
      (o) => `
      <tr>
        <td style="padding:4px 6px;font-size:12px;border-bottom:1px solid #eee;">#${o.id.slice(-6).toUpperCase()}</td>
        <td style="padding:4px 6px;font-size:12px;border-bottom:1px solid #eee;">${o.customerName}</td>
        <td style="padding:4px 6px;font-size:12px;border-bottom:1px solid #eee;">${o.type === "TABLE" ? o.table?.name ?? "Table" : "Parcel"}</td>
        <td style="padding:4px 6px;font-size:12px;border-bottom:1px solid #eee;">${o.items.map((i) => `${i.name}×${i.quantity}`).join(", ")}</td>
        <td style="padding:4px 6px;font-size:12px;border-bottom:1px solid #eee;text-align:right;">&#8377;${o.total.toFixed(0)}</td>
        <td style="padding:4px 6px;font-size:12px;border-bottom:1px solid #eee;">${o.status}</td>
        <td style="padding:4px 6px;font-size:12px;border-bottom:1px solid #eee;">${new Date(o.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}</td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Orders — ${label}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    p { font-size: 13px; color: #555; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #1e293b; color: white; padding: 6px 8px; font-size: 12px; text-align: left; }
    tr:nth-child(even) td { background: #f8fafc; }
    .summary { margin-top: 16px; font-weight: bold; font-size: 14px; }
    @media print { @page { margin: 15mm; } }
  </style>
</head>
<body>
  <h1>${hotelName} — Orders Report</h1>
  <p>${label} &nbsp;·&nbsp; ${orders.length} orders &nbsp;·&nbsp; Total: &#8377;${total.toFixed(0)}</p>
  <table>
    <thead>
      <tr>
        <th>Order #</th><th>Customer</th><th>Table</th><th>Items</th><th>Amount</th><th>Status</th><th>Time</th>
      </tr>
    </thead>
    <tbody>${orderRows}</tbody>
  </table>
  <div class="summary">Grand Total: &#8377;${total.toFixed(0)}</div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 400);
}
