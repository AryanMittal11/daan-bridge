import { Router, Response } from 'express';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import prisma from '../prisma/client';

const router = Router();

// Get all gallery posts
router.get('/', async (req, res) => {
  try {
    const posts = await prisma.galleryPost.findMany({
      include: {
        user: {
          select: { id: true, name: true, avatar: true, role: true }
        },
        likedBy: {
          select: { id: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch gallery posts' });
  }
});

// Create a new post
router.post('/', authenticateJWT, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { image, caption } = req.body;
    if (!image || !caption) return res.status(400).json({ error: "Image and caption are required" });

    const newPost = await prisma.galleryPost.create({
      data: {
        user: { connect: { id: req.user.sub } },
        image,
        caption,
      },
      include: {
         user: {
           select: { id: true, name: true, avatar: true, role: true }
         }
      }
    });
    return res.status(201).json(newPost);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to create post' });
  }
});

// Update a post
router.put('/:id', authenticateJWT, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { caption } = req.body;
    
    const post = await prisma.galleryPost.findUnique({ where: { id } });
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.userId !== req.user.sub) return res.status(403).json({ error: "Unauthorized" });

    const updatedPost = await prisma.galleryPost.update({
      where: { id },
      data: { caption },
      include: {
         user: {
           select: { id: true, name: true, avatar: true, role: true }
         }
      }
    });
    return res.json(updatedPost);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to update post' });
  }
});

// Delete a post
router.delete('/:id', authenticateJWT, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const post = await prisma.galleryPost.findUnique({ where: { id } });
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.userId !== req.user.sub) return res.status(403).json({ error: "Unauthorized" });

    await prisma.galleryPost.delete({ where: { id } });
    return res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Toggle like a post
router.post('/:id/like', authenticateJWT, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const userId = req.user.sub;
    
    const post = await prisma.galleryPost.findUnique({
      where: { id },
      include: { likedBy: { select: { id: true } } }
    });
    
    if (!post) return res.status(404).json({ error: "Post not found" });

    const hasLiked = post.likedBy.some(u => u.id === userId);

    const updatedPost = await prisma.galleryPost.update({
      where: { id },
      data: {
        likedBy: hasLiked 
          ? { disconnect: { id: userId } }
          : { connect: { id: userId } }
      },
      include: { likedBy: { select: { id: true } } }
    });
    
    return res.json({ hasLiked: !hasLiked, likesCount: updatedPost.likedBy.length });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to toggle like on post' });
  }
});

export default router;
