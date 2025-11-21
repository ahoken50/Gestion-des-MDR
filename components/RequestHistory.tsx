import React, { useState } from 'react';
import type { PickupRequest } from '../types';
import { FirebasePickupRequest } from '../services/firebaseService';
import { generatePdf } from '../services/pdfService';
import { PDFService, createPickupRequestPDF, groupItemsByLocation } from '../services/pdfServiceMulti';
import { FileTextIcon, XMarkIcon } from './icons';
import RequestDetail from './RequestDetail';
import type { SelectedItem } from '../types-pdf';

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
    const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled'>('all');
    const [selectedRequest, setSelectedRequest] = useState<PickupRequest | FirebasePickupRequest | null>(null);

    const filteredRequests = requests.filter(request => {
        if (filter === 'all') return true;
        return request.status === filter;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'in_progress':
                return 'bg-blue-100 text-blue-800';
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return 'En attente';
            case 'in_progress': return 'En cours';
            case 'completed': return 'Complétée';
            case 'cancelled': return 'Annulée';
            default: return status;
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

    const handleRegeneratePDF = (request: PickupRequest | FirebasePickupRequest) => {
        // Check if it's a multi-location request
        if (request.locationComments || (request.items.length > 0 && request.items.some(item => item.location))) {
            // Multi-location PDF
            const selectedItems: SelectedItem[] = request.items.map(item => ({
                id: item.id || `temp-${Date.now()}-${Math.random()}`,
                name: item.name,
                quantity: item.quantity,
                location: item.location || request.location
            }));

            const contactInfo = {
                name: request.contactName,
                phone: request.contactPhone,
                notes: request.notes,
                bcNumber: request.bcNumber
            };

            // Reconstruct grouped items with comments
            const groupedItems = groupItemsByLocation(selectedItems);
            const groupedItemsWithComments: Record<string, { items: any[], comments?: string }> = {};

            Object.entries(groupedItems).forEach(([loc, data]) => {
                groupedItemsWithComments[loc] = {
                    items: data.items,
                    comments: request.locationComments?.[loc]
                };
            });

            const pdfRequest = createPickupRequestPDF(selectedItems, contactInfo, groupedItemsWithComments);
            const pdfService = new PDFService();
            pdfService.generatePickupRequestPDF(pdfRequest);
            const requestNumber = 'requestNumber' in request ? request.requestNumber : request.id.substring(0, 8);
            pdfService.save(`demande_ramassage_${requestNumber}.pdf`);
        } else {
            // Simple single-location PDF
            generatePdf(request as PickupRequest);
        }
    };

    const handleCancelRequest = (requestId: string) => {
        if (confirm('Voulez-vous vraiment annuler cette demande?')) {
            onUpdateRequestStatus(requestId, 'cancelled');
        }
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
                        onChange={(e) => setFilter(e.target.value as any)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-1.5"
                    >
                        <option value="all">Toutes</option>
                        <option value="pending">En attente</option>
                        <option value="in_progress">En cours</option>
                        <option value="completed">Complétées</option>
                        <option value="cancelled">Annulées</option>
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
                                <th scope="col" className="table-header-cell">Lieu(x)</th>
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
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {request.location.length > 30 ? request.location.substring(0, 30) + '...' : request.location}
                                            {request.locationComments && Object.keys(request.locationComments).length > 1 && (
                                                <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">+{Object.keys(request.locationComments).length - 1}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            <div className="font-medium">{request.items.length} contenant(s)</div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                {request.items.slice(0, 2).map(i => i.name).join(', ')}
                                                {request.items.length > 2 && ` +${request.items.length - 2}`}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select
                                                value={request.status}
                                                onChange={(e) => onUpdateRequestStatus(request.id, e.target.value as any)}
                                                className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-500 ${getStatusBadge(request.status)}`}
                                            >
                                                <option value="pending">En attente</option>
                                                <option value="in_progress">En cours</option>
                                                <option value="completed">Complétée</option>
                                                <option value="cancelled">Annulée</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleViewDetails(request)}
                                                    className="text-blue-600 hover:text-blue-800 transition-colors px-2 py-1 rounded hover:bg-blue-50"
                                                    title="Voir les détails"
                                                >
                                                    Détails
                                                </button>
                                                <button
                                                    onClick={() => handleRegeneratePDF(request)}
                                                    className="text-green-600 hover:text-green-800 transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-green-50"
                                                    title="Régénérer PDF"
                                                >
                                                    <FileTextIcon className="w-4 h-4" />
                                                    <span className="text-xs">PDF</span>
                                                </button>
                                                {request.status !== 'cancelled' && (
                                                    <button
                                                        onClick={() => handleCancelRequest(request.id)}
                                                        className="text-red-600 hover:text-red-800 transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50"
                                                        title="Annuler la demande"
                                                    >
                                                        <XMarkIcon className="w-4 h-4" />
                                                    </button>
                                                )}
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
