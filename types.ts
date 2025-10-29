export interface InventoryItem {
  id: string;
  name: string;
  quantity: number; // Quantity of empty containers
  location: string;
}

export interface RequestedItem {
  name: string;
  quantity: number;
}

export interface PickupRequest {
  id: string;
  location: string;
  items: RequestedItem[];
  date: string; // ISO date string
  status: 'pending' | 'completed';
  contactName: string;
  contactPhone: string;
  notes?: string;
}
