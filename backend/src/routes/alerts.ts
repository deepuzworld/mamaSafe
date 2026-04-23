import { Router } from 'express';
import prisma from '../utils/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// Fetch User Alerts
router.get('/', async (req: AuthRequest, res) => {
    try {
        const alerts = await prisma.alert.findMany({
            where: { userId: req.user.userId, resolved: false },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ success: true, alerts });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Resolve Alert
router.put('/:alertId', async (req: AuthRequest, res) => {
    try {
        const { alertId } = req.params;
        const { resolved } = req.body;

        // Check ownership
        const alert = await prisma.alert.findUnique({ where: { alertId: alertId as string } });
        if (!alert || alert.userId !== req.user.userId) {
            return res.status(404).json({ success: false, message: 'Alert not found' });
        }

        const updatedAlert = await prisma.alert.update({
            where: { alertId: alertId as string },
            data: { resolved }
        });

        res.status(200).json({ success: true, alert: updatedAlert });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

export default router;
