import React, { useState, useMemo } from 'react';
import type { InventoryItem } from '../types';
import type { SelectedItem, PickupRequestPDF } from '../types-pdf';
import { PDFService, createPickupRequestPDF } from '../services/pdfServiceMulti';
import { LOCATIONS } from '../constants';
import { PlusIcon, TrashIcon, DocumentArrowDownIcon } from './icons';

interface MultiSelectionFormProps {
    inventory: InventoryItem[];
    onRequestGenerated?: (request: PickupRequestPDF) => void;
}

const MultiSelectionForm: React.FC<MultiSelectionFormProps> = ({ 
    inventory, 
    onRequestGenerated 
}) => {
    const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
    const [contactName, setContactName] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Grouper l'inventaire par localisation pour l'affichage
    const inventoryByLocation = useMemo(() => {
        const grouped = LOCATIONS.map(location => ({
            location,
            items: inventory.filter(item => item.location === location && item.quantity > 0)
        })).filter(group => group.items.length > 0);
        
        return grouped;
    }, [inventory]);

    // Ajouter un contenant à la sélection
    const handleAddItem = (item: InventoryItem, quantity: number) => {
        const existingIndex = selectedItems.findIndex(
            selected => selected.id === item.id
        );
        
        if (existingIndex >= 0) {
            // Mettre à jour la quantité si l'item existe déjà
            const newSelected = [...selectedItems];
            newSelected[existingIndex].quantity = quantity;
            setSelectedItems(newSelected);
        } else {
            // Ajouter un nouvel item
            const newItem: SelectedItem = {
                id: item.id,
                name: item.name,
                quantity,
                location: item.location
            };
            setSelectedItems([...selectedItems, newItem]);
        }
    };

    // Retirer un contenant de la sélection
    const handleRemoveItem = (itemId: string) => {
        setSelectedItems(selectedItems.filter(item => item.id !== itemId));
    };

    // Mettre à jour la quantité d'un item sélectionné
    const handleUpdateQuantity = (itemId: string, quantity: number) => {
        setSelectedItems(selectedItems.map(item => 
            item.id === itemId ? { ...item, quantity } : item
        ));
    };

    // Grouper les items sélectionnés par localisation pour l'affichage
    const selectedByLocation = useMemo(() => {
        return selectedItems.reduce((groups, item) => {
            if (!groups[item.location]) {
                groups[item.location] = [];
            }
            groups[item.location].push(item);
            return groups;
        }, {} as Record<string, SelectedItem[]>);
    }, [selectedItems]);

    // Générer le PDF
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
            // Créer la demande PDF
            const request = createPickupRequestPDF(selectedItems, {
                name: contactName,
                phone: contactPhone,
                notes: notes.trim() || undefined
            });

            // Générer et sauvegarder le PDF
            const pdfService = new PDFService();
            pdfService.generatePickupRequestPDF(request);
            pdfService.save(`demande_ramassage_${request.id}.pdf`);

            // Notifier le composant parent
            if (onRequestGenerated) {
                onRequestGenerated(request);
            }

            // Réinitialiser le formulaire
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
        <div className="space-y-8">
            {/* Formulaire de contact */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
                    Informations de contact
                </h2>
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

            {/* Sélection des contenants */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
                    Sélectionner les contenants à ramasser
                </h2>
                
                {inventoryByLocation.length > 0 ? (
                    inventoryByLocation.map(({ location, items }) => (
                        <div key={location} className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-700 mb-3">
                                {location}
                            </h3>
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
                                                            handleAddItem(item, Math.min(quantity, item.quantity));
                                                        } else if (selectedItem) {
                                                            handleRemoveItem(item.id);
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
                    <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
                        Récapitulatif de la sélection
                    </h2>
                    
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
                        {Object.entries(selectedByLocation).map(([location, items]) => (
                            <div key={location} className="border-l-4 border-blue-500 pl-4">
                                <h4 className="font-semibold text-gray-800 mb-2">{location}</h4>
                                <div className="space-y-2">
                                    {items.map(item => (
                                        <div key={item.id} className="flex justify-between items-center text-sm">
                                            <span className="text-gray-700">{item.name}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="font-medium">Quantité: {item.quantity}</span>
                                                <button
                                                    onClick={() => handleRemoveItem(item.id)}
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
    );
};

export default MultiSelectionForm;