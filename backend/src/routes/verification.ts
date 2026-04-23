import express from 'express';
import multer from 'multer';
import { 
    startVerificationSession, 
    processFrame, 
    completeVerification 
} from '../controllers/verificationController';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Process frames strictly in memory

// 1. Start session
router.post('/start', startVerificationSession);

// 2. Upload verification frames (multipart)
router.post('/frame', upload.single('frame'), processFrame);

// 3. Complete and log verification result securely
router.post('/complete', completeVerification);

export default router;
