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

// Types pour les données
export interface FirebasePickupRequest {
  id?: string;
  bcNumber?: string;
  requestNumber: number; // Numéro séquentiel
  location: string;
  items: Array<{
    name: string;
    quantity: number;
  }>;
  date: string;
  contactName: string;
  contactPhone: string;
  notes?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  emails?: string[]; // Courriels en suivi
  images?: string[]; // URLs des images
  locationComments?: Record<string, string>; // Commentaires par lieu
  locationCosts?: Record<string, number>; // Coûts par lieu
  cost?: number; // Coût de la demande
  invoiceUrl?: string; // URL de la facture (PDF ou image)
  createdAt: any; // Timestamp Firebase
  updatedAt: any; // Timestamp Firebase
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  location: string;
  updatedAt: any;
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

  // Obtenir toutes les demandes
  async getPickupRequests(): Promise<FirebasePickupRequest[]> {
    const q = query(collection(db, 'pickupRequests'), orderBy('requestNumber', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebasePickupRequest));
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

  // Ajouter une image à une demande
  async addImageToRequest(requestId: string, file: File): Promise<string> {
    const storageRef = ref(storage, `requests/${requestId}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    // Ajouter l'URL à la demande
    const request = await this.getPickupRequest(requestId);
    if (request) {
      const images = request.images || [];
      images.push(downloadURL);
      await this.updatePickupRequest(requestId, { images });
    }

    return downloadURL;
  }

  // Ajouter une facture à une demande
  async addInvoiceToRequest(requestId: string, file: File): Promise<string> {
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
      const mergedInventory = localInventory.map(localItem => {
        const firebaseItem = firebaseInventory.find(fi => fi.id === localItem.id);
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