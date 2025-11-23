import React, { useState, useMemo, useEffect } from 'react';
import { LOCATIONS } from '../../constants';
import { TrashIcon, DocumentArrowDownIcon } from '../icons';
import type { InventoryItem } from '../../types';
import type { SelectedItem, PickupRequestPDF } from '../../types-pdf';
import { PDFService, createPickupRequestPDF } from '../../services/pdfServiceMulti';
import { useToast } from '../ui/Toast';

interface MultiRequestFormProps {
    inventory: InventoryItem[];
    contactInfo: {
        name: string;
        phone: string;
        notes: string;
        bcNumber: string;
    };
    onPDFGenerated?: (request: PickupRequestPDF) => void;
}

const MultiRequestForm: React.FC<MultiRequestFormProps> = ({ inventory, contactInfo, onPDFGenerated }) => {
    const { success, error: toastError, info } = useToast();
    const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
    const [locationComments, setLocationComments] = useState<Record<string, string>>({});
    const [isGenerating, setIsGenerating] = useState(false);

    const inventoryByLocation = useMemo(() => {
        return LOCATIONS.map(loc => ({
            location: loc,
            items: inventory.filter(item => item.location === loc && item.quantity > 0)
        }));
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

    // Clean up invalid selections
    useEffect(() => {
        const validSelectedItems = selectedItems.filter(selectedItem => {
            if (selectedItem.id.startsWith('custom-')) return true;
            const inventoryItem = inventory.find(item => item.id === selectedItem.id);
            return inventoryItem && inventoryItem.quantity >= selectedItem.quantity;
        });

        if (validSelectedItems.length !== selectedItems.length) {
            setSelectedItems(validSelectedItems);
        }
    }, [inventory, selectedItems]);

    const handleAddMultiItem = (item: InventoryItem, quantity: number) => {
        const existingIndex = selectedItems.findIndex(
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

    const handleAddCustomMultiItem = () => {
        const customName = prompt('Entrez le nom du contenant personnalisé (ex: Baril de colasse vide):');
        if (!customName || !customName.trim()) return;

        const locationChoice = prompt(`Choisissez le lieu pour "${customName.trim()}":\n\n${LOCATIONS.map((loc, i) => `${i + 1}. ${loc}`).join('\n')}\n\nEntrez le numéro:`);
        if (!locationChoice) return;

        const locationIndex = parseInt(locationChoice, 10) - 1;
        if (locationIndex < 0 || locationIndex >= LOCATIONS.length) {
            toastError('Numéro de lieu invalide.');
            return;
        }

        const selectedLocation = LOCATIONS[locationIndex];
        const quantityStr = prompt(`Quantité de "${customName.trim()}" pour ${selectedLocation}:`, '1');
        if (!quantityStr) return;

        const quantity = parseInt(quantityStr, 10);
        if (isNaN(quantity) || quantity < 1) {
            toastError('Quantité invalide.');
            return;
        }

        const existingItem = selectedItems.find(
            item => item.name === customName.trim() && item.location === selectedLocation
        );

        if (existingItem) {
            toastError('Ce contenant est déjà dans la sélection pour ce lieu.');
            return;
        }

        const newItem: SelectedItem = {
            id: `custom-${Date.now()}-${Math.random()}`,
            name: customName.trim(),
            quantity,
            location: selectedLocation
        };

        setSelectedItems([...selectedItems, newItem]);
        success(`"${customName.trim()}" ajouté avec succès pour ${selectedLocation}!`);
    };

    const handleGeneratePDF = async () => {
        if (selectedItems.length === 0) {
            toastError('Veuillez sélectionner au moins un contenant.');
            return;
        }

        if (!contactInfo.name.trim() || !contactInfo.phone.trim()) {
            toastError('Veuillez remplir les informations de contact.');
            return;
        }

        setIsGenerating(true);

        try {
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
                name: contactInfo.name,
                phone: contactInfo.phone,
                notes: contactInfo.notes.trim() || undefined,
                bcNumber: contactInfo.bcNumber.trim() || undefined
            }, groupedItemsWithComments);

            const pdfService = new PDFService();
            pdfService.generatePickupRequestPDF(request);
            pdfService.save(`demande_ramassage_${request.id}.pdf`);

            if (onPDFGenerated) {
                onPDFGenerated(request);
            }

            setSelectedItems([]);
            setLocationComments({});
            success('PDF généré avec succès !');
        } catch (error) {
            console.error('Erreur lors de la génération du PDF:', error);
            toastError('Une erreur est survenue lors de la génération du PDF.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="card p-6 slide-up">
                <div className="card-header p-4 -m-6 mb-6">
                    <h3 className="text-xl font-bold gradient-text">📦 Sélectionner les contenants à ramasser</h3>
                    <p className="text-sm text-gray-600 mt-1">Choisissez les contenants de différents lieux et ajoutez des commentaires spécifiques</p>
                </div>

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
                                                max={item.quantity}
                                                value={selectedQuantity}
                                                onChange={e => {
                                                    const quantity = parseInt(e.target.value, 10) || 0;
                                                    if (quantity > 0) {
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
    );
};

export default MultiRequestForm;
