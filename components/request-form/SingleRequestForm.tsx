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

    const handleAddItemFromInventory = (itemName: string, quantity: number, replaceBin: boolean = false) => {
        const existingIndex = requestedItems.findIndex(item => item.name === itemName);
        if (existingIndex >= 0) {
            const newItems = [...requestedItems];
            if (quantity > 0) {
                newItems[existingIndex].quantity = quantity;
                newItems[existingIndex].replaceBin = replaceBin;
            } else {
                newItems.splice(existingIndex, 1);
            }
            setRequestedItems(newItems);
        } else if (quantity > 0) {
            setRequestedItems([...requestedItems, { name: itemName, quantity, replaceBin }]);
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

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (requestedItems.length === 0) {
            toastError("Veuillez ajouter au moins un contenant.");
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit({ location, items: requestedItems });
            setRequestedItems([]);
            // Keep location consistent for user convenience
        } catch (error) {
            console.error("Error submitting request:", error);
            toastError("Une erreur est survenue lors de la soumission.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="card p-6 space-y-8 slide-up">
            <div className="card-header p-4 -m-6 mb-6">
                <h3 className="text-xl font-bold gradient-text">📦 Détails de la demande</h3>
                <p className="text-sm text-gray-600 mt-1 dark:text-gray-400">Sélectionnez le lieu et les contenants à ramasser</p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-xl dark:bg-blue-900/20 dark:border-blue-500">
                <label htmlFor="location" className="block text-sm font-semibold text-blue-900 mb-2 dark:text-blue-100">📍 Lieu de cueillette</label>
                <select
                    id="location"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="block w-full rounded-xl border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg p-3 bg-white font-medium dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                    {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
            </div>

            {/* Visual Inventory Grid */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <span>📦</span> Sélection Visuelle (Inventaire)
                    </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableItems.map(itemName => {
                        const inventoryItem = inventory.find(i => i.name === itemName && i.location === location);
                        const requestedItem = requestedItems.find(i => i.name === itemName);
                        const qty = requestedItem?.quantity || 0;
                        const isRequested = qty > 0;
                        const maxQty = inventoryItem ? inventoryItem.quantity : 999;

                        return (
                            <div
                                key={itemName}
                                className={`p-4 rounded-xl border-2 transition-all duration-200 ${isRequested
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500/20'
                                    : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 bg-white dark:bg-gray-800/50'
                                    }`}
                            >
                                <div className="font-bold text-gray-900 dark:text-white mb-1 truncate" title={itemName}>
                                    {itemName}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                    {inventoryItem ? `Libre: ${inventoryItem.quantity}` : 'Spécial (Hors inventaire)'}
                                </div>

                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleAddItemFromInventory(itemName, Math.max(0, qty - 1), requestedItem?.replaceBin)}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-gray-700 border dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 active:scale-95 transition-all"
                                        >
                                            -
                                        </button>
                                        <input
                                            type="number"
                                            value={qty}
                                            readOnly
                                            className="w-12 text-center font-bold text-sm border-none bg-transparent focus:ring-0 dark:text-white"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleAddItemFromInventory(itemName, Math.min(maxQty, qty + 1), requestedItem?.replaceBin)}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-500 text-white hover:bg-blue-600 active:scale-95 transition-all shadow-sm"
                                        >
                                            +
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id={`replace-grid-${itemName}`}
                                            checked={requestedItem?.replaceBin || false}
                                            disabled={!isRequested}
                                            onChange={e => handleAddItemFromInventory(itemName, qty, e.target.checked)}
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                        />
                                        <label htmlFor={`replace-grid-${itemName}`} className={`text-xs select-none ${!isRequested ? 'text-gray-400' : 'text-gray-700 dark:text-gray-300 cursor-pointer'}`}>
                                            Remplacement
                                        </label>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-center">
                    <button
                        type="button"
                        onClick={handleAddCustomItem}
                        className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                        ✏️ Ajouter un contenant personnalisé
                    </button>
                </div>
            </div>

            {/* Summary List */}
            {requestedItems.length > 0 && (
                <div className="border-t pt-6 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">✅ Récapitulatif</h3>
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold dark:bg-blue-900 dark:text-blue-100">
                            {requestedItems.length} contenant{requestedItems.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    <div className="space-y-3">
                        {requestedItems.map((item, index) => {
                            const inventoryItem = inventory.find(i => i.name === item.name && i.location === location);
                            const maxQty = inventoryItem ? inventoryItem.quantity : 999;

                            return (
                                <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm transition-all">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-gray-800 dark:text-gray-200 truncate">{item.name}</div>
                                        <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                                            {inventoryItem ? 'Inventaire' : 'Personnalisé'}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {/* Quantity Controls */}
                                        <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-600 p-1 shadow-inner">
                                            <button
                                                type="button"
                                                onClick={() => handleAddItemFromInventory(item.name, Math.max(0, item.quantity - 1), item.replaceBin)}
                                                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                                            >
                                                -
                                            </button>
                                            <span className="w-8 text-center font-bold text-blue-600 dark:text-blue-400 text-sm">
                                                {item.quantity}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleAddItemFromInventory(item.name, Math.min(maxQty, item.quantity + 1), item.replaceBin)}
                                                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                                            >
                                                +
                                            </button>
                                        </div>

                                        {/* Replacement Toggle */}
                                        <button
                                            type="button"
                                            onClick={() => handleAddItemFromInventory(item.name, item.quantity, !item.replaceBin)}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${item.replaceBin
                                                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 border border-orange-200 dark:border-orange-800'
                                                : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 border border-gray-200 dark:border-gray-700'
                                                }`}
                                        >
                                            Remplacement
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem(index)}
                                            className="text-red-400 hover:text-red-600 p-1.5 transition-colors"
                                            aria-label="Supprimer"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="pt-4">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary w-full py-4 text-xl flex items-center justify-center gap-3 shadow-xl hover:shadow-blue-500/20 transition-all active:scale-[0.98]"
                >
                    {isSubmitting ? 'Traitement en cours...' : '✅ Soumettre la demande'}
                </button>
            </div>
        </form>
    );
};

export default SingleRequestForm;
