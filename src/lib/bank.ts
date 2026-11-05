import raw from '../data/nerscare-bank.json' with { type: 'json' }

/**
 * Bank data NERSCARE (dikembangkan tim sebelum kompetisi). Indikator S/O/R adalah rancangan
 * operasional tim, bukan kriteria resmi SDKI; label luaran/intervensi berstatus kandidat review.
 * Dibangun ulang dengan: node scripts/build-bank.mjs <folder data NERSCARE>
 */
export type DxType = 'Aktual' | 'Risiko' | 'Promosi'
export type BankDiagnosis = { id: string; label: string; type: DxType; domain: string; follow_up: string }
export type BankCue = { id: string; dx: string; type: 'S' | 'O' | 'R'; text: string; weight: number }

type Bank = {
  source: string
  notice: string
  diagnoses: BankDiagnosis[]
  cues: BankCue[]
  aliases: Array<{ phrase: string; cue: string }>
  slki: Record<string, string[]>
  siki: Record<string, string[]>
}

export const BANK = raw as Bank
export const DX_INDEX = new Map(BANK.diagnoses.map(d => [d.id, d]))
export const CUE_INDEX = new Map(BANK.cues.map(c => [c.id, c]))
export const CUES_BY_DX = BANK.cues.reduce((m, c) => {
  const list = m.get(c.dx) ?? []
  list.push(c)
  return m.set(c.dx, list)
}, new Map<string, BankCue[]>())
