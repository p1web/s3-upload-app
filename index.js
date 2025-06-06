process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const express = require('express');
const multer = require('multer');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3 = require('./s3Client');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

const app = express();
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.use(express.static('public')); // Serve HTML from /public

// Upload route
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).send('No file uploaded');

    const fileName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${path.extname(file.originalname)}`;

    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    await s3.send(new PutObjectCommand(uploadParams));

    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

    res.send(`File uploaded successfully: <a href="${fileUrl}" target="_blank">${fileUrl}</a>`);

  } catch (err) {
    console.error(err);
    res.status(500).send('File upload failed');
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
