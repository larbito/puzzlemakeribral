import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { PageLayout } from '@/components/layout/PageLayout';
import { motion, AnimatePresence } from "framer-motion";
import styled from 'styled-components';

// Import our utility functions and API
import {
  trimSizeOptions,
  paperTypeOptions,
  bindingTypeOptions,
  aiStylePresets,
  calculateCoverDimensions,
  extractColorPalette,
  enhancePrompt,
  type CoverDimensions
} from "@/lib/futuristicCoverUtils";

import {
  generateCoverImage,
  generateFullCover,
  downloadImage,
  getProxiedImageUrl,
  loadImage,
  getCoverTextSuggestions,
  addTextToImage,
  type GenerateCoverParams,
  type FullCoverParams
} from "@/lib/futuristicApi";

// Add icons
import { 
  BookOpen, 
  Sparkles, 
  Download, 
  Palette, 
  RefreshCw, 
  Layers, 
  Image, 
  Type, 
  Settings,
  ChevronRight,
  ChevronDown,
  Crop,
  Zap,
  RotateCw
} from "lucide-react";

// Styled components
const FuturisticContainer = styled.div`
  background-color: #0a0a1a;
  border-radius: 16px;
  padding: 2rem;
  color: #e0e0ff;
  box-shadow: 0 0 30px rgba(80, 100, 255, 0.2);
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(to right, transparent, rgba(0, 255, 255, 0.5), transparent);
    animation: scanline 3s linear infinite;
  }
  
  @keyframes scanline {
    0% {
      top: 0%;
    }
    100% {
      top: 100%;
    }
  }
`;

const NeonBanner = styled.div`
  background: rgba(0, 10, 40, 0.7);
  border: 1px solid rgba(0, 200, 255, 0.3);
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: #a0e0ff;
  font-weight: 500;
  position: relative;
  overflow: hidden;
  margin-bottom: 2rem;
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(0, 200, 255, 0.1), transparent);
    transform: translateX(-100%);
    animation: shimmer 3s infinite;
  }
  
  @keyframes shimmer {
    100% {
      transform: translateX(100%);
    }
  }
`;

const VersionTag = styled.span`
  background: rgba(0, 150, 255, 0.3);
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: bold;
  letter-spacing: 0.05em;
`;

const GradientText = styled.h1`
  font-size: 2rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(to right, #50f, #0ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const NeonBorder = styled(motion.div)`
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 1.5rem;
  background: linear-gradient(#0a0a1a, #0a0a1a) padding-box,
              linear-gradient(to right, #50f, #0ff) border-box;
  box-shadow: 0 0 15px rgba(80, 0, 255, 0.5);
  
  @keyframes borderGlow {
    0%, 100% {
      box-shadow: 0 0 15px rgba(80, 0, 255, 0.5);
    }
    50% {
      box-shadow: 0 0 25px rgba(0, 255, 255, 0.7);
    }
  }
  
  animation: borderGlow 4s ease infinite;
`;

const FuturisticBookCoverGenerator = () => {
  // State management will go here
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [activePanel, setActivePanel] = useState("design");

  return (
    <PageLayout
      title="Futuristic Book Cover Creator"
      description="Next-gen AI book cover generator with advanced customization"
    >
      {/* Feature announcement banner */}
      <NeonBanner>
        <Sparkles className="h-5 w-5 text-cyan-300" />
        <span>New futuristic UI with advanced AI features</span>
        <VersionTag>BETA</VersionTag>
      </NeonBanner>
      
      <FuturisticContainer>
        <div className="futuristic-header">
          <NeonBorder
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GradientText>
              <BookOpen className="inline-block mr-2 h-8 w-8" />
              Futuristic Book Cover Designer
            </GradientText>
          </NeonBorder>
          
          <p className="text-center mt-2 text-blue-200 text-opacity-80">
            Design professional book covers with advanced AI technology
          </p>
        </div>
        
        {/* Main content area with holographic effect */}
        <motion.div 
          className="holographic-container mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {/* Control panel navigation */}
          <div className="control-nav">
            <button 
              className={`nav-button ${activePanel === "design" ? "active" : ""}`}
              onClick={() => setActivePanel("design")}
            >
              <Palette className="h-4 w-4 mr-2" />
              Design
            </button>
            <button 
              className={`nav-button ${activePanel === "settings" ? "active" : ""}`}
              onClick={() => setActivePanel("settings")}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </button>
            <button 
              className={`nav-button ${activePanel === "text" ? "active" : ""}`}
              onClick={() => setActivePanel("text")}
            >
              <Type className="h-4 w-4 mr-2" />
              Text
            </button>
            <button 
              className={`nav-button ${activePanel === "export" ? "active" : ""}`}
              onClick={() => setActivePanel("export")}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
          
          {/* Main content */}
          <div className="holographic-content">
            <div className="panel-area">
              {/* Active panel content here */}
              <AnimatePresence mode="wait">
                {activePanel === "design" && (
                  <motion.div 
                    key="design"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="panel-content"
                  >
                    <h3 className="panel-title">
                      <Palette className="h-5 w-5 mr-2" />
                      Design Your Cover
                    </h3>
                    
                    <div className="panel-section">
                      <label className="futuristic-label">
                        <span className="label-text">Cover Concept</span>
                        <textarea 
                          className="futuristic-input"
                          placeholder="Describe your book cover concept..."
                          rows={4}
                        />
                      </label>
                      
                      <label className="futuristic-label mt-4">
                        <span className="label-text">Style</span>
                        <select className="futuristic-select">
                          {aiStylePresets.map(style => (
                            <option key={style.value} value={style.value}>
                              {style.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      
                      <div className="mt-6">
                        <button className="futuristic-button primary">
                          <Sparkles className="h-5 w-5 mr-2" />
                          Generate Cover
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {activePanel === "settings" && (
                  <motion.div 
                    key="settings"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="panel-content"
                  >
                    <h3 className="panel-title">
                      <Settings className="h-5 w-5 mr-2" />
                      Book Specifications
                    </h3>
                    
                    <div className="panel-section">
                      <label className="futuristic-label">
                        <span className="label-text">Trim Size</span>
                        <select className="futuristic-select">
                          {trimSizeOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      
                      <label className="futuristic-label mt-4">
                        <span className="label-text">Paper Type</span>
                        <select className="futuristic-select">
                          {paperTypeOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      
                      <label className="futuristic-label mt-4">
                        <span className="label-text">Binding Type</span>
                        <select className="futuristic-select">
                          {bindingTypeOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      
                      <label className="futuristic-label mt-4">
                        <span className="label-text">Page Count</span>
                        <input 
                          type="number" 
                          className="futuristic-input"
                          min="24"
                          max="800"
                          defaultValue="120"
                        />
                      </label>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Preview area */}
            <div className="preview-area">
              <div className="preview-header">
                <h3>Preview</h3>
                <div className="preview-controls">
                  <button className="preview-button">
                    <Layers className="h-4 w-4" />
                  </button>
                  <button className="preview-button">
                    <Crop className="h-4 w-4" />
                  </button>
                  <button className="preview-button">
                    <RotateCw className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="preview-display">
                {loading ? (
                  <div className="loading-indicator">
                    <div className="spinner"></div>
                    <span>Generating your book cover...</span>
                  </div>
                ) : (
                  <div className="empty-preview">
                    <Image className="h-12 w-12 text-blue-500/30" />
                    <span>Your book cover will appear here</span>
                    <span className="hint">Start by describing your concept in the Design panel</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Action button bar */}
        <div className="action-bar">
          <div className="step-indicator">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>
              <span>1</span>
              <div className="step-label">Design</div>
            </div>
            <div className="step-line"></div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>
              <span>2</span>
              <div className="step-label">Customize</div>
            </div>
            <div className="step-line"></div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>
              <span>3</span>
              <div className="step-label">Export</div>
            </div>
          </div>
          
          <div className="action-buttons">
            <button className="futuristic-button secondary">
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate
            </button>
            <button className="futuristic-button primary">
              <ChevronRight className="h-5 w-5 mr-1" />
              Next Step
            </button>
          </div>
        </div>
      </FuturisticContainer>
      
      <style>{`
        .holographic-container {
          background: rgba(20, 30, 60, 0.3);
          border-radius: 12px;
          border: 1px solid rgba(100, 200, 255, 0.2);
          overflow: hidden;
          position: relative;
        }
        
        .holographic-container::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% 0%, rgba(100, 200, 255, 0.15), transparent 60%);
          pointer-events: none;
        }
        
        .control-nav {
          display: flex;
          border-bottom: 1px solid rgba(100, 200, 255, 0.2);
          padding: 0.5rem 1rem;
          gap: 0.5rem;
        }
        
        .nav-button {
          background: transparent;
          color: rgba(200, 220, 255, 0.7);
          padding: 0.5rem 1rem;
          border-radius: 6px;
          border: none;
          font-size: 0.9rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        
        .nav-button:hover {
          background: rgba(100, 150, 255, 0.1);
          color: rgba(200, 220, 255, 0.9);
        }
        
        .nav-button.active {
          background: rgba(100, 150, 255, 0.2);
          color: #fff;
          box-shadow: 0 0 10px rgba(100, 150, 255, 0.3);
        }
        
        .holographic-content {
          display: flex;
          min-height: 500px;
        }
        
        .panel-area {
          width: 40%;
          border-right: 1px solid rgba(100, 200, 255, 0.2);
          padding: 1.5rem;
          overflow-y: auto;
        }
        
        .panel-title {
          font-size: 1.2rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          color: #fff;
          display: flex;
          align-items: center;
        }
        
        .panel-section {
          padding: 1rem 0;
        }
        
        .futuristic-label {
          display: block;
          margin-bottom: 0.5rem;
        }
        
        .label-text {
          display: block;
          font-size: 0.9rem;
          color: rgba(200, 220, 255, 0.8);
          margin-bottom: 0.5rem;
        }
        
        .futuristic-input,
        .futuristic-select {
          width: 100%;
          background: rgba(30, 40, 70, 0.5);
          border: 1px solid rgba(100, 150, 255, 0.3);
          border-radius: 6px;
          padding: 0.75rem;
          color: #fff;
          font-size: 0.95rem;
          transition: all 0.2s ease;
          outline: none;
        }
        
        .futuristic-input:focus,
        .futuristic-select:focus {
          border-color: rgba(0, 200, 255, 0.6);
          box-shadow: 0 0 0 2px rgba(0, 200, 255, 0.2);
        }
        
        .futuristic-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='rgba(100, 150, 255, 0.8)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'%3E%3C/path%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          background-size: 16px;
          padding-right: 2.5rem;
        }
        
        .preview-area {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        
        .preview-header {
          padding: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(100, 200, 255, 0.2);
        }
        
        .preview-header h3 {
          font-size: 1.1rem;
          font-weight: 500;
          color: rgba(200, 220, 255, 0.9);
        }
        
        .preview-controls {
          display: flex;
          gap: 0.5rem;
        }
        
        .preview-button {
          background: rgba(30, 40, 70, 0.5);
          border: 1px solid rgba(100, 150, 255, 0.3);
          border-radius: 4px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(200, 220, 255, 0.8);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .preview-button:hover {
          background: rgba(40, 60, 100, 0.5);
          color: #fff;
          border-color: rgba(100, 150, 255, 0.5);
        }
        
        .preview-display {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          position: relative;
          background: repeating-linear-gradient(
            45deg,
            rgba(10, 20, 40, 0.3),
            rgba(10, 20, 40, 0.3) 10px,
            rgba(20, 30, 50, 0.3) 10px,
            rgba(20, 30, 50, 0.3) 20px
          );
        }
        
        .empty-preview {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          text-align: center;
          color: rgba(200, 220, 255, 0.6);
        }
        
        .empty-preview span {
          font-size: 1.1rem;
        }
        
        .empty-preview .hint {
          font-size: 0.9rem;
          opacity: 0.7;
        }
        
        .loading-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          color: rgba(200, 220, 255, 0.8);
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(100, 150, 255, 0.3);
          border-radius: 50%;
          border-top-color: rgba(0, 200, 255, 0.8);
          animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .action-bar {
          margin-top: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .step-indicator {
          display: flex;
          align-items: center;
        }
        
        .step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        
        .step span {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(30, 40, 70, 0.5);
          border: 1px solid rgba(100, 150, 255, 0.3);
          color: rgba(200, 220, 255, 0.7);
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }
        
        .step.active span {
          background: rgba(0, 100, 255, 0.3);
          border-color: rgba(0, 200, 255, 0.6);
          color: #fff;
          box-shadow: 0 0 10px rgba(0, 150, 255, 0.4);
        }
        
        .step-line {
          width: 60px;
          height: 1px;
          background: rgba(100, 150, 255, 0.3);
          margin: 0 0.5rem;
        }
        
        .step-label {
          font-size: 0.8rem;
          color: rgba(200, 220, 255, 0.7);
        }
        
        .action-buttons {
          display: flex;
          gap: 1rem;
        }
        
        .futuristic-button {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 500;
          transition: all 0.2s ease;
          border: none;
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }
        
        .futuristic-button::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            to bottom right,
            rgba(255, 255, 255, 0),
            rgba(255, 255, 255, 0.1),
            rgba(255, 255, 255, 0)
          );
          transform: rotate(45deg);
          z-index: 1;
          transition: all 0.3s ease;
          pointer-events: none;
        }
        
        .futuristic-button:hover::before {
          transform: rotate(45deg) translate(50%, 50%);
        }
        
        .futuristic-button.primary {
          background: linear-gradient(to right, #4040ff, #00a0ff);
          color: #fff;
          box-shadow: 0 0 15px rgba(0, 150, 255, 0.3);
        }
        
        .futuristic-button.primary:hover {
          background: linear-gradient(to right, #5050ff, #00b0ff);
          box-shadow: 0 0 20px rgba(0, 150, 255, 0.5);
        }
        
        .futuristic-button.secondary {
          background: rgba(30, 40, 70, 0.5);
          border: 1px solid rgba(100, 150, 255, 0.3);
          color: rgba(200, 220, 255, 0.9);
        }
        
        .futuristic-button.secondary:hover {
          background: rgba(40, 60, 100, 0.5);
          border-color: rgba(100, 150, 255, 0.5);
        }
      `}</style>
    </PageLayout>
  );
};

export default FuturisticBookCoverGenerator; 