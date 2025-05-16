import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { promisify } from 'util';
import { removeBackground, enhanceImage } from './replicate';

// Promisify exec for cleaner async/await syntax
const execPromise = promisify(exec);

/**
 * Process an image through Inkscape to convert it to SVG
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Starting vectorization process');
    
    // Parse the form data from the incoming request
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const removeBackgroundOption = formData.get('removeBackground') === 'true';
    const enhanceImageOption = formData.get('enhanceImage') === 'true';
    
    // Validate the uploaded file
    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }
    
    // Check file size (limit to 10MB)
    if (imageFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image file too large (max 10MB)' },
        { status: 400 }
      );
    }
    
    // Create a unique working directory in the system temp folder
    const workDir = path.join(os.tmpdir(), `vectorize-${uuidv4()}`);
    await fs.promises.mkdir(workDir, { recursive: true });
    
    // Input and output file paths
    const inputPath = path.join(workDir, 'input.png');
    let processedPath = inputPath; // Track the current processed file path
    const outputPath = path.join(workDir, 'output.svg');
    
    console.log(`Working directory: ${workDir}`);
    console.log(`Input path: ${inputPath}`);
    console.log(`Output path: ${outputPath}`);
    
    // Write the uploaded image to the input file
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    await fs.promises.writeFile(inputPath, buffer);
    
    // Background removal if requested
    if (removeBackgroundOption) {
      try {
        console.log('Removing background with Replicate API...');
        const nobgPath = path.join(workDir, 'nobg.png');
        
        // Use our Replicate helper function
        const success = await removeBackground(inputPath, nobgPath);
        
        if (success) {
          processedPath = nobgPath;
          console.log('Background removal completed successfully');
        } else {
          console.error('Background removal failed, using original image');
        }
      } catch (error) {
        console.error('Background removal failed:', error);
        // Continue with original image if background removal fails
      }
    }
    
    // Image enhancement if requested
    if (enhanceImageOption) {
      try {
        console.log('Enhancing image quality with Replicate API...');
        const enhancedPath = path.join(workDir, 'enhanced.png');
        
        // Use our Replicate helper function
        const success = await enhanceImage(processedPath, enhancedPath);
        
        if (success) {
          processedPath = enhancedPath;
          console.log('Image enhancement completed successfully');
        } else {
          console.error('Image enhancement failed, using current processed image');
        }
      } catch (error) {
        console.error('Image enhancement failed:', error);
        // Continue with the current processed image if enhancement fails
      }
    }
    
    // Execute Inkscape CLI to convert the image to SVG
    try {
      console.log('Running Inkscape for vectorization...');
      
      // Verify Inkscape is installed and get version
      try {
        const { stdout } = await execPromise('inkscape --version');
        console.log(`Inkscape version: ${stdout.trim()}`);
      } catch (error) {
        console.error('Error checking Inkscape installation:', error);
        return NextResponse.json(
          { error: 'Inkscape is not installed or not in PATH' },
          { status: 500 }
        );
      }
      
      // Command to run Inkscape CLI for vectorization
      // Note: Command format may vary by Inkscape version
      
      // Try modern Inkscape 1.0+ command format
      const inkscapeCommand = `inkscape --export-filename="${outputPath}" --export-type=svg --export-plain-svg "${processedPath}"`;
      
      console.log(`Executing command: ${inkscapeCommand}`);
      const { stdout, stderr } = await execPromise(inkscapeCommand);
      
      console.log('Inkscape stdout:', stdout);
      if (stderr) console.error('Inkscape stderr:', stderr);
      
      // Check if the output file was created
      const fileExists = fs.existsSync(outputPath);
      console.log(`Output file exists: ${fileExists}`);
      
      if (!fileExists) {
        throw new Error('Inkscape did not generate an output file');
      }
      
      // Read the generated SVG
      const svgContent = await fs.promises.readFile(outputPath, 'utf8');
      
      // Return the SVG directly in the response
      // In a production environment, you might want to store this in a cloud storage service
      return NextResponse.json({
        success: true,
        svgUrl: `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`
      });
    } catch (error) {
      console.error('Inkscape vectorization failed:', error);
      
      // Try legacy Inkscape command format if the modern format failed
      try {
        console.log('Trying legacy Inkscape command format...');
        const legacyCommand = `inkscape -f "${processedPath}" -l "${outputPath}" --export-plain-svg`;
        
        console.log(`Executing legacy command: ${legacyCommand}`);
        const { stdout, stderr } = await execPromise(legacyCommand);
        
        console.log('Legacy Inkscape stdout:', stdout);
        if (stderr) console.error('Legacy Inkscape stderr:', stderr);
        
        // Check if the output file was created
        const fileExists = fs.existsSync(outputPath);
        console.log(`Legacy output file exists: ${fileExists}`);
        
        if (!fileExists) {
          throw new Error('Legacy Inkscape command did not generate an output file');
        }
        
        // Read the generated SVG
        const svgContent = await fs.promises.readFile(outputPath, 'utf8');
        
        // Return the SVG directly in the response
        return NextResponse.json({
          success: true,
          svgUrl: `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`
        });
      } catch (legacyError) {
        console.error('Legacy Inkscape command also failed:', legacyError);
        return NextResponse.json(
          { error: `Vectorization failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
          { status: 500 }
        );
      }
    } finally {
      // Clean up the temporary directory
      try {
        await fs.promises.rm(workDir, { recursive: true, force: true });
        console.log(`Cleaned up working directory: ${workDir}`);
      } catch (cleanupError) {
        console.error('Error cleaning up working directory:', cleanupError);
      }
    }
  } catch (error) {
    console.error('Error in vectorization process:', error);
    return NextResponse.json(
      { error: `Vectorization process failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 