import React, { createContext, useContext, useState, useCallback } from 'react';
import { XMarkIcon } from '../icons';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    addToast: (message: string, type: ToastType) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const addToast = useCallback((message: string, type: ToastType) => {
        const id = Date.now().toString() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);

        // Auto remove after 3 seconds
        setTimeout(() => {
            removeToast(id);
        }, 3000);
    }, [removeToast]);

    const success = useCallback((message: string) => addToast(message, 'success'), [addToast]);
    const error = useCallback((message: string) => addToast(message, 'error'), [addToast]);
    const info = useCallback((message: string) => addToast(message, 'info'), [addToast]);

    return (
        <ToastContext.Provider value={{ addToast, success, error, info }}>
            {children}
            <div
                className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
                role="region"
                aria-label="Notifications"
                aria-live="polite"
            >
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`
                            pointer-events-auto px-4 py-3 rounded-lg shadow-lg text-white transform transition-all duration-300 ease-in-out
                            ${toast.type === 'success' ? 'bg-green-600' : ''}
                            ${toast.type === 'error' ? 'bg-red-600' : ''}
                            ${toast.type === 'info' ? 'bg-blue-600' : ''}
                            flex items-center gap-3 min-w-[300px] animate-slide-in relative pr-10
                        `}
                        role={toast.type === 'error' ? 'alert' : 'status'}
                    >
                        <span className="text-xl shrink-0">
                            {toast.type === 'success' && '✅'}
                            {toast.type === 'error' && '❌'}
                            {toast.type === 'info' && 'ℹ️'}
                        </span>
                        <p className="font-medium text-sm sm:text-base leading-snug">{toast.message}</p>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                            aria-label="Fermer la notification"
                        >
                            <XMarkIcon className="w-4 h-4 text-white" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
