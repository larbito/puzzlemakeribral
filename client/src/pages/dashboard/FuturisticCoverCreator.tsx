import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { PageLayout } from '@/components/layout/PageLayout';
import { motion, AnimatePresence } from "framer-motion";

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

// CSS classes for the component
import './FuturisticCoverCreator.css';

const FuturisticCoverCreator = () => {
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
      <div className="neon-banner">
        <Sparkles className="h-5 w-5 text-cyan-300" />
        <span>New futuristic UI with advanced AI features</span>
        <span className="version-tag">BETA</span>
      </div>
      
      <div className="futuristic-container">
        <div className="futuristic-header">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="neon-border"
          >
            <h1 className="gradient-text">
              <BookOpen className="inline-block mr-2 h-8 w-8" />
              Futuristic Book Cover Designer
            </h1>
          </motion.div>
          
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
      </div>
    </PageLayout>
  );
};

export default FuturisticCoverCreator; 