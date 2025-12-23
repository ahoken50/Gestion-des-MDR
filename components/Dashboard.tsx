import React, { useMemo, useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
} from 'recharts';
import type { PickupRequest, InventoryItem } from '../types';
import { FirebasePickupRequest } from '../services/firebaseService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ArrowDownTrayIcon } from './icons';
import { useToast } from './ui/Toast';

interface DashboardProps {
    requests: (PickupRequest | FirebasePickupRequest)[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Dashboard: React.FC<DashboardProps> = React.memo(({ requests }) => {
    const { error: toastError, success: toastSuccess } = useToast();
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
    const [customDateRange, setCustomDateRange] = useState<{ start: string; end: string }>({
        start: '',
        end: ''
    });

    // Filter requests by selected year and period
    const filteredRequests = useMemo(() => {
        let filtered = requests.filter(req => new Date(req.date).getFullYear() === selectedYear);

        const now = new Date();

        switch (selectedPeriod) {
            case 'month':
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                filtered = filtered.filter(req => {
                    const date = new Date(req.date);
                    return date >= startOfMonth && date <= endOfMonth;
                });
                break;
            case 'quarter':
                const currentQuarter = Math.floor(now.getMonth() / 3);
                const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
                const endOfQuarter = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
                filtered = filtered.filter(req => {
                    const date = new Date(req.date);
                    return date >= startOfQuarter && date <= endOfQuarter;
                });
                break;
            case 'last30':
                const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                filtered = filtered.filter(req => new Date(req.date) >= last30Days);
                break;
            case 'custom':
                if (customDateRange.start && customDateRange.end) {
                    const startDate = new Date(customDateRange.start);
                    const endDate = new Date(customDateRange.end);
                    filtered = filtered.filter(req => {
                        const date = new Date(req.date);
                        return date >= startDate && date <= endDate;
                    });
                }
                break;
            case 'all':
            default:
                // Already filtered by year
                break;
        }

        return filtered;
    }, [requests, selectedYear, selectedPeriod, customDateRange]);

    // Get available years from requests
    const availableYears = useMemo(() => {
        const years = new Set(requests.map(req => new Date(req.date).getFullYear()));
        years.add(new Date().getFullYear()); // Always include current year
        return Array.from(years).sort((a, b) => b - a);
    }, [requests]);

    // KPI Calculations
    const kpis = useMemo(() => {
        const totalRequests = filteredRequests.length;
        const pendingRequests = filteredRequests.filter(r => r.status === 'pending').length;
        const completedRequests = filteredRequests.filter(r => r.status === 'completed').length;

        const totalContainers = filteredRequests.reduce((sum, req) => {
            return sum + req.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
        }, 0);

        const totalCost = filteredRequests.reduce((sum, req) => sum + (req.cost || 0), 0);

        return { totalRequests, pendingRequests, completedRequests, totalContainers, totalCost };
    }, [filteredRequests]);

    // Chart Data Preparation
    const locationData = useMemo(() => {
        const locationCounts: Record<string, number> = {};
        filteredRequests.forEach(req => {
            req.items.forEach(item => {
                const loc = item.location || req.location;
                // Clean up location name if it's a combined string
                const cleanLoc = loc.split(',')[0].trim();
                locationCounts[cleanLoc] = (locationCounts[cleanLoc] || 0) + item.quantity;
            });
        });

        return Object.entries(locationCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value) // Sort by highest count
            .slice(0, 5); // Top 5 locations
    }, [filteredRequests]);

    const typeData = useMemo(() => {
        const typeCounts: Record<string, number> = {};
        filteredRequests.forEach(req => {
            req.items.forEach(item => {
                typeCounts[item.name] = (typeCounts[item.name] || 0) + item.quantity;
            });
        });

        return Object.entries(typeCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5 types
    }, [filteredRequests]);

    const timelineData = useMemo(() => {
        const dateCounts: Record<string, number> = {};
        // Sort requests by date first
        const sortedRequests = [...filteredRequests].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        sortedRequests.forEach(req => {
            const date = new Date(req.date).toLocaleDateString('fr-CA');
            const quantity = req.items.reduce((sum, item) => sum + item.quantity, 0);
            dateCounts[date] = (dateCounts[date] || 0) + quantity;
        });

        // Take last 7 active days or just map all
        return Object.entries(dateCounts).map(([date, count]) => ({ date, count }));
    }, [filteredRequests]);

    const costByLocationData = useMemo(() => {
        const locationCosts: Record<string, number> = {};
        filteredRequests.forEach(req => {
            if (req.locationCosts) {
                // Use detailed location costs if available
                Object.entries(req.locationCosts).forEach(([loc, cost]) => {
                    const cleanLoc = loc.split(',')[0].trim();
                    locationCosts[cleanLoc] = (locationCosts[cleanLoc] || 0) + cost;
                });
            } else if (req.cost) {
                // Fallback to total cost attributed to primary location
                const loc = req.location.split(',')[0].trim();
                locationCosts[loc] = (locationCosts[loc] || 0) + req.cost;
            }
        });

        return Object.entries(locationCosts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [filteredRequests]);

    const handleDownloadPDF = () => {
        try {
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pageWidth = pdf.internal.pageSize.width;
            const pageHeight = pdf.internal.pageSize.height;
            const margin = 20;
            let yPos = margin;

            // === PAGE DE GARDE ===
            pdf.setFillColor(37, 99, 235);
            pdf.rect(0, 0, pageWidth, 60, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(28);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Rapport Annuel de Gestion', pageWidth / 2, 25, { align: 'center' });
            pdf.setFontSize(16);
            pdf.text(`${selectedYear}`, pageWidth / 2, 37, { align: 'center' });
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');
            pdf.text('Système de Cueillette de Contenants', pageWidth / 2, 47, { align: 'center' });
            const today = new Date().toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(9);
            pdf.text(`Généré le ${today}`, pageWidth / 2, 55, { align: 'center' });

            yPos = 80;

            // === SECTION KPIs ===
            pdf.setTextColor(31, 41, 55);
            pdf.setFontSize(16);
            pdf.setFont('helvetica', 'bold');
            pdf.text('INDICATEURS CLES DE PERFORMANCE', margin, yPos);
            yPos += 10;

            const kpiBoxes = [
                { label: 'Total Demandes', value: kpis.totalRequests.toString(), color: [59, 130, 246] },
                { label: 'En Attente', value: kpis.pendingRequests.toString(), color: [234, 179, 8] },
                { label: 'Complétées', value: kpis.completedRequests.toString(), color: [34, 197, 94] },
                { label: 'Contenants', value: kpis.totalContainers.toString(), color: [168, 85, 247] },
                { label: 'Coût Total', value: `${kpis.totalCost.toFixed(2)} $`, color: [239, 68, 68] }
            ];

            const boxWidth = (pageWidth - 2 * margin - 16) / 5;
            kpiBoxes.forEach((kpi, index) => {
                const x = margin + index * (boxWidth + 4);
                pdf.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
                pdf.rect(x, yPos, boxWidth, 25, 'F');
                pdf.setTextColor(255, 255, 255);
                pdf.setFontSize(8);
                pdf.setFont('helvetica', 'normal');
                pdf.text(kpi.label.toUpperCase(), x + boxWidth / 2, yPos + 8, { align: 'center' });
                pdf.setFontSize(14);
                pdf.setFont('helvetica', 'bold');
                pdf.text(kpi.value, x + boxWidth / 2, yPos + 18, { align: 'center' });
            });

            yPos += 35;

            // === GRAPHIQUE: Contenants par Établissement ===
            pdf.setTextColor(31, 41, 55);
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('CONTENANTS RAMASSES PAR ETABLISSEMENT', margin, yPos);
            yPos += 8;

            // Draw visual bar chart for containers
            const maxContainers = Math.max(...locationData.map(item => item.value), 1); // Avoid division by zero
            const barMaxWidth = pageWidth - 2 * margin - 60;

            locationData.slice(0, 5).forEach((item, index) => {
                const barWidth = (item.value / maxContainers) * barMaxWidth;
                const barHeight = 8;
                const barY = yPos + (index * 12);

                // Location label
                pdf.setFontSize(9);
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(60, 60, 60);
                const labelText = item.name.length > 25 ? item.name.substring(0, 22) + '...' : item.name;
                pdf.text(labelText, margin, barY + 6);

                // Bar
                pdf.setFillColor(59, 130, 246);
                pdf.rect(margin + 65, barY, barWidth, barHeight, 'F');

                // Value
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(59, 130, 246);
                pdf.text(item.value.toString(), margin + 65 + barWidth + 3, barY + 6);
            });

            yPos += (locationData.slice(0, 5).length * 12) + 15;

            // === GRAPHIQUE: Coûts par Établissement ===
            if (yPos > pageHeight - 80) { pdf.addPage(); yPos = margin; }

            pdf.setTextColor(31, 41, 55);
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('COUTS PAR ETABLISSEMENT', margin, yPos);
            yPos += 8;

            const maxCost = Math.max(...costByLocationData.map(item => item.value), 1);

            costByLocationData.slice(0, 5).forEach((item, index) => {
                const barWidth = (item.value / maxCost) * barMaxWidth;
                const barHeight = 8;
                const barY = yPos + (index * 12);

                // Location label
                pdf.setFontSize(9);
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(60, 60, 60);
                const labelText = item.name.length > 25 ? item.name.substring(0, 22) + '...' : item.name;
                pdf.text(labelText, margin, barY + 6);

                // Bar
                pdf.setFillColor(239, 68, 68);
                pdf.rect(margin + 65, barY, barWidth, barHeight, 'F');

                // Value
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(239, 68, 68);
                pdf.text(`${item.value.toFixed(2)} $`, margin + 65 + barWidth + 3, barY + 6);
            });

            yPos += (costByLocationData.slice(0, 5).length * 12) + 15;

            // === TABLEAU: Contenants par Lieu ===
            if (yPos > pageHeight - 60) { pdf.addPage(); yPos = margin; }
            pdf.setTextColor(31, 41, 55);
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('REPARTITION PAR LIEU DE RAMASSAGE', margin, yPos);
            yPos += 2;
            autoTable(pdf, {
                startY: yPos,
                head: [['Lieu', 'Quantité']],
                body: locationData.map(item => [item.name, item.value.toString()]),
                theme: 'grid',
                headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
                margin: { left: margin, right: margin },
                styles: { fontSize: 10, cellPadding: 3 }
            });

            yPos = (pdf as any).lastAutoTable?.finalY + 12;

            // === TABLEAU: Types de Contenants ===
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('TYPES DE CONTENANTS COLLECTES', margin, yPos);
            yPos += 2;
            autoTable(pdf, {
                startY: yPos,
                head: [['Type', 'Quantité']],
                body: typeData.map(item => [item.name, item.value.toString()]),
                theme: 'grid',
                headStyles: { fillColor: [34, 197, 94], textColor: 255, fontStyle: 'bold' },
                margin: { left: margin, right: margin },
                styles: { fontSize: 10, cellPadding: 3 }
            });

            yPos = (pdf as any).lastAutoTable?.finalY + 12;
            if (yPos > pageHeight - 60) { pdf.addPage(); yPos = margin; }

            // === TABLEAU: Analyse des Coûts ===
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('ANALYSE DES COUTS PAR LIEU', margin, yPos);
            yPos += 2;
            autoTable(pdf, {
                startY: yPos,
                head: [['Lieu', 'Coût Total']],
                body: costByLocationData.map(item => [item.name, `${item.value.toFixed(2)} $`]),
                theme: 'grid',
                headStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: 'bold' },
                margin: { left: margin, right: margin },
                styles: { fontSize: 10, cellPadding: 3 }
            });

            yPos = (pdf as any).lastAutoTable?.finalY + 15;

            // === SECTION RESUME ET ANALYSE ===
            if (yPos > pageHeight - 100) { pdf.addPage(); yPos = margin; }

            pdf.setFillColor(245, 247, 250);
            pdf.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
            pdf.setTextColor(31, 41, 55);
            pdf.setFontSize(16);
            pdf.setFont('helvetica', 'bold');
            pdf.text('RESUME EXECUTIF', margin + 2, yPos + 6);
            yPos += 16;

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(60, 60, 60);

            const avgCostPerRequest = kpis.totalRequests > 0 ? (kpis.totalCost / kpis.totalRequests).toFixed(2) : '0.00';
            const avgContainersPerRequest = kpis.totalRequests > 0 ? (kpis.totalContainers / kpis.totalRequests).toFixed(1) : '0';
            const completionRate = kpis.totalRequests > 0 ? ((kpis.completedRequests / kpis.totalRequests) * 100).toFixed(1) : '0';

            // Period information
            pdf.setFont('helvetica', 'bold');
            pdf.text(`Période couverte: Année ${selectedYear}`, margin + 2, yPos);
            yPos += 8;

            const summaryData = [
                ['Taux de complétion', `${completionRate}%`],
                ['Coût moyen par demande', `${avgCostPerRequest} $`],
                ['Contenants moyens par demande', avgContainersPerRequest],
                ['Nombre d\'établissements actifs', locationData.length.toString()],
                ['Coût total annuel', `${kpis.totalCost.toFixed(2)} $`],
                ['Volume total traité', `${kpis.totalContainers} contenants`]
            ];

            autoTable(pdf, {
                startY: yPos,
                body: summaryData,
                theme: 'striped',
                styles: { fontSize: 10, cellPadding: 4, textColor: [60, 60, 60] },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 90, fillColor: [250, 250, 250] },
                    1: { halign: 'right', cellWidth: 80 }
                },
                margin: { left: margin, right: margin },
                headStyles: { fillColor: [37, 99, 235] }
            });

            yPos = (pdf as any).lastAutoTable?.finalY + 12;

            // === FAITS SAILLANTS ===
            if (yPos > pageHeight - 60) { pdf.addPage(); yPos = margin; }

            pdf.setFillColor(240, 245, 255);
            pdf.rect(margin, yPos, pageWidth - 2 * margin, 9, 'F');
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(30, 58, 138);
            pdf.text('FAITS SAILLANTS', margin + 2, yPos + 6);
            yPos += 14;

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(60, 60, 60);

            const highlights = [
                `${kpis.totalRequests} demandes de ramassage traitées durant l'année ${selectedYear}`,
                `${kpis.totalContainers} contenants collectés au total`,
                `Coût total des opérations: ${kpis.totalCost.toFixed(2)} $`,
                `${locationData.length} établissements ont bénéficié du service`,
                `Taux de complétion des demandes: ${completionRate}%`,
            ];

            highlights.forEach((highlight, index) => {
                if (yPos > pageHeight - 20) { pdf.addPage(); yPos = margin; }
                pdf.setFillColor(59, 130, 246);
                pdf.circle(margin + 4, yPos - 1, 1.5, 'F');
                const lines = pdf.splitTextToSize(highlight, pageWidth - 2 * margin - 10);
                pdf.text(lines, margin + 8, yPos);
                yPos += Math.max(lines.length * 5, 6);
            });

            yPos += 6;

            // === RECOMMANDATIONS ===
            if (yPos > pageHeight - 50) { pdf.addPage(); yPos = margin; }

            pdf.setFillColor(254, 243, 199);
            pdf.rect(margin, yPos, pageWidth - 2 * margin, 9, 'F');
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(146, 64, 14);
            pdf.text('RECOMMANDATIONS', margin + 2, yPos + 6);
            yPos += 14;

            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(60, 60, 60);

            const recommendations = [
                `Assurer le suivi des ${kpis.pendingRequests} demande(s) en attente pour maintenir un taux de complétion optimal`,
                `Optimiser la planification des collectes pour les établissements à fort volume`,
                `Évaluer les opportunités de réduction des coûts sans compromettre la qualité du service`,
            ];

            recommendations.forEach((rec, index) => {
                if (yPos > pageHeight - 20) { pdf.addPage(); yPos = margin; }
                pdf.setFont('helvetica', 'bold');
                pdf.text(`${index + 1}.`, margin + 2, yPos);
                pdf.setFont('helvetica', 'normal');
                const lines = pdf.splitTextToSize(rec, pageWidth - 2 * margin - 8);
                pdf.text(lines, margin + 8, yPos);
                yPos += lines.length * 5 + 3;
            });

            // === PIED DE PAGE ===
            const totalPages = (pdf as any).internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                pdf.setPage(i);
                pdf.setFontSize(9);
                pdf.setTextColor(150, 150, 150);
                pdf.text(`Rapport annuel ${selectedYear} - Page ${i} sur ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
            }

            pdf.save(`rapport_annuel_${selectedYear}.pdf`);
            toastSuccess('Rapport PDF généré avec succès !');
        } catch (error) {
            console.error("Error generating PDF:", error);
            toastError("Erreur lors de la génération du PDF");
        }
    };

    return (
        <div className="space-y-8 slide-up p-4 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold gradient-text">Tableau de bord</h2>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-md shadow-sm border dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Année:</span>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="border-none bg-transparent font-bold text-blue-600 focus:ring-0 cursor-pointer"
                        >
                            {availableYears.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleDownloadPDF}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <ArrowDownTrayIcon className="w-5 h-5" />
                        Exporter PDF
                    </button>
                </div>
            </div>

            {/* Advanced Filters */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">🗓️ Filtres Avancés</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Period Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Période
                        </label>
                        <select
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm p-2 focus:border-blue-500 focus:ring-blue-500"
                        >
                            <option value="all">Toute l'année</option>
                            <option value="month">Ce mois</option>
                            <option value="quarter">Ce trimestre</option>
                            <option value="last30">30 derniers jours</option>
                            <option value="custom">Période personnalisée</option>
                        </select>
                    </div>

                    {/* Spacer for layout */}
                    <div></div>
                    <div></div>

                    {/* Reset Button */}
                    <div className="flex items-end">
                        <button
                            onClick={() => {
                                setSelectedYear(new Date().getFullYear());
                                setSelectedPeriod('all');
                                setCustomDateRange({ start: '', end: '' });
                            }}
                            className="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            🔄 Réinitialiser
                        </button>
                    </div>
                </div>

                {/* Custom Date Range */}
                {selectedPeriod === 'custom' && (
                    <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Date de début
                            </label>
                            <input
                                type="date"
                                value={customDateRange.start}
                                onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white shadow-sm p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Date de fin
                            </label>
                            <input
                                type="date"
                                value={customDateRange.end}
                                onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white shadow-sm p-2" />
                        </div>
                    </div>
                )}
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase">Total Demandes</h3>
                    <p className="text-3xl font-bold text-gray-800 dark:text-white">{kpis.totalRequests}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase">En Attente</h3>
                    <p className="text-3xl font-bold text-gray-800 dark:text-white">{kpis.pendingRequests}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-green-500">
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase">Complétées</h3>
                    <p className="text-3xl font-bold text-gray-800 dark:text-white">{kpis.completedRequests}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-purple-500">
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase">Contenants</h3>
                    <p className="text-3xl font-bold text-gray-800 dark:text-white">{kpis.totalContainers}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-red-500">
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase">Coût Total</h3>
                    <p className="text-3xl font-bold text-gray-800 dark:text-white">{kpis.totalCost.toFixed(2)} $</p>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Bar Chart: Containers by Location */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-white mb-4">Contenants par Lieu (Top 5)</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={locationData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="value" name="Quantité" fill="#8884d8" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart: Container Types */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-white mb-4">Types de Contenants (Top 5)</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={typeData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {typeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Line Chart: Timeline */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-white mb-4">Tendance de Collecte</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={timelineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="count" name="Contenants" stroke="#82ca9d" strokeWidth={2} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Bar Chart: Costs by Location */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-white mb-4">Coûts par Lieu (Top 5)</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={costByLocationData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(value) => `${Number(value).toFixed(2)} $`} />
                                <Legend />
                                <Bar dataKey="value" name="Coût ($)" fill="#ff8042" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
});

Dashboard.displayName = 'Dashboard';
export default Dashboard;
