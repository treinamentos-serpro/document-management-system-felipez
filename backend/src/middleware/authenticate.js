const { createHash, timingSafeEqual } = require('node:crypto');

function isValidTokenMap(userTokens) {
  if (!userTokens || typeof userTokens !== 'object' || Array.isArray(userTokens)) {
    return false;
  }

  const entries = Object.entries(userTokens);
  return entries.length > 0
    && entries.every(([userId, token]) => (
      userId.trim() === userId
      && userId.length > 0
      && typeof token === 'string'
      && token.length >= 32
      && token.trim() === token
    ))
    && new Set(entries.map(([, token]) => token)).size === entries.length;
}

function createAuthenticate(userTokens) {
  return function authenticate(req, res, next) {
    if (!isValidTokenMap(userTokens)) {
      return res.status(503).json({
        error: {
          code: 'AUTHENTICATION_NOT_CONFIGURED',
          message: 'A autenticação não está configurada no servidor.',
        },
      });
    }

    const match = (req.get('authorization') || '').match(/^Bearer\s+(.+)$/i);
    if (!match) {
      return res.status(401).json({
        error: { code: 'UNAUTHENTICATED', message: 'Autenticação obrigatória.' },
      });
    }

    const suppliedHash = createHash('sha256').update(match[1]).digest();
    let authenticatedUser;
    for (const [userId, token] of Object.entries(userTokens)) {
      if (typeof token !== 'string' || token.length === 0) continue;

      const expectedHash = createHash('sha256').update(token).digest();
      if (timingSafeEqual(suppliedHash, expectedHash)) {
        authenticatedUser = userId;
      }
    }

    if (!authenticatedUser) {
      return res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Credencial inválida.' },
      });
    }

    req.user = { id: authenticatedUser };
    return next();
  };
}

module.exports = { createAuthenticate };