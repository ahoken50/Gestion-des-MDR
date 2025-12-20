import { useState, useEffect } from 'react';
import { firebaseService, type FirebasePickupRequest } from '../services/firebaseService';
import type { InventoryItem, PickupRequest, RequestedItem } from '../types';
import type { PickupRequestPDF } from '../types-pdf';
import { INITIAL_INVENTORY } from '../constants';
import { useToast } from '../components/ui/Toast';

export type View = 'inventory' | 'new_request' | 'history' | 'dashboard';

export const useAppData = () => {
    const { success, error, info } = useToast();
    // Helper for toast usage because useToast returns object with methods
    const toast = { success, error, info };

    const [currentView, setCurrentView] = useState<View>('inventory');

    // State for inventory
    const [inventory, setInventory] = useState<InventoryItem[]>(() => {
        try {
            const savedInventory = localStorage.getItem('inventory');
            return savedInventory ? JSON.parse(savedInventory) : INITIAL_INVENTORY;
        } catch (error) {
            console.error("Failed to parse inventory from localStorage", error);
            return INITIAL_INVENTORY;
        }
    });

    // State for pickup requests
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

    // Persist inventory
    useEffect(() => {
        const saveInventory = async () => {
            if (isFirebaseEnabled) {
                try {
                    await firebaseService.updateInventory(inventory);
                } catch (error) {
                    console.error('Error saving inventory to Firebase:', error);
                    localStorage.setItem('inventory', JSON.stringify(inventory));
                }
            } else {
                localStorage.setItem('inventory', JSON.stringify(inventory));
            }
        };
        saveInventory();
    }, [inventory, isFirebaseEnabled]);

    // Persist local requests
    useEffect(() => {
        localStorage.setItem('pickupRequests', JSON.stringify(pickupRequests));
    }, [pickupRequests]);

    // Initialize Firebase
    useEffect(() => {
        const initFirebase = async () => {
            try {
                const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
                const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

                if (apiKey && projectId && apiKey !== 'undefined' && projectId !== 'undefined') {
                    console.log('Firebase configuration detected, initializing...');
                    setIsFirebaseEnabled(true);

                    try {
                        // Sync Inventory
                        const fbInventory = await firebaseService.getInventory();
                        if (fbInventory.length > 0) {
                            setInventory(fbInventory);
                        } else {
                            // Initial seed if Firebase is empty
                            const savedInventory = localStorage.getItem('inventory');
                            let localInventory = savedInventory ? JSON.parse(savedInventory) : [];
                            if (!localInventory || localInventory.length === 0) {
                                localInventory = INITIAL_INVENTORY;
                            }
                            await firebaseService.updateInventory(localInventory);
                            setInventory(localInventory);
                        }

                        // Sync Requests
                        const fbRequests = await firebaseService.getPickupRequests();
                        setFirebaseRequests(fbRequests);

                        // Process Offline Queue (Local Requests)
                        const savedRequests = localStorage.getItem('pickupRequests');
                        if (savedRequests) {
                            const localRequests: PickupRequest[] = JSON.parse(savedRequests);
                            if (localRequests.length > 0) {
                                toast.info(`Synchronisation de ${localRequests.length} demandes hors ligne...`);
                                let syncedCount = 0;
                                for (const req of localRequests) {
                                    try {
                                        const firebaseRequest: Omit<FirebasePickupRequest, 'id' | 'requestNumber' | 'createdAt' | 'updatedAt'> = {
                                            ...req,
                                            status: req.status as any, // Ensure status matches
                                        };
                                        // Remove ID to let Firebase generate one, or keep it if we want to track?
                                        // FirebaseService.addPickupRequest ignores ID anyway.
                                        await firebaseService.addPickupRequest(firebaseRequest);
                                        syncedCount++;
                                    } catch (err) {
                                        console.error("Failed to sync request", req, err);
                                    }
                                }

                                if (syncedCount > 0) {
                                    toast.success(`${syncedCount} demandes synchronisées avec succès !`);
                                    // Clear local requests after sync
                                    setPickupRequests([]);
                                    localStorage.removeItem('pickupRequests');
                                    // Refresh Firebase requests
                                    const updatedFbRequests = await firebaseService.getPickupRequests();
                                    setFirebaseRequests(updatedFbRequests);
                                }
                            }
                        }

                    } catch (error) {
                        console.error('Error loading/syncing data from Firebase:', error);
                        // Fallback to local data
                        const savedInventory = localStorage.getItem('inventory');
                        const localInventory = savedInventory ? JSON.parse(savedInventory) : INITIAL_INVENTORY;
                        setInventory(localInventory);
                    }
                } else {
                    setIsFirebaseEnabled(false);
                }
            } catch (error) {
                console.error('Error initializing Firebase:', error);
                setIsFirebaseEnabled(false);
            }
        };
        initFirebase();
    }, []);

    const allRequests = [...firebaseRequests, ...pickupRequests];

    const handleAddRequest = async (newRequest: Omit<PickupRequest, 'id' | 'status'>): Promise<number | undefined> => {
        try {
            let requestNumber: number | undefined;

            if (isFirebaseEnabled) {
                const firebaseRequest: Omit<FirebasePickupRequest, 'id' | 'requestNumber' | 'createdAt' | 'updatedAt'> = {
                    ...newRequest,
                    status: 'pending',
                };
                const result = await firebaseService.addPickupRequest(firebaseRequest);
                requestNumber = result.requestNumber;

                const fbRequests = await firebaseService.getPickupRequests();
                setFirebaseRequests(fbRequests);
            } else {
                const requestWithId: PickupRequest = {
                    ...newRequest,
                    id: Date.now().toString(),
                    status: 'pending',
                };
                setPickupRequests(prev => [requestWithId, ...prev]);
            }

            const updatedInventory = inventory.map(invItem => {
                const requested = newRequest.items.find(reqItem => reqItem.name === invItem.name && newRequest.location === invItem.location);
                if (requested) {
                    return { ...invItem, quantity: Math.max(0, invItem.quantity - requested.quantity) };
                }
                return invItem;
            });
            setInventory(updatedInventory);
            setCurrentView('history');
            toast.success('Demande créée avec succès !');
            return requestNumber;
        } catch (error) {
            console.error('Error saving request:', error);
            toast.error('Erreur lors de la sauvegarde de la demande');
            return undefined;
        }
    };

    const handleUpdateRequestStatus = async (requestId: string, status: 'pending' | 'in_progress' | 'completed' | 'cancelled') => {
        try {
            const firebaseRequest = firebaseRequests.find(req => req.id === requestId);
            if (firebaseRequest && isFirebaseEnabled) {
                await firebaseService.updatePickupRequest(requestId, { status });
                setFirebaseRequests(prev => prev.map(req => req.id === requestId ? { ...req, status } : req));
            } else {
                setPickupRequests(prev => prev.map(req => req.id === requestId ? { ...req, status } : req));
            }
        } catch (error) {
            console.error('Error updating request status:', error);
            toast.error('Erreur lors de la mise à jour du statut');
        }
    };

    const handleRequestUpdated = async (updatedRequest: PickupRequest | FirebasePickupRequest) => {
        try {
            if ('requestNumber' in updatedRequest && isFirebaseEnabled) {
                await firebaseService.updatePickupRequest(updatedRequest.id!, updatedRequest);
                setFirebaseRequests(prev => prev.map(req => req.id === updatedRequest.id ? updatedRequest : req));
            } else {
                setPickupRequests(prev => prev.map(req => req.id === updatedRequest.id ? updatedRequest : req));
            }
        } catch (error) {
            console.error('Error updating request:', error);
            toast.error('Erreur lors de la mise à jour de la demande');
        }
    };

    const handlePDFGenerated = async (request: PickupRequestPDF) => {
        try {
            const allItems: RequestedItem[] = [];
            const locations: string[] = [];

            Object.entries(request.groupedItems).forEach(([location, locationData]) => {
                locations.push(location);
                const items = Array.isArray(locationData) ? locationData : locationData.items;
                items.forEach(item => {
                    allItems.push({
                        id: item.id,
                        name: item.name,
                        quantity: item.quantity,
                        location: item.location,
                        replaceBin: item.replaceBin
                    });
                });
            });

            const historyRequest: Omit<PickupRequest, 'id' | 'status'> = {
                bcNumber: request.bcNumber,
                location: locations.join(', '),
                items: allItems,
                date: request.date,
                contactName: request.contactName,
                contactPhone: request.contactPhone,
                notes: request.notes,
                locationComments: request.locationComments
            };

            if (isFirebaseEnabled) {
                const firebaseRequest: Omit<FirebasePickupRequest, 'id' | 'requestNumber' | 'createdAt' | 'updatedAt'> = {
                    ...historyRequest,
                    status: 'pending',
                };
                await firebaseService.addPickupRequest(firebaseRequest);
                const fbRequests = await firebaseService.getPickupRequests();
                setFirebaseRequests(fbRequests);
            } else {
                const requestWithId: PickupRequest = {
                    ...historyRequest,
                    id: Date.now().toString(),
                    status: 'pending',
                };
                setPickupRequests(prev => [requestWithId, ...prev]);
            }

            const updatedInventory = inventory.map(invItem => {
                const totalRequested = allItems
                    .filter(reqItem => !reqItem.id.startsWith('custom-') && reqItem.name === invItem.name && reqItem.location === invItem.location)
                    .reduce((sum, item) => sum + item.quantity, 0);

                if (totalRequested > 0) {
                    return { ...invItem, quantity: Math.max(0, invItem.quantity - totalRequested) };
                }
                return invItem;
            });
            setInventory(updatedInventory);

        } catch (error) {
            console.error('Error saving PDF request to history:', error);
        }
    };

    return {
        currentView,
        setCurrentView,
        inventory,
        setInventory,
        allRequests,
        handleAddRequest,
        handleUpdateRequestStatus,
        handleRequestUpdated,
        handlePDFGenerated
    };
};
