import OpenAI from 'openai';

// Initialize OpenAI client with a check for API key
const openai = import.meta.env.VITE_OPENAI_API_KEY 
  ? new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    })
  : null;

export interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export type PuzzleType = 'sudoku' | 'crossword' | 'coloring';

export interface PuzzlePrompt {
  type: PuzzleType;
  difficulty?: string;
  theme?: string;
  size?: string;
  additionalInstructions?: string;
}

export class AIService {
  static async generatePuzzle(prompt: PuzzlePrompt): Promise<AIResponse> {
    if (!openai) {
      return {
        success: false,
        error: 'OpenAI API key not configured. Please add your API key to continue.'
      };
    }

    try {
      const systemPrompt = this.getSystemPrompt(prompt.type);
      const userPrompt = this.constructPrompt(prompt);

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      return {
        success: true,
        data: completion.choices[0].message.content
      };
    } catch (error) {
      console.error('AI Generation Error:', error);
      return {
        success: false,
        error: 'Failed to generate puzzle. Please try again.'
      };
    }
  }

  static async enhancePuzzleBook(bookDetails: any): Promise<AIResponse> {
    if (!openai) {
      return {
        success: false,
        error: 'OpenAI API key not configured. Please add your API key to continue.'
      };
    }

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert puzzle book designer. Help enhance and organize puzzle books with engaging themes, difficulty progression, and educational value."
          },
          {
            role: "user",
            content: `Please enhance this puzzle book concept:
              Title: ${bookDetails.title}
              Theme: ${bookDetails.theme}
              Target Age: ${bookDetails.targetAge}
              Puzzle Types: ${bookDetails.puzzleTypes.join(', ')}
              Please provide:
              1. Suggested organization and flow
              2. Theme-based categories
              3. Difficulty progression
              4. Educational elements
              5. Engagement features`
          }
        ],
        temperature: 0.7,
      });

      return {
        success: true,
        data: completion.choices[0].message.content
      };
    } catch (error) {
      console.error('AI Enhancement Error:', error);
      return {
        success: false,
        error: 'Failed to enhance puzzle book. Please try again.'
      };
    }
  }

  private static getSystemPrompt(puzzleType: PuzzleType): string {
    const prompts: Record<PuzzleType, string> = {
      sudoku: "You are an expert Sudoku puzzle generator. Create valid, engaging Sudoku puzzles that follow standard rules and maintain the requested difficulty level.",
      crossword: "You are an expert crossword puzzle designer. Create engaging crossword puzzles with clever clues and interconnected words based on the given theme.",
      coloring: "You are an expert coloring page designer. Create detailed, engaging coloring pages that match the requested theme and complexity level."
    };

    return prompts[puzzleType];
  }

  private static constructPrompt(prompt: PuzzlePrompt): string {
    const basePrompt = `Generate a ${prompt.type} puzzle with the following specifications:
    - Difficulty: ${prompt.difficulty || 'medium'}
    - Theme: ${prompt.theme || 'general'}
    - Size: ${prompt.size || 'standard'}
    ${prompt.additionalInstructions ? `Additional Instructions: ${prompt.additionalInstructions}` : ''}
    
    Please provide the puzzle in a structured format with:
    1. The puzzle content
    2. Solution
    3. Any additional instructions or notes
    4. Difficulty rating explanation`;

    return basePrompt;
  }

  static async generatePuzzleHints(puzzle: any, type: PuzzleType): Promise<AIResponse> {
    if (!openai) {
      return {
        success: false,
        error: 'OpenAI API key not configured. Please add your API key to continue.'
      };
    }

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert puzzle hint generator. Provide helpful, progressive hints that guide without giving away the solution."
          },
          {
            role: "user",
            content: `Generate three progressive hints for this ${type} puzzle that help solve it without giving away the solution completely.`
          }
        ],
        temperature: 0.7,
      });

      return {
        success: true,
        data: completion.choices[0].message.content
      };
    } catch (error) {
      console.error('Hint Generation Error:', error);
      return {
        success: false,
        error: 'Failed to generate hints. Please try again.'
      };
    }
  }
} 