# Vérification complète avant build
Write-Host "🔍 Vérification de l'arborescence..." -ForegroundColor Cyan
$errors = @()
$criticalFiles = @(
    "web-admin/vite.config.js",
    "web-admin/index.html", 
    "web-admin/src/main.jsx",
    "mobile/eas.json",
    "mobile/app.json",
    ".firebaserc",
    "firebase.json"
)
foreach ($file in $criticalFiles) {
    if (-not (Test-Path $file)) {
        $errors += "❌ Fichier manquant: $file"
    } else {
        Write-Host "✅ $file" -ForegroundColor Green
    }
}
if ($errors.Count -gt 0) {
    Write-Host "
❌ Erreurs trouvées:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host $_ -ForegroundColor Red }
} else {
    Write-Host "
✅ Tous les fichiers sont corrects!" -ForegroundColor Green
}
