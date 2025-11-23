#!/bin/bash
# Script de deployment rápido para GastosDuo
# Uso: ./deploy.sh

echo "🚀 GastosDuo - Deployment Script"
echo "================================"
echo ""

# Verificar que npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm no está instalado"
    exit 1
fi

# Build de producción
echo "📦 Building production bundle..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Revisa los errores arriba."
    exit 1
fi

echo "✅ Build exitoso!"
echo ""

# Verificar si Git está inicializado
if [ ! -d ".git" ]; then
    echo "📝 Inicializando Git..."
    git init
    git branch -M main
fi

# Agregar cambios
echo "📝 Adding files to git..."
git add .

# Commit
echo "📝 Committing changes..."
read -p "Mensaje del commit (o ENTER para 'Update'): " commit_msg
commit_msg=${commit_msg:-"Update"}
git commit -m "$commit_msg"

# Push
echo "📤 Pushing to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ¡Deployment completado!"
    echo "🌐 Netlify detectará los cambios y desplegará automáticamente"
    echo "⏳ Espera 2-3 minutos y revisa tu sitio"
else
    echo "⚠️  Push falló. Si es la primera vez:"
    echo "   1. Crea un repo en GitHub"
    echo "   2. Ejecuta: git remote add origin <URL-DEL-REPO>"
    echo "   3. Ejecuta: git push -u origin main"
fi
