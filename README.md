# Puzzle Craft Forge

A comprehensive web application for creating and formatting books, puzzles, and other content for Amazon KDP (Kindle Direct Publishing).

## Features

### 🔥 **NEW: KDP Book Formatter & Editor**

Transform your manuscripts into professional, KDP-ready books with our comprehensive book formatting tool.

#### ✨ Key Features:
- **Multi-format File Upload**: Support for .docx, .pdf, and .txt files
- **Intelligent Text Extraction**: Automatically extracts and structures content into chapters
- **Live Preview & Editing**: Click-to-edit any text directly on the page preview
- **AI Text Enhancement**: Improve your content with AI-powered text enhancement
- **Professional Formatting**: KDP-compliant formatting with proper margins, fonts, and spacing
- **PDF Export**: Generate print-ready PDFs that meet Amazon KDP specifications

#### 🚀 How to Use:

1. **Upload Your Manuscript**
   - Drag & drop or browse for your .docx, .pdf, or .txt file
   - The system automatically extracts text and identifies chapters
   - Preview extracted content before proceeding

2. **Configure Book Settings**
   - **Size & Margins**: Choose trim size (6x9, 5x8, 7x10, 8.5x11) and set margins
   - **Typography**: Select fonts, font size, and line spacing
   - **Appearance**: Enable/disable table of contents and page numbers

3. **Preview & Edit**
   - View your book as formatted pages
   - Click on any text element to edit it inline
   - Navigate through pages to review the entire book
   - Make real-time edits with instant preview updates

4. **AI Enhancement** (Optional)
   - Select any chapter for AI-powered text improvement
   - Choose enhancement type:
     - **General Improvement**: Better flow and readability
     - **Simplify Text**: Easier to understand language
     - **Formal Style**: Academic and professional tone
     - **Creative Enhancement**: More descriptive and engaging
     - **Grammar Correction**: Fix grammar and punctuation
   - Preview changes before applying

5. **Export to PDF**
   - Generate KDP-compliant PDF with proper formatting
   - Embedded fonts and high-quality output
   - Ready for upload to Amazon KDP

#### 📋 KDP Compliance Features:
- ✅ Proper margin specifications (minimum 0.25" all sides)
- ✅ Embedded fonts for consistent rendering
- ✅ Correct trim sizes for Amazon KDP
- ✅ Professional typography and spacing
- ✅ Page numbering and table of contents
- ✅ High-quality PDF output under 650MB

### Other Features

- **Puzzle Generators**: Create crosswords, word searches, sudoku, and more
- **AI Coloring Book Generator**: Generate coloring pages with AI
- **Book Cover Designer**: Create professional book covers
- **T-Shirt Designer**: Design custom t-shirts
- **Bulk Content Generation**: Generate multiple puzzles at once

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Radix UI** components
- **React Router** for navigation
- **Zustand** for state management
- **jsPDF** & **html2canvas** for PDF generation
- **mammoth.js** for DOCX processing
- **pdf.js** for PDF text extraction

### Backend
- **Node.js** with Express
- **OpenAI API** for AI text enhancement
- **Multer** for file uploads
- **mammoth** for server-side DOCX processing
- **pdf-parse** for PDF text extraction

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- OpenAI API key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/puzzle-craft-forge.git
   cd puzzle-craft-forge
   ```

2. **Install dependencies**
   ```bash
   # Install client dependencies
   cd client
   npm install
   
   # Install backend dependencies
   cd ../backend
   npm install
   ```

3. **Environment Setup**
   
   Create `.env` file in the backend directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3001
   ```
   
   Create `.env.local` file in the client directory:
   ```env
   VITE_API_URL=http://localhost:3001
   ```

4. **Start the development servers**
   
   Terminal 1 (Backend):
   ```bash
   cd backend
   npm start
   ```
   
   Terminal 2 (Client):
   ```bash
   cd client
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5177
   - Backend API: http://localhost:3001

## Usage

### KDP Book Formatter

1. Navigate to `/dashboard/kdp-formatter`
2. Follow the 5-step wizard:
   - **Step 1**: Upload your manuscript file
   - **Step 2**: Configure book settings
   - **Step 3**: Preview and edit content
   - **Step 4**: Enhance with AI (optional)
   - **Step 5**: Export to PDF

### File Format Support

- **.txt**: Plain text files
- **.docx**: Microsoft Word documents
- **.pdf**: PDF documents (text extraction)

### Supported Book Formats

- **6" x 9"**: Standard paperback (most popular)
- **5" x 8"**: Compact paperback
- **7" x 10"**: Textbook/workbook format
- **8.5" x 11"**: Large format/manual size

## API Endpoints

### KDP Formatter API

- `POST /api/kdp-formatter/extract` - Extract text from uploaded files
- `POST /api/kdp-formatter/enhance-text` - AI text enhancement
- `POST /api/kdp-formatter/format-pdf` - PDF formatting options

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@puzzlecraftforge.com or create an issue on GitHub.

---

**Made with ❤️ for content creators and publishers**
