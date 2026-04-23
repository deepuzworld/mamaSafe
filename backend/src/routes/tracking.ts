import { Router } from 'express';
import prisma from '../utils/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// Create Mood Log
router.post('/mood', async (req: AuthRequest, res) => {
    try {
        const { moodScore, notes } = req.body;
        const moodLog = await prisma.moodLog.create({
            data: {
                userId: req.user.userId,
                moodScore,
                notes
            }
        });
        res.status(201).json({ success: true, moodId: moodLog.moodId });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Create Sleep Log
router.post('/sleep', async (req: AuthRequest, res) => {
    try {
        const { hoursSlept, sleepQuality } = req.body;
        const sleepLog = await prisma.sleepLog.create({
            data: {
                userId: req.user.userId,
                hoursSlept,
                sleepQuality
            }
        });
        res.status(201).json({ success: true, sleepId: sleepLog.sleepId });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Create Journal Entry
router.post('/journal', async (req: AuthRequest, res) => {
    try {
        const { entryType, content } = req.body;
        const journalEntry = await prisma.journalEntry.create({
            data: {
                userId: req.user.userId,
                entryType,
                content
            }
        });
        res.status(201).json({ success: true, journalId: journalEntry.journalId });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Fetch User Logs (Timeline Activity)
router.get('/history', async (req: AuthRequest, res) => {
    try {
        const userId = req.user.userId;
        const moods = await prisma.moodLog.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
        const sleeps = await prisma.sleepLog.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
        const journals = await prisma.journalEntry.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });

        res.status(200).json({ success: true, History: { moods, sleeps, journals } });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

export default router;
