import React, { useState, useMemo } from 'react';
import type { PickupRequest } from '../types';
import { FirebasePickupRequest } from '../services/firebaseService';

interface CalendarViewProps {
    requests: (PickupRequest | FirebasePickupRequest)[];
    onViewRequest: (request: PickupRequest | FirebasePickupRequest) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ requests, onViewRequest }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const daysInMonth = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const days = new Date(year, month + 1, 0).getDate();
        
        const daysArray: (Date | null)[] = [];
        // Align with Monday as first day (0=Sunday, 1=Monday in getDay)
        // Adjusting firstDay for Monday-start (0 becomes 6, 1 becomes 0 etc)
        const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

        for (let i = 0; i < adjustedFirstDay; i++) {
            daysArray.push(null);
        }
        for (let i = 1; i <= days; i++) {
            daysArray.push(new Date(year, month, i));
        }
        return daysArray;
    }, [currentMonth]);

    const formatDateKey = (date: Date | string) => {
        try {
            const d = new Date(date);
            if (isNaN(d.getTime())) return null;
            // Format to YYYY-MM-DD in local time
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        } catch (e) {
            return null;
        }
    };

    const requestsByDay = useMemo(() => {
        const map: Record<string, (PickupRequest | FirebasePickupRequest)[]> = {};
        requests.forEach(req => {
            const dateStr = formatDateKey(req.date);
            if (dateStr) {
                if (!map[dateStr]) map[dateStr] = [];
                map[dateStr].push(req);
            }
        });
        return map;
    }, [requests]);

    const otherMonthsWithData = useMemo(() => {
        const months = new Set<string>();
        requests.forEach(req => {
            const d = new Date(req.date);
            if (!isNaN(d.getTime())) {
                const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
                const currentMonthKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;
                if (monthKey !== currentMonthKey) {
                    months.add(monthKey);
                }
            }
        });
        return months.size;
    }, [requests, currentMonth]);

    const navigateMonth = (direction: number) => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-400';
            case 'in_progress': return 'bg-blue-500';
            case 'completed': return 'bg-green-500';
            case 'cancelled': return 'bg-red-500';
            default: return 'bg-gray-400';
        }
    };

    const monthName = currentMonth.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
    const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

    return (
        <div className="space-y-6 slide-up">
            <div className="flex items-center justify-between glass p-6 rounded-3xl shadow-xl">
                <h2 className="text-3xl font-bold capitalize text-gray-800 dark:text-white">
                    {monthName}
                </h2>
                <div className="flex space-x-2">
                    <button 
                        onClick={() => navigateMonth(-1)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-600 dark:text-gray-300"
                    >
                        ← Précédent
                    </button>
                    <button 
                        onClick={() => setCurrentMonth(new Date())}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
                    >
                        Aujourd'hui
                    </button>
                    <button 
                        onClick={() => navigateMonth(1)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-600 dark:text-gray-300"
                    >
                        Suivant →
                    </button>
                </div>
            </div>

            <div className="glass rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                <div className="grid grid-cols-7 bg-white/50 dark:bg-black/20 border-b border-gray-200 dark:border-gray-800">
                    {weekDays.map(day => (
                        <div key={day} className="py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-800">
                    {daysInMonth.map((day, idx) => {
                        const formattedDay = day ? formatDateKey(day) : '';
                        const dailyReqs = day ? requestsByDay[formattedDay || ''] || [] : [];
                        const isToday = formattedDay === formatDateKey(new Date());

                        return (
                            <div 
                                key={idx} 
                                className={`min-h-[140px] bg-white dark:bg-gray-900 p-2 transition-colors ${day ? 'hover:bg-gray-50 dark:hover:bg-gray-850' : ''}`}
                            >
                                {day && (
                                    <div className="h-full flex flex-col">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-sm font-bold flex items-center justify-center w-7 h-7 rounded-full transition-colors ${
                                                isToday ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400'
                                            }`}>
                                                {day.getDate()}
                                            </span>
                                            {dailyReqs.length > 0 && (
                                                <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                                                    {dailyReqs.length}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
                                            {dailyReqs.slice(0, 3).map(req => (
                                                <button
                                                    key={req.id}
                                                    onClick={() => onViewRequest(req)}
                                                    className="w-full text-left p-1.5 rounded-lg text-[10px] truncate group transition-all hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center space-x-1.5 border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                                                >
                                                    <span className={`w-2 h-2 rounded-full shrink-0 ${getStatusColor(req.status)}`} />
                                                    <span className="font-semibold text-gray-700 dark:text-gray-300 truncate">
                                                        {req.location.split(',')[0]}
                                                    </span>
                                                </button>
                                            ))}
                                            {dailyReqs.length > 3 && (
                                                <div className="text-[9px] text-center font-bold text-gray-400 p-1">
                                                    + {dailyReqs.length - 3} autres
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {Object.keys(requestsByDay).filter(k => k.startsWith(`${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`)).length === 0 && otherMonthsWithData > 0 && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl flex items-center justify-between scale-in">
                    <div className="flex items-center space-x-3">
                        <div className="bg-blue-500 text-white p-2 rounded-lg">
                            <span className="text-xl">ℹ️</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-blue-900 dark:text-blue-100">Aucune demande ce mois-ci</p>
                            <p className="text-xs text-blue-700 dark:text-blue-300">Nous avons trouvé {requests.length} demande(s) dans d'autres mois de l'historique.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            // Find month with most recent request
                            const lastReq = [...requests].sort((a, b) => b.date.localeCompare(a.date))[0];
                            if (lastReq) {
                                setCurrentMonth(new Date(lastReq.date));
                            }
                        }}
                        className="text-xs font-bold bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                    >
                        Aller à la dernière demande
                    </button>
                </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-6 p-4 glass rounded-2xl justify-center text-xs font-semibold">
                <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-yellow-400" />
                    <span className="text-gray-600 dark:text-gray-300">En attente</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-gray-600 dark:text-gray-300">En cours</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-gray-600 dark:text-gray-300">Terminée</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-gray-600 dark:text-gray-300">Annulée</span>
                </div>
            </div>
        </div>
    );
};

export default CalendarView;
