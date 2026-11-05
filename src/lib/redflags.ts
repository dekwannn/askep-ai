import type { CaseInput, Fact, RedFlag, Stase } from './types.ts'

/**
 * Skrining tanda bahaya berbasis aturan (deterministik), berjalan TANPA AI agar selalu
 * muncul meskipun layanan AI gagal. Ambang bersifat edukatif, bukan protokol triase resmi.
 *
 * Dua tingkat: "segera" (kondisi mengancam, nilai dan lapor saat itu juga) dan "laporkan"
 * (abnormal bermakna yang perlu dilaporkan ke perawat penanggung jawab/CI). Ambang direvisi
 * berdasarkan review anggota tim bidang keperawatan (5 Nov 2026); acuan umum: kategori skor
 * peringatan dini dewasa dan tanda bahaya MTBS/IMCI untuk anak.
 */
const num = (v: string) => {
  const n = Number(v.replace(',', '.'))
  return v.trim() !== '' && Number.isFinite(n) ? n : null
}

/** Usia dalam bulan dari teks bebas ("3 tahun", "8 bulan", "4 hari"); null bila tidak terbaca. */
export function ageInMonths(age: string): number | null {
  const m = age.toLowerCase().match(/(\d+(?:[.,]\d+)?)\s*(tahun|thn|th|bulan|bln|minggu|hari)/)
  if (!m) return null
  const n = Number(m[1].replace(',', '.'))
  return m[2].startsWith('t') ? n * 12 : m[2].startsWith('b') ? n : m[2] === 'minggu' ? n / 4.3 : n / 30
}

const NEGATIONS = /\b(?:tidak|tanpa|menyangkal|tak|bukan|belum|disangkal)\b/i

/** Kata kunci dianggap dinegasikan bila ada kata negasi ≤ 4 kata sebelumnya dalam klausa yang sama. */
function negated(text: string, index: number) {
  const clause = text.slice(0, index).split(/[.,;:!?\n]/).pop() ?? ''
  return NEGATIONS.test(clause.trim().split(/\s+/).slice(-4).join(' '))
}
type Rule = { id: string; level: RedFlag['level']; pattern: string; message: string; onlyStase?: Stase }
const RULES: Rule[] = [
  { id: 'nyeri-dada', level: 'segera', pattern: 'nyeri dada', message: 'Nyeri dada: pertimbangkan penyebab jantung, perlu penilaian segera.' },
  { id: 'kejang', level: 'segera', pattern: 'kejang', message: 'Kejang: amankan jalan napas dan lapor segera.' },
  { id: 'perdarahan-hebat', level: 'segera', pattern: 'perdarahan (?:hebat|banyak|aktif)', message: 'Perdarahan hebat: risiko syok, perlu penanganan segera.' },
  { id: 'perdarahan', level: 'laporkan', pattern: 'mimisan|gusi berdarah|muntah darah|bab (?:hitam|berdarah)|batuk darah',
    message: 'Perdarahan (mis. mimisan): pada demam berdarah termasuk tanda peringatan, laporkan dan pantau hemodinamik.' },
  { id: 'sesak-berat', level: 'segera', pattern: 'sesak (?:berat|hebat)|sulit berbicara (?:dalam )?satu kalimat|bicara terputus', message: 'Sesak berat: nilai jalan napas dan oksigenasi segera.' },
  { id: 'bunuh-diri', level: 'segera', pattern: '(?:ingin|ide|percobaan) bunuh diri|ingin mati|menyakiti diri', message: 'Risiko bunuh diri: jangan tinggalkan pasien sendiri, lapor segera.' },
  { id: 'kekerasan', level: 'segera', pattern: 'mengancam|memukul|membanting|mengamuk|agresif|melukai orang',
    message: 'Perilaku kekerasan/agitasi: jaga keselamatan diri dan orang lain, lakukan de-eskalasi dan lapor segera.' },
  { id: 'kesadaran-teks', level: 'segera', pattern: 'tidak sadar|pingsan', message: 'Penurunan/hilang kesadaran: nilai ABC dan lapor segera.' },
  { id: 'stroke', level: 'segera', pattern: 'bicara pelo|wajah (?:mencong|merot)|lemah (?:sebelah|separuh)', message: 'Tanda kemungkinan stroke: waktu sangat menentukan, lapor segera.' },
  { id: 'tersedak', level: 'laporkan', pattern: 'tersedak|batuk saat (?:diberi )?(?:makan|minum)', message: 'Tersedak saat makan/minum: risiko aspirasi, tunda asupan oral dan laporkan.' },
  { id: 'gejala-preeklampsia', level: 'segera', pattern: 'pandangan (?:mata )?kabur|nyeri ulu hati', onlyStase: 'maternitas',
    message: 'Pandangan kabur/nyeri ulu hati pada ibu hamil: waspada preeklampsia berat, lapor segera.' },
  { id: 'dehidrasi', level: 'laporkan', pattern: 'mata (?:tampak )?cekung|turgor (?:kulit )?(?:kembali )?(?:sangat )?lambat',
    message: 'Tanda dehidrasi (mata cekung/turgor lambat): nilai derajat dehidrasi dan laporkan.' },
  { id: 'sulit-menyusu', level: 'laporkan', pattern: 'malas menyusu|tidak mau menyusu|lemah (?:saat )?menghisap',
    message: 'Bayi/anak malas atau lemah menyusu: tanda bahaya pada bayi muda, laporkan.' },
]
const KEYWORD_RULES = RULES.map(r => ({ ...r, re: new RegExp(`\\b(?:${r.pattern})`, 'gi') }))
const mentions = (re: RegExp, text: string) => [...text.matchAll(re)].some(m => !negated(text, m.index ?? 0))

export function screenRedFlags(c: CaseInput, facts: Fact[]): RedFlag[] {
  const flags: RedFlag[] = []
  const add = (id: string, level: RedFlag['level'], message: string, fact_ids: string[]) => flags.push({ id, level, message, fact_ids })
  const v = c.vitals
  const spo2 = num(v.spo2), rr = num(v.rr), hr = num(v.hr), sbp = num(v.sbp), dbp = num(v.dbp), temp = num(v.temp)
  const months = ageInMonths(c.age)
  const child = c.stase === 'anak' || (months !== null && months < 144)

  if (spo2 !== null && spo2 < 90) add('spo2', 'segera', `SpO2 ${spo2}% (< 90%): hipoksemia, perlu evaluasi oksigenasi segera.`, ['spo2'])
  else if (spo2 !== null && spo2 < 95) add('spo2', 'laporkan', `SpO2 ${spo2}% (< 95%): oksigenasi menurun, laporkan dan pantau ketat.`, ['spo2'])

  if (rr !== null) {
    // Napas cepat anak mengikuti batas MTBS/IMCI; dewasa mengikuti kategori skor peringatan dini.
    const fast = !child ? 25 : months === null ? 30 : months < 2 ? 60 : months < 12 ? 50 : months < 60 ? 40 : 30
    if (rr <= 8 || (!child && rr >= 30)) add('rr', 'segera', `Frekuensi napas ${rr} x/menit sangat abnormal.`, ['rr'])
    else if (rr >= fast) add('rr', 'laporkan', `Frekuensi napas ${rr} x/menit di atas batas napas cepat untuk usianya (≥ ${fast}).`, ['rr'])
  }

  if (hr !== null) {
    const high = !child ? 130 : months === null ? 140 : months < 12 ? 180 : months < 60 ? 160 : 140
    if (hr >= high || hr <= 40) add('nadi', 'segera', `Nadi ${hr} x/menit sangat abnormal untuk usianya.`, ['nadi'])
    else if (!child && hr >= 111) add('nadi', 'laporkan', `Nadi ${hr} x/menit (≥ 111): takikardia, laporkan dan cari penyebabnya.`, ['nadi'])
  }

  if (sbp !== null && sbp < 90) add('hipotensi', 'segera', `Tekanan sistolik ${sbp} mmHg (< 90): waspada syok.`, ['td'])
  if ((sbp !== null && sbp >= 180) || (dbp !== null && dbp >= 120))
    add('krisis-ht', 'segera', `Tekanan darah ${sbp ?? '-'}/${dbp ?? '-'} mmHg: waspada krisis hipertensi.`, ['td'])
  else if (c.stase === 'maternitas' && ((sbp !== null && sbp >= 160) || (dbp !== null && dbp >= 110)))
    add('ht-hamil', 'segera', `Tekanan darah ${sbp ?? '-'}/${dbp ?? '-'} mmHg pada ibu hamil/nifas (≥ 160/110): rentang berat, risiko kejang, lapor segera.`, ['td'])

  if (temp !== null && (temp >= 40 || temp < 35)) add('suhu', 'segera', `Suhu ${temp} °C di luar batas aman.`, ['suhu'])
  if (['somnolen', 'sopor', 'koma'].includes(c.consciousness)) add('kesadaran', 'segera', 'Penurunan kesadaran: nilai ABC dan lapor segera.', ['gcs'])

  // Gula darah dari teks DO, mis. "GDS 386 mg/dL".
  const textFacts = facts.filter(f => ['KU', 'DS', 'DO'].includes(f.kind))
  for (const f of textFacts) {
    const m = f.text.match(/\b(?:gds|gda|gdp|gula darah(?: sewaktu| puasa)?)\D{0,12}(\d{2,3})/i)
    if (!m) continue
    const g = Number(m[1])
    if (g < 70) add('hipoglikemia', 'segera', `Gula darah ${g} mg/dL (< 70): hipoglikemia, tangani dan lapor segera.`, [f.id])
    else if (g >= 300) add('hiperglikemia', 'laporkan', `Gula darah ${g} mg/dL (≥ 300): nilai dehidrasi dan tanda krisis hiperglikemik, laporkan.`, [f.id])
    break
  }

  for (const rule of KEYWORD_RULES) {
    if (rule.onlyStase && rule.onlyStase !== c.stase) continue
    const hits = textFacts.filter(f => mentions(rule.re, f.text)).map(f => f.id)
    if (hits.length) add(rule.id, rule.level, rule.message, hits)
  }
  return flags
}
