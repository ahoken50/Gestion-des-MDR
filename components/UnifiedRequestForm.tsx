import React, { useState } from 'react';
import type { InventoryItem, PickupRequest } from '../types';
import type { PickupRequestPDF } from '../types-pdf';
import ContactInfoForm from './request-form/ContactInfoForm';
import SingleRequestForm from './request-form/SingleRequestForm';
import MultiRequestForm from './request-form/MultiRequestForm';
import { PDFService, createPickupRequestPDF } from '../services/pdfServiceMulti';
import { useToast } from './ui/Toast';

interface UnifiedRequestFormProps {
    inventory: InventoryItem[];
    onSubmit: (request: Omit<PickupRequest, 'id' | 'status'>) => Promise<number | undefined>;
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

    const handleSingleSubmit = async (data: { location: string; items: any[] }) => {
        if (!contactName.trim() || !contactPhone.trim()) {
            toastError("Veuillez remplir les informations de contact.");
            return;
        }

        const requestNumber = await onSubmit({
            bcNumber: bcNumber.trim() || undefined,
            location: data.location,
            items: data.items,
            date: new Date().toISOString(),
            contactName,
            contactPhone,
            notes,
        });

        // Generate PDF for single request
        try {
            const selectedItems = data.items.map(item => ({
                id: item.name, // Using name as ID for simplicity in single request
                name: item.name,
                quantity: item.quantity,
                location: data.location,
                replaceBin: item.replaceBin
            }));

            const pdfRequest = createPickupRequestPDF(selectedItems, {
                name: contactName,
                phone: contactPhone,
                notes: notes.trim() || undefined,
                bcNumber: bcNumber.trim() || undefined,
                requestNumber: requestNumber?.toString()
            });

            const pdfService = new PDFService();
            await pdfService.generatePickupRequestPDF(pdfRequest);
            pdfService.save(`demande_ramassage_${pdfRequest.requestNumber || pdfRequest.id}.pdf`);

            if (onPDFGenerated) {
                onPDFGenerated(pdfRequest);
            }
        } catch (error) {
            console.error('Error generating PDF for single request:', error);
            toastError('Erreur lors de la génération du PDF.');
        }

        // Reset shared fields after submit
        setBcNumber('');
        setContactName('');
        setContactPhone('');
        setNotes('');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Mode Selection */}
            <div
                className="grid grid-cols-2 gap-4 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg"
                role="tablist"
                aria-label="Mode de demande"
            >
                <button
                    role="tab"
                    id="tab-single"
                    aria-selected={mode === 'single'}
                    aria-controls="panel-single"
                    onClick={() => setMode('single')}
                    className={`py-2 px-4 rounded-md text-sm font-medium transition-all ${mode === 'single'
                        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                >
                    Demande Unique
                </button>
                <button
                    role="tab"
                    id="tab-multi"
                    aria-selected={mode === 'multi'}
                    aria-controls="panel-multi"
                    onClick={() => setMode('multi')}
                    className={`py-2 px-4 rounded-md text-sm font-medium transition-all ${mode === 'multi'
                        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                >
                    Demande Multiple
                </button>
            </div>

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
            <div
                role="tabpanel"
                id={`panel-${mode}`}
                aria-labelledby={`tab-${mode}`}
                className="animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
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
                        onSubmit={onSubmit}
                    />
                )}
            </div>
        </div>
    );
};

export default UnifiedRequestForm;