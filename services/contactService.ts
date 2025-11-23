// Contact autocomplete service
// Stores and retrieves frequently used contacts

import { firebaseService } from './firebaseService';

export interface Contact {
    id?: string;
    name: string;
    phone: string;
    lastUsed: number;
    useCount: number;
}

class ContactService {
    private readonly STORAGE_KEY = 'mdr_contacts';
    private contacts: Contact[] = [];

    constructor() {
        this.loadContacts();
    }

    /**
     * Load contacts from localStorage
     */
    private loadContacts(): void {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                this.contacts = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading contacts:', error);
            this.contacts = [];
        }
    }

    /**
     * Save contacts to localStorage
     */
    private saveContacts(): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.contacts));
        } catch (error) {
            console.error('Error saving contacts:', error);
        }
    }

    /**
     * Add or update a contact
     */
    addContact(name: string, phone: string): void {
        const existing = this.contacts.find(c =>
            c.name.toLowerCase() === name.toLowerCase() || c.phone === phone
        );

        if (existing) {
            // Update existing
            existing.name = name;
            existing.phone = phone;
            existing.lastUsed = Date.now();
            existing.useCount++;
        } else {
            // Add new
            this.contacts.push({
                name,
                phone,
                lastUsed: Date.now(),
                useCount: 1
            });
        }

        this.saveContacts();
    }

    /**
     * Search contacts by name (fuzzy search)
     */
    searchContacts(query: string): Contact[] {
        if (!query || query.trim().length < 2) return [];

        const searchTerm = query.toLowerCase();

        return this.contacts
            .filter(contact =>
                contact.name.toLowerCase().includes(searchTerm)
            )
            .sort((a, b) => {
                // Sort by: exact match > starts with > use count > last used
                const aName = a.name.toLowerCase();
                const bName = b.name.toLowerCase();

                if (aName === searchTerm) return -1;
                if (bName === searchTerm) return 1;

                if (aName.startsWith(searchTerm) && !bName.startsWith(searchTerm)) return -1;
                if (bName.startsWith(searchTerm) && !aName.startsWith(searchTerm)) return 1;

                if (a.useCount !== b.useCount) return b.useCount - a.useCount;

                return b.lastUsed - a.lastUsed;
            })
            .slice(0, 5); // Return top 5
    }

    /**
     * Get contact by name
     */
    getContactByName(name: string): Contact | undefined {
        return this.contacts.find(c =>
            c.name.toLowerCase() === name.toLowerCase()
        );
    }

    /**
     * Get all contacts sorted by usage
     */
    getAllContacts(): Contact[] {
        return [...this.contacts].sort((a, b) => {
            if (a.useCount !== b.useCount) return b.useCount - a.useCount;
            return b.lastUsed - a.lastUsed;
        });
    }

    /**
     * Delete a contact
     */
    deleteContact(name: string): void {
        this.contacts = this.contacts.filter(c =>
            c.name.toLowerCase() !== name.toLowerCase()
        );
        this.saveContacts();
    }

    /**
     * Clear all contacts
     */
    clearAllContacts(): void {
        this.contacts = [];
        this.saveContacts();
    }
}

export const contactService = new ContactService();
