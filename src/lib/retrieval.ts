import { BANK, CUE_INDEX, CUES_BY_DX, DX_INDEX, type BankCue, type DxType } from './bank.ts'
import { screenRedFlags } from './redflags.ts'
import type { CaseInput, Fact } from './types.ts'

/**
 * Tahap 1 (retrieval): cocokkan fakta kasus dengan 1.015 indikator & 76 alias di bank data
 * NERSCARE, lalu ranking diagnosis. Hasilnya menjadi konteks terfokus untuk LLM (tahap 2).
 * Pencocokan leksikal ini hanya alat penyaring, bukan penetapan diagnosis.
 */

const NEGATIONS = new Set(['tidak', 'tak', 'tanpa', 'bukan', 'belum', 'menyangkal', 'nggak', 'gak', 'tdk'])
const STOP = new Set([
  'pasien', 'klien', 'mengatakan', 'mengeluh', 'tampak', 'terlihat', 'dan', 'atau', 'yang', 'dengan', 'saat', 'pada',
  'untuk', 'dari', 'ke', 'di', 'ada', 'sejak', 'hari', 'jam', 'kali', 'sangat', 'agak', 'sedikit', 'lebih', 'masih',
  'sudah', 'telah', 'akan', 'karena', 'jika', 'bila', 'merasa', 'terasa', 'rasa', 'seperti', 'ini', 'itu', 'nya',
  'ibu', 'anak', 'keluarga', 'terutama', 'tahun', 'bulan', 'menit', 'kurang', 'atas', 'bawah', 'per', 'oleh',
  'riwayat', 'sebelum', 'sebelumnya', 'sehari', 'luar', 'rumah',
  // Kata pengisi pada teks indikator bank data yang tidak membawa makna klinis.
  'sesuai', 'konteks', 'dalam', 'terdokumentasi', 'teramati', 'dinilai', 'diperiksa', 'terukur', 'kondisi',
  'pemeriksaan', 'teridentifikasi', 'dibandingkan',
])

export function normalize(text: string) {
  return text.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim()
}

/** Token bermakna; kata setelah negasi diberi awalan "tidak_" agar "tidak sesak" ≠ "sesak". */
export function tokenize(text: string): string[] {
  const out: string[] = []
  let negate = false
  for (const w of normalize(text).split(' ')) {
    if (NEGATIONS.has(w)) { negate = true; continue }
    if (w.length < 3 || STOP.has(w)) continue
    out.push(negate ? `tidak_${w}` : w)
    negate = false
  }
  return out
}

const similar = (a: string, b: string) =>
  a === b || (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a)))

/** Cue cocok bila sebagian besar kata kuncinya muncul dalam satu fakta. */
export function cueMatches(cueTokens: string[], factTokens: string[], strict = false) {
  if (!cueTokens.length) return false
  const hit = cueTokens.filter(c => factTokens.some(f => similar(c, f))).length
  if (strict || cueTokens.length <= 2) return hit === cueTokens.length
  return hit >= Math.ceil(cueTokens.length * 0.6)
}

const num = (v: string) => {
  const n = Number(v.replace(',', '.'))
  return v.trim() !== '' && Number.isFinite(n) ? n : null
}

/**
 * Terjemahkan angka TTV menjadi istilah yang dipakai indikator objektif bank data
 * (mis. "Frekuensi atau kedalaman napas abnormal", "Saturasi rendah sesuai konteks").
 * Ambang bersifat edukatif dan dewasa; dicocokkan secara ketat (semua kata indikator harus ada).
 */
export function vitalDescriptors(c: CaseInput): Fact[] {
  const out: Fact[] = []
  const add = (id: string, text: string) => out.push({ id, kind: 'TTV', text })
  const v = c.vitals
  const spo2 = num(v.spo2), temp = num(v.temp), hr = num(v.hr), rr = num(v.rr), sbp = num(v.sbp)
  if (spo2 !== null && spo2 < 95) add('spo2', 'saturasi oksigen rendah perubahan saturasi oksigen')
  if (temp !== null && temp >= 37.5) add('suhu', 'suhu tubuh di atas kisaran rujukan usia demam')
  if (temp !== null && temp < 36) add('suhu', 'suhu tubuh di luar rentang usia')
  if (hr !== null && hr > 100 && temp !== null && temp >= 37.5) add('nadi', 'takikardia terkait demam')
  if (rr !== null && (rr > 24 || rr < 12)) add('rr', 'frekuensi kedalaman napas abnormal')
  if (sbp !== null && sbp < 90) add('td', 'hipotensi perfusi buruk perubahan tekanan darah')
  if (sbp !== null && sbp >= 140) add('td', 'perubahan tekanan darah')
  if (['apatis', 'somnolen', 'sopor', 'koma'].includes(c.consciousness)) add('gcs', 'perubahan tingkat kesadaran menurun')
  return out
}

export type MatchedCue = { cue_id: string; type: BankCue['type']; text: string; fact_ids: string[] }
export type Retrieved = {
  dx_id: string
  label: string
  type: DxType
  domain: string
  score: number
  matched: MatchedCue[]
  missing: string[]
  follow_up: string
}

const CUE_TOKENS = new Map(BANK.cues.map(c => [c.id, tokenize(c.text)]))

export function retrieve(c: CaseInput, facts: Fact[], limit = 10): Retrieved[] {
  // Deskripsi TTV adalah teks buatan sistem, jadi wajib cocok penuh agar tidak memicu indikator
  // yang hanya mirip sebagian (mis. "nadi meningkat saat cemas" dari takikardia).
  const searchable = [
    ...facts.filter(f => f.kind !== 'TTV').map(f => ({ f, strict: false })),
    ...vitalDescriptors(c).map(f => ({ f, strict: true })),
  ].map(({ f, strict }) => ({ id: f.id, strict, tokens: tokenize(f.text), norm: ` ${normalize(f.text)} ` }))
  // TTV yang masuk kategori tanda bahaya tetap berbobot penuh; abnormal ringan berbobot 1.
  const criticalIds = new Set(screenRedFlags(c, facts).flatMap(f => f.fact_ids))
  const lightIds = new Set(searchable.filter(s => s.strict && !criticalIds.has(s.id)).map(s => s.id))

  const hits = new Map<string, Set<string>>() // cue_id -> fact ids
  const mark = (cueId: string, factId: string) => hits.set(cueId, (hits.get(cueId) ?? new Set()).add(factId))

  for (const cue of BANK.cues) {
    const ct = CUE_TOKENS.get(cue.id)!
    for (const f of searchable) if (cueMatches(ct, f.tokens, f.strict)) mark(cue.id, f.id)
  }
  for (const a of BANK.aliases) {
    const phrase = ` ${normalize(a.phrase)} `
    for (const f of searchable) if (f.norm.includes(phrase) && CUE_INDEX.has(a.cue)) mark(a.cue, f.id)
  }

  const results: Retrieved[] = []
  for (const [dxId, cues] of CUES_BY_DX) {
    const matched = cues.filter(q => hits.has(q.id))
    if (!matched.length) continue
    const dx = DX_INDEX.get(dxId)!
    const types = new Set(matched.map(m => m.type))
    // Bobot provisional bank data + bonus bila didukung data subjektif DAN objektif. Indikator yang
    // hanya cocok lewat TTV abnormal ringan berbobot 1 agar satu angka tidak menggelembungkan skor.
    const weightOf = (m: BankCue) => ([...hits.get(m.id)!].every(id => lightIds.has(id)) ? 1 : m.weight)
    let score = matched.reduce((s, m) => s + weightOf(m), 0) + (types.has('S') && types.has('O') ? 2 : 0)
    // Diagnosis aktual dengan satu indikator saja diturunkan peringkatnya.
    if (dx.type === 'Aktual' && matched.length < 2) score -= 1
    results.push({
      dx_id: dxId, label: dx.label, type: dx.type, domain: dx.domain, score,
      matched: matched.map(m => ({ cue_id: m.id, type: m.type, text: m.text, fact_ids: [...hits.get(m.id)!] })),
      missing: cues.filter(q => !hits.has(q.id) && q.type !== 'R').slice(0, 4).map(q => q.text),
      follow_up: dx.follow_up,
    })
  }
  return results.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label)).slice(0, limit)
}
