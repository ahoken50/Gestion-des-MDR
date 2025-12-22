import React, { useState, useCallback, useRef, memo, useEffect, useMemo } from 'react';
import type { InventoryItem } from '../types';
import { LOCATIONS, INITIAL_INVENTORY } from '../constants';
import { PlusIcon, TrashIcon } from './icons';

interface InventoryManagerProps {
    inventory: InventoryItem[];
    onUpdateInventory: (updatedInventory: InventoryItem[]) => void;
}

const AddItemForm: React.FC<{ onAddItem: (item: Omit<InventoryItem, 'id'>) => void }> = ({ onAddItem }) => {
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState(0);
    const [location, setLocation] = useState(LOCATIONS[0]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && quantity >= 0) {
            onAddItem({ name, quantity, location });
            setName('');
            setQuantity(0);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4 p-4 bg-gray-100 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2">
                <label htmlFor="itemName" className="block text-sm font-medium text-gray-700">Nom du contenant</label>
                <input type="text" id="itemName" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2" required />
            </div>
            <div>
                <label htmlFor="itemQuantity" className="block text-sm font-medium text-gray-700">Quantité</label>
                <input type="number" id="itemQuantity" value={quantity} onChange={e => setQuantity(parseInt(e.target.value, 10))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2" min="0" required />
            </div>
            <div>
                <label htmlFor="itemLocation" className="block text-sm font-medium text-gray-700">Lieu</label>
                <select id="itemLocation" value={location} onChange={e => setLocation(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2">
                    {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
            </div>
            <button type="submit" className="md:col-start-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center gap-2">
                <PlusIcon className="w-5 h-5" /> Ajouter
            </button>
        </form>
    );
};

interface LocationInventorySectionProps {
    location: string;
    items: InventoryItem[];
    onQuantityChange: (id: string, newQuantity: number) => void;
    onDelete: (id: string) => void;
}

// Memoized Location Section Component with Custom Comparator
const LocationInventorySection = memo(({
    location,
    items,
    onQuantityChange,
    onDelete
}: LocationInventorySectionProps) => {
    return (
        <div className="card p-6 slide-up">
            <div className="card-header p-4 -m-6 mb-6">
                <h2 className="text-2xl font-bold gradient-text">📍 {location}</h2>
            </div>
            {items.length > 0 ? (
                <div className="table-container">
                    <table className="table">
                        <thead className="table-header">
                            <tr>
                                <th scope="col" className="table-header-cell">Contenant</th>
                                <th scope="col" className="table-header-cell w-32">Quantité (Vide)</th>
                                <th scope="col" className="table-header-cell w-20 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {items.map(item => (
                                <tr key={item.id} className="table-row">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => onQuantityChange(item.id, parseInt(e.target.value, 10) || 0)}
                                            className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-1"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => onDelete(item.id)} className="text-red-600 hover:text-red-800 transition-colors">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-gray-500 italic">Aucun contenant dans l'inventaire pour ce lieu.</p>
            )}
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison to avoid re-renders when items are structurally equal but different array references
    if (prevProps.location !== nextProps.location) return false;
    // Handlers should be referentially stable, but we check them anyway
    if (prevProps.onQuantityChange !== nextProps.onQuantityChange) return false;
    if (prevProps.onDelete !== nextProps.onDelete) return false;

    // Check items equality
    if (prevProps.items === nextProps.items) return true;
    if (prevProps.items.length !== nextProps.items.length) return false;

    // Check referential equality of each item
    // Since items are objects, and updating one creates a new reference for that one,
    // unchanged items maintain their reference.
    for (let i = 0; i < prevProps.items.length; i++) {
        if (prevProps.items[i] !== nextProps.items[i]) {
            return false;
        }
    }

    return true;
});

LocationInventorySection.displayName = 'LocationInventorySection';

const InventoryManager: React.FC<InventoryManagerProps> = ({ inventory, onUpdateInventory }) => {
    const [showAddForm, setShowAddForm] = useState(false);

    // Keep a ref to inventory to use in stable callbacks without dependency
    const inventoryRef = useRef(inventory);

    // Update ref when inventory changes
    useEffect(() => {
        inventoryRef.current = inventory;
    }, [inventory]);

    // Stable handler for adding items
    const handleAddItem = useCallback((newItem: Omit<InventoryItem, 'id'>) => {
        const currentInventory = inventoryRef.current;
        const itemExists = currentInventory.some(item => item.name.toLowerCase() === newItem.name.toLowerCase() && item.location === newItem.location);
        if (itemExists) {
            alert("Ce type de contenant existe déjà pour ce lieu.");
            return;
        }
        const newInventoryItem: InventoryItem = { ...newItem, id: Date.now().toString() };

        onUpdateInventory([...currentInventory, newInventoryItem]);
        setShowAddForm(false);
    }, [onUpdateInventory]);

    // Stable handler for deleting items
    const handleDeleteItem = useCallback((id: string) => {
        const currentInventory = inventoryRef.current;
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce type de contenant?")) {
            onUpdateInventory(currentInventory.filter(item => item.id !== id));
        }
    }, [onUpdateInventory]);

    // Stable handler for quantity changes - this is the high frequency one!
    const handleQuantityChange = useCallback((id: string, newQuantity: number) => {
        const currentInventory = inventoryRef.current;
        onUpdateInventory(currentInventory.map(item => item.id === id ? { ...item, quantity: Math.max(0, newQuantity) } : item));
    }, [onUpdateInventory]);

    // ⚡ BOLT OPTIMIZATION: Smart Memoization
    // We use a ref to store the previous result and only create new object references
    // if the actual content has changed. This allows LocationInventorySection's
    // custom comparator to return true (fast path) more often.
    const prevInventoryByLocationRef = useRef<{ location: string; items: InventoryItem[] }[]>([]);

    const inventoryByLocation = useMemo(() => {
        const prev = prevInventoryByLocationRef.current;
        const newGroups: Record<string, InventoryItem[]> = {};

        // Single pass O(N) grouping instead of N * Locations
        inventory.forEach(item => {
            if (!newGroups[item.location]) {
                newGroups[item.location] = [];
            }
            newGroups[item.location].push(item);
        });

        const next = LOCATIONS.map((location, index) => {
            const newItems = newGroups[location] || [];
            const prevGroup = prev[index];

            // Check if we can reuse the previous group object
            // We compare length first, then referential equality of items
            if (prevGroup && prevGroup.location === location && prevGroup.items.length === newItems.length) {
                let isSame = true;
                for (let i = 0; i < newItems.length; i++) {
                    if (newItems[i] !== prevGroup.items[i]) {
                        isSame = false;
                        break;
                    }
                }
                if (isSame) {
                    return prevGroup; // Reuse the old object reference!
                }
            }

            return {
                location,
                items: newItems,
            };
        });

        prevInventoryByLocationRef.current = next;
        return next;
    }, [inventory]);

    return (
        <div className="space-y-8">
            {inventoryByLocation.map(({ location, items }) => (
                <LocationInventorySection
                    key={location}
                    location={location}
                    items={items}
                    onQuantityChange={handleQuantityChange}
                    onDelete={handleDeleteItem}
                />
            ))}
            <div className="mt-6 bg-white p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Gérer les types de contenants</h2>
                    <button
                        onClick={() => {
                            if (window.confirm("Êtes-vous sûr de vouloir réinitialiser l'inventaire avec les valeurs par défaut ? Cela effacera les modifications actuelles.")) {
                                onUpdateInventory(INITIAL_INVENTORY);
                            }
                        }}
                        className="text-sm text-gray-500 hover:text-red-600 underline"
                    >
                        Réinitialiser l'inventaire par défaut
                    </button>
                </div>
                {!showAddForm && (
                    <button onClick={() => setShowAddForm(true)} className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-2 transition-colors">
                        <PlusIcon className="w-5 h-5" /> Ajouter un type de contenant
                    </button>
                )}
                {showAddForm && <AddItemForm onAddItem={handleAddItem} />}
            </div>
        </div>
    );
};

export default InventoryManager;
