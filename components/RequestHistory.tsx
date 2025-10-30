import React, { useState } from 'react';
import type { PickupRequest } from '../types';
import { FirebasePickupRequest } from '../services/firebaseService';
import { generatePdf } from '../services/pdfService';
import { FileTextIcon } from './icons';
import RequestDetail from './RequestDetail';

interface RequestHistoryProps {
    requests: (PickupRequest | FirebasePickupRequest)[];
    onUpdateRequestStatus: (requestId: string, status: 'pending' | 'completed') => void;
    onRequestUpdated?: (updatedRequest: PickupRequest | FirebasePickupRequest) => void;
    inventory: Array<{ id: string; name: string; quantity: number; location: string }>;
}

// FIX: Provide implementation for RequestHistory component.
const RequestHistory: React.FC<RequestHistoryProps> = ({ 
    requests, 
    onUpdateRequestStatus, 
    onRequestUpdated,
    inventory 
}) => {
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
    const [selectedRequest, setSelectedRequest] = useState<PickupRequest | FirebasePickupRequest | null>(null);

    const filteredRequests = requests.filter(request => {
        if (filter === 'all') return true;
        return request.status === filter;
    });
    
    const getStatusBadge = (status: 'pending' | 'completed') => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'completed':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const handleViewDetails = (request: PickupRequest | FirebasePickupRequest) => {
        setSelectedRequest(request);
    };

    const handleRequestUpdated = (updatedRequest: PickupRequest | FirebasePickupRequest) => {
        if (onRequestUpdated) {
            onRequestUpdated(updatedRequest);
        }
        setSelectedRequest(null);
    };

    return (
        <div className="card p-6 slide-up">
            <div className="flex justify-between items-center mb-6 card-header p-4 -m-6 mb-6">
                <h2 className="text-2xl font-bold gradient-text">📋 Historique des demandes</h2>
                <div className="flex items-center space-x-2">
                    <label htmlFor="statusFilter" className="text-sm font-medium text-gray-700">Filtrer:</label>
                    <select
                        id="statusFilter"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as 'all' | 'pending' | 'completed')}
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-1.5"
                    >
                        <option value="all">Toutes</option>
                        <option value="pending">En attente</option>
                        <option value="completed">Complétées</option>
                    </select>
                </div>
            </div>
            
            {filteredRequests.length > 0 ? (
                <div className="table-container">
                    <table className="table">
                         <thead className="table-header">
                            <tr>
                                <th scope="col" className="table-header-cell">Numéro</th>
                                <th scope="col" className="table-header-cell">Date</th>
                                <th scope="col" className="table-header-cell">Lieu</th>
                                <th scope="col" className="table-header-cell">Contenants</th>
                                <th scope="col" className="table-header-cell">Statut</th>
                                <th scope="col" className="table-header-cell text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredRequests.map(request => {
                                const isFirebaseRequest = 'requestNumber' in request;
                                const displayNumber = isFirebaseRequest 
                                    ? `#${(request as FirebasePickupRequest).requestNumber}`
                                    : request.id.substring(0, 8);
                                
                                return (
                                    <tr key={request.id} className="table-row">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {displayNumber}
                                            {request.bcNumber && (
                                                <span className="ml-2 text-xs text-gray-500">({request.bcNumber})</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(request.date).toLocaleDateString('fr-CA')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.location}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {request.items.map(item => `${item.name} (x${item.quantity})`).join(', ')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                             <select
                                                value={request.status}
                                                onChange={(e) => onUpdateRequestStatus(request.id, e.target.value as 'pending' | 'completed')}
                                                className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-500 ${getStatusBadge(request.status)}`}
                                            >
                                                <option value="pending">En attente</option>
                                                <option value="completed">Complétée</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handleViewDetails(request)} 
                                                    className="text-blue-600 hover:text-blue-800 transition-colors"
                                                    title="Voir les détails"
                                                >
                                                    Détails
                                                </button>
                                                <button 
                                                    onClick={() => generatePdf(request as PickupRequest)} 
                                                    className="text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
                                                    title="Générer PDF"
                                                >
                                                    <FileTextIcon className="w-4 h-4"/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-gray-500 italic mt-4">Aucune demande trouvée pour ce filtre.</p>
            )}
            
            {selectedRequest && (
                <RequestDetail
                    request={selectedRequest}
                    onUpdate={handleRequestUpdated}
                    onCancel={() => setSelectedRequest(null)}
                    inventory={inventory}
                />
            )}
        </div>
    );
};

export default RequestHistory;
