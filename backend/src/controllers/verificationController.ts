import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import FormData from 'form-data';
import crypto from 'crypto';

const prisma = new PrismaClient();

// In-memory sessions store (use Redis in prod)
const sessions: Record<string, { userId: string, challenge: string[], expiresAt: number }> = {};

export const startVerificationSession = async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'userId required' });
        }

        const sessionId = `sess_${crypto.randomBytes(8).toString('hex')}`;
        
        // Random hybrid challenges
        const availableChallenges = ['smile', 'surprised', 'neutral'];
        // Pick one random challenge layer for simplicity, though the frontend handles multiple
        const challenge = [availableChallenges[Math.floor(Math.random() * availableChallenges.length)] || 'smile'];

        sessions[sessionId] = {
            userId,
            challenge,
            expiresAt: Date.now() + 120000 // 2 mins
        };

        res.json({
            success: true,
            sessionId,
            challenge,
            expiresIn: 120
        });
    } catch (error) {
        console.error('Session Error:', error);
        res.status(500).json({ success: false, message: 'Failed to start session' });
    }
};

export const processFrame = async (req: Request, res: Response) => {
    try {
        const file = req.file;
        const { sessionId, expected_challenge } = req.body;

        if (!file || !sessionId) {
            return res.status(400).json({ success: false, message: 'Missing file or Session ID' });
        }

        const session = sessions[sessionId];
        if (!session || session.expiresAt < Date.now()) {
            return res.status(401).json({ success: false, message: 'Session expired or invalid' });
        }

        // Ideally fetch user registered embedding from DB to compare against
        let registered_embeddingStr = '';
        
        // 1. Send Frame to Python AI Microservice
        const form = new FormData();
        form.append('file', file.buffer, file.originalname || 'frame.jpg');
        form.append('sessionId', sessionId);
        if (expected_challenge) form.append('expected_challenge', expected_challenge);
        
        if (registered_embeddingStr) {
            form.append('registered_embedding', registered_embeddingStr);
        }

        console.log(`[Verification] Processing frame for session ${sessionId}, expected: ${expected_challenge}`);

        const aiResponse = await axios.post('http://127.0.0.1:8000/ai/face/analyze', form, {
            headers: {
                ...form.getHeaders()
            }
        });

        // Pipeline response from Python Microservice
        const results = aiResponse.data;
        console.log('[Verification] AI Results:', JSON.stringify(results));

        // If error thrown by python AI
        if (results.error) {
            console.error('[Verification] AI Error:', results.error);
            return res.status(500).json({ success: false, message: results.error });
        }

        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        console.error('AI Processing Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error connecting to AI Microservice' });
    }
};

export const completeVerification = async (req: Request, res: Response) => {
    try {
        const { sessionId, verified, confidence } = req.body;
        
        const session = sessions[sessionId];
        if (!session) {
            return res.status(401).json({ success: false, message: 'Invalid session' });
        }

        if (verified) {
            // Update user database status to verified
            await prisma.user.update({
                where: { userId: session.userId },
                data: { faceVerifyStatus: true }
            });
            delete sessions[sessionId]; // clean session

            res.json({ success: true, message: 'Identified & Verified Successfully!' });
        } else {
            res.status(401).json({ success: false, message: 'Verification failed' });
        }
    } catch (error) {
        console.error('Final Verification Error:', error);
        res.status(500).json({ success: false, message: 'Verification logic failed' });
    }
};
