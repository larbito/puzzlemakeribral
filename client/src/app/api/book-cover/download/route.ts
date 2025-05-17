import { NextResponse } from "next/server";
import sharp from "sharp";
import PDFDocument from "pdfkit";

interface DownloadRequest {
  url: string;
  filename: string;
  format: "pdf" | "png";
}

export async function POST(request: Request) {
  try {
    const { url, filename, format }: DownloadRequest = await request.json();

    if (!url || !filename || !format) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Convert data URL to buffer
    const base64Data = url.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    if (format === "png") {
      // For PNG, just optimize the image
      const optimizedBuffer = await sharp(imageBuffer)
        .png({ quality: 90 })
        .toBuffer();

      return new NextResponse(optimizedBuffer, {
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `attachment; filename="${filename}.png"`,
        },
      });
    } else {
      // For PDF, create a new PDF document
      const doc = new PDFDocument({
        autoFirstPage: false,
      });

      // Get image dimensions
      const metadata = await sharp(imageBuffer).metadata();
      const { width = 0, height = 0 } = metadata;

      // Add a page with the image dimensions
      doc.addPage({
        size: [width, height],
        margin: 0,
      });

      // Add the image
      doc.image(imageBuffer, 0, 0, {
        width,
        height,
      });

      // Convert to buffer
      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));

      const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);
        doc.end();
      });

      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        },
      });
    }
  } catch (error) {
    console.error("Error downloading cover:", error);
    return NextResponse.json(
      { error: "Failed to download cover" },
      { status: 500 }
    );
  }
} 