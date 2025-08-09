import OpenAI from 'openai';

export async function applyUpdate(originalCode: string, instruction: string): Promise<string> {
  const apiKey = process.env.MORPH_API_KEY;
  
  if (!apiKey) {
    throw new Error('MORPH_API_KEY environment variable not set');
  }

  const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: "https://api.morphllm.com/v1",
  });

  const response = await openai.chat.completions.create({
    model: "morph-v3-large",
    messages: [
      {
        role: "user",
        content: `<instruction>Apply this code change</instruction>\n<code>${originalCode}</code>\n<update>${instruction}</update>`,
      },
    ],
  });

  const mergedCode = response.choices[0].message.content;
  
  if (!mergedCode) {
    throw new Error('No response content from Morph API');
  }

  return mergedCode.trim();
}

// Alternative implementation for when we have more details about the Morph API
export async function applyUpdateAdvanced(originalCode: string, instruction: string): Promise<string> {
  // This would be the real implementation once we know the exact Morph API format
  // For now, return a simple transformation as a fallback
  return `${originalCode}\n\n// TODO: Apply update: ${instruction}`;
}
