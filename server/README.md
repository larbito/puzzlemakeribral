# Puzzle Craft Forge Backend

This is the backend service for Puzzle Craft Forge, handling API calls, file operations, authentication, and usage tracking.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Firebase Admin (for auth)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# AWS S3 (for file storage)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region
AWS_BUCKET_NAME=your_bucket_name

# Cloudinary (alternative file storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Ideogram API
IDEOGRAM_API_KEY=your_api_key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

3. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Health Check
- GET `/health` - Check if the server is running

### Authentication
- POST `/api/auth/login` - User login
- POST `/api/auth/register` - User registration
- GET `/api/auth/user` - Get current user

### Ideogram
- POST `/api/ideogram/generate` - Generate images
- GET `/api/ideogram/history` - Get generation history

### Files
- POST `/api/files/upload` - Upload files
- GET `/api/files/download/:id` - Download generated files

## Deployment

This backend is designed to be deployed on Render or Railway. Follow these steps:

1. Create a new web service on Render/Railway
2. Connect your GitHub repository
3. Set the environment variables
4. Deploy!

## Development

- `npm run dev` - Start development server
- `npm start` - Start production server
- `npm test` - Run tests 