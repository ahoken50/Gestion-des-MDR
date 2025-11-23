import React from 'react';
import { useTheme } from './ThemeContext';
import {
    HomeIcon,
    ChartBarIcon,
    ClockIcon,
    CubeIcon,
    SparklesIcon,
    MoonIcon,
    SunIcon
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
        { id: 'ai', label: 'AI Insights', icon: SparklesIcon },
    ];

    return (
        <>
            <aside className="w-64 bg-gradient-to-b from-blue-600 to-blue-800 text-white flex flex-col shadow-2xl">
                {/* Logo/Brand */}
                <div className="p-6 border-b border-blue-500">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                            <span className="text-2xl">♻️</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Gestion MDR</h1>
                            <p className="text-xs text-blue-300 truncate">Service Env.</p>
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
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${isActive
                                    ? 'bg-white text-blue-600 shadow-lg'
                                    : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-medium">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Dark Mode Toggle */}
                <div className="p-4 border-t border-blue-500">
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-blue-700 hover:bg-blue-600 transition-all"
                    >
                        {theme === 'dark' ? (
                            <>
                                <SunIcon className="w-5 h-5" />
                                <span>Mode Clair</span>
                            </>
                        ) : (
                            <>
                                <MoonIcon className="w-5 h-5" />
                                <span>Mode Sombre</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Footer */}
                <div className="p-4 text-center text-xs text-blue-300">
                    <p>Ville de Val-d'Or</p>
                    <p className="mt-1">© 2025</p>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
