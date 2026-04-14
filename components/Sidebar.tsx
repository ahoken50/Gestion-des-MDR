import React from 'react';
import { useTheme } from './ThemeContext';
import {
    HomeIcon,
    ChartBarIcon,
    ClockIcon,
    CubeIcon,
    SparklesIcon,
    MoonIcon,
    SunIcon,
    CalendarIcon
} from './icons';

interface SidebarProps {
    currentView: string;
    onViewChange: (view: string) => void;
    isOpen?: boolean;
    onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, isOpen, onClose }) => {
    const { theme, toggleTheme } = useTheme();

    const menuItems = [
        { id: 'home', label: 'Accueil', icon: HomeIcon },
        { id: 'dashboard', label: 'Tableau de bord', icon: ChartBarIcon },
        { id: 'history', label: 'Historique', icon: ClockIcon },
        { id: 'inventory', label: 'Inventaire', icon: CubeIcon },
        { id: 'calendar', label: 'Calendrier', icon: CalendarIcon },
        { id: 'ai', label: 'AI Insights', icon: SparklesIcon },
    ];

    return (
        <>
            <aside className={`w-64 glass flex flex-col shadow-2xl transition-all duration-300 z-50 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                {/* Logo/Brand */}
                <div className="p-6 border-b border-gray-200/30 dark:border-gray-700/30">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-600 dark:bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <span className="text-2xl filter drop-shadow-md">♻️</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-800 dark:text-white leading-tight">Gestion MDR</h1>
                            <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Service Env.</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentView === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => onViewChange(item.id)}
                                aria-current={isActive ? 'page' : undefined}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40 translate-x-1'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                                <span className="font-bold">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Theme Toggle & Footer */}
                <div className="p-4 space-y-4 border-t border-gray-200/50 dark:border-gray-700/50">
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-center space-x-3 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-750 transition-all border border-transparent hover:border-blue-500/30 group"
                    >
                        {theme === 'dark' ? (
                            <>
                                <SunIcon className="w-5 h-5 text-yellow-400 transition-transform group-hover:rotate-45" />
                                <span className="text-gray-700 dark:text-gray-200 font-medium">Mode Clair</span>
                            </>
                        ) : (
                            <>
                                <MoonIcon className="w-5 h-5 text-blue-600 transition-transform group-hover:-rotate-12" />
                                <span className="text-gray-700 dark:text-gray-200 font-medium">Mode Sombre</span>
                            </>
                        )}
                    </button>

                    <div className="text-center text-[10px] text-gray-400 dark:text-gray-500 font-medium tracking-wide">
                        <p>VILLE DE VAL-D'OR</p>
                        <p className="mt-0.5 opacity-60 italic">Optimisé par IA • © 2025</p>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
