import type { CaseInput, Consciousness, Stase } from './types.ts'

const STASES: Stase[] = ['kmb', 'maternitas', 'anak', 'gadar', 'jiwa', 'komunitas', 'gerontik']
const CONSCIOUSNESS: Consciousness[] = ['', 'compos_mentis', 'apatis', 'somnolen', 'sopor', 'koma']

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)
const s = (x: unknown, max: number) => (typeof x === 'string' ? x.slice(0, max) : '')

export function emptyCase(): CaseInput {
  return {
    label: '', age: '', sex: '', stase: 'kmb', setting: '', chief_complaint: '', subjective: '', objective: '',
    vitals: { sbp: '', dbp: '', hr: '', rr: '', temp: '', spo2: '' }, consciousness: '',
    pqrst: { p: '', q: '', r: '', s: '', t: '' }, history: '', student_diagnosis: '', student_rationale: '',
  }
}

/** Normalisasi body request menjadi CaseInput dengan batas panjang setiap field. */
export function parseCase(raw: unknown): CaseInput {
  const r = isObj(raw) ? raw : {}
  const v = isObj(r.vitals) ? r.vitals : {}
  const p = isObj(r.pqrst) ? r.pqrst : {}
  return {
    label: s(r.label, 20),
    age: s(r.age, 20),
    sex: r.sex === 'L' || r.sex === 'P' ? r.sex : '',
    stase: STASES.includes(r.stase as Stase) ? (r.stase as Stase) : 'kmb',
    setting: s(r.setting, 120),
    chief_complaint: s(r.chief_complaint, 400),
    subjective: s(r.subjective, 2500),
    objective: s(r.objective, 2500),
    vitals: { sbp: s(v.sbp, 6), dbp: s(v.dbp, 6), hr: s(v.hr, 6), rr: s(v.rr, 6), temp: s(v.temp, 6), spo2: s(v.spo2, 6) },
    consciousness: CONSCIOUSNESS.includes(r.consciousness as Consciousness) ? (r.consciousness as Consciousness) : '',
    pqrst: { p: s(p.p, 200), q: s(p.q, 200), r: s(p.r, 200), s: s(p.s, 200), t: s(p.t, 200) },
    history: s(r.history, 1200),
    student_diagnosis: s(r.student_diagnosis, 300),
    student_rationale: s(r.student_rationale, 1000),
  }
}
