import express from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import { AuthService } from '../services/authService.js'
import { authLimiter, createAccountLimiter } from '../middleware/rateLimiter.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { registerSchema, loginSchema, updateProfileSchema } from '../validation/authSchemas.js'
import { createClient } from '@supabase/supabase-js'

const router = express.Router()
const authService = new AuthService()

// POST /auth/register - Limité à 3 créations de compte par heure par IP
router.post('/register', 
    // createAccountLimiter,
    validateRequest(registerSchema),
    async (req, res) => {
        try {
            const {user, profile} = await authService.registerUser(
                req.body.email,
                req.body.password,
                req.body.role,
                req.body.profileData ?? {}
            )
            res.status(201).json({
                success: true,
                message: 'Inscription réussie',
                data: { user, profile }
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
    // authLimiter,
    validateRequest(loginSchema),
    async (req, res) => {
        try {
            const { user, session, profile } = await authService.loginUser(
                req.body.email,
                req.body.password
            )

            // const setSessionCookie = (res, session) => {
            //     const cookieOptions = {
            //         httpOnly: true,
            //         secure: process.env.NODE_ENV === 'production',
            //         maxAge: 1000 * 60 * 60 * 24 * 30, // 30 jours
            //         sameSite: 'strict'
            //     }
            //     res.cookie('access_token', session.access_token, cookieOptions)
            //     res.cookie('refresh_token', session.refresh_token, cookieOptions)
            // }
            // setSessionCookie(res, session)

            res.json({
                success: true,
                message: 'Connexion réussie',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        role: profile.role,
                        access_token: session.access_token,
                        refresh_token: session.refresh_token
                    },
                }
            })
        } catch (error) {
            return res.status(401).json({
                error: 'Email ou mot de passe incorrect'
            })
        }
    }
)

// POST /auth/logout
router.post('/logout', async (req, res) => {
    try {
        await authService.logoutUser()
        res.json({ 
            success: true,
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
            success: true,
            message: 'Profil récupéré',
            data: {
                user: req.user,
            }
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
                success: true,
                message: 'Profil mis à jour',
                data: {
                    profile: updatedProfile
                }
            })
        } catch (error) {
            res.status(400).json({
                error: 'Erreur lors de la mise à jour du profil'
            })
        }
    }
)

// GET /auth/confirm
router.get('/confirm', async (req, res) => {
    const token_hash = req.query.token_hash
    const type = req.query.type
    const next = req.query.next ?? "/"
    if (token_hash && type) {
      const supabase = createClient({ req, res })
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      })
      if (!error) {
        res.redirect(303, `/${next.slice(1)}`)
      }
    }
    // return the user to an error page with some instructions
    res.redirect(303, '/auth/auth-code-error')
})
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