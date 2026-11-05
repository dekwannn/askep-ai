/**
 * Evaluasi akurasi Askep Tutor AI terhadap kunci jawaban ahli keperawatan.
 *
 *   npm run eval:sheets   → buat lembar kasus + template kunci jawaban + daftar diagnosis bank
 *   npm run eval          → jalankan retrieval & AI untuk kasus yang kuncinya sudah diisi
 *
 * Kunci jawaban (eval/kunci_jawaban.csv, pemisah titik koma, bisa dibuka di Excel):
 *   diagnosis_utama          → diagnosis yang WAJIB muncul (pisahkan beberapa dengan |)
 *   diagnosis_dapat_diterima → diagnosis lain yang masih benar
 *   tanda_bahaya             → ya / tidak
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { BANK } from '../src/lib/bank.ts'
import { buildFacts } from '../src/lib/facts.ts'
import { generateAnalysis } from '../src/lib/groq.ts'
import { SYSTEM_PROMPT, buildUserPrompt } from '../src/lib/prompt.ts'
import { screenRedFlags } from '../src/lib/redflags.ts'
import { retrieve } from '../src/lib/retrieval.ts'
import { vetAnalysis } from '../src/lib/validate.ts'
import { EVAL_CASES } from './cases.ts'

const dir = new URL('./', import.meta.url)
// EVAL_KEY_FILE: kunci alternatif (mis. untuk menguji script tanpa menyentuh kunci resmi ahli).
const KEY_FILE = process.env.EVAL_KEY_FILE ? pathToFileURL(process.env.EVAL_KEY_FILE) : new URL('kunci_jawaban.csv', dir)
const HEADER = ['case_id', 'judul', 'diagnosis_utama', 'diagnosis_dapat_diterima', 'tanda_bahaya', 'catatan_ahli']

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = [], cell = '', quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++ } else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === ';') { row.push(cell); cell = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cell); rows.push(row); row = []; cell = ''
    } else cell += ch
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows.filter(r => r.some(c => c.trim()))
}
const csvCell = (v: string) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
const writeCsv = (url: URL, rows: string[][]) =>
  writeFileSync(url, '﻿' + rows.map(r => r.map(csvCell).join(';')).join('\r\n') + '\r\n')

const LABELS = new Map(BANK.diagnoses.map(d => [d.label.toLowerCase(), d.label]))
const labelsOf = (cell: string) => cell.split('|').map(x => x.trim().toLowerCase()).filter(Boolean)

function makeSheets() {
  writeCsv(new URL('daftar_diagnosis_bank.csv', dir), [['id', 'diagnosis', 'jenis', 'domain'],
    ...BANK.diagnoses.map(d => [d.id, d.label, d.type, d.domain])])
  const keyExisted = existsSync(KEY_FILE)
  if (!keyExisted) writeCsv(KEY_FILE, [HEADER, ...EVAL_CASES.map(c => [c.id, c.title, '', '', '', ''])])
  const md = ['# Lembar Kasus Evaluasi', '',
    'Semua kasus FIKTIF. Untuk setiap kasus, isi `eval/kunci_jawaban.csv`: diagnosis utama (wajib muncul),',
    'diagnosis yang masih dapat diterima, dan ada/tidaknya tanda bahaya. Gunakan nama diagnosis persis seperti di',
    '`eval/daftar_diagnosis_bank.csv`; pisahkan beberapa diagnosis dengan `|`. Mohon juga koreksi isi kasus bila tidak realistis.', '']
  for (const c of EVAL_CASES) {
    const d = c.data, vv = d.vitals, p = d.pqrst
    md.push(`## ${c.id}: ${c.title}`, '',
      `- **Identitas:** ${d.label}, ${d.age}, ${d.sex === 'L' ? 'laki-laki' : 'perempuan'}, ${d.setting}`,
      `- **Keluhan utama:** ${d.chief_complaint}`,
      `- **DS:** ${d.subjective.split('\n').join(' / ')}`,
      `- **DO:** ${d.objective.split('\n').join(' / ')}`,
      `- **TTV:** TD ${vv.sbp || '-'}/${vv.dbp || '-'} mmHg, N ${vv.hr || '-'}, RR ${vv.rr || '-'}, S ${vv.temp || '-'} °C, SpO2 ${vv.spo2 || '-'}%`)
    if (Object.values(p).some(Boolean)) md.push(`- **PQRST:** P: ${p.p} / Q: ${p.q} / R: ${p.r} / S: ${p.s} / T: ${p.t}`)
    if (d.history) md.push(`- **Riwayat:** ${d.history}`)
    md.push('')
  }
  writeFileSync(new URL('LEMBAR_KASUS.md', dir), md.join('\n'))
  console.log('Dibuat: eval/LEMBAR_KASUS.md, eval/daftar_diagnosis_bank.csv, ' +
    (keyExisted ? 'kunci jawaban sudah ada (tidak ditimpa)' : 'eval/kunci_jawaban.csv (template kosong)'))
}

type Key = { primary: string[]; acceptable: string[]; redFlag: boolean | null }
function loadKeys(): Map<string, Key> {
  const rows = parseCsv(readFileSync(KEY_FILE, 'utf8').replace(/^﻿/, ''))
  const idx = Object.fromEntries(rows[0].map((h, i) => [h.trim(), i]))
  const keys = new Map<string, Key>()
  for (const r of rows.slice(1)) {
    const primary = labelsOf(r[idx.diagnosis_utama] ?? '')
    if (!primary.length) continue
    const acceptable = labelsOf(r[idx.diagnosis_dapat_diterima] ?? '')
    for (const l of [...primary, ...acceptable]) if (!LABELS.has(l)) console.warn(`! ${r[0]}: "${l}" tidak ada di bank data (cek ejaan di daftar_diagnosis_bank.csv)`)
    const rf = (r[idx.tanda_bahaya] ?? '').trim().toLowerCase()
    keys.set(r[0].trim(), { primary, acceptable, redFlag: rf === 'ya' ? true : rf === 'tidak' ? false : null })
  }
  return keys
}

const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : '-')
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function run() {
  try { process.loadEnvFile(new URL('../.env.local', dir)) } catch { /* boleh pakai env shell */ }
  const keys = loadKeys()
  const cases = EVAL_CASES.filter(c => keys.has(c.id))
  if (!cases.length) { console.log('Belum ada kunci jawaban yang diisi di eval/kunci_jawaban.csv'); return }
  console.log(`Mengevaluasi ${cases.length} kasus (jeda antar kasus untuk menjaga kuota)…`)

  const rows: Array<Record<string, unknown>> = []
  for (const [i, c] of cases.entries()) {
    if (i) await sleep(Number(process.env.EVAL_DELAY_MS ?? 15_000))
    const key = keys.get(c.id)!
    const facts = buildFacts(c.data)
    const flags = screenRedFlags(c.data, facts)
    const retrieved = retrieve(c.data, facts)
    const retLabels = retrieved.map(r => r.label.toLowerCase())
    const row: Record<string, unknown> = {
      id: c.id,
      retrieval_hit3: key.primary.some(p => retLabels.slice(0, 3).includes(p)),
      retrieval_recall10: key.primary.filter(p => retLabels.includes(p)).length / key.primary.length,
      redflag_ok: key.redFlag === null ? null : (flags.length > 0) === key.redFlag,
    }
    const t0 = Date.now()
    try {
      const { raw, model } = await generateAnalysis(SYSTEM_PROMPT, buildUserPrompt(c.data, facts, retrieved, flags))
      const a = vetAnalysis(raw, facts, retrieved, flags, model, '')
      const ai = a.candidates.map(x => x.label.toLowerCase())
      const ok = new Set([...key.primary, ...key.acceptable])
      Object.assign(row, {
        model, seconds: (Date.now() - t0) / 1000,
        ai_hit1: key.primary.includes(ai[0] ?? ''),
        ai_hit3: key.primary.some(p => ai.slice(0, 3).includes(p)),
        ai_recall: key.primary.filter(p => ai.includes(p)).length / key.primary.length,
        ai_precision: ai.length ? ai.filter(x => ok.has(x)).length / ai.length : 0,
        ai_labels: a.candidates.map(x => x.label), dropped: a.dropped,
      })
    } catch (e) {
      row.error = e instanceof Error ? e.message : String(e)
    }
    row.expected = key.primary.map(p => LABELS.get(p) ?? p)
    row.retrieval_top3 = retrieved.slice(0, 3).map(r => r.label)
    rows.push(row)
    console.log(`${c.id}: retrieval@3=${row.retrieval_hit3 ? 'ya' : 'tidak'} | AI@3=${row.error ? 'ERROR ' + row.error : row.ai_hit3 ? 'ya' : 'tidak'}`)
  }

  const okRows = rows.filter(r => !r.error)
  const count = (k: string, rs = rows) => rs.filter(r => r[k] === true).length
  const avg = (k: string, rs: typeof rows) => (rs.length ? rs.reduce((s, r) => s + Number(r[k] ?? 0), 0) / rs.length : 0)
  const rfRows = rows.filter(r => r.redflag_ok !== null)
  const summary = [
    ['Kasus dievaluasi', `${rows.length} (AI berhasil: ${okRows.length})`],
    ['Retrieval saja: diagnosis utama di 3 teratas', pct(count('retrieval_hit3'), rows.length)],
    ['Retrieval saja: recall diagnosis utama di 10 teratas', pct(avg('retrieval_recall10', rows) * 100, 100)],
    ['Retrieval + AI: kandidat pertama = diagnosis utama', pct(count('ai_hit1', okRows), okRows.length)],
    ['Retrieval + AI: diagnosis utama di 3 teratas', pct(count('ai_hit3', okRows), okRows.length)],
    ['Retrieval + AI: recall diagnosis utama', pct(avg('ai_recall', okRows) * 100, 100)],
    ['Retrieval + AI: presisi (kandidat yang benar)', pct(avg('ai_precision', okRows) * 100, 100)],
    ['Skrining tanda bahaya sesuai kunci', pct(rfRows.filter(r => r.redflag_ok === true).length, rfRows.length)],
    ['Rata-rata waktu analisis AI', `${avg('seconds', okRows).toFixed(1)} detik`],
  ]
  const yn = (x: unknown) => (x === true ? '✔' : x === false ? '✘' : '-')
  const md = ['# Hasil Evaluasi Askep Tutor AI', '', `Tanggal: ${new Date().toLocaleString('id-ID')}`, '',
    '| Metrik | Nilai |', '|---|---|', ...summary.map(([k, v]) => `| ${k} | ${v} |`), '',
    '| Kasus | Kunci (utama) | Retrieval top-3 | AI | Ret@3 | AI@1 | AI@3 |', '|---|---|---|---|---|---|---|',
    ...rows.map(r => `| ${r.id} | ${(r.expected as string[]).join(', ')} | ${(r.retrieval_top3 as string[]).join(', ')} | ${r.error ? 'ERROR' : (r.ai_labels as string[]).join(', ')} | ${yn(r.retrieval_hit3)} | ${yn(r.ai_hit1)} | ${yn(r.ai_hit3)} |`),
    '', 'Catatan: kunci jawaban disusun oleh anggota tim bidang keperawatan. Hasil AI dapat sedikit berbeda di setiap run.']
  writeFileSync(new URL('HASIL_EVALUASI.md', dir), md.join('\n'))
  writeFileSync(new URL('hasil_evaluasi.json', dir), JSON.stringify(rows, null, 2))
  console.log('\n' + summary.map(([k, v]) => `${k}: ${v}`).join('\n') + '\n\nLaporan: eval/HASIL_EVALUASI.md')
}

if (process.argv[2] === 'sheets') makeSheets()
else await run()
