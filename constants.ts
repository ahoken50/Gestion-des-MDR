import type { InventoryItem } from './types';

export const LOCATIONS = [
  "2200 Jean-Jacques Cossette",
  "1200 6e rue",
  "1199 rue de l'Escale",
  "Forêt Récréative",
];

// Adresses complètes pour chaque lieu (utilisées dans les PDFs)
export const LOCATION_ADDRESSES: Record<string, { street: string; city: string; postalCode: string; fullAddress: string }> = {
  "2200 Jean-Jacques Cossette": {
    street: "2200 Jean-Jacques Cossette",
    city: "Saguenay, QC",
    postalCode: "G7S 3H1",
    fullAddress: "2200 Jean-Jacques Cossette, Saguenay, QC G7S 3H1"
  },
  "1200 6e rue": {
    street: "1200 6e rue",
    city: "Saguenay, QC",
    postalCode: "G7B 2Z7",
    fullAddress: "1200 6e rue, Saguenay, QC G7B 2Z7"
  },
  "1199 rue de l'Escale": {
    street: "1199 rue de l'Escale",
    city: "Saguenay, QC",
    postalCode: "G7H 7Y1",
    fullAddress: "1199 rue de l'Escale, Saguenay, QC G7H 7Y1"
  },
  "Forêt Récréative": {
    street: "Forêt Récréative",
    city: "Saguenay, QC",
    postalCode: "",
    fullAddress: "Forêt Récréative, Saguenay, QC"
  }
};

export const INITIAL_INVENTORY: InventoryItem[] = [
  // 2200 Jean-Jacques Cossette
  { id: '1', name: 'Bac contenant Urée vide', quantity: 2, location: LOCATIONS[0] },

  // 1200 6e rue
  { id: '3', name: 'Bac solides huileux', quantity: 2, location: LOCATIONS[1] },
  { id: '4', name: "Bac d'aérosols", quantity: 1, location: LOCATIONS[1] },
  { id: '5', name: "Baril d'essence huileuse", quantity: 1, location: LOCATIONS[1] },
  { id: '6', name: "Baril d'huile usée", quantity: 1, location: LOCATIONS[1] },
  { id: '7', name: 'Bacs de contenants de plastique vides', quantity: 3, location: LOCATIONS[1] },
  { id: '8', name: 'Barils de gallons de peinture', quantity: 2, location: LOCATIONS[1] },

  // 1199 rue de l'Escale
  { id: '9', name: 'Bac Solide Huileux', quantity: 2, location: LOCATIONS[2] },
  { id: '10', name: 'Bac Contenants de plastique vide', quantity: 1, location: LOCATIONS[2] },
  { id: '11', name: 'Bac canettes Aérosol', quantity: 1, location: LOCATIONS[2] },
  { id: '12', name: 'Bac contenant Urée vide', quantity: 1, location: LOCATIONS[2] },
  { id: '13', name: 'Baril Gallon de peinture', quantity: 1, location: LOCATIONS[2] },
  { id: '14', name: 'Baril contenants acétones et Gaz mixte', quantity: 1, location: LOCATIONS[2] },
];

// Special items that can be added to pickup requests without being in the inventory of empty containers.
// They are specific to a location.
export const SPECIAL_ITEMS_BY_LOCATION: Record<string, string[]> = {
  [LOCATIONS[0]]: [
    "Baril colasse Plein",
    "Baril colasse Vide",
    "Baril fuel contaminé plein"
  ],
};