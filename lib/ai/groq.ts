import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/**
 * Streams a chat completion from Groq (llama-3.1-70b).
 * Returns an async iterator of text chunks.
 */
export async function streamGroqChat(messages: ChatMessage[]) {
  const stream = await groq.chat.completions.create({
    model: 'llama-3.1-70b-versatile',
    messages,
    temperature: 0.9,
    max_tokens: 500,
    top_p: 0.95,
    stream: true,
  })
  return stream
}

/**
 * One-shot completion (for non-streaming responses).
 */
export async function groqChat(messages: ChatMessage[]): Promise<string> {
  const response = await groq.chat.completions.create({
    model: 'llama-3.1-70b-versatile',
    messages,
    temperature: 0.9,
    max_tokens: 500,
  })
  return response.choices[0]?.message?.content || ''
}
