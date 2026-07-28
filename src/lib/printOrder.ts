import { OrderData, OrgSettings } from "@/types";

// ── helpers ────────────────────────────────────────────────────────────────────

function esc(s: string | null | undefined) {
  return (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function logoHtml(url: string | null | undefined) {
  if (!url) return "";
  return `<img src="${esc(url)}" alt="logo"
    style="max-height:60px;max-width:160px;object-fit:contain;display:block;margin:0 auto 4px;" />`;
}

/** Receipt number: DDMM-SERIAL  e.g. 2807-A3F9 */
function receiptNo(orderId: string, createdAt: string) {
  const d = new Date(createdAt);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const serial = orderId.slice(-4).toUpperCase();
  return `${dd}${mm}-${serial}`;
}

// ── single order receipt ───────────────────────────────────────────────────────

export function printOrder(order: OrderData, org?: Partial<OrgSettings> | null) {
  const hotelName  = org?.name ?? "My Hotel";
  const tagline    = org?.tagline ?? "";
  const footer     = org?.footerText ?? "Thank you for your order!";
  const gst        = org?.gstNumber ?? "";
  const fssai      = org?.fssaiNumber ?? "";
  const orgAddress = org?.address ?? "";
  const orgPhone   = org?.phone ?? "";
  const orgEmail   = org?.email ?? "";

  const time = new Date(order.createdAt).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });

  const itemRows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:3px 0;font-size:13px;">${esc(item.name)}</td>
        <td style="padding:3px 0;text-align:center;font-size:13px;">x${item.quantity}</td>
        <td style="padding:3px 0;text-align:right;font-size:13px;">&#8377;${(item.price * item.quantity).toFixed(0)}</td>
      </tr>`
    )
    .join("");

  const businessMeta = [
    gst    ? `<div>GST: ${esc(gst)}</div>`     : "",
    fssai  ? `<div>FSSAI: ${esc(fssai)}</div>` : "",
    orgAddress ? `<div>${esc(orgAddress)}</div>` : "",
    orgPhone   ? `<div>Tel: ${esc(orgPhone)}</div>` : "",
    orgEmail   ? `<div>${esc(orgEmail)}</div>` : "",
  ].filter(Boolean).join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Receipt ${receiptNo(order.id, order.createdAt)}</title>
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
    .divider { border:none; border-top:1px dashed #555; margin:6px 0; }
    table { width:100%; border-collapse:collapse; }
    .total-row td {
      font-weight: bold; font-size: 14px;
      padding-top: 4px; border-top: 1px solid #111;
    }
    .meta { font-size:11px; color:#555; text-align:center; }
    @media print {
      body { margin:0; }
      @page { margin:4mm; size:80mm auto; }
    }
  </style>
</head>
<body>
  ${logoHtml(org?.logoUrl)}
  <div class="center bold" style="font-size:16px;letter-spacing:1px;">${esc(hotelName).toUpperCase()}</div>
  ${tagline ? `<div class="center" style="font-size:11px;color:#555;margin-top:1px;">${esc(tagline)}</div>` : ""}
  ${businessMeta ? `<div class="meta" style="margin-top:3px;">${businessMeta}</div>` : ""}
  <hr class="divider"/>

  <div style="display:flex;justify-content:space-between;">
    <span class="bold">Rcpt# ${receiptNo(order.id, order.createdAt)}</span>
    <span>${order.type === "TABLE" ? `Table: ${esc(order.table?.name ?? "?")}` : "Parcel / Takeaway"}</span>
  </div>
  <div style="font-size:12px;color:#444;margin-top:2px;">${time}</div>
  <hr class="divider"/>

  <div><span class="bold">Customer:</span> ${esc(order.customerName)}</div>
  ${order.phone ? `<div><span class="bold">Phone:</span> ${esc(order.phone)}</div>` : ""}
  ${order.deliveryAddress ? `<div style="font-size:12px;margin-top:2px;"><span class="bold">Address:</span> ${esc(order.deliveryAddress)}</div>` : ""}
  ${order.notes ? `<div style="margin-top:4px;font-size:12px;font-style:italic;">Note: ${esc(order.notes)}</div>` : ""}
  <hr class="divider"/>

  <table>
    <thead>
      <tr>
        <th style="text-align:left;font-size:12px;padding-bottom:3px;">Item</th>
        <th style="text-align:center;font-size:12px;">Qty</th>
        <th style="text-align:right;font-size:12px;">Amt</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
    <tfoot>
      <tr class="total-row">
        <td colspan="2">TOTAL</td>
        <td style="text-align:right;">&#8377;${order.total.toFixed(0)}</td>
      </tr>
    </tfoot>
  </table>

  <hr class="divider"/>
  <div class="center" style="font-size:11px;margin-top:4px;">${esc(footer)}</div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=400,height=650");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 300);
}

// ── all orders day report ─────────────────────────────────────────────────────

export function printAllOrders(
  orders: OrderData[],
  org?: Partial<OrgSettings> | null,
  date?: string
) {
  const hotelName  = org?.name ?? "My Hotel";
  const tagline    = org?.tagline ?? "";
  const footer     = org?.footerText ?? "";
  const gst        = org?.gstNumber ? `GST: ${org.gstNumber}` : "";
  const fssai      = org?.fssaiNumber ? `FSSAI: ${org.fssaiNumber}` : "";
  const label      = date ?? new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const total      = orders.reduce((s, o) => s + o.total, 0);

  const subheader  = [gst, fssai, org?.address, org?.phone, org?.email].filter(Boolean).join("  ·  ");

  const orderRows = orders
    .map(
      (o) => `
      <tr>
        <td style="padding:4px 6px;font-size:12px;border-bottom:1px solid #eee;">${receiptNo(o.id, o.createdAt)}</td>
        <td style="padding:4px 6px;font-size:12px;border-bottom:1px solid #eee;">${esc(o.customerName)}</td>
        <td style="padding:4px 6px;font-size:12px;border-bottom:1px solid #eee;">${esc(o.phone ?? "—")}</td>
        <td style="padding:4px 6px;font-size:12px;border-bottom:1px solid #eee;">${o.type === "TABLE" ? esc(o.table?.name ?? "Table") : "Parcel"}</td>
        <td style="padding:4px 6px;font-size:12px;border-bottom:1px solid #eee;">${o.items.map((i) => `${esc(i.name)}×${i.quantity}`).join(", ")}</td>
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
  <title>Orders — ${esc(label)}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
    .header { display:flex; align-items:center; gap:16px; margin-bottom:4px; }
    .header img { max-height:60px; max-width:120px; object-fit:contain; }
    h1 { font-size:20px; margin:0; }
    .tagline { font-size:13px; color:#777; margin:2px 0 0; }
    .subheader { font-size:12px; color:#555; margin-bottom:14px; }
    table { width:100%; border-collapse:collapse; }
    th { background:#1e293b; color:white; padding:6px 8px; font-size:12px; text-align:left; }
    tr:nth-child(even) td { background:#f8fafc; }
    .summary { margin-top:16px; font-weight:bold; font-size:14px; }
    .footer { margin-top:20px; font-size:12px; color:#888; text-align:center; }
    @media print { @page { margin:15mm; } }
  </style>
</head>
<body>
  <div class="header">
    ${org?.logoUrl ? `<img src="${esc(org.logoUrl)}" alt="logo"/>` : ""}
    <div>
      <h1>${esc(hotelName)}</h1>
      ${tagline ? `<div class="tagline">${esc(tagline)}</div>` : ""}
    </div>
  </div>
  ${subheader ? `<div class="subheader">${esc(subheader)}</div>` : ""}
  <p style="font-size:13px;color:#555;margin-bottom:16px;">
    <strong>${esc(label)}</strong> &nbsp;·&nbsp; ${orders.length} orders &nbsp;·&nbsp; Total: &#8377;${total.toFixed(0)}
  </p>
  <table>
    <thead>
      <tr>
        <th>Order #</th><th>Customer</th><th>Phone</th><th>Table</th><th>Items</th><th>Amount</th><th>Status</th><th>Time</th>
      </tr>
    </thead>
    <tbody>${orderRows}</tbody>
  </table>
  <div class="summary">Grand Total: &#8377;${total.toFixed(0)}</div>
  ${footer ? `<div class="footer">${esc(footer)}</div>` : ""}
</body>
</html>`;

  const win = window.open("", "_blank", "width=1000,height=700");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 400);
}
