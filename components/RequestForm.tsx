import React, { useState, useMemo } from 'react';
import type { InventoryItem, RequestedItem, PickupRequest } from '../types';
import { LOCATIONS, SPECIAL_ITEMS_BY_LOCATION } from '../constants';
import { PlusIcon, TrashIcon } from './icons';

interface RequestFormProps {
    inventory: InventoryItem[];
    onSubmit: (request: Omit<PickupRequest, 'id' | 'status'>) => void;
}

// FIX: Provide implementation for RequestForm component.
const RequestForm: React.FC<RequestFormProps> = ({ inventory, onSubmit }) => {
    const [location, setLocation] = useState(LOCATIONS[0]);
    const [contactName, setContactName] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [requestedItems, setRequestedItems] = useState<RequestedItem[]>([]);

    const availableItems = useMemo(() => {
        const inventoryForLocation = inventory.filter(item => item.location === location && item.quantity > 0);
        const specialItemsForLocation = SPECIAL_ITEMS_BY_LOCATION[location] || [];
        return [...inventoryForLocation.map(i => i.name), ...specialItemsForLocation];
    }, [location, inventory]);

    const handleAddItem = () => {
        if (availableItems.length > 0) {
            const firstItemName = availableItems[0];
            // Avoid adding duplicates
            if (!requestedItems.some(item => item.name === firstItemName)) {
                setRequestedItems([...requestedItems, { name: firstItemName, quantity: 1 }]);
            }
        }
    };

    const handleRemoveItem = (index: number) => {
        setRequestedItems(requestedItems.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, field: 'name' | 'quantity', value: string | number) => {
        const newItems = [...requestedItems];
        if (field === 'name' && typeof value === 'string') {
            // Check if the new item name already exists in the request
            if (newItems.some((item, i) => i !== index && item.name === value)) {
                alert("Ce contenant est déjà dans la demande.");
                return;
            }
            newItems[index].name = value;
        } else if (field === 'quantity' && typeof value === 'number') {
            const inventoryItem = inventory.find(i => i.name === newItems[index].name && i.location === location);
            const maxQuantity = inventoryItem ? inventoryItem.quantity : Infinity; // Special items have no quantity limit
            newItems[index].quantity = Math.max(1, Math.min(value, maxQuantity));
        }
        setRequestedItems(newItems);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (requestedItems.length === 0 || !contactName.trim() || !contactPhone.trim()) {
            alert("Veuillez remplir tous les champs obligatoires et ajouter au moins un contenant.");
            return;
        }

        onSubmit({
            location,
            items: requestedItems,
            date: new Date().toISOString(),
            contactName,
            contactPhone,
            notes,
        });

        // Reset form
        setLocation(LOCATIONS[0]);
        setContactName('');
        setContactPhone('');
        setNotes('');
        setRequestedItems([]);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg space-y-6">
            <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Créer une nouvelle demande de cueillette</h2>

            <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">Lieu de cueillette</label>
                <select id="location" value={location} onChange={e => setLocation(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2">
                    {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="contactName" className="block text-sm font-medium text-gray-700">Nom du contact *</label>
                    <input type="text" id="contactName" value={contactName} onChange={e => setContactName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2" required />
                </div>
                 <div>
                    <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">Téléphone *</label>
                    <input type="tel" id="contactPhone" value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2" required />
                </div>
            </div>

            <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Contenants à ramasser</h3>
                {requestedItems.map((item, index) => {
                    const inventoryItem = inventory.find(i => i.name === item.name && i.location === location);
                    const maxQuantity = inventoryItem ? inventoryItem.quantity : undefined;

                    return (
                        <div key={index} className="flex items-center gap-4 mb-2 p-2 bg-gray-50 rounded-md">
                           <select
                                value={item.name}
                                onChange={e => handleItemChange(index, 'name', e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 flex-grow"
                            >
                                {availableItems.map(name => <option key={name} value={name}>{name}</option>)}
                            </select>
                           <input
                                type="number"
                                value={item.quantity}
                                onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value, 10) || 1)}
                                min="1"
                                max={maxQuantity}
                                className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                                required
                            />
                            {inventoryItem && <span className="text-sm text-gray-500">(Max: {maxQuantity})</span>}
                            <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-600 hover:text-red-800 transition-colors">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    );
                })}
                <button type="button" onClick={handleAddItem} className="mt-2 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 flex items-center gap-2 text-sm">
                    <PlusIcon className="w-4 h-4" /> Ajouter un contenant
                </button>
            </div>
            
            <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes (optionnel)</label>
                <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"></textarea>
            </div>

            <div className="text-right">
                <button type="submit" className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                    Soumettre la demande
                </button>
            </div>
        </form>
    );
};

export default RequestForm;
