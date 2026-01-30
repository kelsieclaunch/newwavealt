import express from 'express';
import multer from 'multer';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // per IP
  standardHeaders: true,
  legacyHeaders: false,
});

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// Handle form submission
app.post('/submit', submitLimiter, upload.single('file-upload'), async (req, res) => {
  // Honeypot spam check
  if (req.body.website) {
    return res.status(200).send('Thanks!');
  }

  const sanitize = (value, max = 300) =>
    typeof value === 'string' ? value.slice(0, max).trim() : '';
  const name = sanitize(req.body.name, 100);
  const email = sanitize(req.body.email, 200);
  const company = sanitize(req.body.company, 200);
  const onBehalf = sanitize(req.body['on-behalf'], 200);
  const industry = sanitize(req.body.industry, 200);
  const hearAbout = sanitize(req.body['hear-about'], 300);
  const url = sanitize(req.body.url, 300);

  const file = req.file;


  const mailOptions = {
    from: `"New Wave Alt" <no-reply@newwavealt.com>`,
    to: [process.env.GMAIL_USER, 'britt@newwavealt.com'],
    subject: `New Submission: ${name}`,
    text: `
Name: ${name}
Email: ${email}
Company: ${company || 'N/A'}
Submitted on behalf of: ${onBehalf}
Industry role: ${industry}
How they heard about New Wave Alt: ${hearAbout}
URL: ${url || 'N/A'}
    `,
    attachments: file
      ? [
          {
            filename: `submission-${Date.now()}${path.extname(file.originalname)}`,
            content: file.buffer,
          },
        ]
      : [],

  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully!');
    res.status(200).send('Submission received! Thank you.');
  } catch (err) {
    console.error('Error sending email:', err);
    res.status(500).send('Something went wrong. Please try again.');
  }
});

// Catch-all route to support client-side routing if needed
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
