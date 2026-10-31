import { getAiAgentCredentials } from '@/lib/services/credentials';
import type { AiProviderType } from '@/lib/types/domain';

function stripJsonCodeFences(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('```')) {
    return trimmed
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
  }
  return trimmed;
}

/**
 * Executes a structured JSON completion using the Superadmin-configured AI provider
 * (`gemini` -> `openai` -> `deterministic` fallback).
 * Never throws when external AI keys are missing or rate-limited — cleanly falls back
 * to the deterministic domain resolver so XPO works 24/7 out of the box.
 */
export async function runStructuredAgentCompletion<T>(params: {
  systemInstruction: string;
  userPrompt: string;
  fallback: () => Promise<T> | T;
}): Promise<{ data: T; providerUsed: AiProviderType }> {
  const ai = await getAiAgentCredentials();

  if (ai.provider === 'gemini' && ai.geminiApiKey) {
    try {
      const model = ai.geminiModel || 'gemini-2.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model
      )}:generateContent?key=${encodeURIComponent(ai.geminiApiKey)}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: params.systemInstruction }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: params.userPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
        signal: AbortSignal.timeout(12000),
      });

      if (res.ok) {
        const json = (await res.json()) as {
          candidates?: Array<{
            content?: { parts?: Array<{ text?: string }> };
          }>;
        };
        const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(stripJsonCodeFences(rawText)) as T;
          return { data: parsed, providerUsed: 'gemini' };
        }
      }
    } catch (err) {
      console.warn('[Agent LLM] Gemini call failed, falling back to deterministic:', err);
    }
  }

  if (ai.provider === 'openai' && ai.openaiApiKey) {
    try {
      const model = ai.openaiModel || 'gpt-4o-mini';
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ai.openaiApiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: params.systemInstruction },
            { role: 'user', content: params.userPrompt },
          ],
        }),
        signal: AbortSignal.timeout(12000),
      });

      if (res.ok) {
        const json = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const rawText = json.choices?.[0]?.message?.content;
        if (rawText) {
          const parsed = JSON.parse(stripJsonCodeFences(rawText)) as T;
          return { data: parsed, providerUsed: 'openai' };
        }
      }
    } catch (err) {
      console.warn('[Agent LLM] OpenAI call failed, falling back to deterministic:', err);
    }
  }

  const data = await params.fallback();
  return { data, providerUsed: 'deterministic' };
}
