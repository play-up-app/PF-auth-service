import { jest, expect, describe, it, beforeEach } from '@jest/globals';

// Mock de Prisma
const mockPrismaClient = {
  profile: {
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
  },
};

// Mock de Supabase
const mockSupabaseAuth = {
  signUp: jest.fn(),
  signInWithPassword: jest.fn(),
  signOut: jest.fn(),
  getUser: jest.fn(),
};

const mockSupabase = {
  auth: mockSupabaseAuth,
};

// Mock des modules
jest.unstable_mockModule('../../config/prisma.js', () => ({
  prismaClient: mockPrismaClient
}));

jest.unstable_mockModule('@supabase/supabase-js', () => ({
  createClient: () => mockSupabase
}));

// Import après les mocks
const { AuthService } = await import('../../services/authService.js');

describe('AuthService', () => {
  let authService;
  const validUUID = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    const mockUserData = {
      email: 'test@example.com',
      password: 'Password123!',
      role: 'organisateur',
      profileData: {
        first_name: 'Jean',
        last_name: 'Dupont',
        display_name: 'Jean Dupont',
      },
    };

    it('devrait créer un nouvel utilisateur avec succès', async () => {
      const mockAuthResponse = {
        data: {
          user: { id: validUUID, email: mockUserData.email },
          session: { access_token: 'token-123' },
        },
        error: null,
      };

      mockSupabaseAuth.signUp.mockResolvedValue(mockAuthResponse);

      const result = await authService.registerUser(
        mockUserData.email,
        mockUserData.password,
        mockUserData.role,
        mockUserData.profileData
      );

      expect(result).toEqual(mockAuthResponse.data);
    });

    it('devrait gérer les erreurs d\'inscription', async () => {
      mockSupabaseAuth.signUp.mockRejectedValue(new Error('Erreur lors de l\'inscription'));

      await expect(
        authService.registerUser(
          mockUserData.email,
          mockUserData.password,
          mockUserData.role,
          mockUserData.profileData
        )
      ).rejects.toThrow('Erreur lors de l\'inscription');
    });
  });

  describe('loginUser', () => {
    const mockLoginData = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('devrait connecter un utilisateur avec succès', async () => {
      const mockAuthResponse = {
        data: {
          user: { id: validUUID, email: mockLoginData.email },
          session: { access_token: 'token-123' },
        },
        error: null,
      };

      const mockProfile = {
        id: validUUID,
        email: mockLoginData.email,
        role: 'organisateur',
      };

      mockSupabaseAuth.signInWithPassword.mockResolvedValue(mockAuthResponse);
      mockPrismaClient.profile.findUnique.mockResolvedValue(mockProfile);
      mockPrismaClient.profile.update.mockResolvedValue({ ...mockProfile, last_login: new Date() });

      const result = await authService.loginUser(
        mockLoginData.email,
        mockLoginData.password
      );

      expect(result).toEqual({
        user: mockAuthResponse.data.user,
        session: mockAuthResponse.data.session,
        profile: mockProfile,
      });
    });

    it('devrait gérer les erreurs de connexion', async () => {
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({ data: null, error: { message: 'Invalid credentials' } });

      await expect(
        authService.loginUser(mockLoginData.email, mockLoginData.password)
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('getUserProfile', () => {
    it('devrait récupérer le profil utilisateur avec succès', async () => {
      const mockProfile = {
        id: validUUID,
        email: 'test@example.com',
        role: 'organisateur',
      };

      mockPrismaClient.profile.findUnique.mockResolvedValue(mockProfile);

      const result = await authService.getUserProfile(validUUID);

      expect(result).toEqual(mockProfile);
    });

    it('devrait gérer le cas où le profil n\'existe pas', async () => {
      mockPrismaClient.profile.findUnique.mockResolvedValue(null);

      await expect(
        authService.getUserProfile(validUUID)
      ).rejects.toThrow('Profile non trouvé');
    });
  });

  describe('logoutUser', () => {
    it('devrait déconnecter l\'utilisateur avec succès', async () => {
      mockSupabaseAuth.signOut.mockResolvedValue({ error: null });

      const result = await authService.logoutUser();

      expect(result).toBe(true);
      expect(mockSupabaseAuth.signOut).toHaveBeenCalled();
    });

    it('devrait gérer les erreurs de déconnexion', async () => {
      mockSupabaseAuth.signOut.mockResolvedValue({ error: { message: 'Logout failed' } });

      await expect(
        authService.logoutUser()
      ).rejects.toThrow('Logout failed');
    });
  });

  describe('getCurrentUser', () => {
    it('devrait récupérer l\'utilisateur courant avec succès', async () => {
      const mockUser = { id: validUUID };
      const mockProfile = {
        id: validUUID,
        email: 'test@example.com',
        role: 'organisateur',
      };

      mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: mockUser } });
      mockPrismaClient.profile.findUnique.mockResolvedValue(mockProfile);

      const result = await authService.getCurrentUser('token-123');

      expect(result).toEqual(mockProfile);
    });

    it('devrait gérer le cas où l\'utilisateur n\'existe pas', async () => {
      mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(
        authService.getCurrentUser('token-123')
      ).rejects.toThrow('Utilisateur non trouvé');
    });
  });

  describe('verifyToken', () => {
    it('devrait vérifier un token valide', async () => {
      mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: { id: validUUID } } });

      const result = await authService.verifyToken('token-123');

      expect(result).toBe(true);
    });

    it('devrait gérer un token invalide', async () => {
      mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(
        authService.verifyToken('invalid-token')
      ).rejects.toThrow('Utilisateur non trouvé');
    });
  });
});