import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, query, orderBy, limit, serverTimestamp, setDoc } from 'firebase/firestore';
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
  status: 'pending' | 'completed';
  emails?: string[]; // Courriels en suivi
  images?: string[]; // URLs des images
  locationComments?: Record<string, string>; // Commentaires par lieu
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
  // Obtenir le prochain numéro de requête
  async getNextRequestNumber(): Promise<number> {
    try {
      const counterDoc = doc(db, 'counters', 'requestNumber');
      const counterSnap = await getDoc(counterDoc);
      
      if (!counterSnap.exists()) {
        // Créer le compteur s'il n'existe pas
        await setDoc(counterDoc, {
          value: 1,
          updatedAt: serverTimestamp()
        });
        return 1;
      }
      
      const currentValue = counterSnap.data()?.value || 0;
      const nextValue = currentValue + 1;
      
      await updateDoc(counterDoc, {
        value: nextValue,
        updatedAt: serverTimestamp()
      });
      
      return nextValue;
    } catch (error) {
      console.error('Error getting next request number:', error);
      // Fallback to timestamp-based ID if Firebase fails
      return Date.now();
    }
  }

  // Ajouter une nouvelle demande
  async addPickupRequest(request: Omit<FirebasePickupRequest, 'id' | 'requestNumber' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const requestNumber = await this.getNextRequestNumber();
    const docRef = await addDoc(collection(db, 'pickupRequests'), {
      ...request,
      requestNumber,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
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

  // Supprimer une demande
  async deletePickupRequest(id: string): Promise<void> {
    await deleteDoc(doc(db, 'pickupRequests', id));
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
      // Update items one by one instead of using batch
      for (const item of items) {
        const docRef = doc(db, 'inventory', item.id);
        await setDoc(docRef, {
          ...item,
          updatedAt: serverTimestamp()
        });
      }
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
      return mergedInventory;
    } catch (error) {
      console.error('Error syncing inventory:', error);
      throw error;
    }
  }
}

export const firebaseService = new FirebaseService();
export { db, storage };