# Puzzle Craft Forge Frontend

This is the frontend application for Puzzle Craft Forge, built with React, TypeScript, and Vite.

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
VITE_API_URL=https://your-backend-url.railway.app
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

## Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Deployment

This frontend is designed to be deployed on Railway. The deployment process is automated through the Dockerfile and railway.toml configuration.

### Railway Deployment Steps

1. Make sure you have the Railway CLI installed
2. Login to Railway: `railway login`
3. Link your project: `railway link`
4. Deploy: `railway up`

The application will be built using the multi-stage Dockerfile, which:
1. Builds the application with optimizations
2. Serves it through Nginx with proper caching and security headers

## Features

- Modern React with TypeScript
- Vite for fast development and building
- Firebase Authentication
- Real-time updates
- Responsive design
- Drag and drop functionality
- Image generation and manipulation
- File management

## Project Structure

```
src/
├── components/     # Reusable UI components
├── hooks/         # Custom React hooks
├── pages/         # Page components
├── services/      # API and external service integrations
├── store/         # State management
├── styles/        # Global styles and themes
├── types/         # TypeScript type definitions
└── utils/         # Utility functions
```

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/my-new-feature`
5. Submit a pull request 