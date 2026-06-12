import { createGroq } from '@ai-sdk/groq';

export class GroqApiKeyError extends Error {
  constructor() {
    super('Missing GROQ_API_KEY in environment variables');
    this.name = 'GroqApiKeyError';
  }
}

export class GroqProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GroqProviderError';
  }
}

export function createGroqModel() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new GroqApiKeyError();
  }

  const groq = createGroq({ apiKey });
  return groq('llama-3.3-70b-versatile');
}

export const groqModel = createGroqModel();