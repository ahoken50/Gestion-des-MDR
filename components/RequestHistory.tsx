import React, { useState } from 'react';
import type { PickupRequest } from '../types';
import { generatePdf } from '../services/pdfService';
import { FileTextIcon } from './icons';

interface RequestHistoryProps {
    requests: PickupRequest[];
    onUpdateRequestStatus: (requestId: string, status: 'pending' | 'completed') => void;
}

// FIX: Provide implementation for RequestHistory component.
const RequestHistory: React.FC<RequestHistoryProps> = ({ requests, onUpdateRequestStatus }) => {
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

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

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-xl font-bold text-gray-800">Historique des demandes</h2>
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
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                         <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lieu</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contenants</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredRequests.map(request => (
                                <tr key={request.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(request.date).toLocaleDateString('fr-CA')}</td>
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
                                        <button onClick={() => generatePdf(request)} className="text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1">
                                            <FileTextIcon className="w-4 h-4"/> PDF
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-gray-500 italic mt-4">Aucune demande trouvée pour ce filtre.</p>
            )}
        </div>
    );
};

export default RequestHistory;
