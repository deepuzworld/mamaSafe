import { Router } from 'express';
import prisma from '../utils/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { sendSMS, triggerCall } from '../utils/selfHostedStack';

const router = Router();

router.use(authenticateToken);

// Trigger Red Button (Pulse)
router.post('/red-button', async (req: AuthRequest, res) => {
    try {
        const userId = req.user.userId;
        const { locationData } = req.body;

        // 1. Record the event
        const event = await prisma.redButtonEvent.create({
            data: {
                userId: userId,
                emergencyStatus: 'active'
            }
        });

        // 2. Identify Mother and Partner
        const user = await prisma.user.findUnique({
            where: { userId },
            include: {
                motherBridges: {
                    include: {
                        partnerUser: true
                    }
                }
            }
        });

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // 3. Trigger Notifications for all connected partners
        const partners = user.motherBridges;
        let notificationsSent = 0;

        for (const bridge of partners) {
            const partnerPhone = bridge.partnerUser?.phoneNumber;
            if (partnerPhone) {
                const message = `This is an urgent emergency alert from Mama Safe. Your partner, ${user.fullName}, has activated her emergency pulse. She requires immediate assistance. Please check on her now.`;
                
                await sendSMS(partnerPhone, message);
                await triggerCall(partnerPhone, user.fullName);
                notificationsSent++;
            }
        }

        console.log(`EMERGENCY: Red Button triggered by ${user.fullName} (${userId}). Notifications sent to ${notificationsSent} partners.`);

        res.status(201).json({ 
            success: true, 
            message: notificationsSent > 0 ? 'Emergency protocol activated and partner notified' : 'Emergency protocol activated (no partner phone found)', 
            eventId: event.eventId 
        });
    } catch (error: any) {
        console.error('Red Button Error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

export default router;
