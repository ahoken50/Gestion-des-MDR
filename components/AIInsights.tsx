import React, { useMemo } from 'react';
import { useAppData } from '../hooks/useAppData';
import {
    ChartBarIcon,
    CurrencyDollarIcon,
    MapPinIcon,
    CalendarIcon,
    LightBulbIcon,
    ArrowTrendingUpIcon,
    ClockIcon
} from '@heroicons/react/24/outline';

const AIInsights: React.FC = () => {
    const { allRequests } = useAppData();

    const insights = useMemo(() => {
        if (allRequests.length === 0) return null;

        // 1. Most Frequent Location
        const locationCounts: Record<string, number> = {};
        allRequests.forEach(req => {
            const loc = req.location.split(',')[0].trim();
            locationCounts[loc] = (locationCounts[loc] || 0) + 1;
        });
        const topLocation = Object.entries(locationCounts).sort((a, b) => b[1] - a[1])[0];

        // 2. Busiest Day of Week
        const dayCounts: Record<string, number> = {};
        const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        allRequests.forEach(req => {
            const day = days[new Date(req.date).getDay()];
            dayCounts[day] = (dayCounts[day] || 0) + 1;
        });
        const topDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];

        // 3. Average Cost
        const requestsWithCost = allRequests.filter(r => r.cost && r.cost > 0);
        const avgCost = requestsWithCost.length > 0
            ? requestsWithCost.reduce((sum, r) => sum + (r.cost || 0), 0) / requestsWithCost.length
            : 0;

        // 4. Trend (Last 30 days vs Previous 30 days)
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

        const recentRequests = allRequests.filter(r => new Date(r.date) >= thirtyDaysAgo).length;
        const previousRequests = allRequests.filter(r => {
            const d = new Date(r.date);
            return d >= sixtyDaysAgo && d < thirtyDaysAgo;
        }).length;

        const trend = previousRequests > 0
            ? ((recentRequests - previousRequests) / previousRequests) * 100
            : 0;

        // 5. Average Processing Time
        const completedRequests = allRequests.filter(r => r.status === 'completed' && r.completedAt);
        let avgProcessingTime = 'N/A';
        let avgProcessingMs = 0;

        if (completedRequests.length > 0) {
            const durations = completedRequests.map(r => {
                const start = new Date(r.date).getTime();
                const end = new Date(r.completedAt!).getTime();
                return Math.max(0, end - start);
            });
            avgProcessingMs = durations.reduce((a, b) => a + b, 0) / durations.length;

            const daysDiff = Math.floor(avgProcessingMs / (1000 * 60 * 60 * 24));
            const hoursDiff = Math.floor((avgProcessingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

            if (daysDiff > 0) {
                avgProcessingTime = `${daysDiff}j ${hoursDiff}h`;
            } else if (hoursDiff > 0) {
                avgProcessingTime = `${hoursDiff}h`;
            } else {
                avgProcessingTime = `${Math.floor(avgProcessingMs / (1000 * 60))}m`;
            }
        }

        return {
            topLocation: topLocation ? topLocation[0] : 'N/A',
            topDay: topDay ? topDay[0] : 'N/A',
            avgCost,
            trend,
            totalRequests: allRequests.length,
            avgProcessingTime
        };
    }, [allRequests]);

    if (!insights) {
        return (
            <div className="p-8 text-center text-gray-500">
                <LightBulbIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Pas assez de données pour générer des insights.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 slide-up p-6">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                    <LightBulbIcon className="w-8 h-8 text-purple-600 dark:text-purple-300" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">AI Insights</h2>
                    <p className="text-gray-500 dark:text-gray-400">Analyse intelligente de vos opérations</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {/* Card 1: Top Location */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                            <MapPinIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Lieu le plus actif</h3>
                    <p className="text-xl font-bold text-gray-800 dark:text-white mt-1">{insights.topLocation}</p>
                    <p className="text-xs text-gray-400 mt-2">Volume de demandes</p>
                </div>

                {/* Card 2: Busiest Day */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                            <CalendarIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                        </div>
                    </div>
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Jour le plus chargé</h3>
                    <p className="text-xl font-bold text-gray-800 dark:text-white mt-1">{insights.topDay}</p>
                    <p className="text-xs text-gray-400 mt-2">Optimisation recommandée</p>
                </div>

                {/* Card 3: Average Cost */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                            <CurrencyDollarIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Coût moyen / demande</h3>
                    <p className="text-xl font-bold text-gray-800 dark:text-white mt-1">{insights.avgCost.toFixed(2)} $</p>
                    <p className="text-xs text-gray-400 mt-2">Sur factures saisies</p>
                </div>

                {/* Card 4: Trend */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                            <ArrowTrendingUpIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${insights.trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {insights.trend > 0 ? '+' : ''}{insights.trend.toFixed(1)}%
                        </span>
                    </div>
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Tendance (30j)</h3>
                    <p className="text-xl font-bold text-gray-800 dark:text-white mt-1">
                        {insights.trend >= 0 ? 'En hausse' : 'En baisse'}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">Vs période précédente</p>
                </div>

                {/* Card 5: Processing Time */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                            <ClockIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                    </div>
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Temps de traitement</h3>
                    <p className="text-xl font-bold text-gray-800 dark:text-white mt-1">{insights.avgProcessingTime}</p>
                    <p className="text-xs text-gray-400 mt-2">Moyenne creation-fermeture</p>
                </div>
            </div>

            {/* AI Recommendation Section */}
            <div className="mt-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                        <LightBulbIcon className="w-8 h-8 text-yellow-300" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold mb-2">Recommandation de l'IA</h3>
                        <p className="text-indigo-100 leading-relaxed">
                            D'après l'analyse de vos {insights.totalRequests} demandes, nous recommandons d'optimiser le temps de traitement pour
                            <span className="font-bold text-white"> {insights.topLocation} </span>
                            car votre moyenne est de <span className="font-bold text-white">{insights.avgProcessingTime}</span>.
                            Une planification le <span className="font-bold text-white">{insights.topDay}</span> semble être la plus efficace.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIInsights;
