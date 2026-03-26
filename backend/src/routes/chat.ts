import express, { Request, Response } from 'express';
import prisma from '../prisma/client';

const router = express.Router();

// Get users to start a chat with
router.get('/users/:userId', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const users = await prisma.user.findMany({
      where: {
        id: { not: userId }
      },
      select: { id: true, name: true, role: true, avatar: true }
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get all conversations for a user
router.get('/conversations/:userId', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    
    // Check if user exists first to be safe
    const user = await prisma.user.findUnique({ where: { id: userId }});
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { id: userId }
        }
      },
      include: {
        participants: {
          select: { id: true, name: true, avatar: true, role: true }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 50 // get more just in case to count unread correctly, but returning full list is fine or let's just get all to compute unread
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Deduplicate conversations just in case multiple were created via race conditions
    const uniqueMap = new Map();
    const result = [];
    for (const conv of conversations) {
       const otherParticipant = conv.participants.find(p => p.id !== userId) || conv.participants[0];
       const otherId = otherParticipant.id;
       if (!uniqueMap.has(otherId)) {
         uniqueMap.set(otherId, true);
         result.push(conv);
       }
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get messages for a specific conversation
router.get('/:conversationId/messages', async (req: Request, res: Response) => {
  try {
    const conversationId = req.params.conversationId as string;
    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Create or get a conversation between two users
router.post('/conversations', async (req: Request, res: Response) => {
  try {
    const { user1Id, user2Id } = req.body;

    if (!user1Id || !user2Id) {
      res.status(400).json({ error: 'Both user1Id and user2Id are required' });
      return;
    }

    // Check if conversation already exists
    const existingConversations = await prisma.conversation.findMany({
      where: {
        AND: [
          { participants: { some: { id: user1Id } } },
          { participants: { some: { id: user2Id } } }
        ]
      },
      include: {
        participants: {
           select: { id: true, name: true, avatar: true, role: true }
        },
        messages: {
           orderBy: { createdAt: 'desc' },
           take: 50
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const exactMatch = existingConversations.find((conv: any) => conv.participants.length === 2);

    if (exactMatch) {
      res.json(exactMatch);
      return;
    }

    // Otherwise, create a new conversation
    const newConversation = await prisma.conversation.create({
      data: {
        participants: {
          connect: [{ id: user1Id }, { id: user2Id }]
        }
      },
      include: {
        participants: {
          select: { id: true, name: true, avatar: true, role: true }
        },
        messages: true
      }
    });

    res.json(newConversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

export default router;
