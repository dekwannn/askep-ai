import type { CaseInput, Fact } from './types.ts'

const MAX_FACTS = 60

/** Pecah teks bebas menjadi butir-butir pendek supaya AI bisa mengutip bukti per butir. */
export function splitStatements(text: string, limit = 15): string[] {
  return text
    .split(/\r?\n|;|•|(?<=[.!?])\s+(?=[A-Z])/)
    .map(s => s.replace(/^[\s\-*\d.)]+/, '').trim())
    .filter(s => s.length > 1)
    .slice(0, limit)
    .map(s => s.slice(0, 300))
}

const num = (v: string) => {
  const n = Number(v.replace(',', '.'))
  return v.trim() !== '' && Number.isFinite(n) ? n : null
}

const CONSCIOUSNESS_LABEL: Record<string, string> = {
  compos_mentis: 'Compos mentis', apatis: 'Apatis', somnolen: 'Somnolen', sopor: 'Sopor', koma: 'Koma',
}

/**
 * Ubah kasus menjadi daftar fakta berlabel. Identitas (inisial) TIDAK ikut dikirim ke AI;
 * hanya usia, jenis kelamin, stase, dan data klinis simulasi.
 */
export function buildFacts(c: CaseInput): Fact[] {
  const facts: Fact[] = []
  const add = (id: string, kind: Fact['kind'], text: string) => {
    const t = text.trim()
    if (t) facts.push({ id, kind, text: t.slice(0, 300) })
  }
  add('ku', 'KU', c.chief_complaint)
  splitStatements(c.subjective).forEach((s, i) => add(`ds${i + 1}`, 'DS', s))
  splitStatements(c.objective).forEach((s, i) => add(`do${i + 1}`, 'DO', s))

  const v = c.vitals
  const sbp = num(v.sbp), dbp = num(v.dbp)
  if (sbp !== null && dbp !== null) add('td', 'TTV', `Tekanan darah ${sbp}/${dbp} mmHg`)
  if (num(v.hr) !== null) add('nadi', 'TTV', `Nadi ${num(v.hr)} x/menit`)
  if (num(v.rr) !== null) add('rr', 'TTV', `Frekuensi napas ${num(v.rr)} x/menit`)
  if (num(v.temp) !== null) add('suhu', 'TTV', `Suhu ${num(v.temp)} °C`)
  if (num(v.spo2) !== null) add('spo2', 'TTV', `SpO2 ${num(v.spo2)}%`)
  if (c.consciousness) add('gcs', 'TTV', `Kesadaran ${CONSCIOUSNESS_LABEL[c.consciousness]}`)

  const pq = c.pqrst
  add('p', 'PQRST', pq.p && `P (pemicu/pereda): ${pq.p}`)
  add('q', 'PQRST', pq.q && `Q (kualitas): ${pq.q}`)
  add('r', 'PQRST', pq.r && `R (lokasi/penjalaran): ${pq.r}`)
  add('s', 'PQRST', pq.s && `S (skala): ${pq.s}`)
  add('t', 'PQRST', pq.t && `T (waktu): ${pq.t}`)

  splitStatements(c.history, 6).forEach((s, i) => add(`rw${i + 1}`, 'RIWAYAT', s))
  return facts.slice(0, MAX_FACTS)
}
