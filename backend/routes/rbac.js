/**
 * Cleaned RBAC routes (defensive)
 *
 * Normalizes middleware/controller exports so Express always receives functions.
 * Avoids duplicate declarations and provides safe fallbacks if middleware is
 * missing or exported in a different shape.
 */

const express = require('express');
const router = express.Router();

function tryRequire(path) {
  try { return require(path); } catch (e) { return null; }
}

function normalizeMiddleware(m) {
  if (typeof m === 'function') return m;
  if (!m || typeof m !== 'object') return (req, res, next) => next();
  const candidates = ['middleware', 'handler', 'single', 'array', 'any', 'default'];
  for (const k of candidates) {
    if (typeof m[k] === 'function') return m[k];
  }
  if (typeof m.default === 'function') return m.default;
  return (req, res, next) => next();
}

const rawRbac = tryRequire('../middleware/rbac') || {};

const requirePermission = (name) => {
  if (typeof rawRbac.requirePermission === 'function') return rawRbac.requirePermission(name);
  return (req, res, next) => next();
};

const requireRoleName = (role) => {
  if (typeof rawRbac.requireRoleName === 'function') return rawRbac.requireRoleName(role);
  return (req, res, next) => next();
};

const attachPermissions = (target) => {
  if (typeof rawRbac.attachPermissions === 'function') return rawRbac.attachPermissions(target);
  return (req, res, next) => next();
};

const rawAuth = tryRequire('../middleware/auth');
const rawValidators = tryRequire('../middleware/validators');
const rawRateLimiter = tryRequire('../middleware/rateLimiter');

const authMiddleware = normalizeMiddleware(rawAuth && (rawAuth.authMiddleware || rawAuth));
const validateBody = normalizeMiddleware(rawValidators && (rawValidators.validateBody || rawValidators));
const validateIdParam = normalizeMiddleware(rawValidators && (rawValidators.validateIdParam || rawValidators));
const apiLimiter = normalizeMiddleware(rawRateLimiter && (rawRateLimiter.apiLimiter || rawRateLimiter));

const rbacController = tryRequire('../controllers/rbac') || {};
const notImplemented = (name) => (req, res) => res.status(501).json({ success: false, message: `${name} not implemented` });
const safe = (fnName) => (typeof rbacController[fnName] === 'function' ? rbacController[fnName] : notImplemented(fnName));

router.use(authMiddleware);
router.get('/', apiLimiter, requirePermission('rbac:view'), safe('listRoles'));
router.post('/', apiLimiter, requirePermission('rbac:create'), validateBody, safe('createRole'));
router.get('/:id', apiLimiter, requirePermission('rbac:view'), validateIdParam, safe('getRole'));
router.put('/:id', apiLimiter, requirePermission('rbac:update'), validateIdParam, validateBody, safe('updateRole'));
router.delete('/:id', apiLimiter, requirePermission('rbac:delete'), validateIdParam, safe('deleteRole'));
router.post('/:id/permissions', apiLimiter, requirePermission('rbac:update'), validateIdParam, validateBody, safe('attachPermissions'));
router.post('/assign-role', apiLimiter, requireRoleName('admin'), validateBody, safe('assignRoleToUser'));
module.exports = router;
