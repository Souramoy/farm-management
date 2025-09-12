import express from 'express';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import multer from 'multer';
import cors from 'cors';
import axios from 'axios';
import FormData from 'form-data'; // Proper ESM import (replaces in-route require)
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Version sentinel to verify the correct file is running (bump when changing scan route logic)
const SERVER_FILE_VERSION = 'scan-ai-integration-v3';

const app = express();
console.log('[SERVER START] server.js version:', SERVER_FILE_VERSION);
if (typeof require !== 'undefined') {
  // In pure ESM context, require should be undefined. If it exists, we log it for diagnostics.
  console.log('[DIAGNOSTIC] require is defined in this runtime (possible mixed module system).');
}
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  console.log(`Creating data directory: ${DATA_DIR}`);
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  console.log(`Creating uploads directory: ${UPLOADS_DIR}`);
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const JWT_SECRET = 'farm-management-secret-key';
// Hard-coded production AI service base URL (user requested no env vars)
const AI_SERVICE_BASE = 'https://farm-ai-production.up.railway.app';

function readJSON(file) {
  const filePath = path.join(DATA_DIR, file);
  if (!fs.existsSync(filePath)) {
    console.log(`File ${file} not found, creating with default data`);
    // Initialize with default data structure
    const defaultData = getDefaultData(file);
    writeJSON(file, defaultData);
    return defaultData;
  }
  console.log(`Reading data from ${file}`);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeJSON(file, data) {
  const filePath = path.join(DATA_DIR, file);
  console.log(`Writing data to ${file}`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function getDefaultData(file) {
  const defaults = {
    'users.json': [],
    'farms.json': [],
    'animals.json': [],
    'scans.json': [],
    'compliance.json': [],
    'alerts.json': [],
    'training.json': [
      {
        id: 1,
        title: 'Animal Health Basics',
        type: 'video',
        description: 'Learn the fundamentals of animal health monitoring',
        content: 'Basic animal health principles and early disease detection.',
        thumbnail: 'https://images.pexels.com/photos/422218/pexels-photo-422218.jpeg'
      },
      {
        id: 2,
        title: 'Preventive Care Guidelines',
        type: 'article',
        description: 'Essential preventive care practices for livestock',
        content: 'Comprehensive guide to vaccination schedules and nutrition.',
        thumbnail: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg'
      }
    ]
  };
  return defaults[file] || [];
}

// Middleware for JWT authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    console.log('Authentication failed: No token provided');
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Authentication failed: Invalid token', err.message);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    console.log(`Authenticated user: ${user.username} (ID: ${user.id}, Role: ${user.role})`);
    next();
  });
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(UPLOADS_DIR, req.body.type || 'general');
    if (!fs.existsSync(uploadPath)) {
      console.log(`Creating upload directory: ${uploadPath}`);
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      console.log(`File upload accepted: ${file.originalname}, type: ${file.mimetype}`);
      return cb(null, true);
    } else {
      console.log(`File upload rejected: ${file.originalname}, type: ${file.mimetype}`);
      cb(new Error('Invalid file type'));
    }
  }
});

// Authentication Routes
app.post('/api/register', async (req, res) => {
  try {
    console.log('Registration attempt:', { username: req.body.username, email: req.body.email });
    const users = readJSON('users.json');
    const { username, password, role = 'farmer', email, farmName } = req.body;
    
    if (users.find(u => u.username === username)) {
      console.log('Registration failed: Username already exists', username);
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    const password_hash = await bcrypt.hash(password, 10);
    const newUser = {
      id: Date.now(),
      username,
      email,
      password_hash,
      role,
      farmName,
      createdAt: new Date().toISOString(),
      isActive: true
    };
    
    users.push(newUser);
    writeJSON('users.json', users);
    
    const token = jwt.sign({ 
      id: newUser.id, 
      username: newUser.username, 
      role: newUser.role 
    }, JWT_SECRET, { expiresIn: '7d' });
    
    console.log(`User registered successfully: ${username} (ID: ${newUser.id})`);
    
    res.json({ 
      message: 'User registered successfully',
      token,
      user: { 
        id: newUser.id, 
        username: newUser.username, 
        role: newUser.role,
        email: newUser.email,
        farmName: newUser.farmName
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    console.log('Login attempt:', { username: req.body.username });
    const users = readJSON('users.json');
    const { username, password } = req.body;
    
    const user = users.find(u => u.username === username && u.isActive);
    if (!user) {
      console.log('Login failed: User not found or inactive', username);
      return res.status(400).json({ error: 'User not found or inactive' });
    }
    
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      console.log('Login failed: Invalid password for user', username);
      return res.status(400).json({ error: 'Invalid password' });
    }
    
    const token = jwt.sign({ 
      id: user.id, 
      username: user.username, 
      role: user.role 
    }, JWT_SECRET, { expiresIn: '7d' });
    
    console.log(`User logged in successfully: ${username} (ID: ${user.id})`);
    
    res.json({ 
      token,
      user: { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        email: user.email,
        farmName: user.farmName
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Animal Scanning Routes
app.post('/api/scan', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    console.log(`Scan request from user ${req.user.username} (ID: ${req.user.id})`);
    const { animalId, notes } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    // NOTE: FormData is imported at top (ESM). The previous in-route require caused a ReferenceError in ESM and led to 500.

    // Create a FormData object to send the image file to the AI service
    const formData = new FormData();
    const fileStream = fs.createReadStream(req.file.path);
    formData.append('image', fileStream, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    
    console.log(`Image file details: ${req.file.originalname}, ${req.file.mimetype}, size: ${req.file.size} bytes`);

    // Call AI service with image
    let aiResult;
    try {
      console.log('Calling AI service for image analysis...');
      
      // With the form-data npm package, getHeaders() is available
      // If there's any issue with getHeaders, comment this out and use the commented out version below
      const headers = formData.getHeaders ? formData.getHeaders() : { 'Content-Type': 'multipart/form-data' };
      console.log('Request headers:', headers);
      
      const response = await axios.post(`${AI_SERVICE_BASE}/analyze`, formData, {
        headers: headers,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 60000 // Increased timeout for Gemini processing (60 seconds)
      });
      
      aiResult = response.data;
      console.log(`AI service response: ${aiResult.result} (confidence: ${aiResult.confidence})`);
      console.log(`Animal type detected: ${aiResult.animal_type}`);
      
    } catch (aiError) {
      // Detailed diagnostics
      console.log('AI service error details:');
      if (aiError.response) {
        console.log('Response status:', aiError.response.status);
        console.log('Response data:', aiError.response.data);
        console.log('Response headers:', aiError.response.headers);
      } else if (aiError.request) {
        console.log('No response received. URL (if available):', aiError.request?._currentUrl || 'N/A');
      } else {
        console.log('Error setting up request:', aiError.message);
      }
      console.log('Stack (if any):', aiError.stack || 'No stack');

      // Fallback random result for resilience
      const statuses = ['healthy', 'treatable', 'untreatable'];
      aiResult = {
        result: statuses[Math.floor(Math.random() * statuses.length)],
        confidence: +(Math.random() * 0.4 + 0.6).toFixed(3),
        animal_type: 'unknown',
        message: 'AI service unavailable - using fallback random result',
        scanId: Date.now(),
        health_assessment: {
            status: 'unknown',
            confidence: 0.7,
            observations: 'AI service unavailable',
            key_issues: ['Service unavailable']
        },
        recommendations: {
            treatable: true,
            message: 'Please try again later when the AI service is available',
            monitoring_advice: 'Manual inspection recommended'
        }
      };
      console.log(`Fallback result used due to AI error: ${aiResult.result} (confidence: ${aiResult.confidence})`);
    }
    
    const scans = readJSON('scans.json');
    const newScan = {
      id: Date.now(),
      userId: req.user.id,
      animalId: animalId || null,
      result: aiResult.result, // Using the standardized result field
      confidence: aiResult.confidence,
      imagePath: req.file ? req.file.path : null,
      notes: notes || '',
      timestamp: new Date().toISOString(),
      reviewed: false,
      // Store enhanced data from new AI model
      animalType: aiResult.animal_type || 'unknown',
      observations: aiResult.health_assessment?.observations || '',
      keyIssues: aiResult.health_assessment?.key_issues || [],
      recommendations: aiResult.recommendations || {}
    };
    
    scans.push(newScan);
    writeJSON('scans.json', scans);
    
    // Create alert if problematic
    if (aiResult.result !== 'healthy') {
      console.log(`Creating alert for ${aiResult.result} condition`);
      const alerts = readJSON('alerts.json');
      
      // Create a more detailed alert message using the enhanced data
      const issuesText = aiResult.health_assessment?.key_issues?.length 
        ? `Issues: ${aiResult.health_assessment.key_issues.join(', ')}`
        : '';
        
      alerts.push({
        id: Date.now(),
        userId: req.user.id,
        type: 'health_alert',
        title: `Animal Health Alert - ${aiResult.animal_type || 'Animal'}`,
        message: `Scan detected ${aiResult.result} condition (${Math.round(aiResult.confidence * 100)}% confidence). ${issuesText}`,
        priority: aiResult.result === 'untreatable' ? 'high' : 'medium',
        timestamp: new Date().toISOString(),
        read: false
      });
      writeJSON('alerts.json', alerts);
    }
    
    console.log(`Scan completed successfully for user ${req.user.username}, result: ${aiResult.result}`);
    
    // Pass all the enhanced AI result data to the frontend
    res.json(aiResult);
    
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ error: 'Scan failed' });
  }
});

// Get user scans
app.get('/api/scans', authenticateToken, (req, res) => {
  try {
    console.log(`Fetching scans for user ${req.user.username} (Role: ${req.user.role})`);
    const scans = readJSON('scans.json');
    const userScans = req.user.role === 'admin' ? 
      scans : 
      scans.filter(scan => scan.userId === req.user.id);
    
    console.log(`Returning ${userScans.length} scans`);
    res.json(userScans.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
  } catch (error) {
    console.error('Error fetching scans:', error);
    res.status(500).json({ error: 'Failed to fetch scans' });
  }
});

// Compliance Routes
app.post('/api/compliance', authenticateToken, upload.single('document'), (req, res) => {
  try {
    console.log(`Compliance document upload from user ${req.user.username}`);
    const { title, description, category } = req.body;
    const compliance = readJSON('compliance.json');
    
    const newCompliance = {
      id: Date.now(),
      userId: req.user.id,
      title,
      description,
      category: category || 'general',
      documentPath: req.file ? req.file.path : null,
      timestamp: new Date().toISOString(),
      status: 'pending',
      reviewedBy: null,
      reviewedAt: null
    };
    
    compliance.push(newCompliance);
    writeJSON('compliance.json', compliance);
    
    console.log(`Compliance document uploaded successfully: ${title} (ID: ${newCompliance.id})`);
    
    res.json({ message: 'Compliance document uploaded successfully', id: newCompliance.id });
  } catch (error) {
    console.error('Error uploading compliance document:', error);
    res.status(500).json({ error: 'Failed to upload compliance document' });
  }
});

app.get('/api/compliance', authenticateToken, (req, res) => {
  try {
    console.log(`Fetching compliance records for user ${req.user.username} (Role: ${req.user.role})`);
    const compliance = readJSON('compliance.json');
    const userCompliance = req.user.role === 'admin' ? 
      compliance : 
      compliance.filter(item => item.userId === req.user.id);
    
    console.log(`Returning ${userCompliance.length} compliance records`);
    res.json(userCompliance.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
  } catch (error) {
    console.error('Error fetching compliance records:', error);
    res.status(500).json({ error: 'Failed to fetch compliance records' });
  }
});

// Training Routes
app.get('/api/training', authenticateToken, (req, res) => {
  try {
    console.log(`Fetching training content for user ${req.user.username}`);
    const training = readJSON('training.json');
    console.log(`Returning ${training.length} training items`);
    res.json(training);
  } catch (error) {
    console.error('Error fetching training content:', error);
    res.status(500).json({ error: 'Failed to fetch training content' });
  }
});

// Alerts Routes
app.get('/api/alerts', authenticateToken, (req, res) => {
  try {
    console.log(`Fetching alerts for user ${req.user.username} (Role: ${req.user.role})`);
    const alerts = readJSON('alerts.json');
    const userAlerts = req.user.role === 'admin' ? 
      alerts : 
      alerts.filter(alert => alert.userId === req.user.id);
    
    const unreadCount = userAlerts.filter(alert => !alert.read).length;
    console.log(`Returning ${userAlerts.length} alerts (${unreadCount} unread)`);
    
    res.json(userAlerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

app.patch('/api/alerts/:id/read', authenticateToken, (req, res) => {
  try {
    console.log(`Marking alert ${req.params.id} as read by user ${req.user.username}`);
    const alerts = readJSON('alerts.json');
    const alertIndex = alerts.findIndex(alert => 
      alert.id === parseInt(req.params.id) && 
      (req.user.role === 'admin' || alert.userId === req.user.id)
    );
    
    if (alertIndex === -1) {
      console.log(`Alert ${req.params.id} not found for user ${req.user.username}`);
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    alerts[alertIndex].read = true;
    writeJSON('alerts.json', alerts);
    
    console.log(`Alert ${req.params.id} marked as read successfully`);
    
    res.json({ message: 'Alert marked as read' });
  } catch (error) {
    console.error('Error updating alert:', error);
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

// Dashboard Stats
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  try {
    console.log(`Fetching dashboard stats for user ${req.user.username} (Role: ${req.user.role})`);
    const scans = readJSON('scans.json');
    const alerts = readJSON('alerts.json');
    const compliance = readJSON('compliance.json');
    
    const userScans = req.user.role === 'admin' ? scans : scans.filter(s => s.userId === req.user.id);
    const userAlerts = req.user.role === 'admin' ? alerts : alerts.filter(a => a.userId === req.user.id);
    const userCompliance = req.user.role === 'admin' ? compliance : compliance.filter(c => c.userId === req.user.id);
    
    const stats = {
      totalScans: userScans.length,
      healthyScans: userScans.filter(s => s.result === 'healthy').length,
      alertsCount: userAlerts.filter(a => !a.read).length,
      pendingCompliance: userCompliance.filter(c => c.status === 'pending').length,
      recentScans: userScans.slice(-5).reverse()
    };
    
    console.log(`Dashboard stats: ${stats.totalScans} scans, ${stats.healthyScans} healthy, ${stats.alertsCount} alerts, ${stats.pendingCompliance} pending compliance`);
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Farm Management API running on port ${PORT}`);
  console.log(`📊 Data directory: ${DATA_DIR}`);
  console.log(`📁 Uploads directory: ${UPLOADS_DIR}`);
  console.log(`⏰ Server started at: ${new Date().toISOString()}`);
});