import type { InventoryItem } from './types';

export const LOCATIONS = [
  "2200 Jean-Jacques Cossette",
  "1200 6e rue",
  "1199 rue de l'Escale",
  "Forêt Récréative",
];

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