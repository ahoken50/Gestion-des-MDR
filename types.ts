export interface InventoryItem {
  id: string;
  name: string;
  quantity: number; // Quantity of empty containers
  location: string;
}

export interface RequestedItem {
  id?: string;
  name: string;
  quantity: number;
  location?: string;
}

export interface PickupRequest {
  id: string;
  bcNumber?: string; // Numéro de bon de commande
  location: string;
  items: RequestedItem[];
  date: string; // ISO date string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  contactName: string;
  contactPhone: string;
  notes?: string;
  locationComments?: Record<string, string>;
  cost?: number;
  invoiceUrl?: string;
}
