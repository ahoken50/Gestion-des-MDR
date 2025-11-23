import React, { useState, useEffect } from 'react';
import { XMarkIcon } from './icons';

interface CostDistributionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (totalCost: number, locationCosts: Record<string, number>) => void;
    locations: string[];
    initialTotalCost?: number;
    initialLocationCosts?: Record<string, number>;
}

const CostDistributionModal: React.FC<CostDistributionModalProps> = ({
    isOpen,
    onClose,
    onSave,
    locations,
    initialTotalCost = 0,
    initialLocationCosts = {}
}) => {
    const [costs, setCosts] = useState<Record<string, string>>({});
    const [total, setTotal] = useState<number>(0);

    useEffect(() => {
        if (isOpen) {
            // Initialize costs
            const newCosts: Record<string, string> = {};
            locations.forEach(loc => {
                newCosts[loc] = initialLocationCosts[loc] ? initialLocationCosts[loc].toString() : '';
            });

            // If no split costs but total exists, put it all in the first location or leave empty to let user decide
            if (Object.keys(initialLocationCosts).length === 0 && initialTotalCost > 0 && locations.length === 1) {
                newCosts[locations[0]] = initialTotalCost.toString();
            }

            setCosts(newCosts);
        }
    }, [isOpen, locations, initialLocationCosts, initialTotalCost]);

    useEffect(() => {
        // Calculate total whenever costs change
        const newTotal = Object.values(costs).reduce((sum, val) => {
            const num = parseFloat(val.replace(',', '.'));
            return sum + (isNaN(num) ? 0 : num);
        }, 0);
        setTotal(newTotal);
    }, [costs]);

    const handleCostChange = (location: string, value: string) => {
        setCosts(prev => ({
            ...prev,
            [location]: value
        }));
    };

    const handleSave = () => {
        const finalLocationCosts: Record<string, number> = {};
        Object.entries(costs).forEach(([loc, val]) => {
            const num = parseFloat(val.replace(',', '.'));
            if (!isNaN(num) && num > 0) {
                finalLocationCosts[loc] = num;
            }
        });
        onSave(total, finalLocationCosts);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden slide-up">
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Répartition des Coûts</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 max-h-[60vh] overflow-y-auto">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Veuillez entrer le coût associé à chaque lieu de cueillette.
                    </p>

                    <div className="space-y-3">
                        {locations.map(location => (
                            <div key={location} className="flex flex-col">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {location}
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={costs[location] || ''}
                                        onChange={(e) => handleCostChange(location, e.target.value)}
                                        placeholder="0.00"
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 pl-8 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 dark:text-gray-400 sm:text-sm">$</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t dark:border-gray-600 flex justify-between items-center">
                    <div className="text-sm font-bold text-gray-800 dark:text-white">
                        Total: {total.toFixed(2)} $
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Enregistrer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CostDistributionModal;
