import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, query, orderBy, limit, serverTimestamp, setDoc, runTransaction, writeBatch } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Configuration Firebase (utilisera les variables d'environnement)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

import type { RequestedItem, InventoryItem, PickupRequest } from '../types';

// Types pour les données
export interface FirebasePickupRequest extends Omit<PickupRequest, 'items'> {
  requestNumber: number; // Numéro séquentiel
  items: RequestedItem[];
  createdAt: any; // Timestamp Firebase
  updatedAt: any; // Timestamp Firebase
}


class FirebaseService {
  // Obtenir le prochain numéro de requête de manière atomique
  async getNextRequestNumber(): Promise<number> {
    const counterDocRef = doc(db, 'counters', 'requestNumber');

    try {
      const newRequestNumber = await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterDocRef);

        let nextValue: number;

        if (!counterDoc.exists()) {
          // Créer le compteur s'il n'existe pas
          nextValue = 1;
          transaction.set(counterDocRef, {
            value: nextValue,
            updatedAt: serverTimestamp()
          });
        } else {
          const currentValue = counterDoc.data()?.value || 0;
          nextValue = currentValue + 1;

          transaction.update(counterDocRef, {
            value: nextValue,
            updatedAt: serverTimestamp()
          });
        }

        return nextValue;
      });

      return newRequestNumber;

    } catch (error) {
      console.error('Error getting next request number with transaction:', error);
      // Fallback to timestamp-based ID if transaction fails
      return Date.now();
    }
  }

  // Réserver une plage de numéros de requête
  async reserveRequestNumbers(count: number): Promise<number> {
    const counterDocRef = doc(db, 'counters', 'requestNumber');

    try {
      const startValue = await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterDocRef);

        let rangeStart: number;
        let nextValue: number;

        if (!counterDoc.exists()) {
          rangeStart = 1;
          nextValue = count; // Last assigned value will be count (e.g., if count=3, assignments are 1,2,3. Last=3)

          transaction.set(counterDocRef, {
            value: nextValue,
            updatedAt: serverTimestamp()
          });
        } else {
          const currentValue = counterDoc.data()?.value || 0;
          rangeStart = currentValue + 1;
          nextValue = currentValue + count;

          transaction.update(counterDocRef, {
            value: nextValue,
            updatedAt: serverTimestamp()
          });
        }

        return rangeStart;
      });

      return startValue;

    } catch (error) {
      console.error('Error reserving request numbers:', error);
      throw error;
    }
  }

  // Ajouter plusieurs demandes (batch)
  async addPickupRequests(requests: Omit<FirebasePickupRequest, 'id' | 'requestNumber' | 'createdAt' | 'updatedAt'>[]): Promise<void> {
    if (requests.length === 0) return;

    try {
      // 1. Réserver les numéros
      const startRequestNumber = await this.reserveRequestNumbers(requests.length);

      // 2. Traiter par lots de 500
      const batchSize = 500;
      const chunks = [];

      for (let i = 0; i < requests.length; i += batchSize) {
        chunks.push(requests.slice(i, i + batchSize));
      }

      let currentRequestNumber = startRequestNumber;

      for (const chunk of chunks) {
        const batch = writeBatch(db);

        chunk.forEach(request => {
          const docRef = doc(collection(db, 'pickupRequests'));
          batch.set(docRef, {
            ...request,
            requestNumber: currentRequestNumber++,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        });

        await batch.commit();
      }

      console.log(`Successfully added ${requests.length} pickup requests.`);
    } catch (error) {
      console.error('Error adding pickup requests in batch:', error);
      throw error;
    }
  }

  // Ajouter une nouvelle demande
  async addPickupRequest(request: Omit<FirebasePickupRequest, 'id' | 'requestNumber' | 'createdAt' | 'updatedAt'>): Promise<{ id: string, requestNumber: number }> {
    const requestNumber = await this.getNextRequestNumber();
    const docRef = await addDoc(collection(db, 'pickupRequests'), {
      ...request,
      requestNumber,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, requestNumber };
  }

  // Mettre à jour une demande
  async updatePickupRequest(id: string, updates: Partial<FirebasePickupRequest>): Promise<void> {
    const docRef = doc(db, 'pickupRequests', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  // Mettre à jour plusieurs demandes (bulk)
  async updatePickupRequestsBulk(ids: string[], updates: Partial<FirebasePickupRequest>): Promise<void> {
    if (ids.length === 0) return;

    try {
      const batchSize = 500;
      const chunks = [];
      for (let i = 0; i < ids.length; i += batchSize) {
        chunks.push(ids.slice(i, i + batchSize));
      }

      for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach(id => {
          const docRef = doc(db, 'pickupRequests', id);
          batch.update(docRef, {
            ...updates,
            updatedAt: serverTimestamp()
          });
        });
        await batch.commit();
      }
    } catch (error) {
      console.error('Error in bulk update:', error);
      throw error;
    }
  }

  // Obtenir toutes les demandes
  async getPickupRequests(): Promise<FirebasePickupRequest[]> {
    const q = query(collection(db, 'pickupRequests'), orderBy('requestNumber', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();

      // Sanitize legacy data: ensure required fields always have safe defaults
      const sanitized: FirebasePickupRequest = {
        id: docSnap.id,
        requestNumber: data.requestNumber ?? 0,
        location: data.location ?? '',
        items: Array.isArray(data.items) ? data.items.map((item: any) => ({
          id: item?.id ?? '',
          name: item?.name ?? 'Inconnu',
          quantity: typeof item?.quantity === 'number' ? item.quantity : 1,
          location: item?.location ?? data.location ?? '',
          replaceBin: item?.replaceBin ?? false,
        })) : [],
        date: data.date ?? new Date().toISOString(),
        status: (['pending', 'in_progress', 'completed', 'cancelled'].includes(data.status))
          ? data.status
          : 'pending',
        contactName: data.contactName ?? '',
        contactPhone: data.contactPhone ?? '',
        notes: data.notes ?? '',
        bcNumber: data.bcNumber ?? '',
        cost: data.cost,
        locationCosts: data.locationCosts,
        invoiceUrl: data.invoiceUrl,
        emails: Array.isArray(data.emails) ? data.emails : [],
        attachments: Array.isArray(data.attachments) ? data.attachments : [],
        locationComments: data.locationComments ?? {},
        completedAt: data.completedAt,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };

      return sanitized;
    });
  }

  // Obtenir une demande spécifique
  async getPickupRequest(id: string): Promise<FirebasePickupRequest | null> {
    const docRef = doc(db, 'pickupRequests', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as FirebasePickupRequest;
    }

    return null;
  }

  // Ajouter une pièce jointe à une demande (Image ou PDF)
  async addAttachmentToRequest(requestId: string, file: File): Promise<string> {
    // SECURITY: Validate file size (max 10MB) and type
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size exceeds 10MB limit');
    }
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif'
    ];
    if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/')) {
      throw new Error('Invalid file type. Only PDF and images are allowed.');
    }

    const storageRef = ref(storage, `requests/${requestId}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    // Ajouter l'URL à la demande
    const request = await this.getPickupRequest(requestId);
    if (request) {
      const attachments = request.attachments || [];
      attachments.push(downloadURL);
      await this.updatePickupRequest(requestId, { attachments });
    }

    return downloadURL;
  }

  // Ajouter une facture à une demande
  async addInvoiceToRequest(requestId: string, file: File): Promise<string> {
    // SECURITY: Validate file size (max 10MB) and type
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size exceeds 10MB limit');
    }
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/')) {
      throw new Error('Invalid file type. Only PDF and images are allowed.');
    }

    const storageRef = ref(storage, `invoices/${requestId}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    // Mettre à jour l'URL de la facture dans la demande
    await this.updatePickupRequest(requestId, { invoiceUrl: downloadURL });

    return downloadURL;
  }

  // Mettre à jour les courriels de suivi
  async updateRequestEmails(requestId: string, emails: string[]): Promise<void> {
    await this.updatePickupRequest(requestId, { emails });
  }

  // Gestion de l'inventaire
  async getInventory(): Promise<InventoryItem[]> {
    const querySnapshot = await getDocs(collection(db, 'inventory'));

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as InventoryItem));
  }

  async updateInventory(items: InventoryItem[]): Promise<void> {
    try {
      // Firestore batch has a limit of 500 operations
      const batchSize = 500;
      const chunks = [];

      for (let i = 0; i < items.length; i += batchSize) {
        chunks.push(items.slice(i, i + batchSize));
      }

      for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach(item => {
          const docRef = doc(db, 'inventory', item.id);
          batch.set(docRef, {
            ...item,
            updatedAt: serverTimestamp()
          });
        });
        await batch.commit();
      }
      console.log(`Inventory updated successfully (${items.length} items)`);
    } catch (error) {
      console.error('Error updating inventory:', error);
      throw error;
    }
  }

  // Synchroniser l'inventaire local avec Firebase
  async syncInventoryWithFirebase(localInventory: InventoryItem[]): Promise<void> {
    try {
      const firebaseInventory = await this.getInventory();

      // Fusionner les données
      // Optimization: Create a Map for O(1) lookup instead of O(N) find inside loop
      const firebaseInventoryMap = new Map(firebaseInventory.map(item => [item.id, item]));

      const mergedInventory = localInventory.map(localItem => {
        const firebaseItem = firebaseInventoryMap.get(localItem.id);
        return firebaseItem || {
          ...localItem,
          updatedAt: serverTimestamp()
        };
      });

      await this.updateInventory(mergedInventory);
    } catch (error) {
      console.error('Error syncing inventory:', error);
      throw error;
    }
  }
}

export const firebaseService = new FirebaseService();
export { db, storage };