import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { frontPrompt, context } = await request.json();

    if (!frontPrompt) {
      return NextResponse.json(
        { error: "Front cover prompt is required" },
        { status: 400 }
      );
    }

    const prompt = `Generate a complementary back cover design prompt based on the following front cover description:

Front Cover: ${frontPrompt}

Additional Context: ${context || "Create a harmonious design that complements the front cover"}

Requirements:
- The back cover should maintain visual consistency with the front cover
- The design should be suitable for text overlay
- Avoid including text or typography in the design
- Focus on creating a subtle, complementary background
- Consider the mood and theme of the front cover

Generate a concise prompt that will create a back cover design meeting these requirements.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a professional book cover designer specializing in creating harmonious front and back cover designs.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    const backPrompt = completion.choices[0].message.content;

    return NextResponse.json({ backPrompt });
  } catch (error) {
    console.error("Error generating back cover prompt:", error);
    return NextResponse.json(
      { error: "Failed to generate back cover prompt" },
      { status: 500 }
    );
  }
} 