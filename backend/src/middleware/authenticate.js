const { createHash, timingSafeEqual } = require('node:crypto');

function authenticate(req, res, next) {
  let userTokens;

  try {
    userTokens = JSON.parse(process.env.DMS_USER_TOKENS || '{}');
  } catch {
    return res.status(503).json({ error: 'A autenticação não está configurada corretamente.' });
  }

  if (!userTokens || typeof userTokens !== 'object' || Array.isArray(userTokens)) {
    return res.status(503).json({ error: 'A autenticação não está configurada corretamente.' });
  }

  const users = Object.entries(userTokens).filter(
    ([userId, token]) => userId.trim() && typeof token === 'string' && token.length > 0
  );
  if (users.length === 0) {
    return res.status(503).json({ error: 'A autenticação não está configurada.' });
  }

  const authorization = req.get('authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return res.status(401).json({ error: 'Autenticação obrigatória.' });
  }

  const suppliedHash = createHash('sha256').update(match[1]).digest();
  let authenticatedUser;
  for (const [userId, token] of users) {
    const expectedHash = createHash('sha256').update(token).digest();
    if (timingSafeEqual(suppliedHash, expectedHash)) {
      authenticatedUser = userId;
    }
  }

  if (!authenticatedUser) {
    return res.status(401).json({ error: 'Credencial inválida.' });
  }

  req.user = { id: authenticatedUser };
  return next();
}

module.exports = { authenticate };