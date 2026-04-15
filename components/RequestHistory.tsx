import React, { useState, useMemo, useCallback } from 'react';
import type { PickupRequest } from '../types';
import { FirebasePickupRequest } from '../services/firebaseService';
import { generatePdf } from '../services/pdfService';
import { PDFService, createPickupRequestPDF, groupItemsByLocation } from '../services/pdfServiceMulti';
import { FileTextIcon, XMarkIcon, ArrowDownTrayIcon, PaperClipIcon, MagnifyingGlassIcon } from './icons';
import type { SelectedItem } from '../types-pdf';
import { LOCATIONS } from '../constants';
import * as XLSX from 'xlsx';
import { useToast } from './ui/Toast';

const calculateTotalQuantity = (items: { quantity: number }[]) => {
    let sum = 0;
    if (!items) return 0;
    for (const item of items) {
        sum += item.quantity || 0;
    }
    return sum;
};

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
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
}

const RequestHistoryRow = React.memo(({
    request,
    onViewDetails,
    onRegeneratePDF,
    onCancel,
    onOpenCostModal,
    onStatusChange,
    isSelected,
    onToggleSelect
}: RequestHistoryRowProps) => {
    const isFirebaseRequest = 'requestNumber' in request;
    const displayNumber = isFirebaseRequest
        ? `#${(request as FirebasePickupRequest).requestNumber}`
        : request.id.substring(0, 8);

    return (
        <tr className={`table-row hover:bg-gray-50 dark:hover:bg-gray-700 ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
            <td className="px-6 py-4 whitespace-nowrap">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(request.id)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 dark:border-gray-600 dark:bg-gray-700"
                />
            </td>
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
                    {calculateTotalQuantity(request.items)} contenant(s)
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
                    <option value="cancelled">Annulée</option>
                </select>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => onViewDetails(request)}
                        className="text-blue-600 hover:text-blue-800 transition-colors px-2 py-1 rounded hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-gray-700"
                    >
                        Détails
                    </button>
                    <button
                        onClick={() => onRegeneratePDF(request)}
                        className="text-green-600 hover:text-green-800 transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-gray-700"
                    >
                        <FileTextIcon className="w-4 h-4" />
                        <span className="text-xs">PDF</span>
                    </button>
                    {request.status !== 'cancelled' && (
                        <button
                            onClick={() => onCancel(request.id)}
                            className="text-red-600 hover:text-red-800 transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-gray-700"
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
    onUpdateRequestStatus: (requestId: string, status: 'pending' | 'completed' | 'in_progress' | 'cancelled') => void;
    onRequestUpdated?: (updatedRequest: PickupRequest | FirebasePickupRequest) => void;
    onBulkUpdate: (ids: string[], updates: { status?: 'pending' | 'completed' | 'in_progress' | 'cancelled'; bcNumber?: string }) => void;
    inventory: Array<{ id: string; name: string; quantity: number; location: string }>;
    selectedRequest: PickupRequest | FirebasePickupRequest | null;
    onSelectedRequestChange: (request: PickupRequest | FirebasePickupRequest | null) => void;
    onOpenCostModal: (request: PickupRequest | FirebasePickupRequest) => void;
}

const RequestHistory: React.FC<RequestHistoryProps> = ({
    requests,
    onUpdateRequestStatus,
    onRequestUpdated,
    onBulkUpdate,
    inventory,
    selectedRequest,
    onSelectedRequestChange,
    onOpenCostModal
}) => {
    const { success: toastSuccess } = useToast();
    const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled'>('all');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [bulkBCNumber, setBulkBCNumber] = useState('');

    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [locationFilter, setLocationFilter] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');

    const requestsWithMeta = useMemo(() => {
        return requests.map(req => ({
            original: req,
            timestamp: new Date(req.date).getTime()
        }));
    }, [requests]);

    const filteredRequests = useMemo(() => {
        const startTimestamp = startDate ? new Date(startDate).getTime() : null;
        const end = endDate ? new Date(endDate) : null;
        let endTimestamp: number | null = null;

        if (end) {
            end.setHours(23, 59, 59, 999);
            endTimestamp = end.getTime();
        }

        const query = searchQuery ? searchQuery.toLowerCase() : '';

        return requestsWithMeta.filter(({ original: request, timestamp }) => {
            if (filter !== 'all' && request.status !== filter) return false;
            if (startTimestamp !== null && timestamp < startTimestamp) return false;
            if (endTimestamp !== null && timestamp > endTimestamp) return false;
            if (locationFilter && !request.location.includes(locationFilter)) return false;

            if (query) {
                const matchesId = 'requestNumber' in request
                    ? request.requestNumber.toString().includes(query)
                    : request.id.toLowerCase().includes(query);

                if (matchesId) return true;
                const matchesItems = request.items.some(item => item.name.toLowerCase().includes(query));
                if (!matchesItems) return false;
            }

            return true;
        }).map(item => item.original);
    }, [requestsWithMeta, filter, startDate, endDate, locationFilter, searchQuery]);

    const handleRegeneratePDF = useCallback(async (request: PickupRequest | FirebasePickupRequest) => {
        if (request.items && request.items.length > 0) {
            const pdfService = new PDFService();
            let requestForPdf = request as any;
            if (!requestForPdf.groupedItems) {
                // Fix for the missing location bug in history: items may not have item.location
                // We inject the general request.location if the item doesn't have one to prevent 'Non spécifié'
                const itemsWithLocation = request.items.map(item => ({
                    ...item,
                    location: ('location' in item && item.location) ? item.location : (request.location || 'Non spécifié')
                }));

                const groupedItems = groupItemsByLocation(itemsWithLocation as SelectedItem[]);
                if (request.locationComments) {
                    Object.keys(groupedItems).forEach(location => {
                        if (request.locationComments && request.locationComments[location]) {
                            groupedItems[location].comments = request.locationComments[location];
                        }
                    });
                }

                requestForPdf = {
                    ...request,
                    groupedItems,
                    totalItems: calculateTotalQuantity(request.items),
                    totalLocations: Object.keys(groupedItems).length,
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
            await generatePdf(request as PickupRequest);
        }
    }, []);

    const handleCancelRequest = useCallback((requestId: string) => {
        if (confirm('Voulez-vous vraiment annuler cette demande?')) {
            onUpdateRequestStatus(requestId, 'cancelled');
        }
    }, [onUpdateRequestStatus]);

    const handleExportExcel = useCallback(() => {
        if (filteredRequests.length === 0) {
            alert("Aucune donnée à exporter");
            return;
        }

        const summaryData = filteredRequests.map(req => {
            const number = 'requestNumber' in req ? req.requestNumber : req.id.substring(0, 8);
            return {
                'Numéro': number,
                'Date de Demande': new Date(req.date).toLocaleDateString('fr-CA'),
                'Statut': getStatusLabel(req.status),
                'Lieu Principal': req.location,
                'Total Contenants': calculateTotalQuantity(req.items),
                'Coût ($)': req.cost || 0,
                'BC #': req.bcNumber || '',
                'Notes': req.notes || ''
            };
        });

        const detailedData: any[] = [];
        filteredRequests.forEach(req => {
            const number = 'requestNumber' in req ? req.requestNumber : req.id.substring(0, 8);
            req.items.forEach(item => {
                detailedData.push({
                    'No Requête': number,
                    'Date': new Date(req.date).toLocaleDateString('fr-CA'),
                    'Nom du Contenant': item.name,
                    'Quantité': item.quantity,
                    'Lieu Spécifique': item.location || req.location,
                    'Remplacement': item.replaceBin ? 'OUI' : 'NON'
                });
            });
        });

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summaryData), "Résumé des Demandes");
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(detailedData), "Détails par Article");
        XLSX.writeFile(workbook, `Rapport_MDR_${new Date().toISOString().split('T')[0]}.xlsx`);
        toastSuccess('Fichier Excel généré avec succès !');
    }, [filteredRequests, toastSuccess]);

    const handleSelectAll = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(filteredRequests.map(r => r.id));
        } else {
            setSelectedIds([]);
        }
    }, [filteredRequests]);

    const toggleSelect = useCallback((id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }, []);

    const handleBulkStatusChange = (status: any) => {
        onBulkUpdate(selectedIds, { status });
        setSelectedIds([]);
    };

    const handleBulkBCChange = () => {
        if (!bulkBCNumber.trim()) return;
        onBulkUpdate(selectedIds, { bcNumber: bulkBCNumber });
        setBulkBCNumber('');
        setSelectedIds([]);
    };

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
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Du</label>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Au</label>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Lieu</label>
                            <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-1 w-32 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                <option value="">Tous</option>
                                {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Statut</label>
                            <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
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
                        <button onClick={handleExportExcel} className="bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 transition-colors flex items-center gap-1 text-sm">
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
                                <th className="px-6 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        onChange={handleSelectAll}
                                        checked={selectedIds.length === filteredRequests.length && filteredRequests.length > 0}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 dark:border-gray-600 dark:bg-gray-700 cursor-pointer"
                                    />
                                </th>
                                <th className="table-header-cell dark:text-gray-200">No. Requete/BC</th>
                                <th className="table-header-cell dark:text-gray-200">Date</th>
                                <th className="table-header-cell dark:text-gray-200">Lieu(x)</th>
                                <th className="table-header-cell dark:text-gray-200">Contenants</th>
                                <th className="table-header-cell dark:text-gray-200">Coût</th>
                                <th className="table-header-cell dark:text-gray-200">Statut</th>
                                <th className="table-header-cell text-right dark:text-gray-200">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                            {filteredRequests.map(request => (
                                <RequestHistoryRow
                                    key={request.id}
                                    request={request}
                                    onViewDetails={onSelectedRequestChange}
                                    onRegeneratePDF={handleRegeneratePDF}
                                    onCancel={handleCancelRequest}
                                    onOpenCostModal={onOpenCostModal}
                                    onStatusChange={handleStatusChange}
                                    isSelected={selectedIds.includes(request.id)}
                                    onToggleSelect={toggleSelect}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full mb-3">
                        <MagnifyingGlassIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Aucune demande trouvée</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-4">
                        Aucun résultat ne correspond à vos filtres actuels.
                    </p>
                    <button
                        onClick={() => { setFilter('all'); setStartDate(''); setEndDate(''); setLocationFilter(''); setSearchQuery(''); }}
                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                    >
                        Réinitialiser tous les filtres
                    </button>
                </div>
            )}

            {selectedIds.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 glass dark:glass-dark p-4 rounded-3xl shadow-2xl border border-blue-500/20 z-[60] flex items-center space-x-6 view-enter">
                    <div className="flex items-center space-x-3 px-4 border-r border-gray-200 dark:border-gray-700">
                        <span className="bg-blue-600 text-white w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold shadow-lg shadow-blue-500/30">
                            {selectedIds.length}
                        </span>
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Sélectionnés</span>
                    </div>

                    <div className="flex items-center space-x-3">
                        <select onChange={(e) => handleBulkStatusChange(e.target.value)} className="text-xs font-bold rounded-xl px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 transition-all outline-none dark:text-white">
                            <option value="">Changer Statut...</option>
                            <option value="pending">En attente</option>
                            <option value="in_progress">En cours</option>
                            <option value="completed">Complétée</option>
                            <option value="cancelled">Annulée</option>
                        </select>
                        <div className="flex items-center space-x-2">
                             <input type="text" placeholder="Numéro de BC..." value={bulkBCNumber} onChange={(e) => setBulkBCNumber(e.target.value)} className="text-xs font-bold rounded-xl px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 transition-all outline-none w-32 dark:text-white" />
                             <button onClick={handleBulkBCChange} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95">Appliquer BC</button>
                        </div>
                        <button onClick={() => setSelectedIds([])} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RequestHistory;