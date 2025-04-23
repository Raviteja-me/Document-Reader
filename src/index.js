const express = require('express');
const multer = require('multer');
const mammoth = require('mammoth');
const textract = require('textract');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
 
// Security and CORS
app.use(cors());
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Configure multer with memory storage for Cloud Run
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.doc', '.docx'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

// Function to extract text from DOCX buffer
async function extractDocxText(buffer) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
}

// Function to extract text from DOC buffer
function extractDocText(buffer) {
    return new Promise((resolve, reject) => {
        textract.fromBufferWithMime('application/msword', buffer, (error, text) => {
            if (error) reject(error);
            else resolve(text);
        });
    });
}

app.get('/', (req, res) => {
    res.json({ status: 'API is running' });
});

app.post('/api/extract-text', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileExtension = path.extname(req.file.originalname).toLowerCase();
        let extractedText;

        if (fileExtension === '.docx') {
            extractedText = await extractDocxText(req.file.buffer);
        } else if (fileExtension === '.doc') {
            extractedText = await extractDocText(req.file.buffer);
        }

        res.json({ 
            success: true,
            text: extractedText,
            originalFile: req.file.originalname
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to extract text',
            message: error.message 
        });
    }
});

const port = process.env.PORT || 8080;
console.log(`Starting server on port ${port}...`);
app.listen(port, '0.0.0.0', () => {
    console.log(`Server successfully running on port ${port}`);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});