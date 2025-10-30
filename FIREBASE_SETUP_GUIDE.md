# 🔥 Guide d'intégration Firebase - Gestion des MDR

Ce guide vous explique comment configurer Firebase pour votre application de gestion de cueillette.

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Création du projet Firebase](#création-du-projet-firebase)
3. [Configuration de Firestore Database](#configuration-de-firestore-database)
4. [Configuration de Firebase Storage](#configuration-de-firebase-storage)
5. [Configuration de l'authentification](#configuration-de-lauthentification)
6. [Variables d'environnement](#variables-denvironnement)
7. [Déploiement des règles de sécurité](#déploiement-des-règles-de-sécurité)
8. [Configuration GitHub Secrets](#configuration-github-secrets)
9. [Test de l'intégration](#test-de-lintégration)
10. [Dépannage](#dépannage)

---

## 🎯 Prérequis

- Un compte Google
- Accès à [Firebase Console](https://console.firebase.google.com)
- Accès administrateur au dépôt GitHub
- Node.js installé localement (pour les tests)

---

## 🚀 Création du projet Firebase

### Étape 1 : Créer un nouveau projet

1. Allez sur [Firebase Console](https://console.firebase.google.com)
2. Cliquez sur **"Ajouter un projet"** ou **"Create a project"**
3. Entrez le nom du projet : `gestion-mdr` (ou votre choix)
4. **Google Analytics** : Vous pouvez l'activer ou le désactiver selon vos besoins
5. Cliquez sur **"Créer le projet"**

### Étape 2 : Ajouter une application Web

1. Dans la console Firebase, cliquez sur l'icône **Web** (`</>`)
2. Enregistrez votre application avec un nom : `Gestion MDR Web`
3. **Cochez** "Also set up Firebase Hosting" si vous voulez utiliser Firebase Hosting
4. Cliquez sur **"Enregistrer l'application"**
5. **IMPORTANT** : Copiez les informations de configuration qui s'affichent :

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "votre-projet.firebaseapp.com",
  projectId: "votre-projet-id",
  storageBucket: "votre-projet.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

**⚠️ Gardez ces informations en sécurité - vous en aurez besoin plus tard !**

---

## 🗄️ Configuration de Firestore Database

### Étape 1 : Créer la base de données

1. Dans le menu latéral, cliquez sur **"Firestore Database"**
2. Cliquez sur **"Créer une base de données"**
3. Choisissez le mode :
   - **Mode production** (recommandé) : Sécurisé par défaut
   - **Mode test** : Ouvert pendant 30 jours (pour développement uniquement)
4. Choisissez l'emplacement : 
   - `us-central1` (États-Unis)
   - `europe-west1` (Belgique)
   - Choisissez le plus proche de vos utilisateurs
5. Cliquez sur **"Activer"**

### Étape 2 : Structure de la base de données

Votre base de données aura automatiquement cette structure :

```
firestore/
├── counters/
│   └── requestNumber (document)
│       └── value: 0
│       └── updatedAt: timestamp
│
├── pickupRequests/ (collection)
│   └── {requestId} (documents)
│       ├── requestNumber: number
│       ├── bcNumber: string (optionnel)
│       ├── location: string
│       ├── items: array
│       ├── date: string
│       ├── contactName: string
│       ├── contactPhone: string
│       ├── notes: string (optionnel)
│       ├── status: "pending" | "completed"
│       ├── emails: array (optionnel)
│       ├── images: array (optionnel)
│       ├── locationComments: object (optionnel)
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
└── inventory/ (collection)
    └── {itemId} (documents)
        ├── name: string
        ├── quantity: number
        ├── location: string
        └── updatedAt: timestamp
```

### Étape 3 : Initialiser le compteur

1. Dans Firestore, cliquez sur **"Démarrer une collection"**
2. ID de collection : `counters`
3. ID du document : `requestNumber`
4. Ajoutez les champs :
   - `value` (number) : `0`
   - `updatedAt` (timestamp) : Cliquez sur "timestamp" et sélectionnez l'heure actuelle
5. Cliquez sur **"Enregistrer"**

---

## 📦 Configuration de Firebase Storage

### Étape 1 : Activer Storage

1. Dans le menu latéral, cliquez sur **"Storage"**
2. Cliquez sur **"Commencer"**
3. Lisez les règles de sécurité par défaut
4. Cliquez sur **"Suivant"**
5. Choisissez le même emplacement que Firestore
6. Cliquez sur **"Terminé"**

### Étape 2 : Structure des fichiers

Les fichiers seront organisés ainsi :

```
storage/
└── requests/
    └── {requestId}/
        ├── {timestamp}_image1.jpg
        ├── {timestamp}_image2.png
        └── ...
```

---

## 🔐 Configuration de l'authentification

### Option 1 : Authentification anonyme (Recommandé pour commencer)

1. Dans le menu latéral, cliquez sur **"Authentication"**
2. Cliquez sur **"Commencer"**
3. Allez dans l'onglet **"Sign-in method"**
4. Activez **"Anonyme"**
5. Cliquez sur **"Enregistrer"**

### Option 2 : Authentification par email/mot de passe

1. Dans **"Sign-in method"**, activez **"E-mail/Mot de passe"**
2. Créez des utilisateurs dans l'onglet **"Users"**
3. Cliquez sur **"Ajouter un utilisateur"**
4. Entrez email et mot de passe
5. Cliquez sur **"Ajouter un utilisateur"**

### Option 3 : Authentification Google

1. Dans **"Sign-in method"**, activez **"Google"**
2. Configurez l'email de support du projet
3. Cliquez sur **"Enregistrer"**

---

## 🔑 Variables d'environnement

### Étape 1 : Créer le fichier .env local

Créez un fichier `.env` à la racine du projet :

```bash
# Configuration Firebase
VITE_FIREBASE_API_KEY=AIza...votre_clé
VITE_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=votre-projet-id
VITE_FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

**⚠️ IMPORTANT : Ajoutez `.env` à votre `.gitignore` !**

### Étape 2 : Vérifier .gitignore

Assurez-vous que votre `.gitignore` contient :

```
# Environment variables
.env
.env.local
.env.production
```

---

## 🛡️ Déploiement des règles de sécurité

### Méthode 1 : Via la Console Firebase (Recommandé)

#### Pour Firestore :

1. Allez dans **"Firestore Database"**
2. Cliquez sur l'onglet **"Règles"**
3. Copiez-collez le contenu du fichier `firestore.rules` :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Règles pour les compteurs
    match /counters/{document} {
      allow read, write: if request.auth != null;
    }
    
    // Règles pour les demandes de ramassage
    match /pickupRequests/{requestId} {
      // Lecture: uniquement les utilisateurs authentifiés
      allow read: if request.auth != null;
      
      // Création: uniquement les utilisateurs authentifiés
      allow create: if request.auth != null 
        && request.resource.data.requestNumber is number
        && request.resource.data.contactName is string
        && request.resource.data.contactPhone is string
        && request.resource.data.status in ['pending', 'completed']
        && request.resource.data.items is list
        && request.resource.data.items.size() > 0;
      
      // Mise à jour: uniquement les utilisateurs authentifiés
      allow update: if request.auth != null 
        && request.resource.data.requestNumber is number;
      
      // Suppression: uniquement les administrateurs
      allow delete: if request.auth != null;
    }
    
    // Règles pour l'inventaire
    match /inventory/{itemId} {
      // Lecture: tous les utilisateurs authentifiés
      allow read: if request.auth != null;
      
      // Écriture: tous les utilisateurs authentifiés
      allow write: if request.auth != null;
    }
  }
}
```

4. Cliquez sur **"Publier"**

#### Pour Storage :

1. Allez dans **"Storage"**
2. Cliquez sur l'onglet **"Règles"**
3. Copiez-collez ces règles :

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Images des demandes
    match /requests/{requestId}/{allPaths=**} {
      // Lecture: uniquement si l'utilisateur est authentifié
      allow read: if request.auth != null;
      
      // Écriture: uniquement si l'utilisateur est authentifié
      allow write: if request.auth != null
        && request.resource.size < 10 * 1024 * 1024  // Max 10MB
        && request.resource.contentType.matches('image/.*');
    }
  }
}
```

4. Cliquez sur **"Publier"**

### Méthode 2 : Via Firebase CLI (Avancé)

```bash
# Installer Firebase CLI
npm install -g firebase-tools

# Se connecter
firebase login

# Initialiser le projet
firebase init

# Déployer les règles
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

---

## 🔐 Configuration GitHub Secrets

### Étape 1 : Accéder aux Secrets

1. Allez sur votre dépôt GitHub
2. Cliquez sur **"Settings"** (Paramètres)
3. Dans le menu latéral, cliquez sur **"Secrets and variables"** → **"Actions"**

### Étape 2 : Ajouter les secrets

Cliquez sur **"New repository secret"** pour chaque variable :

#### Secret 1 : FIREBASE_API_KEY
- **Name** : `FIREBASE_API_KEY`
- **Value** : Votre clé API Firebase (ex: `AIza...`)

#### Secret 2 : FIREBASE_AUTH_DOMAIN
- **Name** : `FIREBASE_AUTH_DOMAIN`
- **Value** : `votre-projet.firebaseapp.com`

#### Secret 3 : FIREBASE_PROJECT_ID
- **Name** : `FIREBASE_PROJECT_ID`
- **Value** : `votre-projet-id`

#### Secret 4 : FIREBASE_STORAGE_BUCKET
- **Name** : `FIREBASE_STORAGE_BUCKET`
- **Value** : `votre-projet.appspot.com`

#### Secret 5 : FIREBASE_MESSAGING_SENDER_ID
- **Name** : `FIREBASE_MESSAGING_SENDER_ID`
- **Value** : `123456789`

#### Secret 6 : FIREBASE_APP_ID
- **Name** : `FIREBASE_APP_ID`
- **Value** : `1:123456789:web:abc123`

### Étape 3 : Mettre à jour le workflow GitHub Actions

Le fichier `.github/workflows/deploy.yml` doit inclure :

```yaml
env:
  VITE_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
  VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}
  VITE_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
  VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.FIREBASE_STORAGE_BUCKET }}
  VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.FIREBASE_MESSAGING_SENDER_ID }}
  VITE_FIREBASE_APP_ID: ${{ secrets.FIREBASE_APP_ID }}
```

---

## ✅ Test de l'intégration

### Test local

1. Créez votre fichier `.env` avec les bonnes valeurs
2. Lancez l'application :
```bash
npm run dev
```
3. Ouvrez l'application dans votre navigateur
4. Créez une nouvelle demande
5. Vérifiez dans Firebase Console :
   - **Firestore** : La demande doit apparaître dans `pickupRequests`
   - **Firestore** : Le compteur `requestNumber` doit être incrémenté

### Test en production

1. Poussez vos changements sur GitHub
2. Le workflow GitHub Actions se déclenchera automatiquement
3. Une fois déployé, testez l'application sur GitHub Pages
4. Vérifiez que les données sont bien sauvegardées dans Firebase

---

## 🔧 Dépannage

### Problème : "Firebase not configured"

**Solution** : Vérifiez que toutes les variables d'environnement sont définies :
```bash
# Vérifier localement
echo $VITE_FIREBASE_API_KEY

# Vérifier dans GitHub
# Settings → Secrets and variables → Actions
```

### Problème : "Permission denied"

**Solution** : Vérifiez les règles de sécurité Firestore et Storage. Assurez-vous que l'authentification est activée.

### Problème : "Request number not incrementing"

**Solution** : 
1. Vérifiez que le document `counters/requestNumber` existe
2. Vérifiez que la valeur initiale est un nombre (0)
3. Vérifiez les règles de sécurité pour `counters`

### Problème : "Images not uploading"

**Solution** :
1. Vérifiez que Storage est activé
2. Vérifiez les règles de sécurité Storage
3. Vérifiez la taille des images (max 10MB)
4. Vérifiez le format (doit être une image)

### Problème : "Build fails on GitHub Actions"

**Solution** :
1. Vérifiez que tous les secrets sont définis dans GitHub
2. Vérifiez le fichier `.github/workflows/deploy.yml`
3. Consultez les logs du workflow pour plus de détails

---

## 📚 Ressources supplémentaires

- [Documentation Firebase](https://firebase.google.com/docs)
- [Documentation Firestore](https://firebase.google.com/docs/firestore)
- [Documentation Storage](https://firebase.google.com/docs/storage)
- [Règles de sécurité Firestore](https://firebase.google.com/docs/firestore/security/get-started)
- [Règles de sécurité Storage](https://firebase.google.com/docs/storage/security)

---

## 🎉 Félicitations !

Votre application est maintenant configurée avec Firebase ! Les demandes seront automatiquement sauvegardées dans le cloud et accessibles depuis n'importe où.

### Fonctionnalités activées :

✅ Numérotation séquentielle automatique des demandes  
✅ Sauvegarde cloud des demandes  
✅ Synchronisation en temps réel  
✅ Support des images et pièces jointes  
✅ Gestion des courriels de suivi  
✅ Historique complet des modifications  

---

**Besoin d'aide ?** Consultez la documentation Firebase ou créez une issue sur GitHub.