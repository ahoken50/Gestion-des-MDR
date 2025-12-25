import React from 'react';
import { TruckIcon } from './icons';

export type View = 'inventory' | 'new_request' | 'history' | 'dashboard';

interface HeaderProps {
    currentView: View;
    onViewChange: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onViewChange }) => {
    const navItemClasses = "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent";
    const activeClasses = "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg scale-105";
    const inactiveClasses = "text-blue-100 hover:bg-white/10 hover:text-white hover:scale-105";

    return (
        <header className="bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 text-white shadow-2xl sticky top-0 z-50 backdrop-blur-sm border-b border-blue-800/50">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="bg-gradient-to-br from-blue-400 to-indigo-500 p-2.5 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <TruckIcon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <span className="font-bold text-2xl bg-gradient-to-r from-blue-200 to-indigo-200 bg-clip-text text-transparent">
                                Gestion de Cueillette
                            </span>
                            <p className="text-xs text-blue-200/80">Système de gestion MDR</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 md:space-x-3">
                        <button
                            onClick={() => onViewChange('inventory')}
                            aria-current={currentView === 'inventory' ? 'page' : undefined}
                            className={`${navItemClasses} ${currentView === 'inventory' ? activeClasses : inactiveClasses}`}
                        >
                            <span className="flex items-center gap-2">
                                <span>📦</span>
                                <span className="hidden sm:inline">Inventaire</span>
                            </span>
                        </button>
                        <button
                            onClick={() => onViewChange('new_request')}
                            aria-current={currentView === 'new_request' ? 'page' : undefined}
                            className={`${navItemClasses} ${currentView === 'new_request' ? activeClasses : inactiveClasses}`}
                        >
                            <span className="flex items-center gap-2">
                                <span>➕</span>
                                <span className="hidden sm:inline">Nouvelle Demande</span>
                            </span>
                        </button>
                        <button
                            onClick={() => onViewChange('history')}
                            aria-current={currentView === 'history' ? 'page' : undefined}
                            className={`${navItemClasses} ${currentView === 'history' ? activeClasses : inactiveClasses}`}
                        >
                            <span className="flex items-center gap-2">
                                <span>📋</span>
                                <span className="hidden sm:inline">Historique</span>
                            </span>
                        </button>
                        <button
                            onClick={() => onViewChange('dashboard')}
                            aria-current={currentView === 'dashboard' ? 'page' : undefined}
                            className={`${navItemClasses} ${currentView === 'dashboard' ? activeClasses : inactiveClasses}`}
                        >
                            <span className="flex items-center gap-2">
                                <span>📊</span>
                                <span className="hidden sm:inline">Tableau de bord</span>
                            </span>
                        </button>
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default Header;