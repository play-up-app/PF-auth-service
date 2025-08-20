import { createClient } from '@supabase/supabase-js'
import { prismaClient } from '../config/prisma.js'
import { logInfo, logError } from '../config/logger.js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

export class AuthService {
    constructor() {
        this.supabase = supabase
    }

    async registerUser(email, password, role, profileData) {
        try {
            logInfo('Tentative d\'inscription', { email, role });
            
            const { data: authUser, error: authError } = await this.supabase.auth.signUp({
                email, 
                password,
                options: {
                    data: {
                        'first_name': profileData.first_name,
                        'last_name': profileData.last_name,
                        'role': role,
                        'display_name': profileData.display_name,
                    }
                }
            })  
            if (authError) {
                logError('Échec de l\'inscription Supabase', authError);
                throw new Error(authError.message)
            }

            logInfo('Inscription réussie', { userId: authUser.user.id, role });
            return { user: authUser.user, session: authUser.session }
        } catch (error) {
            logError('Erreur lors de l\'inscription', error);
            throw new Error('Erreur lors de l\'inscription')
        }
    }

    async updateProfile(userId, data) {        
        // Mise à jour du profil principal
        const updatedProfile = await prismaClient.profile.update({
            where: { id: userId },
            data: {
                ...data,
                updated_at: new Date()
            }
        })
        if(!updatedProfile) {
            throw new Error('Profil non trouvé')
        }
        
        return await this.getUserProfile(userId)
    }

    async loginUser(email, password) {
        try {
            logInfo('Tentative de connexion', { email });
            
            const { data: authUser, error: authError } = await this.supabase.auth.signInWithPassword({
                email,
                password,
            })
            if (authError) {
                logError('Échec de connexion', authError);
                throw new Error(authError.message)
            }

            const userProfile = await this.getUserProfile(authUser.user.id)
            await prismaClient.profile.update({
                where: { id: authUser.user.id },
                data: {
                    last_login: new Date(),
                }
            })

            logInfo('Connexion réussie', { 
                userId: authUser.user.id,
                role: userProfile.role
            });

            return { 
                user: authUser.user, 
                session: authUser.session,
                profile: userProfile
            }
        } catch (error) {
            logError('Erreur lors de la connexion', error);
            throw error;
        }
    }

    async getUserProfile(userId) {
        const profile = await prismaClient.profile.findUnique({
            where: { id: userId },
        })
        if (!profile) {
            throw new Error('Profile non trouvé')
        }
        return {
            ...profile
        }
    }

    async getCurrentUser(token) {
        const { data: { user } } = await this.supabase.auth.getUser(token)
        if (!user) {
            throw new Error('Utilisateur non trouvé')
        }
        return await this.getUserProfile(user.id)
    }

    async verifyToken(token) {
        const { data: { user } } = await this.supabase.auth.getUser(token)
        if (!user) {
            throw new Error('Utilisateur non trouvé')
        }
        return true
    }

    async logoutUser() {
        try {
            logInfo('Tentative de déconnexion');
            
            const { error } = await this.supabase.auth.signOut()
            if (error) {
                logError('Échec de la déconnexion', error);
                throw new Error(error.message)
            }

            logInfo('Déconnexion réussie');
            return true
        } catch (error) {
            logError('Erreur lors de la déconnexion', error);
            throw error;
        }
    }
}