# Plan de travail - Gestion des MDR

## 1. Ajout du numéro de BC dans le formulaire ✅
- [x] Ajouter le champ "Numéro de BC" dans UnifiedRequestForm
- [x] Mettre à jour les types TypeScript pour inclure le numéro de BC
- [x] Modifier le service PDF pour inclure le numéro de BC

## 2. Mise à jour automatique de l'onglet nouvelle demande ✅
- [x] Créer un effet de synchronisation dans UnifiedRequestForm
- [x] Utiliser useEffect pour écouter les changements d'inventaire
- [x] Assurer la réactivité des listes de contenants

## 3. Amélioration du PDF ✅
- [x] Redessiner le modèle PDF avec un design plus professionnel
- [x] Ajouter les adresses complètes des lieux de collecte
- [x] Ajouter des champs de commentaires par lieu
- [x] Améliorer la mise en page et le style

## 4. Modification des demandes dans l'historique ✅
- [x] Créer un composant de détail/modification de demande
- [x] Ajouter un bouton "Modifier" dans RequestHistory
- [x] Implémenter la logique de mise à jour des demandes
- [x] Gérer la mise à jour de l'inventaire lors de la modification

## 5. Intégration Firebase ✅
- [x] Installer les dépendances Firebase
- [x] Configurer Firebase avec les clés API
- [x] Créer la structure de la base de données
- [x] Implémenter la sauvegarde des demandes dans Firebase
- [x] Ajouter la gestion des courriels et images
- [x] Implémenter le séquençage automatique des numéros de requête
- [x] Migrer les données existantes vers Firebase

## 6. Règles de sécurité Firebase ✅
- [x] Créer les règles de lecture/écriture appropriées
- [x] Configurer l'accès par utilisateur
- [x] Sécuriser les données sensibles