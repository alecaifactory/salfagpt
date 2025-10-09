import { GoogleGenerativeAI } from '@google/genai';
import type { MessageContent, ContextSection } from './firestore';

// Initialize Gemini AI client
const API_KEY = import.meta.env.ANTHROPIC_API_KEY_CAP001_CURSOR || import.meta.env.GOOGLE_AI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// Model configuration
const MODEL_NAME = 'gemini-2.5-pro-latest';
const CONTEXT_WINDOW = 1000000; // 1M tokens

export interface GenerateOptions {
  systemInstruction?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  userContext?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GenerateResponse {
  content: MessageContent;
  tokenCount: number;
  contextSections: ContextSection[];
}

// Token counting helper (approximate)
function estimateTokenCount(text: string): number {
  // Rough estimate: ~4 characters per token
  return Math.ceil(text.length / 4);
}

// Generate AI response with Gemini 2.5-pro
export async function generateAIResponse(
  userMessage: string,
  options: GenerateOptions = {}
): Promise<GenerateResponse> {
  const {
    systemInstruction = 'You are a helpful AI assistant.',
    conversationHistory = [],
    userContext = '',
    temperature = 0.7,
    maxTokens = 8192,
  } = options;

  try {
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction,
    });

    // Build the conversation context
    const contextParts: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    // Add conversation history
    conversationHistory.forEach(msg => {
      contextParts.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    });

    // Add user context if provided
    let fullUserMessage = userMessage;
    if (userContext) {
      fullUserMessage = `Context:\n${userContext}\n\nUser Message:\n${userMessage}`;
    }

    // Add current user message
    contextParts.push({
      role: 'user',
      parts: [{ text: fullUserMessage }],
    });

    // Generate response
    const chat = model.startChat({
      history: contextParts.slice(0, -1), // All but the last message
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    });

    const result = await chat.sendMessage(fullUserMessage);
    const response = result.response;
    const responseText = response.text();

    // Parse response for different content types
    const content = parseResponseContent(responseText);
    
    // Calculate token counts
    const systemTokens = estimateTokenCount(systemInstruction);
    const historyTokens = conversationHistory.reduce(
      (sum, msg) => sum + estimateTokenCount(msg.content),
      0
    );
    const contextTokens = estimateTokenCount(userContext);
    const userTokens = estimateTokenCount(userMessage);
    const responseTokens = estimateTokenCount(responseText);

    // Build context sections for display
    const contextSections: ContextSection[] = [
      {
        name: 'System Instructions',
        tokenCount: systemTokens,
        content: systemInstruction,
        collapsed: true,
      },
      {
        name: 'Conversation History',
        tokenCount: historyTokens,
        content: `${conversationHistory.length} messages`,
        collapsed: false,
      },
      {
        name: 'User Context',
        tokenCount: contextTokens,
        content: userContext || 'No additional context',
        collapsed: true,
      },
      {
        name: 'Current User Message',
        tokenCount: userTokens,
        content: userMessage,
        collapsed: true,
      },
      {
        name: 'Model Response',
        tokenCount: responseTokens,
        content: responseText,
        collapsed: true,
      },
    ];

    return {
      content,
      tokenCount: responseTokens,
      contextSections,
    };
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw new Error(`Failed to generate AI response: ${error.message}`);
  }
}

// Parse response content to detect different types (text, code, etc.)
function parseResponseContent(responseText: string): MessageContent {
  // Check for code blocks
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const codeMatches = Array.from(responseText.matchAll(codeBlockRegex));

  if (codeMatches.length > 0) {
    // Contains code - create mixed content
    const parts: Array<{ type: string; content: string | object }> = [];
    let lastIndex = 0;

    codeMatches.forEach(match => {
      const [fullMatch, language, code] = match;
      const matchIndex = match.index!;

      // Add text before code block
      if (matchIndex > lastIndex) {
        const textBefore = responseText.slice(lastIndex, matchIndex).trim();
        if (textBefore) {
          parts.push({ type: 'text', content: textBefore });
        }
      }

      // Add code block
      parts.push({
        type: 'code',
        content: {
          language: language || 'plaintext',
          code: code.trim(),
        },
      });

      lastIndex = matchIndex + fullMatch.length;
    });

    // Add remaining text after last code block
    if (lastIndex < responseText.length) {
      const textAfter = responseText.slice(lastIndex).trim();
      if (textAfter) {
        parts.push({ type: 'text', content: textAfter });
      }
    }

    return {
      type: 'mixed',
      parts,
    };
  }

  // Plain text response
  return {
    type: 'text',
    text: responseText,
  };
}

// Stream AI response (for real-time streaming)
export async function* streamAIResponse(
  userMessage: string,
  options: GenerateOptions = {}
): AsyncGenerator<string, void, unknown> {
  const {
    systemInstruction = 'You are a helpful AI assistant.',
    conversationHistory = [],
    userContext = '',
    temperature = 0.7,
    maxTokens = 8192,
  } = options;

  try {
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction,
    });

    // Build the conversation context
    const contextParts: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    // Add conversation history
    conversationHistory.forEach(msg => {
      contextParts.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    });

    // Add user context if provided
    let fullUserMessage = userMessage;
    if (userContext) {
      fullUserMessage = `Context:\n${userContext}\n\nUser Message:\n${userMessage}`;
    }

    // Generate streaming response
    const chat = model.startChat({
      history: contextParts,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    });

    const result = await chat.sendMessageStream(fullUserMessage);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      yield chunkText;
    }
  } catch (error) {
    console.error('Error streaming AI response:', error);
    throw new Error(`Failed to stream AI response: ${error.message}`);
  }
}

// Generate title for conversation based on first message
export async function generateConversationTitle(firstMessage: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: 'Generate a short, descriptive title (3-6 words) for a conversation based on the first message. Only return the title, nothing else.',
    });

    const result = await model.generateContent(firstMessage);
    const title = result.response.text().trim().replace(/^["']|["']$/g, '');
    
    return title.length > 60 ? title.slice(0, 60) + '...' : title;
  } catch (error) {
    console.error('Error generating title:', error);
    return 'New Conversation';
  }
}

// Analyze image using Gemini's multimodal capabilities
export async function analyzeImage(
  imageData: string, // Base64 or URL
  prompt: string = 'Describe this image in detail.'
): Promise<MessageContent> {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const imagePart = {
      inlineData: {
        data: imageData,
        mimeType: 'image/jpeg', // Adjust based on actual image type
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();

    return {
      type: 'text',
      text: responseText,
    };
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw new Error(`Failed to analyze image: ${error.message}`);
  }
}

// Get model info
export function getModelInfo() {
  return {
    name: MODEL_NAME,
    contextWindow: CONTEXT_WINDOW,
    capabilities: [
      'text generation',
      'code generation',
      'image analysis',
      'conversation',
      'reasoning',
    ],
  };
}

