export const jwtConfig = {
  secret: (process.env.JWT_SECRET || 'ferraco-crm-secret-key-change-in-production') as string,
  expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as string,
  refreshExpiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '30d') as string,
};

// Validação do secret em produção
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be defined in production environment');
}

if (process.env.NODE_ENV === 'production' && jwtConfig.secret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long in production');
}
