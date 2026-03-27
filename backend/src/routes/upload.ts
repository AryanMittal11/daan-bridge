import express from 'express';
import multer from 'multer';
import { storage } from '../utils/cloudinary';

const router = express.Router();

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

router.post('/', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    // The secure_url is returned by Cloudinary Storage
    res.json({ url: (req.file as any).path });
});

export default router;
