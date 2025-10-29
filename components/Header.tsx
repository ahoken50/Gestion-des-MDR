import React from 'react';
import { TruckIcon } from './icons';

export type View = 'inventory' | 'new_request' | 'history';

interface HeaderProps {
    currentView: View;
    onViewChange: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onViewChange }) => {
    const navItemClasses = "px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white";
    const activeClasses = "bg-blue-600 text-white";
    const inactiveClasses = "text-gray-300 hover:bg-gray-700 hover:text-white";

    return (
        <header className="bg-gray-800 text-white shadow-lg sticky top-0 z-10">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-3">
                        <TruckIcon className="w-8 h-8 text-blue-400"/>
                        <span className="font-bold text-xl">Gestion de Cueillette</span>
                    </div>
                    <div className="flex items-center space-x-2 md:space-x-4">
                        <button 
                            onClick={() => onViewChange('inventory')}
                            className={`${navItemClasses} ${currentView === 'inventory' ? activeClasses : inactiveClasses}`}
                        >
                            Inventaire
                        </button>
                        <button
                            onClick={() => onViewChange('new_request')}
                            className={`${navItemClasses} ${currentView === 'new_request' ? activeClasses : inactiveClasses}`}
                        >
                            Nouvelle Demande
                        </button>
                         <button
                            onClick={() => onViewChange('history')}
                            className={`${navItemClasses} ${currentView === 'history' ? activeClasses : inactiveClasses}`}
                        >
                            Historique
                        </button>
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default Header;