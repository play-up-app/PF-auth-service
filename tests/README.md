# 🧪 Tests du Service d'Authentification

## Structure des Tests

```
tests/
├── middleware/          # Tests des middlewares
│   ├── accessibility.test.js
│   ├── authMiddleware.test.js
│   └── validateRequest.test.js
├── services/           # Tests des services
│   └── authService.test.js
└── README.md          # Ce fichier
```

## 🎯 Couverture

Objectif de couverture : > 80% sur :
- Lignes
- Branches
- Fonctions
- Statements

## 🔍 Types de Tests

### Tests Unitaires
- Services
- Middlewares
- Validation

### Tests d'Intégration
- Routes
- Base de données
- Authentification

## 🛠️ Outils

- Jest
- Supertest
- Prisma Client

## 📝 Conventions

### Nommage
```javascript
describe('AuthService', () => {
    describe('registerUser', () => {
        it('devrait créer un nouvel utilisateur', () => {
            // ...
        });
    });
});
```

### Mocks
```javascript
// Mock Prisma
const mockPrismaClient = {
    user: {
        create: jest.fn(),
        findUnique: jest.fn()
    }
};

// Mock Supabase
const mockSupabase = {
    auth: {
        signUp: jest.fn()
    }
};
```

## 🏃 Exécution

```bash
# Tous les tests
npm test

# Tests spécifiques
npm test auth.test.js

# Couverture
npm run test:coverage

```

## ✅ Validation CI

Les tests sont exécutés automatiquement :
- À chaque push
- Dans les Pull Requests
- Quotidiennement (nightly)