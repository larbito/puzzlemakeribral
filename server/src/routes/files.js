import express from 'express';
import { S3 } from 'aws-sdk';
import { v2 as cloudinary } from 'cloudinary';
import { verifyToken } from './auth.js';

const router = express.Router();

// Configure S3
const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload file
router.post('/upload', verifyToken, async (req, res) => {
  try {
    const { file, storage = 's3' } = req.body;
    let uploadResult;

    if (storage === 's3') {
      // Upload to S3
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${Date.now()}-${file.name}`,
        Body: Buffer.from(file.data, 'base64'),
        ContentType: file.type,
      };

      uploadResult = await s3.upload(params).promise();
    } else if (storage === 'cloudinary') {
      // Upload to Cloudinary
      uploadResult = await cloudinary.uploader.upload(
        `data:${file.type};base64,${file.data}`,
        {
          folder: 'puzzle-craft-forge',
          resource_type: 'auto'
        }
      );
    }

    res.json({
      url: storage === 's3' ? uploadResult.Location : uploadResult.secure_url,
      key: storage === 's3' ? uploadResult.Key : uploadResult.public_id
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Download file
router.get('/download/:key', verifyToken, async (req, res) => {
  try {
    const { key } = req.params;
    const { storage = 's3' } = req.query;

    if (storage === 's3') {
      // Download from S3
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key
      };

      const data = await s3.getObject(params).promise();
      res.setHeader('Content-Type', data.ContentType);
      res.setHeader('Content-Disposition', `attachment; filename="${key}"`);
      res.send(data.Body);
    } else if (storage === 'cloudinary') {
      // Get Cloudinary URL
      const result = await cloudinary.api.resource(key);
      res.json({ url: result.secure_url });
    }
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

export default router; 