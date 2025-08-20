import express from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import { AuthService } from '../services/authService.js'
import { authLimiter, createAccountLimiter } from '../middleware/rateLimiter.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { registerSchema, loginSchema, updateProfileSchema } from '../validation/authSchemas.js'

const router = express.Router()
const authService = new AuthService()

// POST /auth/register - Limité à 3 créations de compte par heure par IP
router.post('/register', 
    createAccountLimiter,
    validateRequest(registerSchema),
    async (req, res) => {
        try {
            const {user, profile} = await authService.registerUser(
                req.body.email,
                req.body.password,
                req.body.role,
                req.body.profileData
            )
            res.status(201).json({
                message: 'Inscription réussie',
                user: user,
                profile: profile
            })
        } catch (error) {
            return res.status(400).json({ 
                error: error.message 
            })
        }
    }
)

// POST /auth/login - Limité à 5 tentatives par heure par IP
router.post('/login',
    authLimiter,
    validateRequest(loginSchema),
    async (req, res) => {
        try {
            const { user, session, profile } = await authService.loginUser(
                req.body.email,
                req.body.password
            )

            const setSessionCookie = (res, session) => {
                const cookieOptions = {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 jours
                    sameSite: 'strict'
                }
                res.cookie('access_token', session.access_token, cookieOptions)
                res.cookie('refresh_token', session.refresh_token, cookieOptions)
            }
            setSessionCookie(res, session)
            
            res.json({
                message: 'Connexion réussie',
                user: {
                    id: user.id,
                    email: user.email,
                    role: profile.role
                },
                profile: profile,
            })
        } catch (error) {
            return res.status(401).json({
                error: 'Email ou mot de passe incorrect'
            })
        }
    }
)

// POST /auth/logout
router.post('/logout', requireAuth, async (req, res) => {
    try {
        await authService.logoutUser()
        
        res.clearCookie('access_token')
        res.clearCookie('refresh_token')
        
        res.json({ 
            message: 'Déconnexion réussie',
        })
    } catch (error) {
        res.status(500).json({
            error: 'Erreur lors de la déconnexion'
        })
    }
})
  
// GET /auth/me
router.get('/me', requireAuth, async (req, res) => {
    try {
        res.json({
            message: 'Profil récupéré',
            profile: req.user,
        })
    } catch (error) {
        res.status(500).json({
            error: 'Erreur lors de la récupération du profil'
        })
    }
})
  
// PATCH /auth/profile
router.patch('/profile',
    requireAuth,
    validateRequest(updateProfileSchema),
    async (req, res) => {
        try {
            const updatedProfile = await authService.updateProfile(req.user.id, req.body)
            
            res.json({
                message: 'Profil mis à jour',
                profile: updatedProfile
            })
        } catch (error) {
            res.status(400).json({
                error: 'Erreur lors de la mise à jour du profil'
            })
        }
    }
)
  
// Error handling middleware
router.use((error, req, res, next) => {
    console.error('Auth Error:', error.message)
    
    if (error.message.includes('duplicate key')) {
        return res.status(409).json({
            error: 'Email déjà utilisé'
        })
    }
    
    if (error.message.includes('Invalid login')) {
        return res.status(401).json({
            error: 'Email ou mot de passe incorrect'
        })
    }
    
    res.status(500).json({
        error: 'Erreur serveur',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    })
})
  
export default router