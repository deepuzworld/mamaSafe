import { Router } from 'express';
import prisma from '../utils/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// Middleware to ensure role is professional and password is reset
const isProfessional = async (req: AuthRequest, res: any, next: any) => {
    if (req.user.role !== 'professional') {
        return res.status(403).json({ success: false, message: 'Access denied. Professional only.' });
    }

    // Check if password reset is required
    const user = await prisma.user.findUnique({ where: { userId: req.user.userId as string } });
    if (user?.mustResetPassword) {
        return res.status(403).json({ 
            success: false, 
            message: 'Password reset required before accessing sessions.',
            mustResetPassword: true 
        });
    }

    next();
};


// Profile Setup
router.put('/profile', isProfessional, async (req: AuthRequest, res) => {
    try {
        const { specialization, licenseNo, bio, availability } = req.body;
        
        const expert = await (prisma.expert as any).upsert({
            where: { userId: req.user.userId as string },
            update: {
                specialization,
                licenseNo,
                bio,
                availability
            },
            create: {
                userId: req.user.userId as string,
                specialization,
                licenseNo,
                bio,
                availability
            }
        });

        res.status(200).json({ success: true, expert });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// View Appointments
router.get('/appointments', isProfessional, async (req: AuthRequest, res: any) => {
    try {
        const expert = await (prisma.expert as any).findUnique({ where: { userId: req.user.userId as string } });
        if (!expert) return res.status(404).json({ success: false, message: 'Expert profile not found' });

        const sessions = await prisma.consultation.findMany({
            where: { expertId: expert.expertId },
            include: {
                user: {
                    select: {
                        fullName: true,
                        email: true
                    }
                }
            },
            orderBy: { dateTime: 'asc' }
        });

        res.status(200).json({ success: true, sessions });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Update Appointment (Complete or add notes)
router.put('/appointment/:meetingId', isProfessional, async (req: AuthRequest, res) => {
    try {
        const { status, clinicalNotes } = req.body;
        await (prisma.consultation as any).update({
            where: { meetingId: req.params.meetingId as string },
            data: { status, clinicalNotes: clinicalNotes as string }
        });
        res.status(200).json({ success: true });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Case Review: Get patient trends (Only if booked)
router.get('/patient-trends/:patientId', isProfessional, async (req: AuthRequest, res: any) => {
    try {
        const expert = await (prisma.expert as any).findUnique({ where: { userId: req.user.userId as string } });
        
        // Ensure there is a booking between this expert and patient
        const booking = await prisma.consultation.findFirst({
            where: { 
                expertId: expert?.expertId as string,
                userId: req.params.patientId as string
            }
        });

        if (!booking) {
            return res.status(403).json({ success: false, message: 'No active booking with this patient' });
        }

        const patientId = req.params.patientId as string;
        const moodTrends = await prisma.moodLog.findMany({
            where: { userId: patientId },
            orderBy: { createdAt: 'desc' },
            take: 30
        });

        const sleepTrends = await prisma.sleepLog.findMany({
            where: { userId: patientId },
            orderBy: { createdAt: 'desc' },
            take: 30
        });

        const lastConsultation = await prisma.consultation.findFirst({
            where: {
                expertId: expert?.expertId as string,
                userId: patientId,
                status: 'Done',
                clinicalNotes: { not: null }
            },
            orderBy: { dateTime: 'desc' }
        });

        res.status(200).json({ 
            success: true, 
            trends: { 
                moodTrends, 
                sleepTrends,
                lastClinicalNotes: lastConsultation?.clinicalNotes || null
            } 
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Update Patient Condition (Future tracking)
router.put('/patient-condition/:patientId', isProfessional, async (req: AuthRequest, res) => {
    try {
        const { currentCondition, expertNotes } = req.body;
        const patientId = req.params.patientId as string;

        await prisma.profile.update({
            where: { userId: patientId },
            data: { 
                currentCondition: currentCondition as string,
                expertNotes: expertNotes as string
            }
        });

        res.status(200).json({ success: true, message: 'Patient condition updated successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Get Detailed Patient Condition
router.get('/patient-condition/:patientId', isProfessional, async (req: AuthRequest, res: any) => {
    try {
        const patientId = req.params.patientId as string;
        const profile = await prisma.profile.findUnique({
            where: { userId: patientId },
            select: {
                currentCondition: true,
                expertNotes: true,
                firstPregnancy: true,
                historyOfBipolar: true,
                babyBirthDate: true
            }
        });

        res.status(200).json({ success: true, profile });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

export default router;
