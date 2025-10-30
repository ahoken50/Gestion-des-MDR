import React, { useState, useEffect } from 'react';
import Header, { type View } from './components/Header';
import InventoryManager from './components/InventoryManager';
import UnifiedRequestForm from './components/UnifiedRequestForm';
import RequestHistory from './components/RequestHistory';
import { INITIAL_INVENTORY } from './constants';
import { firebaseService, type FirebasePickupRequest } from './services/firebaseService';
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

    // State for pickup requests - combine local and Firebase
    const [pickupRequests, setPickupRequests] = useState<(PickupRequest | FirebasePickupRequest)[]>(() => {
        try {
            const savedRequests = localStorage.getItem('pickupRequests');
            return savedRequests ? JSON.parse(savedRequests) : [];
        } catch (error) {
            console.error("Failed to parse pickup requests from localStorage", error);
            return [];
        }
    });
    
    const [firebaseRequests, setFirebaseRequests] = useState<FirebasePickupRequest[]>([]);
    const [isFirebaseEnabled, setIsFirebaseEnabled] = useState(false);

    // Persist inventory to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('inventory', JSON.stringify(inventory));
    }, [inventory]);

    // Persist pickup requests to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('pickupRequests', JSON.stringify(pickupRequests));
    }, [pickupRequests]);

    // Initialize Firebase and sync data
    useEffect(() => {
        const initFirebase = async () => {
            try {
                // Vérifier si Firebase est configuré
                const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
                const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
                
                if (apiKey && projectId && apiKey !== 'undefined' && projectId !== 'undefined') {
                    console.log('Firebase configuration detected, initializing...');
                    setIsFirebaseEnabled(true);
                    
                    // Charger les demandes depuis Firebase
                    const fbRequests = await firebaseService.getPickupRequests();
                    setFirebaseRequests(fbRequests);
                    
                    console.log('Firebase initialized successfully');
                } else {
                    console.log('Firebase not configured, using local storage only');
                    setIsFirebaseEnabled(false);
                }
            } catch (error) {
                console.error('Error initializing Firebase:', error);
                setIsFirebaseEnabled(false);
            }
        };

        initFirebase();
    }, []);

    // Combiner les demandes locales et Firebase
    const allRequests = [...firebaseRequests, ...pickupRequests];

    const handleAddRequest = async (newRequest: Omit<PickupRequest, 'id' | 'status'>) => {
        try {
            let savedRequest;
            
            if (isFirebaseEnabled) {
                // Sauvegarder dans Firebase
                const firebaseRequest: Omit<FirebasePickupRequest, 'id' | 'requestNumber' | 'createdAt' | 'updatedAt'> = {
                    ...newRequest,
                    status: 'pending',
                };
                const docId = await firebaseService.addPickupRequest(firebaseRequest);
                
                // Récupérer la demande sauvegardée avec son ID
                savedRequest = await firebaseService.getPickupRequest(docId);
                if (savedRequest) {
                    setFirebaseRequests(prev => [savedRequest, ...prev]);
                }
            } else {
                // Sauvegarder localement
                const requestWithId: PickupRequest = {
                    ...newRequest,
                    id: Date.now().toString(),
                    status: 'pending',
                };
                setPickupRequests(prev => [requestWithId, ...prev]);
                savedRequest = requestWithId;
            }
            
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
        } catch (error) {
            console.error('Error saving request:', error);
            alert('Erreur lors de la sauvegarde de la demande');
        }
    };
    
    const handleUpdateRequestStatus = async (requestId: string, status: 'pending' | 'completed') => {
        try {
            // Vérifier si c'est une demande Firebase
            const firebaseRequest = firebaseRequests.find(req => req.id === requestId);
            
            if (firebaseRequest && isFirebaseEnabled) {
                await firebaseService.updatePickupRequest(requestId, { status });
                setFirebaseRequests(prev => 
                    prev.map(req => req.id === requestId ? {...req, status} : req)
                );
            } else {
                setPickupRequests(prev => 
                    prev.map(req => req.id === requestId ? {...req, status} : req)
                );
            }
        } catch (error) {
            console.error('Error updating request status:', error);
            alert('Erreur lors de la mise à jour du statut');
        }
    };

    const handleRequestUpdated = async (updatedRequest: PickupRequest | FirebasePickupRequest) => {
        try {
            // Vérifier si c'est une demande Firebase
            if ('requestNumber' in updatedRequest && isFirebaseEnabled) {
                await firebaseService.updatePickupRequest(updatedRequest.id!, updatedRequest);
                setFirebaseRequests(prev => 
                    prev.map(req => req.id === updatedRequest.id ? updatedRequest : req)
                );
            } else {
                setPickupRequests(prev => 
                    prev.map(req => req.id === updatedRequest.id ? updatedRequest : req)
                );
            }
        } catch (error) {
            console.error('Error updating request:', error);
            alert('Erreur lors de la mise à jour de la demande');
        }
    };

    const handlePDFGenerated = (request: PickupRequestPDF) => {
        console.log('PDF Request generated:', request);
        // Vous pouvez ici ajouter la logique pour sauvegarder la demande si nécessaire
    };

    return (
        <div className="min-h-screen font-sans bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
            <Header currentView={currentView} onViewChange={setCurrentView} />
            <main className="container mx-auto p-4 sm:p-6 lg:p-8 fade-in">
                {currentView === 'inventory' && (
                    <InventoryManager inventory={inventory} onUpdateInventory={setInventory} />
                )}
                {currentView === 'new_request' && (
                    <UnifiedRequestForm 
                        inventory={inventory} 
                        onSubmit={handleAddRequest}
                        onPDFGenerated={handlePDFGenerated}
                    />
                )}
                {currentView === 'history' && (
                    <RequestHistory 
                        requests={allRequests} 
                        onUpdateRequestStatus={handleUpdateRequestStatus}
                        onRequestUpdated={handleRequestUpdated}
                        inventory={inventory}
                    />
                )}
            </main>
        </div>
    );
};

export default App;
