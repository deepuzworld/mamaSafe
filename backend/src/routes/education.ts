import { Router } from 'express';
import prisma from '../utils/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Multer configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Get all approved resources
router.get('/resources', async (req, res) => {
    try {
        const resources = await prisma.resourceHub.findMany({
            where: { isApproved: true },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ success: true, resources });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Expert/Admin contributes resource
router.post('/resources', authenticateToken, upload.single('file'), async (req: AuthRequest, res) => {
    try {
        const { title, content, category, type, url } = req.body;
        const file = req.file;
        let finalUrl = url;
        let thumbnail = req.body.thumbnail;
        
        if (file) {
             const fileUrl = `/uploads/${file.filename}`;
             if (type === 'video') {
                 finalUrl = fileUrl;
             } else {
                 thumbnail = fileUrl;
             }
        }

        const userId = req.user?.userId;
        const role = req.user?.role;

        if (role !== 'admin' && role !== 'professional' && role !== 'mother') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const user = await prisma.user.findUnique({ where: { userId } });

        const resource = await prisma.resourceHub.create({
            data: {
                title,
                content,
                category,
                type,
                thumbnail,
                url,
                authorName: user?.fullName,
                authorRole: role,
                isApproved: role === 'admin' // Admins auto-approve
            }
        });

        res.status(201).json({ success: true, resource });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

export default router;
