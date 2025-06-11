const express = require('express');
const multer = require('multer');
const {
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3 = require('../utils/s3Client');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const BUCKET = process.env.S3_BUCKET_NAME;

/**
 * @swagger
 * tags:
 *   name: S3
 *   description: S3 File Upload and Management
 */

/**
 * @swagger
 * /s3/upload:
 *   post:
 *     summary: Upload a file to S3
 *     tags: [S3]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  const key = `${Date.now()}-${file.originalname}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  try {
    await s3.send(command);
    res.status(200).json({ success: true, key });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /s3/file/{key}:
 *   get:
 *     summary: Get a presigned URL for a file
 *     tags: [S3]
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Presigned URL returned
 */
router.get('/file/:key', async (req, res) => {
  const key = req.params.key;

  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });

  try {
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    res.status(200).json({ success: true, url });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /s3/file/{key}:
 *   delete:
 *     summary: Delete a file from S3
 *     tags: [S3]
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File deleted
 */
router.delete('/file/:key', async (req, res) => {
  const key = req.params.key;

  const command = new DeleteObjectCommand({ Bucket: BUCKET, Key: key });

  try {
    await s3.send(command);
    res.status(200).json({ success: true, message: 'File deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /s3/list:
 *   get:
 *     summary: List all files in the S3 bucket
 *     tags: [S3]
 *     responses:
 *       200:
 *         description: File list returned
 */
router.get('/list', async (req, res) => {
  const command = new ListObjectsV2Command({ Bucket: BUCKET });

  try {
    const data = await s3.send(command);
    const files = data.Contents?.map((item) => ({
      key: item.Key,
      lastModified: item.LastModified,
      size: item.Size,
    })) || [];

    res.status(200).json({ success: true, files });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
