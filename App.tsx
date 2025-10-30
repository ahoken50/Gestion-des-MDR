import React, { useState, useEffect } from 'react';
import Header, { type View } from './components/Header';
import InventoryManager from './components/InventoryManager';
import RequestForm from './components/RequestForm';
import RequestHistory from './components/RequestHistory';
import MultiSelectionForm from './components/MultiSelectionForm';
import { INITIAL_INVENTORY } from './constants';
import type { InventoryItem, PickupRequest } from './types';
import type { PickupRequestPDF } from './types-pdf';

// FIX: Provide implementation for the main App component.
const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>('inventory');
    
    // State for inventory, loading from localStorage or using initial data
    const [inventory, setInventory] = useState<InventoryItem[]>(() => {
        try {
            const savedInventory = localStorage.getItem('inventory');
            return savedInventory ? JSON.parse(savedInventory) : INITIAL_INVENTORY;
        } catch (error) {
            console.error("Failed to parse inventory from localStorage", error);
            return INITIAL_INVENTORY;
        }
    });

    // State for pickup requests, loading from localStorage
    const [pickupRequests, setPickupRequests] = useState<PickupRequest[]>(() => {
        try {
            const savedRequests = localStorage.getItem('pickupRequests');
            return savedRequests ? JSON.parse(savedRequests) : [];
        } catch (error) {
            console.error("Failed to parse pickup requests from localStorage", error);
            return [];
        }
    });

    // Persist inventory to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('inventory', JSON.stringify(inventory));
    }, [inventory]);

    // Persist pickup requests to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('pickupRequests', JSON.stringify(pickupRequests));
    }, [pickupRequests]);

    const handleAddRequest = (newRequest: Omit<PickupRequest, 'id' | 'status'>) => {
        const requestWithId: PickupRequest = {
            ...newRequest,
            id: Date.now().toString(),
            status: 'pending',
        };
        setPickupRequests(prev => [requestWithId, ...prev]);
        
        // Update inventory: subtract requested items from empty container counts
        const updatedInventory = inventory.map(invItem => {
            const requested = newRequest.items.find(reqItem => reqItem.name === invItem.name && newRequest.location === invItem.location);
            if (requested) {
                return { ...invItem, quantity: Math.max(0, invItem.quantity - requested.quantity) };
            }
            return invItem;
        });
        setInventory(updatedInventory);

        // Switch view to history to see the new request
        setCurrentView('history');
    };
    
    const handleUpdateRequestStatus = (requestId: string, status: 'pending' | 'completed') => {
        setPickupRequests(prev => prev.map(req => req.id === requestId ? {...req, status} : req));
    };

    const handleMultiSelectionRequest = (request: PickupRequestPDF) => {
        console.log('PDF Request generated:', request);
        // Vous pouvez ici ajouter la logique pour sauvegarder la demande si nécessaire
    };

    return (
        <div className="bg-gray-50 min-h-screen font-sans">
            <Header currentView={currentView} onViewChange={setCurrentView} />
            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                {currentView === 'inventory' && (
                    <InventoryManager inventory={inventory} onUpdateInventory={setInventory} />
                )}
                {currentView === 'new_request' && (
                    <RequestForm inventory={inventory} onSubmit={handleAddRequest} />
                )}
                {currentView === 'multi_selection' && (
                    <MultiSelectionForm inventory={inventory} onRequestGenerated={handleMultiSelectionRequest} />
                )}
                {currentView === 'history' && (
                    <RequestHistory requests={pickupRequests} onUpdateRequestStatus={handleUpdateRequestStatus} />
                )}
            </main>
        </div>
    );
};

export default App;
