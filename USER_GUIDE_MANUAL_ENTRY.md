# 📖 Guide d'utilisation - Ajout manuel de contenants

## 🎯 Vue d'ensemble

Cette fonctionnalité vous permet d'ajouter des contenants personnalisés qui ne sont pas dans l'inventaire permanent. C'est idéal pour les contenants temporaires ou spéciaux comme "Baril de colasse vide", "Contenant spécial client", etc.

## ✨ Disponibilité

L'ajout manuel est maintenant disponible dans **DEUX modes** :

1. ✅ **Mode Simple** (demande pour un seul lieu)
2. ✅ **Mode Multi-Sélection** (demande pour plusieurs lieux)

## 🚀 Comment utiliser - Mode Simple

### Étape 1 : Accéder au formulaire
1. Cliquez sur l'onglet **"📝 Nouvelle demande"**
2. Assurez-vous que **"Demande simple (un lieu)"** est sélectionné

### Étape 2 : Ajouter un contenant manuel
1. Dans la section **"📦 Contenants à ramasser"**
2. Cliquez sur le bouton **"✏️ Ajouter manuellement"** (bouton bleu)

### Étape 3 : Entrer les informations
1. **Nom du contenant** : Entrez le nom (ex: "Baril de colasse vide")
2. Le contenant apparaît dans votre liste
3. Ajustez la quantité si nécessaire

### Étape 4 : Soumettre
1. Remplissez les autres informations (contact, téléphone)
2. Cliquez sur **"✅ Soumettre la demande"**

## 🎨 Comment utiliser - Mode Multi-Sélection

### Étape 1 : Accéder au mode multi-sélection
1. Cliquez sur l'onglet **"📝 Nouvelle demande"**
2. Sélectionnez **"📋 Sélection multiple (plusieurs lieux)"**

### Étape 2 : Ajouter un contenant manuel
1. Dans la section **"📦 Sélectionner les contenants à ramasser"**
2. Cliquez sur le bouton **"✏️ Ajouter un contenant manuellement"** (en haut)

### Étape 3 : Suivre les invites
Le système vous demandera 3 informations :

#### 3.1 Nom du contenant
```
Entrez le nom du contenant personnalisé (ex: Baril de colasse vide):
```
- Tapez le nom exact
- Exemple : "Baril de colasse vide"
- Cliquez sur OK

#### 3.2 Choix du lieu
```
Choisissez le lieu pour "Baril de colasse vide":

1. Atelier
2. Entrepôt
3. Bureau
4. Extérieur

Entrez le numéro:
```
- Tapez le numéro correspondant au lieu
- Exemple : Tapez "1" pour Atelier
- Cliquez sur OK

#### 3.3 Quantité
```
Quantité de "Baril de colasse vide" pour Atelier:
```
- Entrez le nombre de contenants
- Exemple : "3"
- Cliquez sur OK

### Étape 4 : Confirmation
Vous verrez un message de succès :
```
✅ "Baril de colasse vide" ajouté avec succès pour Atelier!
```

### Étape 5 : Vérifier et générer le PDF
1. Le contenant apparaît dans le **"✅ Récapitulatif de la sélection"**
2. Vous pouvez ajouter d'autres contenants (manuels ou de l'inventaire)
3. Ajoutez des commentaires spécifiques au lieu si nécessaire
4. Cliquez sur **"📄 Générer le PDF de ramassage"**

## 💡 Exemples d'utilisation

### Exemple 1 : Contenant temporaire
**Situation** : Un client a laissé un baril spécial qui doit être ramassé

**Solution** :
1. Mode simple ou multi-sélection
2. Cliquer "Ajouter manuellement"
3. Nom : "Baril client ABC - temporaire"
4. Quantité : 1
5. Soumettre la demande

### Exemple 2 : Contenants multiples dans différents lieux
**Situation** : Ramassage de barils de colasse vides dans 3 lieux différents

**Solution** :
1. Mode multi-sélection
2. Ajouter manuellement pour Atelier : "Baril de colasse vide" x 2
3. Ajouter manuellement pour Entrepôt : "Baril de colasse vide" x 5
4. Ajouter manuellement pour Extérieur : "Baril de colasse vide" x 1
5. Générer le PDF

### Exemple 3 : Mélange inventaire + manuel
**Situation** : Ramassage normal + contenant spécial

**Solution** :
1. Mode multi-sélection
2. Sélectionner des contenants de l'inventaire (ex: Bacs bleus)
3. Ajouter manuellement : "Contenant spécial projet X"
4. Générer le PDF avec tout

## ⚠️ Points importants

### ✅ À faire
- Utiliser des noms descriptifs et clairs
- Vérifier le lieu sélectionné avant de confirmer
- Vérifier la quantité avant de confirmer
- Ajouter des commentaires si nécessaire

### ❌ À éviter
- Ne pas utiliser de noms trop génériques (ex: "Contenant")
- Ne pas ajouter le même contenant deux fois au même lieu
- Ne pas oublier de remplir les informations de contact

## 🔍 Validation et sécurité

### Vérifications automatiques
Le système vérifie automatiquement :
- ✅ Nom du contenant non vide
- ✅ Lieu valide sélectionné
- ✅ Quantité supérieure à 0
- ✅ Pas de doublons (même nom + même lieu)

### Messages d'erreur
Si vous voyez ces messages :

**"Numéro de lieu invalide"**
- Vous avez entré un numéro qui n'existe pas
- Réessayez avec un numéro de la liste

**"Quantité invalide"**
- Vous avez entré 0 ou un nombre négatif
- Entrez un nombre positif

**"Ce contenant est déjà dans la sélection pour ce lieu"**
- Vous essayez d'ajouter un doublon
- Modifiez la quantité du contenant existant au lieu d'en ajouter un nouveau

## 📊 Différences avec l'inventaire

| Caractéristique | Inventaire | Manuel |
|----------------|-----------|--------|
| Permanent | ✅ Oui | ❌ Non |
| Suivi des quantités | ✅ Oui | ❌ Non |
| Réutilisable | ✅ Oui | ❌ Non |
| Flexible | ❌ Non | ✅ Oui |
| Idéal pour | Items réguliers | Items temporaires |

## 🎯 Cas d'usage recommandés

### Utilisez l'ajout manuel pour :
- ✅ Contenants temporaires
- ✅ Contenants clients spécifiques
- ✅ Items uniques ou rares
- ✅ Contenants de projets spéciaux
- ✅ Items qui ne reviendront pas

### Utilisez l'inventaire pour :
- ✅ Contenants réguliers
- ✅ Items récurrents
- ✅ Contenants standards
- ✅ Items à suivre dans le temps

## 🆘 Dépannage

### Problème : Le bouton "Ajouter manuellement" ne fonctionne pas
**Solution** : Rafraîchissez la page (F5) et réessayez

### Problème : Les invites n'apparaissent pas
**Solution** : Vérifiez que votre navigateur n'a pas bloqué les popups

### Problème : Le contenant n'apparaît pas dans la liste
**Solution** : Vérifiez que vous avez bien cliqué sur OK à chaque étape

### Problème : Je ne peux pas modifier un contenant manuel
**Solution** : Supprimez-le (icône poubelle) et ajoutez-le à nouveau

## 📞 Support

Si vous rencontrez des problèmes :
1. Consultez ce guide
2. Vérifiez la console du navigateur (F12)
3. Contactez le support technique

## 🎉 Avantages de cette fonctionnalité

- ⚡ **Rapidité** : Ajoutez des contenants en quelques secondes
- 🎯 **Flexibilité** : Aucune limite sur les noms
- 📋 **Organisation** : Gardez vos demandes complètes
- 🔄 **Simplicité** : Pas besoin de modifier l'inventaire
- ✅ **Efficacité** : Gérez tous vos contenants en un seul endroit

---

**Version** : 2.2.0  
**Dernière mise à jour** : 2024  
**Statut** : ✅ Fonctionnel dans les deux modes