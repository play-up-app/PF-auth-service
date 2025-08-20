import Joi from 'joi';

// Schéma de base pour les profils
const baseProfileSchema = Joi.object({
    first_name: Joi.string().min(2).max(50).required(),
    last_name: Joi.string().min(2).max(50).required(),
    display_name: Joi.string().min(2).max(100).required(),
});

// Schéma spécifique pour le profil organisateur
const organizerProfileSchema = baseProfileSchema.keys({
    organization_name: Joi.string().min(2).max(100).required(),
    organization_type: Joi.string().valid('club', 'federation', 'association', 'entreprise').required(),
    professional_email: Joi.string().email().required(),
    professional_phone: Joi.string().pattern(/^[0-9+\-\s()]{8,20}$/).required(),
    city: Joi.string().min(2).max(100).required(),
    website_url: Joi.string().uri().optional(),
});

// Schéma spécifique pour le profil joueur
const playerProfileSchema = baseProfileSchema.keys({
    sport_primary: Joi.string().required(),
    position_preferred: Joi.string().required(),
    skill_level: Joi.string().valid('debutant', 'intermediaire', 'confirme', 'expert').required(),
    height_cm: Joi.number().integer().min(100).max(250).optional(),
    date_of_birth: Joi.date().iso().max('now').required(),
});

// Schéma pour l'inscription
export const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string()
        .min(8)
        .max(100)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .required()
        .messages({
            'string.pattern.base': 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial',
            'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
            'string.max': 'Le mot de passe ne doit pas dépasser 100 caractères'
        }),
    role: Joi.string().valid('organisateur', 'joueur', 'spectateur').required(),
    profileData: Joi.when('role', {
        is: 'organisateur',
        then: organizerProfileSchema,
        otherwise: Joi.when('role', {
            is: 'joueur',
            then: playerProfileSchema,
            otherwise: baseProfileSchema
        })
    }).required()
});

// Schéma pour la connexion
export const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

// Schéma pour la mise à jour du profil
export const updateProfileSchema = Joi.object({
    display_name: Joi.string().min(2).max(100).optional(),
    phone: Joi.string().pattern(/^[0-9+\-\s()]{8,20}$/).optional(),
    specialized_data: Joi.object({
        organization_name: Joi.string().min(2).max(100).optional(),
        website_url: Joi.string().uri().optional(),
        professional_email: Joi.string().email().optional(),
        professional_phone: Joi.string().pattern(/^[0-9+\-\s()]{8,20}$/).optional(),
        sport_primary: Joi.string().optional(),
        position_preferred: Joi.string().optional(),
        skill_level: Joi.string().valid('debutant', 'intermediaire', 'confirme', 'expert').optional(),
    }).optional()
});
