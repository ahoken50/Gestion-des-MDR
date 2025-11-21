import React, { useMemo } from 'react';
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

interface DashboardProps {
    requests: (PickupRequest | FirebasePickupRequest)[];
    inventory: InventoryItem[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Dashboard: React.FC<DashboardProps> = ({ requests, inventory }) => {
    // KPI Calculations
    const kpis = useMemo(() => {
        const totalRequests = requests.length;
        const pendingRequests = requests.filter(r => r.status === 'pending').length;
        const completedRequests = requests.filter(r => r.status === 'completed').length;

        const totalContainers = requests.reduce((sum, req) => {
            return sum + req.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
        }, 0);

        return { totalRequests, pendingRequests, completedRequests, totalContainers };
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

    return (
        <div className="space-y-8 slide-up">
            <h2 className="text-2xl font-bold gradient-text mb-6">Tableau de bord</h2>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Contenants Collectés</h3>
                    <p className="text-3xl font-bold text-gray-800">{kpis.totalContainers}</p>
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
        </div>
    );
};

export default Dashboard;
