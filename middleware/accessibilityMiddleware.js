/**
 * Middleware pour ajouter les en-têtes d'accessibilité
 * Implémente les recommandations WCAG 2.1 niveau A de base
 */
export const accessibilityHeaders = (req, res, next) => {
    // Définit la langue par défaut
    res.setHeader('Content-Language', 'fr');
    
    // Ajoute des en-têtes pour les outils d'assistance
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Stocke la langue dans res.locals pour une utilisation ultérieure
    res.locals.language = 'fr';
    
    next();
};

/**
 * Wrapper pour formater les réponses JSON de manière accessible
 * @param {Object} data - Les données à envoyer
 * @param {Object} options - Options supplémentaires (status, etc.)
 */
export const wrapAccessibleResponse = (data, options = {}) => ({
    data,
    meta: {
        timestamp: new Date().toISOString(),
        language: 'fr',
        status: options.status || 'success',
        // Ajoute un message descriptif si c'est une erreur
        ...(options.status === 'error' && {
            errorDescription: options.message || 'Une erreur est survenue'
        })
    }
});
