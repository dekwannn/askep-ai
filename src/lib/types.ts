/** Semua kasus adalah SIMULASI pendidikan. Output AI bukan keputusan klinis. */

export type Stase = 'kmb' | 'maternitas' | 'anak' | 'gadar' | 'jiwa' | 'komunitas' | 'gerontik'

export type Consciousness = '' | 'compos_mentis' | 'apatis' | 'somnolen' | 'sopor' | 'koma'

export type CaseInput = {
  label: string // inisial saja, mis. "Tn. K"
  age: string
  sex: '' | 'L' | 'P'
  stase: Stase
  setting: string
  chief_complaint: string
  subjective: string
  objective: string
  vitals: { sbp: string; dbp: string; hr: string; rr: string; temp: string; spo2: string }
  consciousness: Consciousness
  pqrst: { p: string; q: string; r: string; s: string; t: string }
  history: string
  student_diagnosis: string
  student_rationale: string
}

export type FactKind = 'KU' | 'DS' | 'DO' | 'TTV' | 'PQRST' | 'RIWAYAT'
export type Fact = { id: string; kind: FactKind; text: string }

export type RedFlag = { id: string; level: 'segera' | 'laporkan'; message: string; fact_ids: string[] }

export type Priority = 'tinggi' | 'sedang' | 'rendah'

/** Bentuk mentah yang diminta dari model (divalidasi ulang di server). */
export type ModelOutput = {
  summary: string
  evidence_groups: Array<{ kind: 'DS' | 'DO' | 'TTV'; fact_ids: string[]; meaning: string }>
  data_gaps: string[]
  candidates: Array<{
    dx_id: string
    priority: Priority
    evidence_ids: string[]
    rationale: string
    outcome_goal: string
    interventions: string[]
    uncertainty: string
  }>
  /** strengths wajib mengutip kata-kata mahasiswa; kutipan yang tidak ditemukan dibuang server. */
  student_feedback: { strengths: Array<{ quote: string; comment: string }>; improvements: string[]; verdict: string }
  learning_questions: string[]
  danger_signs: string[]
}

export type BankEvidence = {
  score: number
  matched: Array<{ cue_id: string; type: 'S' | 'O' | 'R'; text: string; fact_ids: string[] }>
  missing: string[]
}

export type Candidate = ModelOutput['candidates'][number] & {
  label: string
  domain: string
  dx_type: 'Aktual' | 'Risiko' | 'Promosi'
  /** Hasil tahap retrieval bank data; null bila kandidat diusulkan AI dari daftar bank. */
  bank: BankEvidence | null
  follow_up: string
  slki: string[]
  siki: string[]
}

export type Analysis = {
  summary: string
  evidence_groups: ModelOutput['evidence_groups']
  data_gaps: string[]
  candidates: Candidate[]
  student_feedback: ModelOutput['student_feedback'] | null
  learning_questions: string[]
  danger_signs: string[]
  red_flags: RedFlag[]
  facts: Fact[]
  /** Ringkasan tahap 1: diagnosis teratas hasil pencocokan bank data. */
  retrieval: Array<{ dx_id: string; label: string; score: number }>
  dropped: number
  model: string
  created_at: string
  learning_only: true
}
