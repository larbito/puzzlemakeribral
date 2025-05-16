/**
 * Utility to check if Inkscape is installed and available
 */
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

/**
 * Check if Inkscape is installed and get its version
 * @returns {Promise<{installed: boolean, version: string|null, error: Error|null}>}
 */
async function checkInkscape() {
  try {
    // Try to run Inkscape with --version flag
    const { stdout, stderr } = await execPromise('inkscape --version');
    
    // Extract version information
    const version = stdout.trim();
    
    console.log(`Inkscape is installed: ${version}`);
    
    return {
      installed: true,
      version,
      error: null
    };
  } catch (error) {
    console.error('Inkscape check failed:', error.message);
    
    return {
      installed: false,
      version: null,
      error
    };
  }
}

/**
 * Check if the environment has the right Inkscape command format
 * (differs between versions < 1.0 and >= 1.0)
 * @returns {Promise<{modern: boolean, legacy: boolean, error: Error|null}>}
 */
async function checkCommandFormat() {
  const result = {
    modern: false,
    legacy: false,
    error: null
  };
  
  try {
    // Check for Inkscape version first
    const inkscapeCheck = await checkInkscape();
    
    if (!inkscapeCheck.installed) {
      result.error = new Error('Inkscape is not installed');
      return result;
    }
    
    // Check for modern format (Inkscape 1.0+)
    try {
      await execPromise('inkscape --help | grep -q "export-filename"');
      result.modern = true;
    } catch {
      // Modern format not available
    }
    
    // Check for legacy format (Inkscape < 1.0)
    try {
      await execPromise('inkscape --help | grep -q "export-svg"');
      result.legacy = true;
    } catch {
      // Legacy format not available
    }
    
    console.log(`Inkscape command formats - Modern: ${result.modern}, Legacy: ${result.legacy}`);
    
    return result;
  } catch (error) {
    console.error('Error checking Inkscape command format:', error);
    result.error = error;
    return result;
  }
}

module.exports = {
  checkInkscape,
  checkCommandFormat
}; 