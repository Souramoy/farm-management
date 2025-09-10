# 🌱 Digital Farm Management PWA

A comprehensive **offline-first Progressive Web App** for modern farm management, featuring AI-powered animal health scanning, compliance tracking, and educational resources.

## 🚀 Features

### 🔐 Authentication & Security
- Local JWT-based authentication
- Role-based access (Farmer, Veterinarian, Admin)
- Secure password hashing with bcrypt
- Offline authentication support

### 🤖 AI-Powered Health Scanning  
- Real-time animal health analysis using ML models
- Camera capture or file upload support
- Confidence scoring and recommendations
- Offline scan queue with background sync

### 📋 Compliance Management
- Document upload and categorization
- Status tracking (Pending, Approved, Rejected)
- Photo and PDF support
- Admin review workflow

### 🎓 Training Hub
- Interactive learning modules
- Video, article, and guide formats
- Progress tracking and completion badges
- Offline content caching

### 🚨 Alert System
- Real-time health alerts
- Priority-based notifications
- Push notification support
- Background sync capabilities

### 📱 Progressive Web App
- Offline-first architecture
- Service worker caching
- App-like experience
- Mobile-optimized interface

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Glassmorphism UI** design
- **PWA** capabilities with Service Worker
- **IndexedDB** for offline storage

### Backend  
- **Node.js** with Express
- **JSON file storage** (no external database)
- **JWT authentication**
- **Multer** for file uploads
- **bcrypt** for password hashing

### AI Service
- **Python Flask** API
- **Random forest simulation** (demo mode)
- **REST API** for health predictions
- **CORS** enabled for cross-origin requests

## 📁 Project Structure

```
/
├── backend/                 # Node.js API server
│   ├── server.js           # Main server file
│   ├── data/               # JSON data storage
│   │   ├── users.json
│   │   ├── scans.json
│   │   ├── compliance.json
│   │   └── alerts.json
│   └── uploads/            # File uploads
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── contexts/           # React contexts
│   └── App.tsx            # Main app component
├── ai/                     # Python AI service
│   ├── ai.py              # Flask AI server
│   ├── requirements.txt   # Python dependencies
│   └── start.py          # AI service launcher
└── public/                # Static assets
    ├── manifest.json      # PWA manifest
    └── sw.js             # Service worker
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- Python 3.8+
- Modern web browser

### Installation

1. **Clone and install dependencies**
   ```bash
   npm install
   ```

2. **Start the development servers**
   ```bash
   npm run dev
   ```
   This starts both frontend (port 3000) and backend (port 4000)

3. **Start the AI service** (in a separate terminal)
   ```bash
   cd ai
   python start.py
   ```
   AI service runs on port 5000

### Demo Credentials
- **Farmer**: `demo / password`
- **Admin**: `admin / admin123`

## 📱 PWA Installation

1. Open the app in a modern browser
2. Look for "Install App" prompt or button
3. Add to home screen for native app experience
4. Works offline after initial load

## 🔧 Configuration

### Environment Variables
The app uses local storage and doesn't require external API keys or database connections.

### Customization
- **Colors**: Modify `tailwind.config.js`
- **AI Models**: Update `ai/ai.py` prediction logic
- **Storage**: Extend JSON schemas in `backend/server.js`

## 🌐 API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login

### Health Scanning  
- `POST /api/scan` - Upload and analyze images
- `GET /api/scans` - Get scan history

### Compliance
- `POST /api/compliance` - Upload documents
- `GET /api/compliance` - Get compliance records

### Training & Alerts
- `GET /api/training` - Get training content
- `GET /api/alerts` - Get user alerts
- `PATCH /api/alerts/:id/read` - Mark alert as read

### Admin
- `GET /api/dashboard/stats` - Dashboard statistics

## 🔄 Offline Capabilities

### Service Worker Features
- **Static asset caching** for offline UI
- **API response caching** for read operations  
- **Background sync** for offline actions
- **Push notifications** for alerts

### Offline Actions
- Scan images (queued for sync)
- Upload compliance documents
- View cached training content
- Read previous data

## 🎨 Design System

### Glassmorphism Theme
- **Backdrop blur effects** with transparency
- **Gradient backgrounds** for visual depth
- **Soft borders** and subtle shadows
- **Mobile-first** responsive design

### Color Palette
- **Primary**: Green (#22C55E) - Growth, health
- **Secondary**: Blue (#3B82F6) - Trust, technology  
- **Warning**: Amber (#F59E0B) - Caution
- **Error**: Red (#EF4444) - Danger
- **Background**: Dark gradients for contrast

## 🧪 Development

### Adding New Features
1. **Frontend**: Create components in `src/components/`
2. **Backend**: Add routes in `backend/server.js`
3. **AI**: Extend models in `ai/ai.py`
4. **Offline**: Update service worker in `public/sw.js`

### Testing
- Manual testing with offline mode
- Test PWA installation
- Verify mobile responsiveness  
- Check accessibility features

## 📦 Production Deployment

### Build Process
```bash
npm run build
```

### Deployment Options
- **Static hosting** (Netlify, Vercel) for frontend
- **VPS or cloud** for backend API
- **Container deployment** with Docker alternative
- **Edge deployment** for global CDN

## 🔒 Security Considerations

- JWT tokens stored securely in localStorage
- File upload validation and sanitization
- CORS protection for API endpoints
- Input validation on all forms
- Rate limiting for API calls

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Check the documentation
- Review example implementations
- Test with demo credentials
- Verify all services are running

## 🚀 Roadmap

### Phase 2 Features
- [ ] Real ML model integration
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Integration APIs
- [ ] Mobile native apps

### Phase 3 Features  
- [ ] IoT sensor integration
- [ ] Weather API integration
- [ ] Automated reporting
- [ ] Advanced user management
- [ ] Cloud synchronization

---

**Built with ❤️ for the farming community**