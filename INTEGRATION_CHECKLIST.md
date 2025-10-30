# ✅ Liste de vérification pour l'intégration Firebase

Utilisez cette checklist pour vous assurer que tout est correctement configuré.

## 📋 Avant de commencer

- [ ] J'ai un compte Google
- [ ] J'ai accès à [Firebase Console](https://console.firebase.google.com)
- [ ] J'ai accès administrateur au dépôt GitHub
- [ ] J'ai lu le guide de démarrage rapide

---

## 🔥 Configuration Firebase

### Projet Firebase
- [ ] Projet Firebase créé
- [ ] Nom du projet noté : `_________________`
- [ ] Application Web ajoutée
- [ ] Configuration Firebase copiée et sauvegardée

### Services activés
- [ ] Firestore Database activé (mode production)
- [ ] Firebase Storage activé
- [ ] Firebase Authentication activé (méthode anonyme)

### Base de données
- [ ] Collection `counters` créée
- [ ] Document `requestNumber` créé avec `value: 0`
- [ ] Règles de sécurité Firestore publiées
- [ ] Règles de sécurité Storage publiées

---

## 🔐 Configuration GitHub

### Secrets GitHub configurés
- [ ] `FIREBASE_API_KEY` ajouté
- [ ] `FIREBASE_AUTH_DOMAIN` ajouté
- [ ] `FIREBASE_PROJECT_ID` ajouté
- [ ] `FIREBASE_STORAGE_BUCKET` ajouté
- [ ] `FIREBASE_MESSAGING_SENDER_ID` ajouté
- [ ] `FIREBASE_APP_ID` ajouté

### Workflow GitHub Actions
- [ ] Fichier `.github/workflows/deploy.yml` contient les variables d'environnement
- [ ] Workflow s'exécute sans erreur
- [ ] Application déployée sur GitHub Pages

---

## 🧪 Tests

### Test local (optionnel)
- [ ] Fichier `.env` créé avec les bonnes valeurs
- [ ] Application lance sans erreur (`npm run dev`)
- [ ] Création d'une demande fonctionne
- [ ] Demande apparaît dans Firebase Console

### Test en production
- [ ] Application accessible sur GitHub Pages
- [ ] Création d'une demande fonctionne
- [ ] Demande sauvegardée dans Firebase
- [ ] Numéro de demande s'incrémente correctement
- [ ] PDF se génère correctement
- [ ] Historique affiche les demandes

---

## 📊 Vérification Firebase Console

### Firestore Database
- [ ] Collection `pickupRequests` existe
- [ ] Les demandes apparaissent avec tous les champs
- [ ] Le champ `requestNumber` s'incrémente
- [ ] Les timestamps sont corrects

### Storage
- [ ] Dossier `requests/` existe (après upload d'image)
- [ ] Les images sont accessibles

### Authentication
- [ ] Des utilisateurs anonymes sont créés
- [ ] Le nombre d'utilisateurs augmente

---

## 🎨 Interface utilisateur

### Apparence
- [ ] Design moderne avec gradients
- [ ] Animations fluides
- [ ] Responsive sur mobile
- [ ] Pas d'erreurs dans la console

### Fonctionnalités
- [ ] Navigation entre les onglets fonctionne
- [ ] Formulaire de demande simple fonctionne
- [ ] Formulaire multi-sélection fonctionne
- [ ] Génération PDF fonctionne
- [ ] Modification de demande fonctionne
- [ ] Filtrage de l'historique fonctionne

---

## 🚨 Résolution de problèmes

Si quelque chose ne fonctionne pas :

### Erreur "Firebase not configured"
- [ ] Vérifier que tous les secrets GitHub sont définis
- [ ] Vérifier l'orthographe des noms de secrets
- [ ] Relancer le workflow GitHub Actions

### Erreur "Permission denied"
- [ ] Vérifier que les règles Firestore sont publiées
- [ ] Vérifier que les règles Storage sont publiées
- [ ] Vérifier que l'authentification anonyme est activée

### Erreur "Request number not incrementing"
- [ ] Vérifier que `counters/requestNumber` existe
- [ ] Vérifier que la valeur est un nombre (0)
- [ ] Vérifier les règles de sécurité pour `counters`

### Build échoue sur GitHub Actions
- [ ] Consulter les logs du workflow
- [ ] Vérifier que tous les secrets sont définis
- [ ] Vérifier qu'il n'y a pas d'erreurs TypeScript

---

## 📈 Prochaines étapes

Une fois tout vérifié :

1. **Tester en conditions réelles**
   - Créer plusieurs demandes
   - Tester sur différents appareils
   - Vérifier la synchronisation

2. **Former les utilisateurs**
   - Montrer comment créer une demande
   - Expliquer les deux modes (simple/multi)
   - Montrer comment consulter l'historique

3. **Surveiller l'utilisation**
   - Vérifier Firebase Console régulièrement
   - Surveiller les quotas Firebase
   - Vérifier les logs d'erreurs

4. **Optimiser si nécessaire**
   - Ajuster les règles de sécurité
   - Optimiser les requêtes
   - Améliorer les performances

---

## 📞 Besoin d'aide ?

- 📖 [Guide de démarrage rapide](./FIREBASE_QUICK_START.md)
- 📚 [Guide complet](./FIREBASE_SETUP_GUIDE.md)
- 🐛 [Créer une issue](https://github.com/ahoken50/Gestion-des-MDR/issues)
- 🔥 [Documentation Firebase](https://firebase.google.com/docs)

---

## ✅ Validation finale

- [ ] Tous les éléments de cette checklist sont cochés
- [ ] L'application fonctionne en production
- [ ] Les données sont sauvegardées dans Firebase
- [ ] Les utilisateurs peuvent créer des demandes
- [ ] Je suis prêt à utiliser l'application !

---

**Date de validation** : _______________

**Validé par** : _______________

**Notes** : 
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________