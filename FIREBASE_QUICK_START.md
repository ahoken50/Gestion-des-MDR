# 🚀 Guide de démarrage rapide Firebase

## ⚡ Configuration en 5 minutes

### Étape 1 : Créer le projet Firebase (2 min)

1. Allez sur https://console.firebase.google.com
2. Cliquez sur **"Ajouter un projet"**
3. Nom du projet : `gestion-mdr`
4. Cliquez sur **"Créer le projet"**

### Étape 2 : Ajouter l'application Web (1 min)

1. Cliquez sur l'icône **Web** (`</>`)
2. Nom de l'app : `Gestion MDR Web`
3. Cliquez sur **"Enregistrer l'application"**
4. **COPIEZ** les informations de configuration :

```javascript
const firebaseConfig = {
  apiKey: "AIza...",                          // ← COPIEZ CECI
  authDomain: "votre-projet.firebaseapp.com", // ← COPIEZ CECI
  projectId: "votre-projet-id",               // ← COPIEZ CECI
  storageBucket: "votre-projet.appspot.com",  // ← COPIEZ CECI
  messagingSenderId: "123456789",             // ← COPIEZ CECI
  appId: "1:123456789:web:abc123"             // ← COPIEZ CECI
};
```

### Étape 3 : Activer Firestore (1 min)

1. Menu latéral → **"Firestore Database"**
2. Cliquez sur **"Créer une base de données"**
3. Choisissez **"Mode production"**
4. Emplacement : `us-central1` ou `europe-west1`
5. Cliquez sur **"Activer"**

### Étape 4 : Activer Storage (30 sec)

1. Menu latéral → **"Storage"**
2. Cliquez sur **"Commencer"**
3. Cliquez sur **"Suivant"** puis **"Terminé"**

### Étape 5 : Activer l'authentification (30 sec)

1. Menu latéral → **"Authentication"**
2. Cliquez sur **"Commencer"**
3. Activez **"Anonyme"**
4. Cliquez sur **"Enregistrer"**

---

## 🔐 Configuration GitHub Secrets

### Dans votre dépôt GitHub :

1. **Settings** → **Secrets and variables** → **Actions**
2. Cliquez sur **"New repository secret"** pour chaque variable :

| Nom du Secret | Valeur à copier depuis Firebase |
|---------------|----------------------------------|
| `FIREBASE_API_KEY` | La valeur de `apiKey` |
| `FIREBASE_AUTH_DOMAIN` | La valeur de `authDomain` |
| `FIREBASE_PROJECT_ID` | La valeur de `projectId` |
| `FIREBASE_STORAGE_BUCKET` | La valeur de `storageBucket` |
| `FIREBASE_MESSAGING_SENDER_ID` | La valeur de `messagingSenderId` |
| `FIREBASE_APP_ID` | La valeur de `appId` |

---

## 🛡️ Règles de sécurité (IMPORTANT)

### Firestore Rules

1. Dans Firebase Console → **Firestore Database** → **Règles**
2. Copiez-collez ce code :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /counters/{document} {
      allow read, write: if request.auth != null;
    }
    
    match /pickupRequests/{requestId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null 
        && request.resource.data.requestNumber is number
        && request.resource.data.contactName is string
        && request.resource.data.contactPhone is string
        && request.resource.data.status in ['pending', 'completed']
        && request.resource.data.items is list
        && request.resource.data.items.size() > 0;
      allow update: if request.auth != null;
      allow delete: if request.auth != null;
    }
    
    match /inventory/{itemId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Cliquez sur **"Publier"**

### Storage Rules

1. Dans Firebase Console → **Storage** → **Règles**
2. Copiez-collez ce code :

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /requests/{requestId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && request.resource.size < 10 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }
  }
}
```

3. Cliquez sur **"Publier"**

---

## 📊 Initialiser le compteur

### Dans Firestore :

1. Cliquez sur **"Démarrer une collection"**
2. ID de collection : `counters`
3. ID du document : `requestNumber`
4. Ajoutez ces champs :
   - `value` (number) : `0`
   - `updatedAt` (timestamp) : Sélectionnez l'heure actuelle
5. Cliquez sur **"Enregistrer"**

---

## ✅ Test de l'intégration

### Test local (optionnel)

1. Créez un fichier `.env` à la racine :

```bash
VITE_FIREBASE_API_KEY=votre_api_key
VITE_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=votre-projet-id
VITE_FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
VITE_FIREBASE_APP_ID=votre_app_id
```

2. Lancez l'application :
```bash
npm run dev
```

### Test en production

1. Poussez vos changements sur GitHub
2. Le workflow GitHub Actions se déclenchera automatiquement
3. Attendez que le déploiement soit terminé
4. Testez l'application sur GitHub Pages
5. Créez une demande et vérifiez dans Firebase Console

---

## 🎉 C'est terminé !

Votre application est maintenant connectée à Firebase !

### Fonctionnalités activées :

✅ Numérotation automatique des demandes (#1, #2, #3...)  
✅ Sauvegarde cloud des demandes  
✅ Synchronisation en temps réel  
✅ Support des images (jusqu'à 10MB)  
✅ Gestion des courriels de suivi  
✅ Historique complet  

---

## 🆘 Problèmes courants

### "Firebase not configured"
→ Vérifiez que tous les secrets GitHub sont définis

### "Permission denied"
→ Vérifiez que les règles de sécurité sont publiées

### "Request number not incrementing"
→ Vérifiez que le document `counters/requestNumber` existe

### "Build fails"
→ Consultez les logs du workflow GitHub Actions

---

## 📚 Documentation complète

Pour plus de détails, consultez **FIREBASE_SETUP_GUIDE.md**

---

**Besoin d'aide ?** Créez une issue sur GitHub ou consultez la [documentation Firebase](https://firebase.google.com/docs)