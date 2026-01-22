import NotAllowedError from './errors/NotAllowedError';

export function requireAccess(userRole, requiredRole) {
  if (userRole !== requiredRole) {
    throw new NotAllowedError('You are not allowed to perform this action');
  }
}

export function hasAccess(userRole, requiredRole) {
  return userRole === requiredRole;
}
