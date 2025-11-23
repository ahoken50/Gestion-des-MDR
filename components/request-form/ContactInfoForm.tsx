import React from 'react';
import ContactAutocomplete from '../ContactAutocomplete';
import { contactService } from '../../services/contactService';

interface ContactInfoFormProps {
    bcNumber: string;
    setBcNumber: (value: string) => void;
    contactName: string;
    setContactName: (value: string) => void;
    contactPhone: string;
    setContactPhone: (value: string) => void;
    notes: string;
    setNotes: (value: string) => void;
}

const ContactInfoForm: React.FC<ContactInfoFormProps> = ({
    bcNumber,
    setBcNumber,
    contactName,
    setContactName,
    contactPhone,
    setContactPhone,
    notes,
    setNotes
}) => {
    return (
        <div className="card p-6 slide-up dark:bg-gray-800 dark:border-gray-700">
            <div className="card-header p-4 -m-6 mb-6 dark:border-gray-700">
                <h3 className="text-xl font-bold gradient-text">📋 Informations de demande</h3>
                <p className="text-sm text-gray-600 mt-1 dark:text-gray-400">Remplissez les informations de contact et de référence</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="bcNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Numéro de BC (optionnel)
                    </label>
                    <input
                        type="text"
                        id="bcNumber"
                        value={bcNumber}
                        onChange={e => setBcNumber(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Ex: BC-2024-001"
                    />
                </div>
                <div>
                    <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nom du contact *
                    </label>
                    <ContactAutocomplete
                        value={contactName}
                        onChange={setContactName}
                        onSelect={(name, phone) => {
                            setContactName(name);
                            setContactPhone(phone);
                        }}
                        placeholder="Nom du contact"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div>
                <div>
                    <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Téléphone *
                    </label>
                    <input
                        type="tel"
                        id="contactPhone"
                        value={contactPhone}
                        onChange={e => setContactPhone(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                    />
                </div>
            </div>
            <div className="mt-4">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Notes générales (optionnel)
                </label>
                <textarea
                    id="notes"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
            </div>
        </div>
    );
};

export default ContactInfoForm;
