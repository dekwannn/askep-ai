import { BANK, DX_INDEX } from './bank.ts'
import type { Retrieved } from './retrieval.ts'
import type { Analysis, Candidate, Fact, ModelOutput, Priority, RedFlag } from './types.ts'

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)
const s = (x: unknown, max = 600) => (typeof x === 'string' ? x.trim().slice(0, max) : '')
const list = (x: unknown, limit: number, max = 300) =>
  Array.isArray(x) ? x.slice(0, limit).map(v => s(v, max)).filter(Boolean) : []
const PRIORITIES: Priority[] = ['tinggi', 'sedang', 'rendah']
type GroupKind = Analysis['evidence_groups'][number]['kind']
const GROUP_KINDS: GroupKind[] = ['DS', 'DO', 'TTV']

const norm = (t: string) => t.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()

/** Kutipan dianggap sah bila (setelah normalisasi) benar-benar ada di jawaban mahasiswa. */
export function vetStrengths(x: unknown, studentText: string): Array<{ quote: string; comment: string }> {
  const source = ` ${norm(studentText)} `
  if (!Array.isArray(x) || !source.trim()) return []
  return x.slice(0, 5).flatMap(item => {
    if (!isObj(item)) return []
    const quote = s(item.quote, 200), comment = s(item.comment, 300)
    const q = norm(quote)
    return q.length >= 3 && comment && source.includes(` ${q} `) ? [{ quote, comment }] : []
  })
}

/**
 * Jangan percaya output model begitu saja: setiap kandidat harus ada di bank data dan
 * didukung minimal satu id fakta yang benar-benar dimasukkan pengguna. Sisanya dibuang.
 */
export function vetAnalysis(
  raw: unknown, facts: Fact[], retrieved: Retrieved[], redFlags: RedFlag[], model: string, studentText: string,
): Analysis {
  const hasStudentAnswer = studentText.trim() !== ''
  if (!isObj(raw)) throw new Error('invalid_model_output')
  const factIds = new Set(facts.map(f => f.id))
  const retrievedById = new Map(retrieved.map(r => [r.dx_id, r]))
  let dropped = 0

  const evidence_groups: Analysis['evidence_groups'] = []
  for (const g of Array.isArray(raw.evidence_groups) ? raw.evidence_groups.slice(0, 6) : []) {
    if (!isObj(g) || !GROUP_KINDS.includes(g.kind as GroupKind)) continue
    const ids = list(g.fact_ids, 20, 20).filter(id => factIds.has(id))
    if (ids.length) evidence_groups.push({ kind: g.kind as GroupKind, fact_ids: [...new Set(ids)], meaning: s(g.meaning, 400) })
  }

  const candidates: Candidate[] = []
  for (const c of Array.isArray(raw.candidates) ? raw.candidates.slice(0, 8) : []) {
    if (!isObj(c)) { dropped++; continue }
    const dx = DX_INDEX.get(s(c.dx_id, 30))
    const evidence = [...new Set(list(c.evidence_ids, 15, 20).filter(id => factIds.has(id)))]
    if (!dx || candidates.some(x => x.dx_id === dx.id) || !evidence.length) { dropped++; continue }
    const r = retrievedById.get(dx.id)
    candidates.push({
      dx_id: dx.id, label: dx.label, domain: dx.domain, dx_type: dx.type,
      priority: PRIORITIES.includes(c.priority as Priority) ? (c.priority as Priority) : 'sedang',
      evidence_ids: evidence,
      rationale: s(c.rationale, 700),
      outcome_goal: s(c.outcome_goal, 400),
      interventions: list(c.interventions, 8, 250),
      uncertainty: s(c.uncertainty, 400),
      bank: r ? { score: r.score, matched: r.matched, missing: r.missing } : null,
      follow_up: dx.follow_up,
      slki: (BANK.slki[dx.id] ?? []).slice(0, 4),
      siki: (BANK.siki[dx.id] ?? []).slice(0, 5),
    })
  }
  // "Risiko X" tidak relevan bila masalah aktual X sudah dipilih.
  const actualLabels = new Set(candidates.filter(c => c.dx_type !== 'Risiko').map(c => c.label.toLowerCase()))
  for (let i = candidates.length - 1; i >= 0; i--) {
    const c = candidates[i]
    if (c.dx_type === 'Risiko' && actualLabels.has(c.label.toLowerCase().replace(/^risiko\s+/, ''))) {
      candidates.splice(i, 1)
      dropped++
    }
  }
  candidates.sort((a, b) => PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority))

  const fb = isObj(raw.student_feedback) ? raw.student_feedback : null
  const student_feedback: ModelOutput['student_feedback'] | null = fb
    ? { strengths: vetStrengths(fb.strengths, studentText), improvements: list(fb.improvements, 5), verdict: s(fb.verdict, 500) }
    : null

  return {
    summary: s(raw.summary, 1000),
    evidence_groups,
    data_gaps: list(raw.data_gaps, 10),
    candidates: candidates.slice(0, 4),
    student_feedback: hasStudentAnswer || student_feedback?.verdict ? student_feedback : null,
    learning_questions: list(raw.learning_questions, 4),
    danger_signs: list(raw.danger_signs, 6),
    red_flags: redFlags,
    facts,
    retrieval: retrieved.map(r => ({ dx_id: r.dx_id, label: r.label, score: r.score })),
    dropped,
    model,
    created_at: new Date().toISOString(),
    learning_only: true,
  }
}
