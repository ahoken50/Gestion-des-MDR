import React from 'react';
import Layout from './components/Layout';
import InventoryManager from './components/InventoryManager';
import UnifiedRequestForm from './components/UnifiedRequestForm';
import RequestHistory from './components/RequestHistory';
import Dashboard from './components/Dashboard';
import AIInsights from './components/AIInsights';
import { useAppData } from './hooks/useAppData';

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
        handlePDFGenerated
    } = useAppData();

    return (
        <ThemeProvider>
            <Layout currentView={currentView} onViewChange={setCurrentView}>
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
                    <Dashboard requests={allRequests} inventory={inventory} />
                )}
            </Layout>
        </ThemeProvider>
    );
};

export default App;
