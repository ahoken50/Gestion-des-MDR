import React, { useState, useEffect, useRef } from 'react';
import { contactService, type Contact } from '../services/contactService';

interface ContactAutocompleteProps {
    value: string;
    onSelect: (name: string, phone: string) => void;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    id?: string;
}

const ContactAutocomplete: React.FC<ContactAutocompleteProps> = ({
    value,
    onSelect,
    onChange,
    placeholder = "Nom du contact",
    className = "",
    disabled = false,
    id
}) => {
    const [suggestions, setSuggestions] = useState<Contact[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Handle click outside to close suggestions
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        onChange(inputValue);

        // Search for suggestions
        if (inputValue.trim().length >= 2) {
            const results = contactService.searchContacts(inputValue);
            setSuggestions(results);
            setShowSuggestions(results.length > 0);
            setActiveSuggestionIndex(0);
        } else {
            setShowSuggestions(false);
        }
    };

    const handleSelectSuggestion = (contact: Contact) => {
        onSelect(contact.name, contact.phone);
        setShowSuggestions(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Arrow down
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveSuggestionIndex(prev =>
                prev < suggestions.length - 1 ? prev + 1 : prev
            );
        }
        // Arrow up
        else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveSuggestionIndex(prev => prev > 0 ? prev - 1 : prev);
        }
        // Enter
        else if (e.key === 'Enter' && showSuggestions && suggestions[activeSuggestionIndex]) {
            e.preventDefault();
            handleSelectSuggestion(suggestions[activeSuggestionIndex]);
        }
        // Escape
        else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    return (
        <div ref={wrapperRef} className="relative">
            <input
                type="text"
                id={id}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                    if (value.trim().length >= 2) {
                        const results = contactService.searchContacts(value);
                        setSuggestions(results);
                        setShowSuggestions(results.length > 0);
                    }
                }}
                placeholder={placeholder}
                disabled={disabled}
                className={className}
                autoComplete="off"
                maxLength={100}
            />

            {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-50 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
                    {suggestions.map((contact, index) => (
                        <li
                            key={index}
                            onClick={() => handleSelectSuggestion(contact)}
                            className={`px-4 py-2 cursor-pointer ${index === activeSuggestionIndex
                                ? 'bg-blue-100 text-blue-900'
                                : 'hover:bg-gray-100'
                                }`}
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="font-medium">{contact.name}</div>
                                    <div className="text-sm text-gray-600">{contact.phone}</div>
                                </div>
                                <div className="text-xs text-gray-400">
                                    {contact.useCount}x utilisé
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ContactAutocomplete;
