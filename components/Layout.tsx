import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { View } from './Header';
import { Bars3Icon } from './icons';
import logo from '../src/assets/logo.png';

interface LayoutProps {
    children: React.ReactNode;
    currentView: View;
    onViewChange: (view: View) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onViewChange }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden premium-bg">
            {/* Sidebar */}
            <Sidebar
                currentView={currentView}
                onViewChange={onViewChange}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header */}
                <header className="lg:hidden bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 h-16 flex items-center justify-between shadow-sm z-30">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                        <Bars3Icon className="w-6 h-6" />
                    </button>
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden shadow-lg border border-white/20 ring-2 ring-blue-500/10">
                            <img src={logo} alt="Val-d'Or" className="w-full h-full object-cover" />
                        </div>
                        <span className="font-bold text-gray-800 dark:text-white text-base">Gestion MDR</span>
                    </div>
                    <div className="w-8" /> {/* Spacer for centering */}
                </header>

                {/* Scrollable Content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
