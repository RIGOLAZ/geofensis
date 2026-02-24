#!/bin/bash

echo "🚀 Setup Geofencing Pro..."

# Install root dependencies
npm install

# Install mobile
cd mobile
npm install
cd ..

# Install web-admin
cd web-admin
npm install
cd ..

# Install functions
cd functions
npm install
cd ..

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Configure Firebase: firebase login && firebase init"
echo "  2. Update mobile/src/config/firebase.js with your config"
echo "  3. cd mobile && npx expo start"
echo "  4. cd web-admin && npm run dev"
