import fetch from 'node-fetch';

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeRequest {
  model: string;
  max_tokens: number;
  messages: ClaudeMessage[];
}

export async function callClaude(messages: ClaudeMessage[]): Promise<string> {
  const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('CLAUDE_API_KEY or ANTHROPIC_API_KEY environment variable not set');
  }

  const model = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: 4000,
      messages
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${response.status} ${error}`);
  }

  const data = await response.json() as { content: Array<{ text: string }> };
  
  if (!data.content || data.content.length === 0) {
    throw new Error('No response from Claude API');
  }

  return data.content[0].text;
}

export async function planGitOperations(instruction: string, repoContext: string): Promise<{
  operations: Array<{ command: string; args: string[] }>;
  explanation: string;
}> {
  const messages: ClaudeMessage[] = [
    {
      role: 'user',
      content: `You are Heimdall, a Git automation assistant. Given this instruction and repo context, break it down into specific Git operations.

Repository Context:
${repoContext}

User Instruction: "${instruction}"

IMPORTANT: Respond with ONLY a valid JSON object, no markdown formatting, no explanations outside the JSON.

Format:
{
  "operations": [
    { "command": "apply-fix", "args": ["file.ts", "--update", "specific change"] },
    { "command": "commit", "args": [] },
    { "command": "pr", "args": ["--base", "main"] }
  ],
  "explanation": "I'll apply the fix to file.ts, then commit the changes and create a PR."
}

Available commands: apply-fix, commit, pr, status, gh`
    }
  ];

  const response = await callClaude(messages);
  
  try {
    // Clean the response to handle potential formatting issues
    const cleanResponse = response.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim();
    
    // Try to extract JSON if wrapped in markdown
    const jsonMatch = cleanResponse.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    const jsonString = jsonMatch ? jsonMatch[1] : cleanResponse;
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Claude response:', response);
    throw new Error(`Failed to parse Claude response: ${error}`);
  }
}