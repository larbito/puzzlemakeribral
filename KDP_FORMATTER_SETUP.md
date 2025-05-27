# KDP Book Formatter - Quick Setup Guide

## 🚀 Quick Start (5 minutes)

### 1. Start the Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

### 2. Access the Application
- Open your browser to: http://localhost:5178 (or the port shown in terminal)
- Navigate to: **Dashboard → KDP Book Formatter**

### 3. Test with Sample Content
- Use the included `test-book.txt` file to test the formatter
- Or upload your own .docx, .pdf, or .txt file

## ✨ Features Available

### ✅ **Working Features (No Setup Required):**
- ✅ File upload (.docx, .pdf, .txt)
- ✅ Text extraction and chapter detection
- ✅ Book settings configuration
- ✅ Live preview with click-to-edit
- ✅ PDF export (KDP-ready)

### 🔧 **AI Enhancement (Requires OpenAI API Key):**
- Text improvement with GPT-4
- Grammar correction
- Style enhancement
- Creative rewriting

## 🔑 Enable AI Features (Optional)

### 1. Get OpenAI API Key
- Visit: https://platform.openai.com/api-keys
- Create a new API key
- Copy the key (starts with `sk-`)

### 2. Configure Backend
Create `backend/.env` file:
```env
PORT=3001
OPENAI_API_KEY=your_api_key_here
FRONTEND_URL=http://localhost:5178
```

### 3. Restart Backend
```bash
cd backend
npm start
```

## 📖 How to Use

### Step 1: Upload Manuscript
- Drag & drop your file or click "Browse Files"
- Supported formats: .docx, .pdf, .txt
- System automatically extracts and structures content

### Step 2: Configure Book Settings
- **Size & Margins**: Choose trim size (6x9 recommended)
- **Typography**: Select font, size, and spacing
- **Appearance**: Enable/disable TOC and page numbers

### Step 3: Preview & Edit
- View your book as formatted pages
- Click any text to edit inline
- Navigate through pages
- Make real-time edits

### Step 4: AI Enhancement (Optional)
- Select a chapter
- Choose enhancement type
- Preview changes
- Apply if satisfied

### Step 5: Export PDF
- Generate KDP-compliant PDF
- Download ready-to-upload file

## 🎯 KDP Compliance

The formatter automatically ensures:
- ✅ Proper margins (minimum 0.25" all sides)
- ✅ Standard trim sizes
- ✅ Embedded fonts
- ✅ Professional typography
- ✅ Page numbering
- ✅ Table of contents

## 🐛 Troubleshooting

### Backend Won't Start
- Check if port 3001 is available
- Install dependencies: `cd backend && npm install`

### Frontend Won't Start
- Check if port 5178 is available
- Install dependencies: `cd client && npm install`

### File Upload Issues
- Ensure file is under 50MB
- Use supported formats: .docx, .pdf, .txt

### AI Enhancement Not Working
- Check if OpenAI API key is configured
- Verify API key has credits
- Check console for error messages

## 📁 Sample Files

Use `test-book.txt` to test the formatter:
- Contains properly formatted chapters
- Demonstrates chapter detection
- Good for testing all features

## 🎉 You're Ready!

The KDP Book Formatter is now ready to transform your manuscripts into professional, KDP-ready books!

---

**Need help?** Check the main README.md or create an issue on GitHub. 