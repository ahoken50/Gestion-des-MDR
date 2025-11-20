# Script pour configurer Node.js et installer les dépendances

Write-Host "🔧 Configuration de Node.js..." -ForegroundColor Cyan

# Ajouter Node.js au PATH pour cette session
$nodePath = "C:\Node\node-v24.11.1-win-x64"
$env:Path = "$nodePath;$env:Path"

Write-Host "✅ Node.js ajouté au PATH" -ForegroundColor Green

# Vérifier que Node.js fonctionne
Write-Host "`n📦 Version de Node.js:" -ForegroundColor Cyan
node --version

Write-Host "`n📦 Version de npm:" -ForegroundColor Cyan
npm --version

# Installer les dépendances du projet
Write-Host "`n📥 Installation des dépendances..." -ForegroundColor Cyan
npm install

Write-Host "`n✅ Installation terminée!" -ForegroundColor Green
Write-Host "`n💡 Pour démarrer le projet, exécutez: npm run dev" -ForegroundColor Yellow
