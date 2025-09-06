import { AuthService } from '../services/authService.js'

const authService = new AuthService()

const requireAuth = async (req, res, next) => {
    // token from header Bearer Authorization
    const token = req.headers.authorization?.split(' ')[1]
    console.log("token", token)
    if (!token) {
        return res.status(401).json({ error: 'Token requis' })
    }

    const isValid = await authService.verifyToken(token)
    if (!isValid) {
        return res.status(401).json({ error: 'Token invalide' })
    }
    
    const userProfile = await authService.getCurrentUser(token)
    if (!userProfile || !userProfile.is_active) {
        return res.status(401).json({ error: 'Utilisateur inactif' })
    }
    console.log('userProfile', userProfile)
    
    req.user = userProfile
    next()
}

const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        // I. Vérification de l'authentification
        if (!req.user) {
            return res.status(401).json({ error: 'Authentification requise' })
        }
      
        // II. Vérification du rôle
        const userRole = req.user.role
        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
      
        if (!roles.includes(userRole)) {
            return res.status(403).json({ 
            error: `Rôle requis: ${roles.join(' ou ')}. Votre rôle: ${userRole}` 
            })
        }
      
        next()
    }
}

const requireOrganisateur = requireRole('organisateur')
const requireJoueur = requireRole('joueur')
const requireSpectateur = requireRole('spectateur')

export { 
    requireAuth, 
    requireRole,
    requireOrganisateur,
    requireJoueur,
    requireSpectateur
}