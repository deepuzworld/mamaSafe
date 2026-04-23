import { Router } from 'express';
import crypto from 'crypto';
import prisma from '../utils/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { sendExpertInvite } from '../utils/mailer';

const router = Router();

router.use(authenticateToken);

// Middleware to ensure role is admin
const isAdmin = (req: AuthRequest, res: any, next: any) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }
    next();
};

// Identity Audit: Review Face-ID success rates
router.get('/audit/face-id', isAdmin, async (req, res) => {
    try {
        const stats = await prisma.faceVerification.groupBy({
            by: ['verificationStatus'],
            _count: true
        });
        const totalUsers = await prisma.user.count();
        res.status(200).json({ success: true, stats, totalUsers });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// User Audit: Get all user registrations
router.get('/audit/users', isAdmin, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                userId: true,
                fullName: true,
                email: true,
                role: true,
                createdAt: true,
                faceVerification: {
                    select: {
                        verificationStatus: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ success: true, users });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Community Moderation: Get flagged posts
router.get('/moderation/flagged', isAdmin, async (req, res) => {
    try {
        const flaggedPosts = await prisma.communityPost.findMany({
            where: { isFlagged: true },
            include: { user: { select: { fullName: true } } }
        });
        res.status(200).json({ success: true, flaggedPosts });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Moderation: Action on post
router.put('/moderation/post/:postId', isAdmin, async (req: AuthRequest, res) => {
    try {
        const action = req.body.action as string;
        const reason = req.body.reason as string;
        
        if (action === 'delete') {
            await (prisma.communityPost as any).delete({ where: { postId: req.params.postId as string } });
        } else if (action === 'hide') {
            await (prisma.communityPost as any).update({ 
                where: { postId: req.params.postId as string },
                data: { isFlagged: true }
            });
        }

        await (prisma.modAudit as any).create({
            data: {
                postId: req.params.postId as string,
                adminId: req.user.userId as string,
                actionTaken: action,
                reason: reason || 'Moderation action'
            }
        });

        res.status(200).json({ success: true });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Expert Validation: Approve new expert
router.get('/experts/pending', isAdmin, async (req, res) => {
    try {
        const pendingExperts = await (prisma.expert as any).findMany({
            where: { isVerified: false },
            include: { user: { select: { fullName: true, email: true } } }
        });
        res.status(200).json({ success: true, pendingExperts });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.put('/expert/verify/:expertId', isAdmin, async (req, res) => {
    try {
        const status = req.body.status as boolean;
        await (prisma.expert as any).update({
            where: { expertId: req.params.expertId as string },
            data: { isVerified: status }
        });
        res.status(200).json({ success: true });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Expert Management: Get all experts
router.get('/experts/all', isAdmin, async (req, res) => {
    try {
        const experts = await (prisma.expert as any).findMany({
            include: { user: { select: { fullName: true, email: true } } }
        });
        res.status(200).json({ success: true, experts });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Expert Management: Add new expert
router.post('/experts/add', isAdmin, async (req, res) => {
    try {
        const { fullName, email, specialization, licenseNo } = req.body;
        
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        // Generate random 8-char password
        const tempPassword = crypto.randomBytes(4).toString('hex');
        const salt = await require('bcryptjs').genSalt(10);
        const passwordHash = await require('bcryptjs').hash(tempPassword, salt);

        const user = await prisma.user.create({
            data: {
                fullName,
                email,
                passwordHash,
                role: 'professional',
                mustResetPassword: true,
                otpCreatedAt: new Date()
            }
        });

        const expert = await (prisma.expert as any).create({
            data: {
                userId: user.userId,
                specialization,
                licenseNo,
                isVerified: true
            }
        });

        // Send invite email
        await sendExpertInvite(email, tempPassword, fullName);

        res.status(201).json({ success: true, expert, tempPassword });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Expert Management: Remove expert (Archival Logic)
router.delete('/expert/:expertId', isAdmin, async (req, res) => {
    try {
        const expertId = req.params.expertId as string;
        
        // Find expert first to get details
        const expert = await (prisma.expert as any).findUnique({
            where: { expertId },
            include: { user: { select: { fullName: true, email: true } } }
        });

        if (!expert) {
            return res.status(404).json({ success: false, message: 'Expert not found' });
        }

        // Add to removed list
        await (prisma.removedExpert as any).create({
            data: {
                fullName: expert.user.fullName,
                email: expert.user.email,
                specialization: expert.specialization,
                licenseNo: expert.licenseNo
            }
        });

        // Delete the expert record
        await (prisma.expert as any).delete({ where: { expertId } });
        
        // Note: We might want to keep the User record but remove the professional role, 
        // or delete it entirely. For now, we only delete the expert profile.
        
        res.status(200).json({ success: true, message: 'Expert removed and archived' });
    } catch (error: any) {
        console.error('Error removing expert:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Expert Management: Get removed experts list
router.get('/experts/removed', isAdmin, async (req, res) => {
    try {
        const removedExperts = await (prisma.removedExpert as any).findMany({
            orderBy: { removedAt: 'desc' }
        });
        res.status(200).json({ success: true, removedExperts });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Expert Management: Resend OTP
router.post('/experts/resend-otp', isAdmin, async (req, res) => {
    try {
        const { expertId } = req.body;
        const expert = await (prisma.expert as any).findUnique({
            where: { expertId },
            include: { user: true }
        });
        if (!expert) return res.status(404).json({ success: false, message: 'Expert not found' });
        
        const tempPassword = crypto.randomBytes(4).toString('hex');
        const salt = await require('bcryptjs').genSalt(10);
        const passwordHash = await require('bcryptjs').hash(tempPassword, salt);
        
        await prisma.user.update({
            where: { userId: expert.userId },
            data: {
                passwordHash,
                mustResetPassword: true,
                otpCreatedAt: new Date()
            }
        });
        
        await sendExpertInvite(expert.user.email, tempPassword, expert.user.fullName);
        res.status(200).json({ success: true, message: 'OTP resent successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});


// System Analytics: Red flag trends
router.get('/analytics/red-flags', isAdmin, async (req, res) => {
    try {
        const trends = await prisma.redFlagLog.findMany({
            take: 100,
            orderBy: { createdAt: 'desc' },
            select: {
                severity: true,
                triggerSource: true,
                createdAt: true
            }
        });
        res.status(200).json({ success: true, trends });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Education Management
router.get('/education', isAdmin, async (req, res) => {
    try {
        const resources = await prisma.resourceHub.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ success: true, resources });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.put('/education/:resourceId', isAdmin, async (req, res) => {
    try {
        const { isApproved } = req.body;
        const resourceId = Array.isArray(req.params.resourceId) ? req.params.resourceId[0] : req.params.resourceId;
        const resource = await prisma.resourceHub.update({
            where: { resourceId: resourceId as string },
            data: { isApproved }
        });
        res.status(200).json({ success: true, resource });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.delete('/education/:resourceId', isAdmin, async (req, res) => {
    try {
        const resourceId = Array.isArray(req.params.resourceId) ? req.params.resourceId[0] : req.params.resourceId;
        await prisma.resourceHub.delete({
            where: { resourceId: resourceId as string }
        });
        res.status(200).json({ success: true });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// System Activity: Get latest systemic events
router.get('/activity', isAdmin, async (req, res) => {
    try {
        const [users, posts, flagLogs] = await Promise.all([
            prisma.user.findMany({ take: 5, orderBy: { createdAt: 'desc' }, select: { fullName: true, createdAt: true, role: true } }),
            prisma.communityPost.findMany({ take: 5, orderBy: { createdAt: 'desc' }, select: { title: true, createdAt: true, pseudonym: true } }),
            prisma.redFlagLog.findMany({ take: 5, orderBy: { createdAt: 'desc' }, select: { severity: true, triggerSource: true, createdAt: true } })
        ]);

        const activity = [
            ...users.map(u => ({ type: 'user', content: `New ${u.role} joined: ${u.fullName}`, timestamp: u.createdAt })),
            ...posts.map(p => ({ type: 'post', content: `New post by ${p.pseudonym}: ${p.title}`, timestamp: p.createdAt })),
            ...flagLogs.map(f => ({ type: 'flag', content: `${f.severity} alert from ${f.triggerSource}`, timestamp: f.createdAt }))
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

        res.status(200).json({ success: true, activity });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

export default router;
