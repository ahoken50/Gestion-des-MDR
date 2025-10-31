import React, { useState, useMemo, useEffect } from 'react';
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
    const [bcNumber, setBcNumber] = useState(''); // Numéro de BC
    const [contactName, setContactName] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [requestedItems, setRequestedItems] = useState<RequestedItem[]>([]);
    
    // État pour le mode multiple
    const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
    const [locationComments, setLocationComments] = useState<Record<string, string>>({}); // Commentaires par lieu
    const [isGenerating, setIsGenerating] = useState(false);

    // Logique pour le mode simple
    const availableItems = useMemo(() => {
        const inventoryForLocation = inventory.filter(item => item.location === location && item.quantity > 0);
        const specialItemsForLocation = SPECIAL_ITEMS_BY_LOCATION[location] || [];
        return [...inventoryForLocation.map(i => i.name), ...specialItemsForLocation];
    }, [location, inventory]);

    // Logique pour le mode multiple
    const inventoryByLocation = useMemo(() => {
        // On ne filtre plus par group.items.length > 0 pour afficher tous les lieux
        const grouped = LOCATIONS.map(loc => ({
            location: loc,
            // On filtre toujours l'inventaire pour n'afficher que les items disponibles (> 0)
            items: inventory.filter(item => item.location === loc && item.quantity > 0)
        }));
        
        return grouped;
    }, [inventory, LOCATIONS]); // Ajout de LOCATIONS comme dépendance pour s'assurer que tous les lieux sont pris en compte

    const selectedByLocation = useMemo(() => {
        return selectedItems.reduce((groups, item) => {
            if (!groups[item.location]) {
                groups[item.location] = [];
            }
            groups[item.location].push(item);
            return groups;
        }, {} as Record<string, SelectedItem[]>);
    }, [selectedItems]);

    // Effet pour synchroniser avec les changements d'inventaire
    useEffect(() => {
        // Nettoyer les sélections qui ne sont plus valides (items supprimés ou quantité réduite)
        const validSelectedItems = selectedItems.filter(selectedItem => {
            const inventoryItem = inventory.find(item => item.id === selectedItem.id);
            return inventoryItem && inventoryItem.quantity >= selectedItem.quantity;
        });

        // Nettoyer les requestedItems qui ne sont plus valides (mode simple)
        const validRequestedItems = requestedItems.filter(requestedItem => {
            const inventoryItem = inventory.find(item => 
                item.name === requestedItem.name && item.location === location
            );
            return inventoryItem && inventoryItem.quantity >= requestedItem.quantity;
        });

        // Mettre à jour si des items sont devenus invalides
        if (validSelectedItems.length !== selectedItems.length) {
            setSelectedItems(validSelectedItems);
        }
        if (validRequestedItems.length !== requestedItems.length) {
            setRequestedItems(validRequestedItems);
        }
    }, [inventory, selectedItems, requestedItems, location]);

    // Fonctions pour le mode simple
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
                alert('Ce contenant est déjà dans la demande.');
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
            bcNumber: bcNumber.trim() || undefined,
            location,
            items: requestedItems,
            date: new Date().toISOString(),
            contactName,
            contactPhone,
            notes,
        });

        // Reset form
        setLocation(LOCATIONS[0]);
        setBcNumber('');
        setContactName('');
        setContactPhone('');
        setNotes('');
        setRequestedItems([]);
    };

    // Fonctions pour le mode multiple
    const handleAddMultiItem = (item: InventoryItem, quantity: number) => {
        const existingIndex = selectedItems.findIndex(
            // On vérifie par ID pour les items d'inventaire, et par nom/location pour les items spontanés
            selected => selected.id === item.id || (selected.name === item.name && selected.location === item.location)
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

    const handleAddCustomMultiItem = () => {
        const customName = prompt('Entrez le nom du contenant personnalisé (ex: Baril de colasse vide):');
        if (!customName || !customName.trim()) {
            return;
        }

        // Demander le lieu
        const locationChoice = prompt(`Choisissez le lieu pour "${customName.trim()}":\n\n${LOCATIONS.map((loc, i) => `${i + 1}. ${loc}`).join('\n')}\n\nEntrez le numéro:`);
        if (!locationChoice) {
            return;
        }

        const locationIndex = parseInt(locationChoice, 10) - 1;
        if (locationIndex < 0 || locationIndex >= LOCATIONS.length) {
            alert('Numéro de lieu invalide.');
            return;
        }

        const selectedLocation = LOCATIONS[locationIndex];

        // Demander la quantité
        const quantityStr = prompt(`Quantité de "${customName.trim()}" pour ${selectedLocation}:`, '1');
        if (!quantityStr) {
            return;
        }

        const quantity = parseInt(quantityStr, 10);
        if (isNaN(quantity) || quantity < 1) {
            alert('Quantité invalide.');
            return;
        }

        // Vérifier si l'item existe déjà
        const existingItem = selectedItems.find(
            item => item.name === customName.trim() && item.location === selectedLocation
        );

        if (existingItem) {
            alert('Ce contenant est déjà dans la sélection pour ce lieu.');
            return;
        }

        // Ajouter l'item personnalisé avec un ID unique
        const newItem: SelectedItem = {
            id: `custom-${Date.now()}-${Math.random()}`,
            name: customName.trim(),
            quantity,
            location: selectedLocation
        };

        setSelectedItems([...selectedItems, newItem]);
        alert(`✅ "${customName.trim()}" ajouté avec succès pour ${selectedLocation}!`);
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
            // Créer les données groupées avec commentaires
            const groupedItemsWithComments = selectedItems.reduce((acc, item) => {
                if (!acc[item.location]) {
                    acc[item.location] = {
                        items: [],
                        comments: locationComments[item.location] || undefined
                    };
                }
                acc[item.location].items.push(item);
                return acc;
            }, {} as Record<string, { items: SelectedItem[], comments?: string }>);

            const request = createPickupRequestPDF(selectedItems, {
                name: contactName,
                phone: contactPhone,
                notes: notes.trim() || undefined,
                bcNumber: bcNumber.trim() || undefined
            }, groupedItemsWithComments);

            const pdfService = new PDFService();
            pdfService.generatePickupRequestPDF(request);
            pdfService.save(`demande_ramassage_${request.id}.pdf`);

            if (onPDFGenerated) {
                onPDFGenerated(request);
            }

            setSelectedItems([]);
            setLocationComments({});
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
            <div className="card p-6 slide-up">
                <div className="card-header p-4 -m-6 mb-6">
                    <h2 className="text-2xl font-bold gradient-text">
                        ➕ Créer une nouvelle demande de cueillette
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">Choisissez le type de demande selon vos besoins</p>
                </div>
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setMode('single')}
                        className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                            mode === 'single' 
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                        }`}
                    >
                        📍 Demande simple (un lieu)
                    </button>
                    <button
                        onClick={() => setMode('multi')}
                        className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                            mode === 'multi' 
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                        }`}
                    >
                        📋 Sélection multiple (plusieurs lieux)
                    </button>
                </div>
            </div>

            {/* Formulaire de contact (commun aux deux modes) */}
            <div className="card p-6 slide-up">
                <div className="card-header p-4 -m-6 mb-6">
                    <h3 className="text-xl font-bold gradient-text">📋 Informations de demande</h3>
                    <p className="text-sm text-gray-600 mt-1">Remplissez les informations de contact et de référence</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="bcNumber" className="block text-sm font-medium text-gray-700">
                            Numéro de BC (optionnel)
                        </label>
                        <input
                            type="text"
                            id="bcNumber"
                            value={bcNumber}
                            onChange={e => setBcNumber(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                            placeholder="Ex: BC-2024-001"
                        />
                    </div>
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
                        Notes générales (optionnel)
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
                <form onSubmit={handleSingleSubmit} className="card p-6 space-y-6 slide-up">
                    <div className="card-header p-4 -m-6 mb-6">
                        <h3 className="text-xl font-bold gradient-text">📦 Détails de la demande</h3>
                        <p className="text-sm text-gray-600 mt-1">Sélectionnez le lieu et les contenants à ramasser</p>
                    </div>
                    
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                        <label htmlFor="location" className="block text-sm font-semibold text-blue-900 mb-2">📍 Lieu de cueillette</label>
                        <select 
                            id="location" 
                            value={location} 
                            onChange={e => setLocation(e.target.value)} 
                            className="block w-full rounded-lg border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base p-3 bg-white font-medium"
                        >
                            {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                        </select>
                    </div>

                    <div className="border-t pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">📦 Contenants à ramasser</h3>
                                <p className="text-sm text-gray-600">Ajoutez les contenants de l'inventaire ou créez-en manuellement</p>
                            </div>
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                                {requestedItems.length} contenant{requestedItems.length !== 1 ? 's' : ''}
                            </span>
                        </div>
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
                        <div className="mt-2 flex gap-2">
                            <button type="button" onClick={handleAddItem} className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 flex items-center justify-center gap-2 text-sm">
                                <PlusIcon className="w-4 h-4" /> Ajouter de l'inventaire
                            </button>
                            <button type="button" onClick={handleAddCustomItem} className="flex-1 bg-blue-100 text-blue-800 py-2 px-4 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 flex items-center justify-center gap-2 text-sm font-medium">
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
            ) : (
                /* Mode multiple */
                <div className="space-y-6">
                    {/* Sélection des contenants */}
                    <div className="card p-6 slide-up">
                        <div className="card-header p-4 -m-6 mb-6">
                            <h3 className="text-xl font-bold gradient-text">📦 Sélectionner les contenants à ramasser</h3>
                            <p className="text-sm text-gray-600 mt-1">Choisissez les contenants de différents lieux et ajoutez des commentaires spécifiques</p>
                        </div>
                        
                        {/* Bouton d'ajout manuel */}
                        <div className="mb-6">
                            <button 
                                type="button" 
                                onClick={handleAddCustomMultiItem} 
                                className="w-full bg-blue-100 text-blue-800 py-3 px-4 rounded-lg hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 flex items-center justify-center gap-2 font-medium transition-all hover:scale-105"
                            >
                                ✏️ Ajouter un contenant manuellement
                            </button>
                            <p className="text-xs text-gray-500 mt-2 text-center">
                                Pour ajouter un contenant qui n'est pas dans l'inventaire (ex: Baril de colasse vide)
                            </p>
                        </div>
                        
                        {inventoryByLocation.map(({ location: loc, items }) => (
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
                                                            max={item.quantity} // La quantité max est celle de l'inventaire
                                                            value={selectedQuantity}
                                                            onChange={e => {
                                                                const quantity = parseInt(e.target.value, 10) || 0;
                                                                if (quantity > 0) {
                                                                    // Pour les items d'inventaire, on ne peut pas dépasser la quantité disponible
                                                                    const maxQuantity = item.id.startsWith('custom-') ? Infinity : item.quantity;
                                                                    handleAddMultiItem(item, Math.min(quantity, maxQuantity));
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
                                        {items.length === 0 && (
                                            <p className="text-gray-500 italic col-span-full">
                                                Aucun contenant disponible dans l'inventaire pour ce lieu.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>

                    {/* Récapitulatif de la sélection */}
                    {selectedItems.length > 0 && (
                        <div className="card p-6 slide-up border-2 border-blue-200">
                            <div className="card-header p-4 -m-6 mb-6 bg-gradient-to-r from-blue-100 to-indigo-100">
                                <h3 className="text-xl font-bold gradient-text">✅ Récapitulatif de la sélection</h3>
                                <p className="text-sm text-gray-600 mt-1">Vérifiez votre sélection avant de générer le PDF</p>
                            </div>
                            
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
                                        <div className="space-y-2 mb-3">
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
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Commentaires pour {loc} (optionnel)
                                            </label>
                                            <textarea
                                                value={locationComments[loc] || ''}
                                                onChange={e => setLocationComments(prev => ({
                                                    ...prev,
                                                    [loc]: e.target.value
                                                }))}
                                                rows={2}
                                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                                                placeholder="Instructions spécifiques pour ce lieu..."
                                            />
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
                            className="btn btn-primary py-3 px-8 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                        >
                            <DocumentArrowDownIcon className="w-5 h-5" />
                            {isGenerating ? '⏳ Génération en cours...' : '📄 Générer le PDF de ramassage'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UnifiedRequestForm;