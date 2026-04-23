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

router.use(authenticateToken);

// Debug logging
router.use((req: AuthRequest, res, next) => {
    console.log(`[Community API] ${req.method} ${req.path}`, req.body);
    next();
});

// Create Post
router.post('/post', upload.array('files'), async (req: AuthRequest, res) => {
    try {
        const { pseudonym, content, title, category } = req.body;
        const files = req.files as Express.Multer.File[];

        const user = await prisma.user.findUnique({
            where: { userId: req.user.userId },
            select: { communityPseudonym: true }
        });

        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found. Please log in again.' });
        }

        const post = await (prisma.communityPost as any).create({
            data: {
                userId: req.user.userId,
                pseudonym: pseudonym || user?.communityPseudonym || 'AnonymousMama',
                content,
                title,
                category,
                attachments: {
                    create: files ? files.map(file => ({
                        fileUrl: `/uploads/${file.filename}`,
                        fileType: (file.filename.toLowerCase().endsWith('.mov') || file.filename.toLowerCase().endsWith('.mkv') || file.filename.toLowerCase().endsWith('.mp4') || file.filename.toLowerCase().endsWith('.webm')) ? 'video' : file.mimetype.split('/')[0] // 'image', 'video', 'audio'
                    })) : []
                }
            },
            include: {
                attachments: true
            }
        });
        res.status(201).json({ success: true, post });
    } catch (error: any) {
        console.error('[Community Post Error]', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Fetch Posts
router.get('/posts', async (req: AuthRequest, res) => {
    try {
        const posts = await (prisma.communityPost as any).findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                comments: {
                    include: {
                        user: {
                            select: {
                                fullName: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                },
                _count: {
                    select: {
                        supports: true,
                        comments: true
                    }
                },
                supports: {
                    where: {
                        userId: req.user.userId
                    },
                    select: {
                        supportId: true
                    }
                },
                attachments: true,
                user: {
                    select: {
                        communityPseudonym: true,
                        avatarUrl: true
                    }
                }
            }
        });

        // Map posts to include a boolean 'supportedByMe'
        const formattedPosts = (posts as any[]).map(post => ({
            ...post,
            pseudonym: post.user?.communityPseudonym || post.pseudonym || 'AnonymousMama',
            avatarUrl: post.user?.avatarUrl,
            supportedByMe: post.supports?.length > 0,
            supportCount: post._count?.supports || 0,
            commentCount: post._count?.comments || 0
        }));

        res.status(200).json({ success: true, posts: formattedPosts });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Add Comment
router.post('/comment', async (req: AuthRequest, res) => {
    try {
        const { postId, content } = req.body;
        if (!content || !postId) {
            return res.status(400).json({ success: false, message: 'Post ID and content are required' });
        }
        const comment = await prisma.postComment.create({
            data: {
                postId,
                userId: req.user.userId,
                content
            },
            include: {
                user: {
                    select: {
                        fullName: true
                    }
                }
            }
        });
        res.status(201).json({ success: true, comment });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Toggle Support (Like)
router.post('/support', async (req: AuthRequest, res) => {
    try {
        const { postId } = req.body;
        if (!postId) {
            return res.status(400).json({ success: false, message: 'Post ID is required' });
        }

        const existingSupport = await prisma.postSupport.findUnique({
            where: {
                postId_userId: {
                    postId,
                    userId: req.user.userId
                }
            }
        });

        if (existingSupport) {
            await prisma.postSupport.delete({
                where: {
                    supportId: existingSupport.supportId
                }
            });
            return res.status(200).json({ success: true, supported: false });
        } else {
            await prisma.postSupport.create({
                data: {
                    postId,
                    userId: req.user.userId
                }
            });
            return res.status(200).json({ success: true, supported: true });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});


// Fetch Current User's Posts
router.get('/me/posts', async (req: AuthRequest, res) => {
    try {
        const posts = await (prisma.communityPost as any).findMany({
            where: { userId: req.user.userId },
            orderBy: { createdAt: 'desc' },
            include: {
                attachments: true,
                _count: {
                    select: {
                        supports: true,
                        comments: true
                    }
                }
            }
        });

        const formattedPosts = (posts as any[]).map(post => ({
            ...post,
            supportCount: post._count?.supports || 0,
            commentCount: post._count?.comments || 0
        }));

        res.status(200).json({ success: true, posts: formattedPosts });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Delete Post
router.delete('/post/:postId', async (req: AuthRequest, res) => {
    try {
        const { postId } = req.params;
        const post = await (prisma.communityPost as any).findUnique({
            where: { postId }
        });

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        if (post.userId !== req.user.userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        await (prisma.communityPost as any).delete({
            where: { postId }
        });

        res.status(200).json({ success: true, message: 'Post deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Update Post
router.put('/post/:postId', async (req: AuthRequest, res) => {
    try {
        const { postId } = req.params;
        const { content } = req.body;
        const post = await (prisma.communityPost as any).findUnique({
            where: { postId }
        });

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        if (post.userId !== req.user.userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const updatedPost = await (prisma.communityPost as any).update({
            where: { postId },
            data: { content }
        });

        res.status(200).json({ success: true, post: updatedPost });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Get Profile Info
router.get('/profile', async (req: AuthRequest, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { userId: req.user.userId },
            select: {
                communityPseudonym: true,
                communityBio: true,
                avatarUrl: true,
                fullName: true,
                createdAt: true,
                _count: {
                    select: {
                        posts: true,
                        supports: true,
                        comments: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ 
            success: true, 
            profile: {
                pseudonym: user.communityPseudonym || 'AnonymousMama',
                bio: user.communityBio || '',
                avatarUrl: user.avatarUrl,
                fullName: user.fullName,
                joinedAt: user.createdAt,
                stats: {
                    posts: user._count.posts,
                    supports: user._count.supports,
                    comments: user._count.comments
                }
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Update Profile Info
router.put('/profile', async (req: AuthRequest, res) => {
    try {
        const { pseudonym, bio, avatarUrl } = req.body;
        
        const updatedUser = await prisma.user.update({
            where: { userId: req.user.userId },
            data: {
                communityPseudonym: pseudonym,
                communityBio: bio,
                avatarUrl: avatarUrl
            }
        });

        res.status(200).json({ 
            success: true, 
            profile: {
                pseudonym: updatedUser.communityPseudonym,
                bio: updatedUser.communityBio,
                avatarUrl: updatedUser.avatarUrl
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Fetch Current User's Liked/Supported Posts
router.get('/me/liked', async (req: AuthRequest, res) => {
    try {
        const supports = await prisma.postSupport.findMany({
            where: { userId: req.user.userId },
            include: {
                communityPost: {
                    include: {
                        attachments: true,
                        user: {
                            select: {
                                communityPseudonym: true,
                                avatarUrl: true
                            }
                        },
                        _count: {
                            select: {
                                supports: true,
                                comments: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const posts = supports.map(s => {
            const post = s.communityPost as any;
            return {
                ...post,
                pseudonym: post.user?.communityPseudonym || post.pseudonym || 'AnonymousMama',
                avatarUrl: post.user?.avatarUrl,
                supportCount: post._count?.supports || 0,
                commentCount: post._count?.comments || 0,
                type: 'liked'
            };
        });

        res.status(200).json({ success: true, posts });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Fetch Current User's Replied Posts
router.get('/me/replied', async (req: AuthRequest, res) => {
    try {
        const comments = await prisma.postComment.findMany({
            where: { userId: req.user.userId },
            include: {
                communityPost: {
                    include: {
                        attachments: true,
                        user: {
                            select: {
                                communityPseudonym: true,
                                avatarUrl: true
                            }
                        },
                        _count: {
                            select: {
                                supports: true,
                                comments: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const seenPostIds = new Set();
        const posts = comments
            .filter(c => {
                if (seenPostIds.has(c.postId)) return false;
                seenPostIds.add(c.postId);
                return true;
            })
            .map(c => {
                const post = c.communityPost as any;
                return {
                    ...post,
                    pseudonym: post.user?.communityPseudonym || post.pseudonym || 'AnonymousMama',
                    avatarUrl: post.user?.avatarUrl,
                    supportCount: post._count?.supports || 0,
                    commentCount: post._count?.comments || 0,
                    type: 'replied'
                };
            });

        res.status(200).json({ success: true, posts });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

export default router;
