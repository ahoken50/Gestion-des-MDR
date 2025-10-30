import React, { useState, useMemo } from 'react';
import type { InventoryItem, RequestedItem, PickupRequest } from '../types';
import type { SelectedItem, PickupRequestPDF } from '../types-pdf';
import { PDFService, createPickupRequestPDF } from '../services/pdfServiceMulti';
import { LOCATIONS, SPECIAL_ITEMS_BY_LOCATION } from '../constants';
import { PlusIcon, TrashIcon, DocumentArrowDownIcon } from './icons';

interface UnifiedRequestFormProps {
    inventory: InventoryItem[];
    onSubmit: (request: Omit<PickupRequest, 'id' | 'status'>) => void;
    onPDFGenerated?: (request: PickupRequestPDF) => void;
}

type RequestMode = 'single' | 'multi';

const UnifiedRequestForm: React.FC<UnifiedRequestFormProps> = ({ 
    inventory, 
    onSubmit,
    onPDFGenerated 
}) => {
    const [mode, setMode] = useState<RequestMode>('single');
    
    // État pour le mode simple
    const [location, setLocation] = useState(LOCATIONS[0]);
    const [contactName, setContactName] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [requestedItems, setRequestedItems] = useState<RequestedItem[]>([]);
    
    // État pour le mode multiple
    const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    // Logique pour le mode simple
    const availableItems = useMemo(() => {
        const inventoryForLocation = inventory.filter(item => item.location === location && item.quantity > 0);
        const specialItemsForLocation = SPECIAL_ITEMS_BY_LOCATION[location] || [];
        return [...inventoryForLocation.map(i => i.name), ...specialItemsForLocation];
    }, [location, inventory]);

    // Logique pour le mode multiple
    const inventoryByLocation = useMemo(() => {
        const grouped = LOCATIONS.map(loc => ({
            location: loc,
            items: inventory.filter(item => item.location === loc && item.quantity > 0)
        })).filter(group => group.items.length > 0);
        
        return grouped;
    }, [inventory]);

    const selectedByLocation = useMemo(() => {
        return selectedItems.reduce((groups, item) => {
            if (!groups[item.location]) {
                groups[item.location] = [];
            }
            groups[item.location].push(item);
            return groups;
        }, {} as Record<string, SelectedItem[]>);
    }, [selectedItems]);

    // Fonctions pour le mode simple
    const handleAddItem = () => {
        if (availableItems.length > 0) {
            const firstItemName = availableItems[0];
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
            if (newItems.some((item, i) => i !== index && item.name === value)) {
                alert("Ce contenant est déjà dans la demande.");
                return;
            }
            newItems[index].name = value;
        } else if (field === 'quantity' && typeof value === 'number') {
            const inventoryItem = inventory.find(i => i.name === newItems[index].name && i.location === location);
            const maxQuantity = inventoryItem ? inventoryItem.quantity : Infinity;
            newItems[index].quantity = Math.max(1, Math.min(value, maxQuantity));
        }
        setRequestedItems(newItems);
    };

    const handleSingleSubmit = (e: React.FormEvent) => {
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

    // Fonctions pour le mode multiple
    const handleAddMultiItem = (item: InventoryItem, quantity: number) => {
        const existingIndex = selectedItems.findIndex(
            selected => selected.id === item.id
        );
        
        if (existingIndex >= 0) {
            const newSelected = [...selectedItems];
            newSelected[existingIndex].quantity = quantity;
            setSelectedItems(newSelected);
        } else {
            const newItem: SelectedItem = {
                id: item.id,
                name: item.name,
                quantity,
                location: item.location
            };
            setSelectedItems([...selectedItems, newItem]);
        }
    };

    const handleRemoveMultiItem = (itemId: string) => {
        setSelectedItems(selectedItems.filter(item => item.id !== itemId));
    };

    const handleUpdateMultiQuantity = (itemId: string, quantity: number) => {
        setSelectedItems(selectedItems.map(item => 
            item.id === itemId ? { ...item, quantity } : item
        ));
    };

    const handleGeneratePDF = async () => {
        if (selectedItems.length === 0) {
            alert('Veuillez sélectionner au moins un contenant.');
            return;
        }
        
        if (!contactName.trim() || !contactPhone.trim()) {
            alert('Veuillez remplir les informations de contact.');
            return;
        }

        setIsGenerating(true);
        
        try {
            const request = createPickupRequestPDF(selectedItems, {
                name: contactName,
                phone: contactPhone,
                notes: notes.trim() || undefined
            });

            const pdfService = new PDFService();
            pdfService.generatePickupRequestPDF(request);
            pdfService.save(`demande_ramassage_${request.id}.pdf`);

            if (onPDFGenerated) {
                onPDFGenerated(request);
            }

            setSelectedItems([]);
            setNotes('');
            
            alert('PDF généré avec succès !');
        } catch (error) {
            console.error('Erreur lors de la génération du PDF:', error);
            alert('Une erreur est survenue lors de la génération du PDF.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Sélecteur de mode */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">
                    Créer une nouvelle demande de cueillette
                </h2>
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setMode('single')}
                        className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                            mode === 'single' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        📍 Demande simple (un lieu)
                    </button>
                    <button
                        onClick={() => setMode('multi')}
                        className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                            mode === 'multi' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        📋 Sélection multiple (plusieurs lieux)
                    </button>
                </div>
            </div>

            {/* Formulaire de contact (commun aux deux modes) */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Informations de contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="contactName" className="block text-sm font-medium text-gray-700">
                            Nom du contact *
                        </label>
                        <input
                            type="text"
                            id="contactName"
                            value={contactName}
                            onChange={e => setContactName(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">
                            Téléphone *
                        </label>
                        <input
                            type="tel"
                            id="contactPhone"
                            value={contactPhone}
                            onChange={e => setContactPhone(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                            required
                        />
                    </div>
                </div>
                <div className="mt-4">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                        Notes (optionnel)
                    </label>
                    <textarea
                        id="notes"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                    />
                </div>
            </div>

            {mode === 'single' ? (
                /* Mode simple */
                <form onSubmit={handleSingleSubmit} className="bg-white p-6 rounded-lg shadow-lg space-y-6">
                    <div>
                        <label htmlFor="location" className="block text-sm font-medium text-gray-700">Lieu de cueillette</label>
                        <select 
                            id="location" 
                            value={location} 
                            onChange={e => setLocation(e.target.value)} 
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                        >
                            {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                        </select>
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
                    
                    <div className="text-right">
                        <button type="submit" className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                            Soumettre la demande
                        </button>
                    </div>
                </form>
            ) : (
                /* Mode multiple */
                <div className="space-y-6">
                    {/* Sélection des contenants */}
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Sélectionner les contenants à ramasser</h3>
                        
                        {inventoryByLocation.length > 0 ? (
                            inventoryByLocation.map(({ location: loc, items }) => (
                                <div key={loc} className="mb-6">
                                    <h4 className="text-md font-semibold text-gray-700 mb-3">
                                        {loc}
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {items.map(item => {
                                            const selectedItem = selectedItems.find(
                                                selected => selected.id === item.id
                                            );
                                            const selectedQuantity = selectedItem?.quantity || 0;
                                            
                                            return (
                                                <div
                                                    key={item.id}
                                                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                                                >
                                                    <div className="font-medium text-gray-900 mb-2">
                                                        {item.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500 mb-3">
                                                        Disponible: {item.quantity}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={item.quantity}
                                                            value={selectedQuantity}
                                                            onChange={e => {
                                                                const quantity = parseInt(e.target.value, 10) || 0;
                                                                if (quantity > 0) {
                                                                    handleAddMultiItem(item, Math.min(quantity, item.quantity));
                                                                } else if (selectedItem) {
                                                                    handleRemoveMultiItem(item.id);
                                                                }
                                                            }}
                                                            className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-1"
                                                        />
                                                        <span className="text-sm text-gray-500">
                                                            / {item.quantity}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 italic">
                                Aucun contenant disponible dans l'inventaire.
                            </p>
                        )}
                    </div>

                    {/* Récapitulatif de la sélection */}
                    {selectedItems.length > 0 && (
                        <div className="bg-white p-6 rounded-lg shadow-lg">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Récapitulatif de la sélection</h3>
                            
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700">
                                        Total des contenants:
                                    </span>
                                    <span className="text-lg font-bold text-blue-600">
                                        {selectedItems.reduce((sum, item) => sum + item.quantity, 0)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-700">
                                        Nombre de lieux:
                                    </span>
                                    <span className="text-lg font-bold text-blue-600">
                                        {Object.keys(selectedByLocation).length}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                {Object.entries(selectedByLocation).map(([loc, items]) => (
                                    <div key={loc} className="border-l-4 border-blue-500 pl-4">
                                        <h5 className="font-semibold text-gray-800 mb-2">{loc}</h5>
                                        <div className="space-y-2">
                                            {items.map(item => (
                                                <div key={item.id} className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-700">{item.name}</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-medium">Quantité: {item.quantity}</span>
                                                        <button
                                                            onClick={() => handleRemoveMultiItem(item.id)}
                                                            className="text-red-600 hover:text-red-800 transition-colors"
                                                        >
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Bouton de génération */}
                    <div className="text-center">
                        <button
                            onClick={handleGeneratePDF}
                            disabled={isGenerating || selectedItems.length === 0}
                            className="bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                        >
                            <DocumentArrowDownIcon className="w-5 h-5" />
                            {isGenerating ? 'Génération en cours...' : 'Générer le PDF de ramassage'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UnifiedRequestForm;