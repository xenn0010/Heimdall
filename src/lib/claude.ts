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

export async function planGitOperations(instruction: string, repoContext: string, codebaseContext?: string): Promise<{
  operations: Array<{ command: string; args: string[] }>;
  explanation: string;
}> {
  const messages: ClaudeMessage[] = [
    {
      role: 'user',
      content: `You are Heimdall, an intelligent Git automation assistant. Analyze the instruction, repository state, and codebase to plan the optimal Git operations.

Repository Context:
${repoContext}

${codebaseContext ? `\nCodebase Context:\n${codebaseContext}` : ''}

User Instruction: "${instruction}"

CRITICAL: You MUST use the actual files found in the Codebase Context above. DO NOT assume standard file structures like src/main.ts or src/app/routes.ts unless they appear in the codebase analysis.

As an agentic assistant, you should:
1. ONLY reference files that actually exist in the Codebase Context
2. If no files are found in codebase analysis, use "explore" command first to discover structure
3. Base all apply-fix operations on real file paths from the codebase analysis
4. Generate meaningful commit messages based on actual changes

IMPORTANT: Respond with ONLY a valid JSON object, no markdown formatting, no explanations outside the JSON.

Format:
{
  "operations": [
    { "command": "explore", "args": ["."] },
    { "command": "apply-fix", "args": ["[actual-file-from-analysis]", "--update", "specific change based on real file analysis"] },
    { "command": "commit", "args": [] }
  ],
  "explanation": "I will work with the actual files found in the codebase analysis, not assumed file structures."
}

Available commands: apply-fix, commit, pr, status, gh, explore

REMEMBER: Use real file paths from the Codebase Context, not assumed standard structures!`
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