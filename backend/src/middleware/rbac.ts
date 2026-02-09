import { AuthRequest } from './auth';
import { Response, NextFunction } from 'express';

export function requireRole(roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role.' });
    }
    next();
  };
}

export function requireVerified(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user.verified && req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Not verified.' });
  }
  next();
}
