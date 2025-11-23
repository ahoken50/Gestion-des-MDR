import React from 'react';
import Header from './components/Header';
import InventoryManager from './components/InventoryManager';
import UnifiedRequestForm from './components/UnifiedRequestForm';
import RequestHistory from './components/RequestHistory';
import Dashboard from './components/Dashboard';
import { useAppData } from './hooks/useAppData';

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
        handlePDFGenerated
    } = useAppData();

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
                {currentView === 'dashboard' && (
                    <Dashboard requests={allRequests} inventory={inventory} />
                )}
            </main>
        </div>
    );
};

export default App;
