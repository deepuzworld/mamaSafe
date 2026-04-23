import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { sendPartnerInvite } from '../utils/mailer';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_fallback';

// Register User
router.post('/register', async (req, res) => {
    try {
        const { 
            fullName, email, phoneNumber, password, role,
            firstPregnancy, historyOfBipolar, babyBirthDate,
            partnerName, partnerEmail, accessLevel
        } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const user = await prisma.user.create({
            data: {
                fullName,
                email,
                phoneNumber,
                passwordHash,
                role
            }
        });

        // If mother, record Profile info
        if (role === 'mother' && firstPregnancy !== undefined) {
            await prisma.profile.create({
                data: {
                    userId: user.userId,
                    firstPregnancy: firstPregnancy || false,
                    historyOfBipolar: historyOfBipolar || false,
                    babyBirthDate: babyBirthDate ? new Date(babyBirthDate) : null
                }
            });
        }

        // If mother specifies a partner
        if (role === 'mother' && partnerEmail && partnerName) {
            let partnerUserId: string | null = null;
            const existingPartner = await prisma.user.findUnique({ where: { email: partnerEmail } });
            
            if (!existingPartner) {
                // Generate temporary 8-char password
                const tempPassword = Math.random().toString(36).slice(-8);
                const pSalt = await bcrypt.genSalt(10);
                const pHash = await bcrypt.hash(tempPassword, pSalt);
                
                const newPartner = await prisma.user.create({
                    data: {
                        fullName: partnerName,
                        email: partnerEmail,
                        passwordHash: pHash,
                        role: 'partner',
                        mustResetPassword: true
                    }
                });
                partnerUserId = newPartner.userId;

                // Send email
                await sendPartnerInvite(partnerEmail, tempPassword, partnerName);
            } else {
                partnerUserId = existingPartner.userId;
            }

            // Link partner to mother
            await prisma.partnerBridge.create({
                data: {
                    motherUserId: user.userId,
                    partnerUserId: partnerUserId,
                    partnerEmail: partnerEmail,
                    accessLevel: accessLevel || 'ViewOnly'
                }
            });
        }

        res.status(201).json({ success: true, message: 'User registered successfully', userId: user.userId });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Login User
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // Add 24 hours expiry check for first login
        if (user.mustResetPassword && user.otpCreatedAt) {
            const current_time = new Date().getTime();
            const otp_created_time = new Date(user.otpCreatedAt).getTime();
            const diff_in_hours = (current_time - otp_created_time) / (1000 * 60 * 60);
            
            if (diff_in_hours > 24) {
                return res.status(403).json({ success: false, message: 'OTP has expired. Please contact admin to resend OTP.', mustReset: false });
            }
        }

        // Ensure token has mustResetPassword or middleware uses user query, let's just use token payload or simple check.
        // Wait, I am redirecting to reset-password from frontend using mustReset: true in response.
        const token = jwt.sign({ userId: user.userId, role: user.role, mustResetPassword: user.mustResetPassword }, JWT_SECRET, { expiresIn: '1d' });

        res.status(200).json({
            success: true,
            token,
            mustReset: user.mustResetPassword,
            user: {
                userId: user.userId,
                fullName: user.fullName,
                role: user.role
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// FaceIO Verification Mock
router.post('/face-verification', async (req, res) => {
    try {
        const { userId, faceIoId } = req.body;

        const verification = await prisma.faceVerification.upsert({
            where: { userId },
            update: {
                faceIoId,
                verificationStatus: 'verified',
                verifiedAt: new Date()
            },
            create: {
                userId,
                faceIoId,
                verificationStatus: 'verified',
                verifiedAt: new Date()
            }
        });

        res.status(200).json({ success: true, verificationStatus: 'verified' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    try {
        const { email, oldPassword, newPassword } = req.body;
        
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        
        const validPassword = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!validPassword) return res.status(400).json({ success: false, message: 'Invalid current credentials' });
        
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);
        
        await prisma.user.update({
            where: { email },
            data: { passwordHash, mustResetPassword: false }
        });
        
        res.status(200).json({ success: true, message: 'Password reset successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

export default router;
