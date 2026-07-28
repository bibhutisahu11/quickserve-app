export type OrderType = "TABLE" | "PARCEL";
export type OrderStatus = "PENDING" | "PREPARING" | "READY" | "DONE" | "CANCELLED";
export type UserRole = "SUPER_ADMIN" | "HOTEL_ADMIN" | "MANAGER" | "WAITER" | "KITCHEN";

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

export interface StaffMember {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: string;
}

export interface OrgData {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  active: boolean;
  createdAt: string;
}
