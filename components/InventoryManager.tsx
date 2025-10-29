import React, { useState } from 'react';
import type { InventoryItem } from '../types';
import { LOCATIONS } from '../constants';
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

const InventoryManager: React.FC<InventoryManagerProps> = ({ inventory, onUpdateInventory }) => {
    const [showAddForm, setShowAddForm] = useState(false);

    const handleAddItem = (newItem: Omit<InventoryItem, 'id'>) => {
        const itemExists = inventory.some(item => item.name.toLowerCase() === newItem.name.toLowerCase() && item.location === newItem.location);
        if (itemExists) {
            alert("Ce type de contenant existe déjà pour ce lieu.");
            return;
        }
        const newInventoryItem: InventoryItem = { ...newItem, id: Date.now().toString() };
        onUpdateInventory([...inventory, newInventoryItem]);
        setShowAddForm(false);
    };

    const handleDeleteItem = (id: string) => {
        if(window.confirm("Êtes-vous sûr de vouloir supprimer ce type de contenant?")) {
            onUpdateInventory(inventory.filter(item => item.id !== id));
        }
    };
    
    const handleQuantityChange = (id: string, newQuantity: number) => {
        onUpdateInventory(inventory.map(item => item.id === id ? { ...item, quantity: Math.max(0, newQuantity) } : item));
    };

    const inventoryByLocation = LOCATIONS.map(location => ({
        location,
        items: inventory.filter(item => item.location === location),
    }));

    return (
        <div className="space-y-8">
            {inventoryByLocation.map(({ location, items }) => (
                <div key={location} className="bg-white p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">{location}</h2>
                    {items.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contenant</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Quantité (Vide)</th>
                                        <th scope="col" className="relative px-6 py-3 w-20"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {items.map(item => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <input 
                                                    type="number" 
                                                    value={item.quantity}
                                                    onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value, 10) || 0)}
                                                    className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-1"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => handleDeleteItem(item.id)} className="text-red-600 hover:text-red-800 transition-colors">
                                                    <TrashIcon className="w-5 h-5"/>
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
            ))}
            <div className="mt-6 bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Gérer les types de contenants</h2>
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