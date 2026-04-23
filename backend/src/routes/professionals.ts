import { Router } from 'express';
import prisma from '../utils/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// Fetch Experts
router.get('/', async (req: AuthRequest, res) => {
    try {
        const todayStart = new Date();
        todayStart.setUTCHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setUTCHours(23, 59, 59, 999);

        const experts = await prisma.expert.findMany({
            include: { 
                user: true,
                _count: {
                    select: { 
                        consultations: {
                            where: {
                                dateTime: {
                                    gte: todayStart,
                                    lte: todayEnd
                                },
                                status: { not: 'Cancelled' }
                            }
                        }
                    }
                }
            }
        });
        const mappedExperts = experts.map(e => ({
            expertId: e.expertId,
            name: e.user.fullName,
            specialization: e.specialization,
            licenseNo: e.licenseNo,
            bio: e.bio,
            isVerified: e.isVerified,
            availability: e.availability,
            isFullyBooked: e._count.consultations >= 9 // Accountable to the 9 time slots per day
        }));
        res.status(200).json({ success: true, professionals: mappedExperts });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Get taken slots for an expert on a specific date
router.get('/:expertId/slots', async (req: AuthRequest, res) => {
    try {
        const expertId = req.params.expertId as string;
        const date = req.query.date as string;
        
        const startOfDay = new Date(`${date}T00:00:00Z`);
        const endOfDay = new Date(`${date}T23:59:59Z`);

        const takenConsultations = await prisma.consultation.findMany({
            where: {
                expertId,
                dateTime: {
                    gte: startOfDay,
                    lte: endOfDay
                },
                status: { not: 'Cancelled' }
            },
            select: { dateTime: true }
        });

        const takenTimes = takenConsultations.map(c => {
            const d = new Date(c.dateTime);
            return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
        });

        res.status(200).json({ success: true, takenTimes });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Book Consultation
router.post('/appointments', async (req: AuthRequest, res) => {
    try {
        const expertId = (req.body.expertId || req.body.professionalId) as string;
        const appointmentDate = req.body.appointmentDate as string;
        const patientComment = req.body.patientComment as string;
        const targetDate = new Date(appointmentDate);

        // Check if slot is already taken
        const existing = await prisma.consultation.findFirst({
            where: {
                expertId,
                dateTime: targetDate,
                status: { not: 'Cancelled' }
            }
        });

        if (existing) {
            return res.status(400).json({ success: false, message: 'This time slot is already booked. Please select another time.' });
        }

        // Check if daily limit (9) reached
        const targetDayStart = new Date(targetDate);
        targetDayStart.setUTCHours(0, 0, 0, 0);
        const targetDayEnd = new Date(targetDate);
        targetDayEnd.setUTCHours(23, 59, 59, 999);

        const dailyCount = await prisma.consultation.count({
            where: {
                expertId,
                dateTime: {
                    gte: targetDayStart,
                    lte: targetDayEnd
                },
                status: { not: 'Cancelled' }
            }
        });

        if (dailyCount >= 9) {
            return res.status(400).json({ success: false, message: 'This expert is fully booked for this day. Please select another date.' });
        }

        const consultation = await prisma.consultation.create({
            data: {
                userId: req.user.userId,
                expertId: expertId,
                dateTime: targetDate,
                status: 'Pending',
                patientComment: patientComment || null
            }
        });
        res.status(201).json({ success: true, appointmentId: consultation.meetingId });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

export default router;
