import React, { useState, useMemo, useEffect } from 'react';
import { LOCATIONS, SPECIAL_ITEMS_BY_LOCATION } from '../../constants';
import { PlusIcon, TrashIcon } from '../icons';
import type { InventoryItem, RequestedItem } from '../../types';
import { useToast } from '../ui/Toast';

interface SingleRequestFormProps {
    inventory: InventoryItem[];
    onSubmit: (data: { location: string; items: RequestedItem[] }) => void;
}

const SingleRequestForm: React.FC<SingleRequestFormProps> = ({ inventory, onSubmit }) => {
    const { error: toastError } = useToast();
    const [location, setLocation] = useState(LOCATIONS[0]);
    const [requestedItems, setRequestedItems] = useState<RequestedItem[]>([]);

    const availableItems = useMemo(() => {
        const inventoryForLocation = inventory.filter(item => item.location === location && item.quantity > 0);
        const specialItemsForLocation = SPECIAL_ITEMS_BY_LOCATION[location] || [];
        return [...inventoryForLocation.map(i => i.name), ...specialItemsForLocation];
    }, [location, inventory]);

    // Clean up requested items when location changes or inventory updates
    useEffect(() => {
        const validRequestedItems = requestedItems.filter(requestedItem => {
            const inventoryItem = inventory.find(item =>
                item.name === requestedItem.name && item.location === location
            );
            // Keep custom items or items that still exist in inventory
            return !inventoryItem || inventoryItem.quantity >= requestedItem.quantity;
        });

        if (validRequestedItems.length !== requestedItems.length) {
            setRequestedItems(validRequestedItems);
        }
    }, [inventory, location]);

    const handleAddItem = () => {
        if (availableItems.length > 0) {
            const firstItemName = availableItems[0];
            if (!requestedItems.some(item => item.name === firstItemName)) {
                setRequestedItems([...requestedItems, { name: firstItemName, quantity: 1 }]);
            }
        }
    };

    const handleAddCustomItem = () => {
        const customName = prompt('Entrez le nom du contenant personnalisé (ex: Baril de colasse vide):');
        if (customName && customName.trim()) {
            if (!requestedItems.some(item => item.name === customName.trim())) {
                setRequestedItems([...requestedItems, { name: customName.trim(), quantity: 1 }]);
            } else {
                toastError('Ce contenant est déjà dans la demande.');
            }
        }
    };

    const handleRemoveItem = (index: number) => {
        setRequestedItems(requestedItems.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, field: 'name' | 'quantity' | 'replaceBin', value: string | number | boolean) => {
        const newItems = [...requestedItems];
        if (field === 'name' && typeof value === 'string') {
            if (newItems.some((item, i) => i !== index && item.name === value)) {
                toastError("Ce contenant est déjà dans la demande.");
                return;
            }
            newItems[index].name = value;
        } else if (field === 'quantity' && typeof value === 'number') {
            const inventoryItem = inventory.find(i => i.name === newItems[index].name && i.location === location);
            const maxQuantity = inventoryItem ? inventoryItem.quantity : Infinity;
            newItems[index].quantity = Math.max(1, Math.min(value, maxQuantity));
        } else if (field === 'replaceBin' && typeof value === 'boolean') {
            newItems[index].replaceBin = value;
        }
        setRequestedItems(newItems);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (requestedItems.length === 0) {
            toastError("Veuillez ajouter au moins un contenant.");
            return;
        }
        onSubmit({ location, items: requestedItems });
        setRequestedItems([]);
        setLocation(LOCATIONS[0]);
    };

    return (
        <form onSubmit={handleSubmit} className="card p-6 space-y-6 slide-up dark:bg-gray-800 dark:border-gray-700">
            <div className="card-header p-4 -m-6 mb-6 dark:border-gray-700">
                <h3 className="text-xl font-bold gradient-text">📦 Détails de la demande</h3>
                <p className="text-sm text-gray-600 mt-1 dark:text-gray-400">Sélectionnez le lieu et les contenants à ramasser</p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded dark:bg-blue-900/20 dark:border-blue-500">
                <label htmlFor="location" className="block text-sm font-semibold text-blue-900 mb-2 dark:text-blue-100">📍 Lieu de cueillette</label>
                <select
                    id="location"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="block w-full rounded-lg border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base p-3 bg-white font-medium dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                    {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
            </div>

            <div className="border-t pt-6 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">📦 Contenants à ramasser</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Ajoutez les contenants de l'inventaire ou créez-en manuellement</p>
                    </div>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold dark:bg-blue-900 dark:text-blue-100">
                        {requestedItems.length} contenant{requestedItems.length !== 1 ? 's' : ''}
                    </span>
                </div>
                {requestedItems.map((item, index) => {
                    const inventoryItem = inventory.find(i => i.name === item.name && i.location === location);
                    const maxQuantity = inventoryItem ? inventoryItem.quantity : undefined;

                    return (
                        <div key={index} className="flex items-center gap-4 mb-2 p-2 bg-gray-50 rounded-md dark:bg-gray-700/50">
                            <select
                                value={item.name}
                                onChange={e => handleItemChange(index, 'name', e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 flex-grow dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                aria-label="Type de contenant"
                            >
                                {availableItems.map(name => <option key={name} value={name}>{name}</option>)}
                            </select>
                            <input
                                type="number"
                                value={item.quantity}
                                onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value, 10) || 1)}
                                min="1"
                                max={maxQuantity}
                                className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                required
                                aria-label={`Quantité pour ${item.name}`}
                            />
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id={`replace-${index}`}
                                    checked={item.replaceBin || false}
                                    onChange={e => handleItemChange(index, 'replaceBin', e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                    aria-label={`Remplacer ${item.name}`}
                                />
                                <label htmlFor={`replace-${index}`} className="text-sm text-gray-700 dark:text-gray-300 select-none">
                                    Remplacer
                                </label>
                            </div>
                            {inventoryItem && <span className="text-sm text-gray-500 dark:text-gray-400">(Max: {maxQuantity})</span>}
                            <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="text-red-600 hover:text-red-800 transition-colors dark:text-red-400 dark:hover:text-red-300"
                                aria-label={`Supprimer ${item.name}`}
                            >
                                <TrashIcon className="w-5 h-5" aria-hidden="true" />
                            </button>
                        </div>
                    );
                })}
                <div className="mt-2 flex gap-2">
                    <button type="button" onClick={handleAddItem} className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 flex items-center justify-center gap-2 text-sm dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                        <PlusIcon className="w-4 h-4" /> Ajouter de l'inventaire
                    </button>
                    <button type="button" onClick={handleAddCustomItem} className="flex-1 bg-blue-100 text-blue-800 py-2 px-4 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 flex items-center justify-center gap-2 text-sm font-medium dark:bg-blue-900 dark:text-blue-100 dark:hover:bg-blue-800">
                        ✏️ Ajouter manuellement
                    </button>
                </div>
            </div>

            <div className="text-right">
                <button type="submit" className="btn btn-primary py-3 px-8 text-lg">
                    ✅ Soumettre la demande
                </button>
            </div>
        </form>
    );
};

export default SingleRequestForm;
