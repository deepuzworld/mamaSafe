import { Router } from 'express';
import prisma from '../utils/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// Create Analysis Request (Trigger to Queue)
router.post('/analysis-request', async (req: AuthRequest, res) => {
    try {
        const { sourceType, sourceId } = req.body;

        // In a real system, you might trigger a Celery/RabbitMQ task here. 
        // We log it in the DB for the Python worker to pick up.
        const request = await prisma.analysisRequest.create({
            data: {
                userId: req.user.userId,
                sourceType,
                sourceId,
                status: 'pending'
            }
        });

        res.status(201).json({ success: true, requestId: request.requestId, status: request.status });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Fetch Analysis Result
router.get('/analysis-result/:requestId', async (req: AuthRequest, res) => {
    try {
        const { requestId } = req.params;

        const result = await prisma.analysisResult.findUnique({
            where: { requestId: requestId as string }
        });

        if (!result) {
            return res.status(404).json({ success: false, message: 'Analysis not completed or found' });
        }

        res.status(200).json({
            success: true,
            riskScore: result.riskScore,
            detectedFlags: result.detectedFlags ? JSON.parse(result.detectedFlags) : []
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

export default router;
