import type { CaseInput } from './types.ts'

// Heuristik "fail-closed": menolak input yang terlihat seperti data identitas nyata.
// Tidak menjamin de-identifikasi; pengguna tetap wajib hanya memakai kasus fiktif.
const IDENTIFIER_RULES: Array<[RegExp, string]> = [
  [/\b\d{16}\b/, 'Terdeteksi angka 16 digit (mirip NIK).'],
  [/(?:\+?62|\b0)8\d[\d\s-]{7,}/, 'Terdeteksi nomor telepon.'],
  [/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i, 'Terdeteksi alamat email.'],
  [/https?:\/\/\S+/i, 'Terdeteksi tautan/URL.'],
  [/\b(?:Tn|Ny|Nn|An|By|Sdr|Sdri)\.?\s+[A-Z][a-z]{2,}/, 'Terdeteksi nama lengkap. Gunakan inisial saja (mis. Tn. K).'],
  [/\b(?:no\.?\s*rm|rekam\s*medis|nik|ktp|bpjs)\s*[:#.-]?\s*\d/i, 'Terdeteksi nomor rekam medis/NIK/BPJS.'],
  // Alamat: singkatan "Jl./Gg. Nama", atau "Jalan/Gang Nama ... No. 5". Istilah klinis seperti
  // "bersihan jalan napas" tidak boleh terdeteksi sebagai alamat.
  [/\b(?:jl|gg)\.\s*\p{L}{3,}/iu, 'Terdeteksi alamat jalan.'],
  [/\b(?:jalan|gang)\s+(?!napas\b)\p{L}+(?:\s+\p{L}+){0,3}\s+(?:no\.?|nomor)\s*\d/iu, 'Terdeteksi alamat jalan.'],
]

const LABEL_RE = /^(?:Tn|Ny|Nn|An|By|Sdr|Sdri)\.?\s?[A-Z](?:\.\s?[A-Z]){0,2}\.?$/

export function privacyIssues(input: CaseInput): string[] {
  const issues = new Set<string>()
  const label = input.label.trim()
  if (label && !LABEL_RE.test(label)) issues.add('Identitas pasien harus berupa sapaan + inisial, mis. "Tn. K" atau "Ny. P".')
  const text = [
    input.setting, input.chief_complaint, input.subjective, input.objective, input.history,
    ...Object.values(input.pqrst), input.student_diagnosis, input.student_rationale,
  ].join('\n')
  for (const [re, message] of IDENTIFIER_RULES) if (re.test(text)) issues.add(message)
  return [...issues]
}
