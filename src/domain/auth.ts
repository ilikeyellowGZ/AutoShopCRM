/**
 * Authentication interfaces for production-ready language-learning application
 * 
 * This module defines TypeScript interfaces for authentication following the
 * production-readiness implementation spec based on a 250-point audit checklist.
 * 
 * Requirements: 1.1, 1.2, 1.6 (Authentication and Row-Level Security)
 * 
 * Design Reference: production-readiness-implementation/design.md
 */

// ============================================================================
// Authentication Provider Types
// ============================================================================

/**
 * OAuth 2.0 authentication providers supported by the application
 * 
 * Design Reference: AuthService should integrate with specified third-party
 * providers (Google, Apple, Facebook) using OAuth 2.0
 * 
 * Requirements: 1.2
 */
export type AuthProvider = 
  | 'google'    // Google OAuth 2.0
  | 'apple'     // Apple Sign In
  | 'facebook'  // Facebook Login
  | 'email'     // Email/password authentication
  | 'microsoft' // Microsoft Account
  | 'github'    // GitHub OAuth
  | string;     // Allow for custom providers

/**
 * Multi-factor authentication methods
 * 
 * Design Reference: AuthService should support multi-factor authentication
 * using time-based one-time passwords or biometric verification
 * 
 * Requirements: 1.6
 */
export type MFAMethod = 
  | 'totp'      // Time-based One-Time Password (Google Authenticator, Authy, etc.)
  | 'sms'       // SMS-based verification
  | 'email'     // Email-based verification
  | 'biometric' // Biometric verification (Touch ID, Face ID, Windows Hello)
  | 'security_key' // WebAuthn/FIDO2 security keys
  | 'backup_code'; // Backup recovery codes

/**
 * Authentication credential types
 * 
 * Design Reference: AuthService should verify using OAuth 2.0 or token-based
 * authentication with 256-bit encryption
 * 
 * Requirements: 1.1
 */
export type Credentials = 
  | OAuthCredentials     // OAuth 2.0 flow
  | EmailCredentials     // Email/password authentication
  | TokenCredentials     // Token-based authentication
  | BiometricCredentials; // Biometric authentication

/**
 * OAuth 2.0 credentials for social authentication
 */
export interface OAuthCredentials {
  type: 'oauth';
  provider: AuthProvider;
  code: string;           // Authorization code from OAuth provider
  redirectUri: string;    // Redirect URI for OAuth callback
  codeVerifier?: string;  // PKCE code verifier for enhanced security
  state?: string;        // CSRF protection state parameter
}

/**
 * Email and password credentials for traditional authentication
 */
export interface EmailCredentials {
  type: 'email';
  email: string;
  password: string;
  rememberMe?: boolean;   // Whether to persist session
}

/**
 * Token-based credentials for API authentication
 */
export interface TokenCredentials {
  type: 'token';
  accessToken: string;
  refreshToken?: string;
  tokenType?: 'bearer' | 'jwt' | 'opaque';
}

/**
 * Biometric credentials for device-native authentication
 */
export interface BiometricCredentials {
  type: 'biometric';
  platform: 'ios' | 'android' | 'web';
  biometricType: 'fingerprint' | 'face' | 'iris' | 'voice';
  credentialId: string;   // WebAuthn credential ID or similar
}

// ============================================================================
// Authentication Session Types
// ============================================================================

/**
 * User permissions for row-level security
 * 
 * Design Reference: RLS_Service shall enforce row-level security policies
 * for database queries with policy evaluation time under 100ms
 * 
 * Requirements: 1.3
 */
export interface Permission {
  resource: string;               // Resource type (e.g., 'user', 'progress', 'audio')
  actions: string[];              // Allowed actions (e.g., ['read', 'write', 'delete'])
  conditions?: Record<string, any>; // Conditional access rules
  scope?: 'own' | 'team' | 'all'; // Scope of access
}

/**
 * Authentication session data
 * 
 * Design Reference: AuthSession should include userId, accessToken,
 * refreshToken, expiresAt, permissions
 * 
 * Requirements: 1.1
 */
export interface AuthSession {
  userId: string;                 // Unique user identifier
  accessToken: string;            // JWT or opaque access token
  refreshToken: string;           // Token for refreshing the session
  expiresAt: Date;                // Token expiration timestamp
  permissions: Permission[];      // User permissions for RLS
  userMetadata: UserMetadata;     // Additional user information
  mfaEnabled: boolean;            // Whether MFA is enabled for this user
  mfaMethod?: MFAMethod;          // Primary MFA method if enabled
  lastAuthenticatedAt: Date;      // Last successful authentication
  sessionId: string;              // Unique session identifier
}

/**
 * User metadata for authentication context
 */
export interface UserMetadata {
  email: string;
  displayName?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  phoneNumber?: string;
  phoneVerified?: boolean;
  provider: AuthProvider;         // Original authentication provider
  providerId: string;             // Provider-specific user ID
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  loginCount: number;
}

/**
 * MFA configuration for a user
 */
export interface MFAConfig {
  method: MFAMethod;
  enabled: boolean;
  configuredAt: Date;
  lastUsedAt?: Date;
  backupCodes?: string[];         // Backup recovery codes
  deviceName?: string;            // Name of the MFA device
}

// ============================================================================
// Authentication Service Interface
// ============================================================================

/**
 * Authentication service interface
 * 
 * Design Reference: AuthService should include methods for signIn, signOut,
 * getCurrentSession, refreshToken, enableMFA, verifyMFA
 * 
 * Requirements: 1.1, 1.2, 1.6
 */
export interface AuthService {
  // Core authentication methods
  signIn(provider: AuthProvider, credentials: Credentials): Promise<AuthSession>;
  signOut(): Promise<void>;
  getCurrentSession(): Promise<AuthSession | null>;
  refreshToken(): Promise<string>;
  
  // Multi-factor authentication
  enableMFA(method: MFAMethod): Promise<void>;
  disableMFA(): Promise<void>;
  verifyMFA(code: string): Promise<boolean>;
  getMFAConfig(): Promise<MFAConfig | null>;
  
  // Session management
  validateSession(): Promise<boolean>;
  invalidateSession(sessionId: string): Promise<void>;
  listActiveSessions(): Promise<AuthSession[]>;
  
  // Token management
  storeToken(token: string, expiresIn: number): Promise<void>;
  getStoredToken(): Promise<string | null>;
  clearStoredToken(): Promise<void>;
  
  // User management
  updateUserMetadata(metadata: Partial<UserMetadata>): Promise<void>;
  changePassword(oldPassword: string, newPassword: string): Promise<void>;
  resetPassword(email: string): Promise<void>;
  
  // Provider management
  linkProvider(provider: AuthProvider, credentials: Credentials): Promise<void>;
  unlinkProvider(provider: AuthProvider): Promise<void>;
  getLinkedProviders(): Promise<AuthProvider[]>;
}

// ============================================================================
// Authentication Error Types
// ============================================================================

/**
 * Authentication error codes
 */
export type AuthErrorCode = 
  | 'invalid_credentials'
  | 'user_not_found'
  | 'email_not_verified'
  | 'account_locked'
  | 'mfa_required'
  | 'mfa_invalid'
  | 'token_expired'
  | 'token_invalid'
  | 'provider_error'
  | 'network_error'
  | 'rate_limited'
  | 'insufficient_permissions'
  | 'session_expired'
  | 'biometric_not_available'
  | 'biometric_not_enrolled'
  | 'biometric_lockout';

/**
 * Authentication error type
 */
export interface AuthError {
  code: AuthErrorCode;
  message: string;
  details?: Record<string, any>;
  retryable: boolean;
  timestamp: Date;
}

/**
 * Authentication result type for operations that can fail
 */
export type AuthResult<T> = 
  | { success: true; data: T }
  | { success: false; error: AuthError };

// ============================================================================
// Authentication Configuration
// ============================================================================

/**
 * Authentication service configuration
 */
export interface AuthConfig {
  // OAuth 2.0 configuration
  oauth: {
    clientId: string;
    clientSecret?: string;
    redirectUri: string;
    scopes: string[];
    usePKCE: boolean;
  };
  
  // Token configuration
  tokens: {
    accessTokenLifetime: number;  // seconds
    refreshTokenLifetime: number; // seconds
    encryptionKey: string;        // 256-bit encryption key
    algorithm: 'HS256' | 'RS256' | 'ES256';
  };
  
  // Session configuration
  session: {
    maxSessionsPerUser: number;
    sessionTimeout: number;       // seconds
    persistentSessions: boolean;
  };
  
  // MFA configuration
  mfa: {
    enabled: boolean;
    requiredForSensitiveOperations: boolean;
    backupCodeCount: number;
    totpIssuer: string;
  };
  
  // Security configuration
  security: {
    passwordMinLength: number;
    passwordRequiresSpecialChar: boolean;
    passwordRequiresNumber: boolean;
    passwordRequiresUppercase: boolean;
    maxLoginAttempts: number;
    lockoutDuration: number;      // seconds
    requireEmailVerification: boolean;
  };
  
  // Cache configuration for offline support
  cache: {
    maxCacheAge: number;          // seconds (24 hours = 86400)
    encryptionEnabled: boolean;
    storageBackend: 'localStorage' | 'indexedDB' | 'secureStorage';
  };
}

// ============================================================================
// Helper Types and Utilities
// ============================================================================

/**
 * Authentication state for UI components
 */
export type AuthState = 
  | { status: 'unauthenticated' }
  | { status: 'authenticating'; provider?: AuthProvider }
  | { status: 'authenticated'; session: AuthSession }
  | { status: 'mfa_required'; session: Partial<AuthSession>; methods: MFAMethod[] }
  | { status: 'error'; error: AuthError };

/**
 * Authentication event types for observability
 */
export type AuthEvent = 
  | { type: 'sign_in_started'; provider: AuthProvider }
  | { type: 'sign_in_succeeded'; userId: string; provider: AuthProvider }
  | { type: 'sign_in_failed'; provider: AuthProvider; error: AuthError }
  | { type: 'sign_out'; userId: string }
  | { type: 'token_refreshed'; userId: string }
  | { type: 'token_refresh_failed'; userId: string; error: AuthError }
  | { type: 'mfa_enabled'; userId: string; method: MFAMethod }
  | { type: 'mfa_disabled'; userId: string; method: MFAMethod }
  | { type: 'session_expired'; userId: string }
  | { type: 'permission_denied'; userId: string; resource: string; action: string };

/**
 * Authentication event handler interface
 */
export interface AuthEventHandler {
  onAuthEvent(event: AuthEvent): void;
}

/**
 * Authentication service factory function type
 */
export type AuthServiceFactory = (config: AuthConfig, eventHandler?: AuthEventHandler) => AuthService;