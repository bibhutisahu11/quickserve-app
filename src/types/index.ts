export type OrderType = "TABLE" | "PARCEL";
export type OrderStatus = "PENDING" | "PREPARING" | "READY" | "DONE" | "CANCELLED";

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface MenuItemData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  imageUrl: string | null;
  available: boolean;
  sortOrder: number;
}

export interface TableData {
  id: string;
  name: string;
  qrToken: string;
  capacity: number;
  active: boolean;
}

export interface OrderItemData {
  id: string;
  name: string;
  price: number;
  quantity: number;
  menuItemId: string;
}

export interface OrderData {
  id: string;
  type: OrderType;
  tableId: string | null;
  table: TableData | null;
  customerName: string;
  phone: string | null;
  notes: string | null;
  status: OrderStatus;
  total: number;
  paymentId: string | null;
  items: OrderItemData[];
  createdAt: string;
  updatedAt: string;
}
