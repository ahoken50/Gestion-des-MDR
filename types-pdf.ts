export interface SelectedItem {
  id: string;
  name: string;
  quantity: number;
  location: string;
}

export interface GroupedItemsByLocation {
  [location: string]: LocationData;
}

export interface LocationData {
  items: SelectedItem[];
  comments?: string; // Commentaires spécifiques à ce lieu
}

export interface PickupRequestPDF {
  id: string;
  bcNumber?: string; // Numéro de bon de commande
  date: string;
  contactName: string;
  contactPhone: string;
  notes?: string;
  groupedItems: GroupedItemsByLocation;
  totalItems: number;
  totalLocations: number;
}

export interface PDFGenerationOptions {
  includeHeader: boolean;
  includeContactInfo: boolean;
  includeNotes: boolean;
  pageSize?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
}