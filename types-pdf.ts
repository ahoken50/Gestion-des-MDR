export interface SelectedItem {
  id: string;
  name: string;
  quantity: number;
  location: string;
  replaceBin?: boolean;
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
  contactAddress?: string;
  notes?: string;
  groupedItems: GroupedItemsByLocation;
  totalItems: number;
  totalLocations: number;
  locationComments?: Record<string, string>; // Commentaires par lieu
}

export interface PDFGenerationOptions {
  includeHeader: boolean;
  includeContactInfo: boolean;
  includeNotes: boolean;
  pageSize?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
}