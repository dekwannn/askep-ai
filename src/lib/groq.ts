import { OUTPUT_SCHEMA } from './prompt.ts'

const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'
/**
 * Urutan model. Kuota (token/menit) Groq dihitung per model, jadi bila satu model terkena
 * rate limit, model berikutnya dicoba. Dapat diganti lewat GROQ_MODEL (dipisah koma).
 */
// qwen/qwen3.8-27b berstatus preview di Groq (bisa dihentikan); dipakai hanya sebagai cadangan terakhir.
export const DEFAULT_MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b']
// Model yang mendukung structured output JSON Schema di Groq; model lain memakai mode JSON biasa.
const SCHEMA_MODELS = new Set(['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'])

type AiCode = 'ai_not_configured' | 'ai_auth' | 'ai_rate_limited' | 'ai_unavailable' | 'ai_invalid_output'
export class AiError extends Error {
  code: AiCode
  constructor(code: AiCode) {
    super(code)
    this.code = code
  }
}

export function aiModels() {
  const custom = process.env.GROQ_MODEL?.split(',').map(m => m.trim()).filter(Boolean)
  return custom?.length ? custom : DEFAULT_MODELS
}

async function requestOnce(system: string, user: string, model: string, useSchema: boolean): Promise<unknown> {
  const key = process.env.GROQ_API_KEY?.trim()
  if (!key) throw new AiError('ai_not_configured')
  let res: Response
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(45_000),
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_completion_tokens: 2500,
        // Model gpt-oss memakai token penalaran internal; "low" menjaga latensi & kuota gratis.
        ...(model.startsWith('openai/gpt-oss') ? { reasoning_effort: 'low' } : {}),
        // Qwen3 menulis proses berpikirnya; sembunyikan agar konten berisi JSON saja.
        ...(model.startsWith('qwen/') ? { reasoning_format: 'hidden' } : {}),
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        response_format: useSchema
          ? { type: 'json_schema', json_schema: { name: 'askep_tutor_analysis', strict: true, schema: OUTPUT_SCHEMA } }
          : { type: 'json_object' },
      }),
    })
  } catch {
    throw new AiError('ai_unavailable')
  }
  if (res.status === 401 || res.status === 403) throw new AiError('ai_auth')
  if (res.status === 429) throw new AiError('ai_rate_limited')
  // 400 dari Groq umumnya berarti JSON hasil model tidak lolos validasi skema/format.
  if (!res.ok) throw new AiError(res.status === 400 ? 'ai_invalid_output' : 'ai_unavailable')
  const body = await res.json().catch(() => null) as { choices?: Array<{ message?: { content?: string } }> } | null
  const content = body?.choices?.[0]?.message?.content
  if (!content || content.length > 40_000) throw new AiError('ai_invalid_output')
  try {
    return JSON.parse(content)
  } catch {
    throw new AiError('ai_invalid_output')
  }
}

/**
 * Coba setiap model berurutan. Pada satu model: output tidak valid → ulangi sekali dengan
 * mode JSON biasa. Rate limit / gangguan → lanjut ke model berikutnya.
 */
export async function generateAnalysis(system: string, user: string): Promise<{ raw: unknown; model: string }> {
  let last: AiError = new AiError('ai_unavailable')
  for (const model of aiModels()) {
    const attempts = SCHEMA_MODELS.has(model) ? [true, false] : [false, false]
    for (const useSchema of attempts) {
      try {
        return { raw: await requestOnce(system, user, model, useSchema), model }
      } catch (e) {
        if (!(e instanceof AiError)) throw e
        if (e.code === 'ai_not_configured' || e.code === 'ai_auth') throw e
        last = e
        if (e.code !== 'ai_invalid_output') break // rate limit / gangguan: pindah model
      }
    }
  }
  throw last
}
