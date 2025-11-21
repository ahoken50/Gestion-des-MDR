import React, { useMemo, useRef } from 'react';
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
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ArrowDownTrayIcon } from './icons';

interface DashboardProps {
    requests: (PickupRequest | FirebasePickupRequest)[];
    inventory: InventoryItem[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Dashboard: React.FC<DashboardProps> = ({ requests, inventory }) => {
    const dashboardRef = useRef<HTMLDivElement>(null);

    // KPI Calculations
    const kpis = useMemo(() => {
        const totalRequests = requests.length;
        const pendingRequests = requests.filter(r => r.status === 'pending').length;
        const completedRequests = requests.filter(r => r.status === 'completed').length;

        const totalContainers = requests.reduce((sum, req) => {
            return sum + req.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
        }, 0);

        const totalCost = requests.reduce((sum, req) => sum + (req.cost || 0), 0);

        return { totalRequests, pendingRequests, completedRequests, totalContainers, totalCost };
    }, [requests]);

    // Chart Data Preparation
    const locationData = useMemo(() => {
        const locationCounts: Record<string, number> = {};
        requests.forEach(req => {
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
    }, [requests]);

    const typeData = useMemo(() => {
        const typeCounts: Record<string, number> = {};
        requests.forEach(req => {
            req.items.forEach(item => {
                typeCounts[item.name] = (typeCounts[item.name] || 0) + item.quantity;
            });
        });

        return Object.entries(typeCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5 types
    }, [requests]);

    const timelineData = useMemo(() => {
        const dateCounts: Record<string, number> = {};
        // Sort requests by date first
        const sortedRequests = [...requests].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        sortedRequests.forEach(req => {
            const date = new Date(req.date).toLocaleDateString('fr-CA');
            const quantity = req.items.reduce((sum, item) => sum + item.quantity, 0);
            dateCounts[date] = (dateCounts[date] || 0) + quantity;
        });

        // Take last 7 active days or just map all
        return Object.entries(dateCounts).map(([date, count]) => ({ date, count }));
    }, [requests]);

    const costByLocationData = useMemo(() => {
        const locationCosts: Record<string, number> = {};
        requests.forEach(req => {
            if (req.cost) {
                const loc = req.location.split(',')[0].trim();
                locationCosts[loc] = (locationCosts[loc] || 0) + req.cost;
            }
        });

        return Object.entries(locationCosts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [requests]);

    const handleDownloadPDF = async () => {
        if (!dashboardRef.current) return;

        try {
            const canvas = await html2canvas(dashboardRef.current, {
                scale: 2, // Better resolution
                useCORS: true,
                logging: false,
                backgroundColor: '#f3f4f6', // Match app background
                onclone: (clonedDoc) => {
                    // AGGRESSIVE FIX: Replace ALL oklch colors in computed styles
                    // This walks through every element and replaces oklch() with rgb()
                    const allElements = clonedDoc.querySelectorAll('*');
                    allElements.forEach((element: Element) => {
                        const htmlElement = element as HTMLElement;
                        const computedStyle = window.getComputedStyle(element);

                        // Properties that might contain oklch colors
                        const colorProps = [
                            'color', 'backgroundColor', 'borderColor',
                            'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
                            'outlineColor', 'textDecorationColor', 'caretColor'
                        ];

                        colorProps.forEach(prop => {
                            const value = computedStyle.getPropertyValue(prop);
                            if (value && value.includes('oklch')) {
                                // Convert oklch to a simple gray fallback
                                htmlElement.style.setProperty(prop, 'rgb(107, 114, 128)', 'important');
                            }
                        });
                    });

                    // Also add CSS rules as backup
                    const stylesheet = clonedDoc.createElement('style');
                    stylesheet.textContent = `
                        * {
                            color: rgb(31, 41, 55) !important;
                        }
                        .bg-white { background-color: rgb(255, 255, 255) !important; }
                        .bg-gray-50 { background-color: rgb(249, 250, 251) !important; }
                        .bg-blue-600 { background-color: rgb(37, 99, 235) !important; }
                        .text-white { color: rgb(255, 255, 255) !important; }
                        .text-gray-500 { color: rgb(107, 114, 128) !important; }
                        .text-gray-700 { color: rgb(55, 65, 81) !important; }
                        .text-gray-800 { color: rgb(31, 41, 55) !important; }
                        .border-blue-500 { border-color: rgb(59, 130, 246) !important; }
                        .border-yellow-500 { border-color: rgb(234, 179, 8) !important; }
                        .border-green-500 { border-color: rgb(34, 197, 94) !important; }
                        .border-purple-500 { border-color: rgb(168, 85, 247) !important; }
                        .border-red-500 { border-color: rgb(239, 68, 68) !important; }
                        .gradient-text {
                            background: linear-gradient(135deg, rgb(59, 130, 246), rgb(147, 51, 234)) !important;
                            -webkit-background-clip: text !important;
                            -webkit-text-fill-color: transparent !important;
                        }
                    `;
                    clonedDoc.head.appendChild(stylesheet);
                }
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            const imgWidth = 297;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`dashboard_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Erreur lors de la génération du PDF");
        }
    };

    return (
        <div ref={dashboardRef} className="space-y-8 slide-up p-4 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold gradient-text">Tableau de bord</h2>
                <button
                    onClick={handleDownloadPDF}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
                >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    Exporter PDF
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Total Demandes</h3>
                    <p className="text-3xl font-bold text-gray-800">{kpis.totalRequests}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">En Attente</h3>
                    <p className="text-3xl font-bold text-gray-800">{kpis.pendingRequests}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Complétées</h3>
                    <p className="text-3xl font-bold text-gray-800">{kpis.completedRequests}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Contenants</h3>
                    <p className="text-3xl font-bold text-gray-800">{kpis.totalContainers}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Coût Total</h3>
                    <p className="text-3xl font-bold text-gray-800">{kpis.totalCost.toFixed(2)} $</p>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Bar Chart: Containers by Location */}
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Contenants par Lieu (Top 5)</h3>
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
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Types de Contenants (Top 5)</h3>
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
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Tendance de Collecte</h3>
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
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Coûts par Lieu (Top 5)</h3>
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
};

export default Dashboard;
