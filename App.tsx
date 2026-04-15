import React from 'react';
import Layout from './components/Layout';
import InventoryManager from './components/InventoryManager';
import UnifiedRequestForm from './components/UnifiedRequestForm';
import RequestHistory from './components/RequestHistory';
import Dashboard from './components/Dashboard';
import AIInsights from './components/AIInsights';
import CalendarView from './components/CalendarView';
import { useAppData } from './hooks/useAppData';

import RequestDetail from './components/RequestDetail';
import CostDistributionModal from './components/CostDistributionModal';
import { ThemeProvider } from './components/ThemeContext';

const App: React.FC = () => {
    const {
        currentView,
        setCurrentView,
        inventory,
        setInventory,
        allRequests,
        handleAddRequest,
        handleUpdateRequestStatus,
        handleRequestUpdated,
        handlePDFGenerated,
        handleBulkUpdateRequests,
        selectedRequest,
        setSelectedRequest,
        isCostModalOpen,
        setIsCostModalOpen,
        requestToEditCost,
        setRequestToEditCost
    } = useAppData();

    const handleSaveCost = (totalCost: number, locationCosts: Record<string, number>) => {
        if (requestToEditCost) {
            handleRequestUpdated({
                ...requestToEditCost,
                cost: totalCost,
                locationCosts: locationCosts
            });
        }
        setIsCostModalOpen(false);
        setRequestToEditCost(null);
    };

    return (
        <ThemeProvider>
            <Layout currentView={currentView} onViewChange={setCurrentView}>
                <div key={currentView} className="view-enter">
                    {currentView === 'inventory' && (
                        <InventoryManager 
                            inventory={inventory} 
                            onUpdateInventory={setInventory} 
                            requests={allRequests}
                        />
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
                            onBulkUpdate={handleBulkUpdateRequests}
                            inventory={inventory}
                            selectedRequest={selectedRequest}
                            onSelectedRequestChange={setSelectedRequest}
                            onOpenCostModal={(request) => {
                                setRequestToEditCost(request);
                                setIsCostModalOpen(true);
                            }}
                        />
                    )}
                    {currentView === 'calendar' && (
                        <CalendarView 
                            requests={allRequests}
                            onViewRequest={(req) => {
                                // We can either navigate to history with filter or show a modal
                                // For now, let's navigate to history view and show details
                                setSelectedRequest(req);
                                setCurrentView('history');
                            }}
                        />
                    )}
                    {currentView === 'home' && (
                        <UnifiedRequestForm
                            inventory={inventory}
                            onSubmit={handleAddRequest}
                            onPDFGenerated={handlePDFGenerated}
                        />
                    )}
                    {currentView === 'ai' && (
                        <AIInsights />
                    )}
                    {currentView === 'dashboard' && (
                        <Dashboard requests={allRequests} />
                    )}
                </div>
            </Layout>

            {/* Global Modals rendered outside the transformed container */}
            {selectedRequest && (
                <RequestDetail
                    request={selectedRequest}
                    onUpdate={handleRequestUpdated}
                    onCancel={() => setSelectedRequest(null)}
                    inventory={inventory}
                />
            )}

            {isCostModalOpen && requestToEditCost && (
                <CostDistributionModal
                    isOpen={isCostModalOpen}
                    onClose={() => setIsCostModalOpen(false)}
                    onSave={handleSaveCost}
                    locations={
                        // Extract unique locations from items
                        Array.from(new Set(requestToEditCost.items.map(item => item.location || requestToEditCost.location)))
                    }
                    initialTotalCost={requestToEditCost.cost}
                    initialLocationCosts={requestToEditCost.locationCosts}
                />
            )}
        </ThemeProvider>
    );
};

export default App;
