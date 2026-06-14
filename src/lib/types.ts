export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "served"
  | "cancelled";

export type SessionStatus = "active" | "closed";

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "seated"
  | "cancelled"
  | "no_show";

export interface Restaurant {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  phone: string | null;
  address: string | null;
  currency: string;
  timezone: string;
  ordering_enabled: boolean;
  reservations_enabled: boolean;
  /** Codes d'accès par rôle (URLs /k/<code> et /s/<code>), sans compte patron. */
  kitchen_code: string;
  server_code: string;
  created_at: string;
  updated_at: string;
}

export interface DiningTable {
  id: string;
  restaurant_id: string;
  label: string;
  seats: number;
  /** Identifiant permanent encodé dans le QR imprimé (/q/<qr_uid>). */
  qr_uid: string;
  created_at: string;
}

export interface TableSession {
  id: string;
  restaurant_id: string;
  table_id: string;
  token: string;
  status: SessionStatus;
  expires_at: string;
  created_at: string;
  closed_at: string | null;
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description: string | null;
  /** null = plat sans prix unitaire (menu à formule). */
  price_cents: number | null;
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  restaurant_id: string;
  table_session_id: string | null;
  table_label: string;
  order_number: number;
  status: OrderStatus;
  customer_name: string | null;
  note: string | null;
  total_cents: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  item_name: string;
  unit_price_cents: number;
  quantity: number;
}

export interface Reservation {
  id: string;
  restaurant_id: string;
  customer_name: string;
  phone: string;
  email: string | null;
  party_size: number;
  starts_at: string;
  status: ReservationStatus;
  note: string | null;
  created_at: string;
  updated_at: string;
}

/** Payload renvoyé par le RPC get_session_menu */
export interface SessionMenu {
  restaurant: {
    id: string;
    name: string;
    currency: string;
    ordering_enabled: boolean;
  };
  table_label: string;
  session_expires_at: string;
  categories: {
    id: string;
    name: string;
    items: {
      id: string;
      name: string;
      description: string | null;
      price_cents: number | null;
      image_url: string | null;
    }[];
  }[];
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  preparing: "En préparation",
  ready: "Prête",
  served: "Servie",
  cancelled: "Annulée",
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "served",
];

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  seated: "Installée",
  cancelled: "Annulée",
  no_show: "Non venue",
};
