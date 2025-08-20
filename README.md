# 🔐 Service d'Authentification

Service d'authentification pour la plateforme de tournois, utilisant Supabase Auth et Prisma.

## 🚀 Démarrage Rapide

```bash
# Installation
npm install

# Développement
npm run dev

# Production
npm start
```

## 🔧 Configuration

### Variables d'Environnement
```env
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_KEY=your-key
PORT=3000
NODE_ENV=development|production
```

## 📦 Fonctionnalités

- 👤 Inscription/Connexion utilisateur
- 🔄 Gestion des sessions
- 👥 Gestion des profils
- 🛡️ Sécurité OWASP
- ♿ Accessibilité WCAG

## 🧪 Tests

```bash
# Lancer tous les tests
npm test

# Tests avec couverture
npm run test:coverage

# Tests en mode watch
npm run test:watch
```

## 🔒 Sécurité

- Protection XSS via Helmet
- Rate Limiting
- Validation des données
- Sessions sécurisées
- Logs structurés

## 📝 Logs

Les logs sont stockés dans :
- `logs/error.log` : Erreurs uniquement
- `logs/combined.log` : Tous les logs

## 🛠️ Maintenance

### Commandes Utiles
```bash
# Générer le client Prisma
npx prisma generate

# Vérifier la couverture des tests
npm run test:coverage
```

### Branches Git
- `main` : Production
- `develop` : Développement

## 📚 Documentation

- [Protocole CI/CD](../docs/bloc2/ci-cd-protocol.md)
- [Mesures de Sécurité](../docs/bloc2/security-measures.md)
- [Manuel de Déploiement](../docs/bloc2/deployment-manual.md)

## 🤝 Contribution

1. Créer une branche feature
2. Commiter les changements
3. Créer une Pull Request vers develop
4. Attendre la validation CI