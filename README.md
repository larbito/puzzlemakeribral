# Puzzle Craft Forge

A modern web application for creating and managing puzzle books, with a focus on Sudoku puzzles and AI-powered features.

## Project Structure

The project is organized into two main parts:

- `client/`: React frontend built with TypeScript, Vite, and Tailwind CSS
- `server/`: Node.js backend built with Express

## Prerequisites

- Node.js 18 or later
- npm 8 or later
- Git

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/puzzle-craft-forge.git
cd puzzle-craft-forge
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in both `client/` and `server/` directories
   - Fill in the required environment variables

4. Start development servers:
```bash
npm run dev
```

This will start both the client (port 5173) and server (port 3000) in development mode.

## Building for Production

```bash
npm run build
```

This will:
1. Build the client into static files
2. Prepare the server for production

## Deployment

The application is configured for deployment on Railway.

### Railway Deployment Steps

1. Create a new project on Railway
2. Connect your GitHub repository
3. Add the required environment variables in Railway's dashboard
4. Deploy!

Railway will automatically:
1. Build the client using the client Dockerfile
2. Build the server using the server Dockerfile
3. Set up the necessary infrastructure

### Environment Variables

#### Server Environment Variables
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (production/development)
- `FRONTEND_URL`: URL of the frontend application
- `FIREBASE_*`: Firebase configuration
- `AWS_*`: AWS configuration (if using S3)
- `CLOUDINARY_*`: Cloudinary configuration
- `IDEOGRAM_API_KEY`: Ideogram API key
- `RATE_LIMIT_*`: Rate limiting configuration

#### Client Environment Variables
- `VITE_API_URL`: Backend API URL
- `VITE_FIREBASE_*`: Firebase configuration for client

## Features

- User authentication with Firebase
- Sudoku puzzle generation and customization
- AI-powered image generation
- PDF export functionality
- Real-time updates
- Responsive design
- Modern UI with Tailwind CSS

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/my-new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
