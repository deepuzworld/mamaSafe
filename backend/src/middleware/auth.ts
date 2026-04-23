import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_fallback';

export interface AuthRequest extends Request {
    user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ success: false, message: 'Access Denied' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('[Auth Error] Token verification failed:', err.message, 'Token received:', token);
            return res.status(403).json({ success: false, message: 'Invalid Token' });
        }
        req.user = user;
        next();
    });
};

export const ensurePasswordResetDone = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.mustResetPassword) {
        return res.status(403).json({ success: false, message: 'Password reset required before accessing this resource.', requireReset: true });
    }
    next();
};
