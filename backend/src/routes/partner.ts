import { Router } from 'express';
import prisma from '../utils/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// Middleware to ensure role is partner and password is reset
const isPartner = async (req: AuthRequest, res: any, next: any) => {
    if (req.user.role !== 'partner') {
        return res.status(403).json({ success: false, message: 'Access denied. Partner only.' });
    }

    // Check if password reset is required
    const user = await prisma.user.findUnique({ where: { userId: req.user.userId as string } });
    if (user?.mustResetPassword) {
        return res.status(403).json({ 
            success: false, 
            message: 'Password reset required before accessing dashboard.',
            mustReset: true 
        });
    }

    // Check if phone number is missing (Mandatory for Pulse alerts)
    if (!user?.phoneNumber) {
        return res.status(403).json({
            success: false,
            message: 'Phone number is mandatory for emergency pulse notifications.',
            mustUpdatePhone: true
        });
    }

    next();
};

// Fetch Partner Dashboard Data
router.get('/dashboard', isPartner, async (req: AuthRequest, res) => {
    try {
        const partnerUserId = req.user.userId;

        // 1. Find the link between partner and mother
        const bridge = await prisma.partnerBridge.findFirst({
            where: { partnerUserId }
        });

        if (!bridge) {
            return res.status(404).json({ success: false, message: 'No linked mother found for this partner.' });
        }

        const mother = await prisma.user.findUnique({
            where: { userId: bridge.motherUserId },
            select: { fullName: true }
        });

        const partnerUser = await prisma.user.findUnique({
            where: { userId: partnerUserId },
            select: { mustResetPassword: true, phoneNumber: true }
        });

        // 2. Fetch High Severity Alerts for the mother
        const alerts = await prisma.redFlagLog.findMany({
            where: { 
                userId: bridge.motherUserId,
                severity: { in: ['High', 'Critical'] }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        // 3. Fetch Tasks assigned to this partner
        const tasks = await prisma.taskTracker.findMany({
            where: { userId: partnerUserId },
            orderBy: { createdAt: 'desc' }
        });

        // 4. Fetch Safety Resources
        const resources = await prisma.resourceHub.findMany({
            where: { category: 'Red Flag Guide' },
            take: 3
        });

        res.status(200).json({
            success: true,
            motherName: mother?.fullName || 'Jane Doe',
            mustReset: partnerUser?.mustResetPassword || false,
            partnerPhone: partnerUser?.phoneNumber || '',
            alerts: alerts.map(a => ({
                alertId: a.alertId,
                severity: a.severity.toLowerCase(),
                message: `${a.triggerSource} detected a ${a.severity} risk.`,
                createdAt: a.createdAt
            })),
            tasks: tasks.map(t => ({
                id: t.taskId,
                task: t.title,
                isComplete: t.isComplete,
                priority: t.description === 'High' ? 'high' : 'normal' // Using description for priority as a quick hack or check schema
            })),
            resources: resources.map(r => ({
                id: r.resourceId,
                title: r.title,
                content: r.content,
                category: r.category
            }))
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Toggle Task Status
router.patch('/tasks/:taskId', isPartner, async (req: AuthRequest, res) => {
    try {
        const { taskId } = req.params;
        const { isComplete } = req.body;

        const updatedTask = await prisma.taskTracker.update({
            where: { taskId: taskId as string },
            data: { isComplete }
        });

        res.status(200).json({ success: true, task: updatedTask });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Update Partner Profile
router.patch('/profile', isPartner, async (req: AuthRequest, res) => {
    try {
        const { phoneNumber, fullName } = req.body;
        const userId = req.user.userId;

        const updatedUser = await prisma.user.update({
            where: { userId },
            data: { 
                phoneNumber,
                fullName 
            }
        });

        res.status(200).json({ 
            success: true, 
            message: 'Profile updated successfully',
            user: {
                fullName: updatedUser.fullName,
                phoneNumber: updatedUser.phoneNumber
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

export default router;
