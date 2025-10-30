# 🚚 Gestion des MDR - Système de Gestion de Cueillette

Application web moderne pour la gestion des demandes de ramassage de conteneurs (MDR).

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-19.2.0-61dafb.svg)
![Firebase](https://img.shields.io/badge/Firebase-Enabled-orange.svg)

## ✨ Fonctionnalités

### 📦 Gestion d'inventaire
- Suivi en temps réel des conteneurs vides par localisation
- Mise à jour facile des quantités
- Organisation par lieu de collecte

### ➕ Création de demandes
- **Mode simple** : Demande pour un seul lieu
- **Mode multi-sélection** : Demande pour plusieurs lieux simultanément
- Numérotation automatique et séquentielle (#1, #2, #3...)
- Champ pour numéro de bon de commande (BC)
- Commentaires spécifiques par lieu de collecte

### 📄 Génération PDF
- PDF professionnel avec design moderne
- Regroupement automatique par localisation
- Inclusion des commentaires par lieu
- Téléchargement instantané

### 📋 Historique complet
- Visualisation de toutes les demandes
- Modification des demandes existantes
- Filtrage par statut (en attente / complétée)
- Ajout de courriels de suivi
- Support des pièces jointes (images)

### ☁️ Synchronisation cloud (Firebase)
- Sauvegarde automatique dans le cloud
- Accès depuis n'importe où
- Synchronisation en temps réel
- Numérotation séquentielle garantie

## 🚀 Démarrage rapide

### Prérequis
- Node.js 20.x ou supérieur
- npm ou yarn
- Compte Firebase (pour la production)

### Installation locale

```bash
# Cloner le dépôt
git clone https://github.com/ahoken50/Gestion-des-MDR.git
cd Gestion-des-MDR

# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev
```

L'application sera accessible sur `http://localhost:3000/Gestion-des-MDR/`

### Configuration Firebase (optionnel)

Pour activer la synchronisation cloud, suivez le guide :
- **Guide rapide** : [FIREBASE_QUICK_START.md](./FIREBASE_QUICK_START.md) (5 minutes)
- **Guide complet** : [FIREBASE_SETUP_GUIDE.md](./FIREBASE_SETUP_GUIDE.md)

## 🏗️ Technologies utilisées

### Frontend
- **React 19.2** - Framework UI
- **TypeScript** - Typage statique
- **Tailwind CSS** - Styling moderne
- **Vite** - Build tool rapide

### Backend / Cloud
- **Firebase Firestore** - Base de données NoSQL
- **Firebase Storage** - Stockage de fichiers
- **Firebase Authentication** - Authentification

### Génération PDF
- **jsPDF** - Création de PDF
- **jsPDF-AutoTable** - Tableaux dans PDF
- **html2canvas** - Capture d'écran

### Déploiement
- **GitHub Pages** - Hébergement statique
- **GitHub Actions** - CI/CD automatique

## 📁 Structure du projet

```
Gestion-des-MDR/
├── src/
│   ├── index.tsx          # Point d'entrée
│   └── index.css          # Styles globaux
├── components/
│   ├── Header.tsx         # En-tête de navigation
│   ├── InventoryManager.tsx    # Gestion inventaire
│   ├── UnifiedRequestForm.tsx  # Formulaire de demande
│   ├── RequestHistory.tsx      # Historique
│   ├── RequestDetail.tsx       # Détails/Modification
│   └── icons.tsx          # Composants d'icônes
├── services/
│   ├── firebaseService.ts      # Service Firebase
│   ├── pdfService.ts           # Génération PDF simple
│   └── pdfServiceMulti.ts      # Génération PDF multi
├── types.ts               # Types TypeScript
├── types-pdf.ts           # Types PDF
├── constants.ts           # Constantes
├── App.tsx                # Composant principal
└── index.html             # HTML de base
```

## 🔧 Scripts disponibles

```bash
# Développement
npm run dev          # Lance le serveur de développement

# Production
npm run build        # Compile pour la production
npm run preview      # Prévisualise le build de production
```

## 🌐 Déploiement

### GitHub Pages (automatique)

Le déploiement est automatique via GitHub Actions :
1. Poussez vos changements sur la branche `main`
2. Le workflow se déclenche automatiquement
3. L'application est déployée sur GitHub Pages

**URL de production** : https://ahoken50.github.io/Gestion-des-MDR/

### Configuration requise

Ajoutez ces secrets dans GitHub :
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`

## 📝 Guide d'utilisation

### 1. Gérer l'inventaire
1. Allez dans l'onglet **"Inventaire"**
2. Modifiez les quantités de conteneurs vides
3. Les changements sont sauvegardés automatiquement

### 2. Créer une demande simple
1. Allez dans **"Nouvelle Demande"**
2. Sélectionnez **"Demande simple (un lieu)"**
3. Remplissez les informations de contact
4. Choisissez le lieu de collecte
5. Ajoutez les contenants souhaités
6. Cliquez sur **"Soumettre la demande"**

### 3. Créer une demande multi-lieux
1. Allez dans **"Nouvelle Demande"**
2. Sélectionnez **"Sélection multiple (plusieurs lieux)"**
3. Remplissez les informations de contact
4. Sélectionnez les contenants de différents lieux
5. Ajoutez des commentaires par lieu (optionnel)
6. Cliquez sur **"Générer le PDF de ramassage"**

### 4. Consulter l'historique
1. Allez dans **"Historique"**
2. Filtrez par statut si nécessaire
3. Cliquez sur **"Détails"** pour voir/modifier une demande
4. Cliquez sur l'icône PDF pour télécharger le formulaire

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Forkez le projet
2. Créez une branche (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Poussez vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.

## 👥 Auteurs

- **Développeur principal** - [ahoken50](https://github.com/ahoken50)

## 🙏 Remerciements

- React team pour le framework
- Firebase team pour les services cloud
- Tailwind CSS pour le système de design
- jsPDF pour la génération de PDF

## 📞 Support

Pour toute question ou problème :
- Créez une [issue](https://github.com/ahoken50/Gestion-des-MDR/issues)
- Consultez la [documentation Firebase](https://firebase.google.com/docs)
- Lisez les guides de configuration

---

**Fait avec ❤️ pour simplifier la gestion des demandes de ramassage**