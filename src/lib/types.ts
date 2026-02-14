
export type OrderStatus = 'Pending' | 'Preparing' | 'Ready' | 'Served';

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  image: string;
  description: string;
  available: boolean;
}

export interface OrderItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  specialRequests?: string;
}

export interface Order {
  id: string;
  tableId: string;
  customerId: string;
  items: OrderItem[];
  totalPrice: number;
  status: OrderStatus;
  timestamp: any;
  summary?: string;
}

export interface Table {
  id: string;
  name: string;
}
