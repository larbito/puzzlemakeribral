import { NextResponse } from "next/server";
import { getPaletteFromURL } from "color-thief-node";

type RGBColor = [number, number, number];

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    // Extract color palette
    const palette = await getPaletteFromURL(imageUrl, 5); // Get 5 dominant colors

    // Convert RGB arrays to hex colors
    const colors = palette.map((rgb: RGBColor) => {
      const [r, g, b] = rgb;
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    });

    return NextResponse.json({ colors });
  } catch (error) {
    console.error("Error extracting colors:", error);
    return NextResponse.json(
      { error: "Failed to extract colors from image" },
      { status: 500 }
    );
  }
} 