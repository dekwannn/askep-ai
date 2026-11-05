import { buildFacts } from '@/lib/facts.ts'
import { AiError, generateAnalysis } from '@/lib/groq.ts'
import { parseCase } from '@/lib/input.ts'
import { privacyIssues } from '@/lib/privacy.ts'
import { SYSTEM_PROMPT, buildUserPrompt } from '@/lib/prompt.ts'
import { screenRedFlags } from '@/lib/redflags.ts'
import { retrieve } from '@/lib/retrieval.ts'
import { vetAnalysis } from '@/lib/validate.ts'

export const runtime = 'nodejs'
export const maxDuration = 60

const AI_MESSAGES: Record<AiError['code'], [number, string]> = {
  ai_not_configured: [503, 'Layanan AI belum dikonfigurasi di server (GROQ_API_KEY kosong).'],
  ai_auth: [503, 'Kunci API layanan AI ditolak. Hubungi pengelola aplikasi.'],
  ai_rate_limited: [429, 'Kuota AI sedang penuh. Tunggu sekitar 1 menit lalu coba lagi.'],
  ai_unavailable: [502, 'Layanan AI sedang tidak dapat dihubungi. Coba lagi beberapa saat.'],
  ai_invalid_output: [502, 'AI memberikan jawaban yang tidak valid. Silakan coba lagi.'],
}

// Pembatas sederhana per IP untuk menjaga kuota API selama penjurian.
const hits = new Map<string, number[]>()
function rateLimited(ip: string) {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter(t => now - t < 60_000)
  recent.push(now)
  hits.set(ip, recent)
  if (hits.size > 5000) hits.clear()
  return recent.length > 8
}

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  if (rateLimited(ip)) return json({ error: 'rate_limited', message: 'Terlalu banyak permintaan. Coba lagi dalam 1 menit.' }, 429)
  if (Number(req.headers.get('content-length') ?? 0) > 60_000) return json({ error: 'too_large', message: 'Data kasus terlalu besar.' }, 413)

  const body = await req.json().catch(() => null) as { case?: unknown; confirm_simulation?: unknown } | null
  if (!body || body.confirm_simulation !== true)
    return json({ error: 'confirm_required', message: 'Centang pernyataan bahwa kasus ini fiktif/simulasi.' }, 400)

  const input = parseCase(body.case)
  const issues = privacyIssues(input)
  if (issues.length) return json({ error: 'privacy', message: 'Data terlihat seperti identitas nyata. Perbaiki dulu:', issues }, 422)

  const facts = buildFacts(input)
  if (facts.filter(f => f.kind !== 'TTV').length < 2)
    return json({ error: 'not_enough_data', message: 'Isi minimal keluhan utama dan data subjektif/objektif.' }, 400)

  // Skrining berbasis aturan & retrieval bank data selalu dikembalikan, bahkan jika AI gagal.
  const redFlags = screenRedFlags(input, facts)
  // Tahap 1: retrieval dari bank data NERSCARE. Tahap 2: penalaran LLM atas hasilnya.
  const retrieved = retrieve(input, facts)
  try {
    const { raw, model } = await generateAnalysis(SYSTEM_PROMPT, buildUserPrompt(input, facts, retrieved, redFlags))
    const studentText = input.student_diagnosis.trim() ? `${input.student_diagnosis}\n${input.student_rationale}` : ''
    const analysis = vetAnalysis(raw, facts, retrieved, redFlags, model, studentText)
    return json({ analysis })
  } catch (e) {
    const code = e instanceof AiError ? e.code : 'ai_invalid_output'
    const [status, message] = AI_MESSAGES[code]
    console.error('[analyze]', code)
    const retrieval = retrieved.map(r => ({ dx_id: r.dx_id, label: r.label, score: r.score }))
    return json({ error: code, message, red_flags: redFlags, facts, retrieval }, status)
  }
}
