    };

return (
    <div className="max-w-4xl mx-auto space-y-6">
        {/* Mode Selection */}
        <div className="grid grid-cols-2 gap-4 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <button
                onClick={() => setMode('single')}
                className={`py-2 px-4 rounded-md text-sm font-medium transition-all ${mode === 'single'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
            >
                Demande Unique
            </button>
            <button
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