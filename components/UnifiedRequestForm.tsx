import React, { useState } from 'react';
import type { InventoryItem, PickupRequest } from '../types';
import type { PickupRequestPDF } from '../types-pdf';
import ContactInfoForm from './request-form/ContactInfoForm';
import SingleRequestForm from './request-form/SingleRequestForm';
import MultiRequestForm from './request-form/MultiRequestForm';
import { useToast } from './ui/Toast';

interface UnifiedRequestFormProps {
    inventory: InventoryItem[];
    onSubmit: (request: Omit<PickupRequest, 'id' | 'status'>) => void;
    onPDFGenerated?: (request: PickupRequestPDF) => void;
}

type RequestMode = 'single' | 'multi';

const UnifiedRequestForm: React.FC<UnifiedRequestFormProps> = ({
    inventory,
    onSubmit,
    onPDFGenerated
}) => {
    const { error: toastError } = useToast();
    const [mode, setMode] = useState<RequestMode>('single');

    // Shared Contact State
    const [bcNumber, setBcNumber] = useState('');
    const [contactName, setContactName] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [notes, setNotes] = useState('');

    const handleSingleSubmit = (data: { location: string; items: any[] }) => {
        if (!contactName.trim() || !contactPhone.trim()) {
            toastError("Veuillez remplir les informations de contact.");
            return;
        }

        onSubmit({
            bcNumber: bcNumber.trim() || undefined,
            location: data.location,
            items: data.items,
            date: new Date().toISOString(),
            contactName,
            contactPhone,
            notes,
        });

        // Reset shared fields after submit
        setBcNumber('');
        setContactName('');
        setContactPhone('');
        setNotes('');
    };

    return (
        <div className="space-y-6">
            {/* Mode Selector */}
            <div className="card p-6 slide-up">
                <div className="card-header p-4 -m-6 mb-6">
                    <h2 className="text-2xl font-bold gradient-text">
                        ➕ Créer une nouvelle demande de cueillette
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">Choisissez le type de demande selon vos besoins</p>
                </div>
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setMode('single')}
                        className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${mode === 'single'
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                            }`}
                    >
                        📍 Demande simple (un lieu)
                    </button>
                    <button
                        onClick={() => setMode('multi')}
                        className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${mode === 'multi'
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                            }`}
                    >
                        📋 Sélection multiple (plusieurs lieux)
                    </button>
                </div>
            </div>

            {/* Shared Contact Form */}
            <ContactInfoForm
                bcNumber={bcNumber}
                setBcNumber={setBcNumber}
                contactName={contactName}
                setContactName={setContactName}
                contactPhone={contactPhone}
                setContactPhone={setContactPhone}
                notes={notes}
                setNotes={setNotes}
            />

            {/* Specific Forms */}
            {mode === 'single' ? (
                <SingleRequestForm
                    inventory={inventory}
                    onSubmit={handleSingleSubmit}
                />
            ) : (
                <MultiRequestForm
                    inventory={inventory}
                    contactInfo={{
                        name: contactName,
                        phone: contactPhone,
                        notes,
                        bcNumber
                    }}
                    onPDFGenerated={onPDFGenerated}
                />
            )}
        </div>
    );
};

export default UnifiedRequestForm;