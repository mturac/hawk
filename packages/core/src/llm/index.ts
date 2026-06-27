import { LLMMessage, LLMResponse, ReviewConfig } from '../types';

export interface ILLMProvider {
  chat(messages: LLMMessage[], config: ReviewConfig): Promise<LLMResponse>;
}

const MAX_RETRIES = 3;
const TIMEOUT_MS = 120000;
const INITIAL_DELAY_MS = 1000;

export async function callLLM(
  messages: LLMMessage[],
  config: ReviewConfig
): Promise<LLMResponse> {
  const provider = getProvider(config.provider);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const result = await withTimeout(provider.chat(messages, config), TIMEOUT_MS);
      return result;
    } catch (error: any) {
      const isRetryable =
        error.message?.includes('429') ||
        error.message?.includes('500') ||
        error.message?.includes('502') ||
        error.message?.includes('503') ||
        error.message?.includes('timeout') ||
        error.message?.includes('ECONNRESET');

      if (!isRetryable || attempt === MAX_RETRIES - 1) {
        throw error;
      }

      const delay = INITIAL_DELAY_MS * Math.pow(2, attempt);
      console.log(`LLM call failed (attempt ${attempt + 1}/${MAX_RETRIES}), retrying in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw new Error('LLM call failed after all retries');
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`LLM call timed out after ${ms}ms`)), ms)
    ),
  ]);
}

function getProvider(providerName: string): ILLMProvider {
  switch (providerName) {
    case 'openai':
      return new OpenAIProvider();
    case 'anthropic':
      return new AnthropicProvider();
    case 'deepseek':
      return new DeepSeekProvider();
    case 'ollama':
      return new OllamaProvider();
    default:
      throw new Error(`Unknown LLM provider: ${providerName}`);
  }
}

async function fetchJSON(url: string, headers: Record<string, string>, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}

class OpenAIProvider implements ILLMProvider {
  async chat(messages: LLMMessage[], config: ReviewConfig): Promise<LLMResponse> {
    if (!config.apiKey) throw new Error('OpenAI API key required');

    const data = await fetchJSON(
      'https://api.openai.com/v1/chat/completions',
      { Authorization: `Bearer ${config.apiKey}` },
      {
        model: config.model || 'gpt-4o',
        messages,
        temperature: 0.1,
        max_tokens: 4096,
      }
    );

    const choice = (data as any)?.choices?.[0];
    const usage = (data as any)?.usage;

    return {
      content: choice?.message?.content ?? '',
      usage: usage
        ? { promptTokens: usage.prompt_tokens, completionTokens: usage.completion_tokens }
        : undefined,
    };
  }
}

class AnthropicProvider implements ILLMProvider {
  async chat(messages: LLMMessage[], config: ReviewConfig): Promise<LLMResponse> {
    if (!config.apiKey) throw new Error('Anthropic API key required');

    const systemMsg = messages.find((m) => m.role === 'system');
    const nonSystemMsgs = messages.filter((m) => m.role !== 'system');

    const data = await fetchJSON(
      'https://api.anthropic.com/v1/messages',
      {
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      {
        model: config.model || 'claude-sonnet-4-20250514',
        system: systemMsg?.content ?? '',
        messages: nonSystemMsgs.map((m) => ({ role: m.role, content: m.content })),
        max_tokens: 4096,
      }
    );

    const content = (data as any)?.content?.[0]?.text ?? '';
    const usage = (data as any)?.usage;

    return {
      content,
      usage: usage
        ? { promptTokens: usage.input_tokens, completionTokens: usage.output_tokens }
        : undefined,
    };
  }
}

class DeepSeekProvider implements ILLMProvider {
  async chat(messages: LLMMessage[], config: ReviewConfig): Promise<LLMResponse> {
    if (!config.apiKey) throw new Error('DeepSeek API key required');

    const data = await fetchJSON(
      'https://api.deepseek.com/v1/chat/completions',
      { Authorization: `Bearer ${config.apiKey}` },
      {
        model: config.model || 'deepseek-chat',
        messages,
        temperature: 0.1,
        max_tokens: 4096,
      }
    );

    const choice = (data as any)?.choices?.[0];
    const usage = (data as any)?.usage;

    return {
      content: choice?.message?.content ?? '',
      usage: usage
        ? { promptTokens: usage.prompt_tokens, completionTokens: usage.completion_tokens }
        : undefined,
    };
  }
}

class OllamaProvider implements ILLMProvider {
  async chat(messages: LLMMessage[], config: ReviewConfig): Promise<LLMResponse> {
    const baseUrl = config.ollamaUrl || 'http://localhost:11434';

    const data = await fetchJSON(
      `${baseUrl}/api/chat`,
      {},
      {
        model: config.model || 'codellama',
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        stream: false,
      }
    );

    return {
      content: (data as any)?.message?.content ?? '',
    };
  }
}
