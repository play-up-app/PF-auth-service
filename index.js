import express from "express"
import cors from "cors"
import helmet from "helmet"
import authRoutes from './routes/authRoute.js'
import cookieParser from 'cookie-parser'
import { globalLimiter } from './middleware/rateLimiter.js'
import { corsOptions } from './config/cors.js'
import { helmetConfig } from './config/helmet.js'
import { healthCheck } from './middleware/healthCheck.js';
import { accessibilityHeaders, wrapAccessibleResponse } from './middleware/accessibilityMiddleware.js'
import  { 
    requestLogger, 
    logError,
    logInfo 
} from './config/logger.js'

const app = express()
const PORT = process.env.PORT || 3000

// Configuration de Helmet
app.use(helmet(helmetConfig))

// Configuration CORS sécurisée
app.use(cors(corsOptions))

// Middleware de parsing
app.use(express.json({
    limit: '10kb' // Limite la taille des requêtes JSON
}))
app.use(express.urlencoded({ 
    extended: true,
    limit: '10kb' // Limite la taille des données de formulaire
}))
app.use(cookieParser())

// Rate Limiting global
app.use(globalLimiter)

// Middleware d'accessibilité
app.use(accessibilityHeaders)

// Logger pour les requêtes HTTP
app.use(requestLogger)

// Health checks
app.get('/health', healthCheck);

// Routes
app.use('/api/auth', authRoutes)

// Route hello world
app.get('/', (req, res) => {
    res.json(wrapAccessibleResponse({
        message: 'Hello World!',
        service: 'Tournament Auth API',
        version: '1.0.0'
    }))
})

// Middleware de gestion des erreurs globales
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: 'Une erreur interne est survenue',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Middleware pour les routes non trouvées
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Route non trouvée'
    });
});

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
    logError(err, { 
        url: req.url, 
        method: req.method,
        body: req.body,
        user: req.user?.id
    });
    next(err);
});

// Start server
app.listen(PORT, () => {
    logInfo('Serveur démarré', {
        port: PORT,
        env: process.env.NODE_ENV,
        nodeVersion: process.version
    });
})