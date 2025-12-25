import React, { useState, useMemo, useCallback } from 'react';
import type { PickupRequest } from '../types';
import { FirebasePickupRequest } from '../services/firebaseService';
import { generatePdf } from '../services/pdfService';
import { PDFService, createPickupRequestPDF, groupItemsByLocation } from '../services/pdfServiceMulti';
import { FileTextIcon, XMarkIcon, ArrowDownTrayIcon, PaperClipIcon } from './icons';
import RequestDetail from './RequestDetail';
import type { SelectedItem } from '../types-pdf';
import { LOCATIONS } from '../constants';
import * as XLSX from 'xlsx';
import CostDistributionModal from './CostDistributionModal';

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'pending':
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200 dark:ring-yellow-900';
        case 'in_progress':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 dark:ring-blue-900';
        case 'completed':
            return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 dark:ring-green-900';
        case 'cancelled':
            return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 dark:ring-red-900';
        default:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
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

interface RequestHistoryRowProps {
    request: PickupRequest | FirebasePickupRequest;
    onViewDetails: (request: PickupRequest | FirebasePickupRequest) => void;
    onRegeneratePDF: (request: PickupRequest | FirebasePickupRequest) => void;
    onCancel: (requestId: string) => void;
    onOpenCostModal: (request: PickupRequest | FirebasePickupRequest) => void;
    onStatusChange: (requestId: string, status: 'pending' | 'completed' | 'in_progress' | 'cancelled') => void;
}

const RequestHistoryRow = React.memo(({
    request,
    onViewDetails,
    onRegeneratePDF,
    onCancel,
    onOpenCostModal,
    onStatusChange
}: RequestHistoryRowProps) => {
    const isFirebaseRequest = 'requestNumber' in request;
    const displayNumber = isFirebaseRequest
        ? `#${(request as FirebasePickupRequest).requestNumber}`
        : request.id.substring(0, 8);

    return (
        <tr className="table-row hover:bg-gray-50 dark:hover:bg-gray-700">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                {displayNumber}
                {request.bcNumber && (
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">({request.bcNumber})</span>
                )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                {new Date(request.date).toLocaleDateString('fr-CA')}
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                {request.location.length > 30 ? request.location.substring(0, 30) + '...' : request.location}
                {request.locationComments && Object.keys(request.locationComments).length > 1 && (
                    <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded dark:bg-blue-900 dark:text-blue-200">+{Object.keys(request.locationComments).length - 1}</span>
                )}
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="font-medium dark:text-gray-300">
                    {request.items.reduce((sum, item) => sum + item.quantity, 0)} contenant(s)
                </div>
                <div className="text-xs text-gray-400 mt-1">
                    {request.items.slice(0, 2).map(i => i.name).join(', ')}
                    {request.items.length > 2 && ` +${request.items.length - 2} autre(s)`}
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                <button
                    onClick={() => onOpenCostModal(request)}
                    className={`font-medium hover:underline ${request.cost ? 'text-gray-900 dark:text-white' : 'text-blue-600 dark:text-blue-400 italic'}`}
                    title="Cliquez pour modifier le coût"
                >
                    {request.cost ? `${request.cost.toFixed(2)} $` : 'Ajouter coût'}
                </button>
                {request.invoiceUrl && (
                    <a
                        href={request.invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 inline-block text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Voir la facture"
                    >
                        <PaperClipIcon className="w-4 h-4" />
                    </a>
                )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <select
                    value={request.status}
                    onChange={(e) => onStatusChange(request.id, e.target.value as any)}
                    className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-500 ${getStatusBadge(request.status)}`}
                >
                    <option value="pending">En attente</option>
                    <option value="in_progress">En cours</option>
                    <option value="completed">Complétée</option>
                    <option value="cancelled">Annulées</option>
                </select>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => onViewDetails(request)}
                        className="text-blue-600 hover:text-blue-800 transition-colors px-2 py-1 rounded hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-gray-700"
                        title="Voir les détails"
                    >
                        Détails
                    </button>
                    <button
                        onClick={() => onRegeneratePDF(request)}
                        className="text-green-600 hover:text-green-800 transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-gray-700"
                        title="Régénérer PDF"
                    >
                        <FileTextIcon className="w-4 h-4" />
                        <span className="text-xs">PDF</span>
                    </button>
                    {request.status !== 'cancelled' && (
                        <button
                            onClick={() => onCancel(request.id)}
                            className="text-red-600 hover:text-red-800 transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-gray-700"
                            title="Annuler la demande"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
});

RequestHistoryRow.displayName = 'RequestHistoryRow';

interface RequestHistoryProps {
    requests: (PickupRequest | FirebasePickupRequest)[];
    onUpdateRequestStatus: (requestId: string, status: 'pending' | 'completed') => void;
    onRequestUpdated?: (updatedRequest: PickupRequest | FirebasePickupRequest) => void;
    inventory: Array<{ id: string; name: string; quantity: number; location: string }>;
}

const RequestHistory: React.FC<RequestHistoryProps> = ({
    requests,
    onUpdateRequestStatus,
    onRequestUpdated,
    inventory
}) => {
    const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled'>('all');
    const [selectedRequest, setSelectedRequest] = useState<PickupRequest | FirebasePickupRequest | null>(null);

    // Advanced Filters
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [locationFilter, setLocationFilter] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');

    const filteredRequests = useMemo(() => {
        // Optimization: Hoist expensive calculations outside the loop
        let start: Date | null = null;
        let end: Date | null = null;

        if (startDate) {
            start = new Date(startDate);
        }
        if (endDate) {
            end = new Date(endDate);
            // Set end date to end of day
            end.setHours(23, 59, 59, 999);
        }

        const query = searchQuery ? searchQuery.toLowerCase() : '';

        return requests.filter(request => {
            // Status Filter
            if (filter !== 'all' && request.status !== filter) return false;

            // Date Range Filter
            const requestDate = new Date(request.date);
            if (start) {
                if (requestDate < start) return false;
            }
            if (end) {
                if (requestDate > end) return false;
            }

            // Location Filter
            if (locationFilter && !request.location.includes(locationFilter)) return false;

            // Search Filter (Container name or ID)
            if (query) {
                const matchesId = 'requestNumber' in request
                    ? request.requestNumber.toString().includes(query)
                    : request.id.toLowerCase().includes(query);
                const matchesItems = request.items.some(item => item.name.toLowerCase().includes(query));

                if (!matchesId && !matchesItems) return false;
            }

            return true;
        });
    }, [requests, filter, startDate, endDate, locationFilter, searchQuery]);

    const handleViewDetails = useCallback((request: PickupRequest | FirebasePickupRequest) => {
        setSelectedRequest(request);
    }, []);

    const handleRequestUpdated = useCallback((updatedRequest: PickupRequest | FirebasePickupRequest) => {
        if (onRequestUpdated) {
            onRequestUpdated(updatedRequest);
        }
        setSelectedRequest(null);
    }, [onRequestUpdated]);

    const handleRegeneratePDF = useCallback(async (request: PickupRequest | FirebasePickupRequest) => {
        // Always try to use the new PDF service first
        // Check if we have items to generate a PDF for
        if (request.items && request.items.length > 0) {
            const pdfService = new PDFService();

            // If groupedItems is missing (legacy/history data), reconstruct it
            let requestForPdf = request as any;
            if (!requestForPdf.groupedItems) {
                // Reconstruct groupedItems from the flat items list
                // Ensure items are cast correctly to include replaceBin
                const groupedItems = groupItemsByLocation(request.items as SelectedItem[]);

                // Inject location comments if available
                if (request.locationComments) {
                    Object.keys(groupedItems).forEach(location => {
                        if (request.locationComments && request.locationComments[location]) {
                            groupedItems[location].comments = request.locationComments[location];
                        }
                    });
                }

                // Create a temporary object that matches PickupRequestPDF interface
                requestForPdf = {
                    ...request,
                    groupedItems,
                    totalItems: (request.items as any[]).reduce((sum: number, i: any) => sum + i.quantity, 0),
                    totalLocations: Object.keys(groupedItems).length,
                    // Ensure other required fields are present
                    contactName: request.contactName || 'N/A',
                    contactPhone: request.contactPhone || 'N/A',
                    date: request.date,
                    id: request.id,
                    notes: request.notes,
                    bcNumber: request.bcNumber,
                    locationComments: request.locationComments,
                    requestNumber: (request as FirebasePickupRequest).requestNumber?.toString()
                };
            }

            await pdfService.generatePickupRequestPDF(requestForPdf);

            const requestNumber = (request as FirebasePickupRequest).requestNumber || request.id.substring(0, 8);
            pdfService.save(`demande_ramassage_${requestNumber}.pdf`);
        } else {
            // Fallback only if absolutely necessary (shouldn't happen for valid requests)
            await generatePdf(request as PickupRequest);
        }
    }, []);

    const handleCancelRequest = useCallback((requestId: string) => {
        if (confirm('Voulez-vous vraiment annuler cette demande?')) {
            onUpdateRequestStatus(requestId, 'cancelled');
        }
    }, [onUpdateRequestStatus]);

    const [isCostModalOpen, setIsCostModalOpen] = useState(false);
    const [requestToEditCost, setRequestToEditCost] = useState<PickupRequest | FirebasePickupRequest | null>(null);

    const handleOpenCostModal = useCallback((request: PickupRequest | FirebasePickupRequest) => {
        setRequestToEditCost(request);
        setIsCostModalOpen(true);
    }, []);

    const handleSaveCost = useCallback((totalCost: number, locationCosts: Record<string, number>) => {
        if (requestToEditCost) {
            const updatedRequest = {
                ...requestToEditCost,
                cost: totalCost,
                locationCosts: locationCosts
            };
            if (onRequestUpdated) {
                onRequestUpdated(updatedRequest);
            }
        }
        setIsCostModalOpen(false);
        setRequestToEditCost(null);
    }, [requestToEditCost, onRequestUpdated]);

    const handleExportExcel = useCallback(() => {
        if (filteredRequests.length === 0) {
            alert("Aucune donnée à exporter");
            return;
        }

        const data = filteredRequests.map(req => {
            const number = 'requestNumber' in req ? req.requestNumber : req.id.substring(0, 8);
            const date = new Date(req.date).toLocaleDateString('fr-CA');
            const status = getStatusLabel(req.status);
            const location = req.location;
            const items = req.items.map(i => `${i.quantity}x ${i.name}`).join('; ');
            const totalQty = req.items.reduce((sum, i) => sum + i.quantity, 0);
            const cost = req.cost ? req.cost : 0;

            return {
                'Numéro': number,
                'Date': date,
                'Statut': status,
                'Lieu': location,
                'Contenants': items,
                'Quantité Totale': totalQty,
                'Coût ($)': cost
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Historique");

        // Adjust column widths
        const wscols = [
            { wch: 10 }, // Numéro
            { wch: 12 }, // Date
            { wch: 15 }, // Statut
            { wch: 30 }, // Lieu
            { wch: 50 }, // Contenants
            { wch: 15 }, // Qté Totale
            { wch: 10 }, // Coût
        ];
        worksheet['!cols'] = wscols;

        XLSX.writeFile(workbook, `export_demandes_${new Date().toISOString().split('T')[0]}.xlsx`);
    }, [filteredRequests]);

    const handleStatusChange = useCallback((requestId: string, status: 'pending' | 'completed' | 'in_progress' | 'cancelled') => {
        onUpdateRequestStatus(requestId, status as any);
    }, [onUpdateRequestStatus]);

    return (
        <div className="card p-6 slide-up dark:bg-gray-800 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6 card-header p-4 -m-6 mb-6 dark:border-gray-700">
                <h2 className="text-2xl font-bold gradient-text">📋 Historique des demandes</h2>
                <div className="flex flex-col gap-4 w-full md:w-auto">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex flex-col">
                            <label htmlFor="startDate" className="text-xs font-medium text-gray-500 dark:text-gray-400">Du</label>
                            <input
                                type="date"
                                id="startDate"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="endDate" className="text-xs font-medium text-gray-500 dark:text-gray-400">Au</label>
                            <input
                                type="date"
                                id="endDate"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="locationFilter" className="text-xs font-medium text-gray-500 dark:text-gray-400">Lieu</label>
                            <select
                                id="locationFilter"
                                value={locationFilter}
                                onChange={(e) => setLocationFilter(e.target.value)}
                                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-1 w-32 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                <option value="">Tous</option>
                                {LOCATIONS.map(loc => (
                                    <option key={loc} value={loc}>{loc}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="statusFilter" className="text-xs font-medium text-gray-500 dark:text-gray-400">Statut</label>
                            <select
                                id="statusFilter"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value as any)}
                                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                <option value="all">Tous</option>
                                <option value="pending">En attente</option>
                                <option value="in_progress">En cours</option>
                                <option value="completed">Complétées</option>
                                <option value="cancelled">Annulées</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Rechercher (ID ou contenant)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-1.5 flex-grow dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                        <button
                            onClick={handleExportExcel}
                            className="bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 transition-colors flex items-center gap-1 text-sm"
                            title="Exporter en Excel"
                        >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Excel</span>
                        </button>
                    </div>
                </div>
            </div>

            {filteredRequests.length > 0 ? (
                <div className="table-container">
                    <table className="table w-full">
                        <thead className="table-header bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="table-header-cell dark:text-gray-200">Numéro</th>
                                <th scope="col" className="table-header-cell dark:text-gray-200">Date</th>
                                <th scope="col" className="table-header-cell dark:text-gray-200">Lieu(x)</th>
                                <th scope="col" className="table-header-cell dark:text-gray-200">Contenants</th>
                                <th scope="col" className="table-header-cell dark:text-gray-200">Coût</th>
                                <th scope="col" className="table-header-cell dark:text-gray-200">Statut</th>
                                <th scope="col" className="table-header-cell text-right dark:text-gray-200">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                            {filteredRequests.map(request => (
                                <RequestHistoryRow
                                    key={request.id}
                                    request={request}
                                    onViewDetails={handleViewDetails}
                                    onRegeneratePDF={handleRegeneratePDF}
                                    onCancel={handleCancelRequest}
                                    onOpenCostModal={handleOpenCostModal}
                                    onStatusChange={handleStatusChange}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-gray-500 italic mt-4 dark:text-gray-400">Aucune demande trouvée pour ce filtre.</p>
            )}

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
        </div>
    );
};

export default RequestHistory;