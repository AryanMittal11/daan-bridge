import "dotenv/config";
import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/auth';
import verificationRoutes from './routes/verification';
import adminRoutes from './routes/admin';
import protectedRoutes from './routes/protected';
import bloodRoutes from './routes/inventory';
import campaignsRoutes from './routes/campaigns';
import uploadRoutes from './routes/upload';
import disasterRoutes from './routes/disaster';
import tutoringRoutes from './routes/tutoring';
import galleryRoutes from './routes/gallery';
import prisma from "./prisma/client";

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for potential base64 or large inputs
app.use('/uploads', express.static(path.join(__dirname, '../uploads'))); // Serve uploads


app.use('/api/auth', authRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', protectedRoutes); // Other protected endpoints
app.use('/api/campaigns', campaignsRoutes); // NEW: Campaigns API
app.use('/api/blood', bloodRoutes); // NEW: Campaigns API
app.use('/api/inventory', bloodRoutes); // Aliasing bloodRoutes to inventory
app.use('/api/upload', uploadRoutes); // NEW: Upload API
app.use('/api/disaster', disasterRoutes); // NEW: Disaster API
app.use('/api/tutoring', tutoringRoutes); // NEW: Tutoring API
app.use('/api/gallery', galleryRoutes); // NEW: Gallery API

app.get('/api/me', (req, res) => { res.send('Daan Bridge API up'); });

app.get("/", async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on :${PORT}`));
