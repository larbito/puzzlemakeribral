import { NextResponse } from "next/server";
import sharp from "sharp";
import { createCanvas, loadImage, registerFont } from "canvas";
import path from "path";

// Register fonts
registerFont(path.join(process.cwd(), "public/fonts/helvetica.ttf"), { family: "helvetica" });
registerFont(path.join(process.cwd(), "public/fonts/times.ttf"), { family: "times" });
registerFont(path.join(process.cwd(), "public/fonts/garamond.ttf"), { family: "garamond" });
registerFont(path.join(process.cwd(), "public/fonts/futura.ttf"), { family: "futura" });

interface AssembleRequest {
  frontCoverUrl: string;
  backCoverUrl: string;
  spineText: string;
  spineColor: string;
  spineFont: string;
  dimensions: {
    width: number;
    height: number;
    spine: number;
    dpi: number;
  };
  interiorImages: string[];
}

export async function POST(request: Request) {
  try {
    const {
      frontCoverUrl,
      backCoverUrl,
      spineText,
      spineColor,
      spineFont,
      dimensions,
      interiorImages,
    }: AssembleRequest = await request.json();

    // Validate required fields
    if (!frontCoverUrl || !backCoverUrl || !dimensions) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Load images
    const frontCover = await loadImage(frontCoverUrl);
    const backCover = await loadImage(backCoverUrl);

    // Create canvas for the full wrap
    const canvas = createCanvas(
      dimensions.width * 2 + dimensions.spine,
      dimensions.height
    );
    const ctx = canvas.getContext("2d");

    // Draw back cover
    ctx.drawImage(backCover, 0, 0, dimensions.width, dimensions.height);

    // Draw spine
    ctx.fillStyle = spineColor;
    ctx.fillRect(dimensions.width, 0, dimensions.spine, dimensions.height);

    // Add spine text if spine width is sufficient (minimum 0.25 inches at 300 DPI)
    if (dimensions.spine >= 0.25 * dimensions.dpi) {
      ctx.save();
      ctx.translate(dimensions.width + dimensions.spine / 2, dimensions.height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `bold ${Math.min(dimensions.spine * 0.8, 36)}px ${spineFont}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(spineText, 0, 0);
      ctx.restore();
    }

    // Draw front cover
    ctx.drawImage(
      frontCover,
      dimensions.width + dimensions.spine,
      0,
      dimensions.width,
      dimensions.height
    );

    // Add interior images to back cover if provided
    if (interiorImages.length > 0) {
      const imageSize = dimensions.width / 3;
      const margin = 20;
      const startY = dimensions.height - imageSize - margin;

      for (let i = 0; i < Math.min(interiorImages.length, 4); i++) {
        const image = await loadImage(interiorImages[i]);
        const x = margin + (imageSize + margin) * (i % 2);
        const y = startY - Math.floor(i / 2) * (imageSize + margin);
        ctx.drawImage(image, x, y, imageSize, imageSize);
      }
    }

    // Convert canvas to buffer
    const buffer = canvas.toBuffer("image/png");

    // Optimize the image
    const optimizedBuffer = await sharp(buffer)
      .png({ quality: 90 })
      .toBuffer();

    // Convert buffer to base64
    const base64Image = `data:image/png;base64,${optimizedBuffer.toString("base64")}`;

    return NextResponse.json({ url: base64Image });
  } catch (error) {
    console.error("Error assembling full wrap:", error);
    return NextResponse.json(
      { error: "Failed to assemble full wrap cover" },
      { status: 500 }
    );
  }
} 