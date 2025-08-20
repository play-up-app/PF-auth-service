import rateLimit from 'express-rate-limit';

// Limiteur global pour toutes les routes
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limite chaque IP à 100 requêtes par fenêtre
    message: {
        status: 'error',
        message: 'Trop de requêtes depuis cette IP, veuillez réessayer dans 15 minutes'
    },
    standardHeaders: true, // Retourne les en-têtes rate limit info dans les headers `RateLimit-*`
    legacyHeaders: false, // Désactive les en-têtes `X-RateLimit-*`
});

// Limiteur strict pour les routes d'authentification
export const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 5, // Limite chaque IP à 5 tentatives
    message: {
        status: 'error',
        message: 'Trop de tentatives de connexion, veuillez réessayer dans 1 heure'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Limiteur pour les routes de création de compte
export const createAccountLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 3, // Limite chaque IP à 3 créations de compte par heure
    message: {
        status: 'error',
        message: 'Trop de comptes créés depuis cette IP, veuillez réessayer dans 1 heure'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
