# Puzzle Craft Forge

A powerful puzzle creation tool that uses AI to generate and manipulate images.

## Project Structure

The project is split into two main parts:
- Frontend: React/Vite application deployed on Vercel
- Backend: Node.js/Express API deployed on Render/Railway

## Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with the following variables:
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Backend API URL
VITE_API_URL=http://localhost:3000

# Optional: Analytics
VITE_GA_MEASUREMENT_ID=your_ga_id
```

3. Start the development server:
```bash
npm run dev
```

## Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following variables:
```env
# Server Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Firebase Admin
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

4. Start the development server:
```bash
npm run dev
```

## Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy!

### Backend (Render/Railway)

1. Connect your GitHub repository to Render/Railway
2. Configure environment variables in the dashboard
3. Deploy!

## Features

- Image generation using Ideogram AI
- File upload and download
- Authentication and authorization
- Usage tracking
- Cloud storage integration (AWS S3/Cloudinary)

## Tech Stack

### Frontend
- React
- Vite
- TypeScript
- Tailwind CSS
- Firebase Auth
- React Query
- Zustand

### Backend
- Node.js
- Express
- Firebase Admin
- AWS SDK
- Cloudinary
- Rate limiting
- Security middleware

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
