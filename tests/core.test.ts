import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildFacts, splitStatements } from '../src/lib/facts.ts'
import { emptyCase, parseCase } from '../src/lib/input.ts'
import { privacyIssues } from '../src/lib/privacy.ts'
import { screenRedFlags } from '../src/lib/redflags.ts'
import { SAMPLE_CASES } from '../src/lib/samples.ts'
import { vetAnalysis, vetStrengths } from '../src/lib/validate.ts'
import { buildUserPrompt } from '../src/lib/prompt.ts'
import { BANK } from '../src/lib/bank.ts'
import { retrieve, tokenize } from '../src/lib/retrieval.ts'

const sample = (id: string) => structuredClone(SAMPLE_CASES.find(s => s.id === id)!.data)

test('semua contoh kasus lolos filter privasi', () => {
  for (const s of SAMPLE_CASES) assert.deepEqual(privacyIssues(s.data), [], s.id)
})

test('privasi menolak NIK, telepon, nama lengkap, dan label bukan inisial', () => {
  const c = emptyCase()
  c.label = 'Tn. Budi'
  c.subjective = 'NIK 5171012304990001, hubungi 081234567890. Ny. Sulastri datang.'
  const issues = privacyIssues(c)
  assert.ok(issues.some(i => i.includes('NIK')))
  assert.ok(issues.some(i => i.includes('telepon')))
  assert.ok(issues.some(i => i.includes('nama lengkap')))
  assert.ok(issues.some(i => i.includes('inisial')))
})

test('fakta dipecah per pernyataan dan identitas tidak ikut', () => {
  const facts = buildFacts(sample('kmb-pneumonia'))
  assert.ok(facts.some(f => f.id === 'ds1'))
  assert.ok(facts.some(f => f.id === 'spo2' && f.text.includes('93')))
  assert.ok(!facts.some(f => f.text.includes('Tn. K')))
  assert.deepEqual(splitStatements('a sesak\n- b batuk; c demam'), ['a sesak', 'b batuk', 'c demam'])
})

test('red flag muncul pada kasus nyeri dada dan tidak pada kasus ringan', () => {
  const gadar = sample('gadar-nyeri-dada')
  const flags = screenRedFlags(gadar, buildFacts(gadar)).map(f => f.id)
  assert.ok(flags.includes('spo2'))
  assert.ok(flags.includes('hipotensi'))
  assert.ok(flags.includes('nyeri-dada'))
  const post = sample('maternitas-post-sc')
  assert.deepEqual(screenRedFlags(post, buildFacts(post)), [])
})

test('kata kunci yang dinegasikan tidak memicu red flag', () => {
  const c = emptyCase()
  c.chief_complaint = 'Kontrol rutin'
  c.subjective = 'Pasien mengatakan tidak ada nyeri dada'
  assert.equal(screenRedFlags(c, buildFacts(c)).length, 0)
})

test('validasi membuang kandidat di luar bank data atau tanpa bukti', () => {
  const c = sample('kmb-pneumonia')
  const facts = buildFacts(c)
  const retrieved = retrieve(c, facts)
  const raw = {
    summary: 'ok', evidence_groups: [{ kind: 'DS', fact_ids: ['ds1', 'palsu'], meaning: 'x' }], data_gaps: [],
    candidates: [
      { dx_id: 'NC-DX-007', priority: 'sedang', evidence_ids: ['spo2'], rationale: 'r', outcome_goal: 'o', interventions: ['i'], uncertainty: 'u' },
      { dx_id: 'NC-DX-002', priority: 'tinggi', evidence_ids: ['ds1', 'do1'], rationale: 'r', outcome_goal: 'o', interventions: ['i'], uncertainty: 'u' },
      { dx_id: 'DX-KARANGAN', priority: 'tinggi', evidence_ids: ['ds1'], rationale: '', outcome_goal: '', interventions: [], uncertainty: '' },
      { dx_id: 'NC-DX-008', priority: 'rendah', evidence_ids: ['tidak-ada'], rationale: '', outcome_goal: '', interventions: [], uncertainty: '' },
    ],
    student_feedback: { strengths: [], improvements: [], verdict: 'v' }, learning_questions: ['q'], danger_signs: [],
  }
  const a = vetAnalysis(raw, facts, retrieved, [], 'test', 'Bersihan jalan napas')
  assert.deepEqual(a.candidates.map(x => x.dx_id), ['NC-DX-002', 'NC-DX-007'])
  assert.equal(a.dropped, 2)
  assert.ok(a.candidates[0].bank && a.candidates[0].bank.matched.length > 0, 'kandidat hasil retrieval membawa bukti bank data')
  assert.ok(a.candidates[0].siki.length > 0)
  assert.deepEqual(a.evidence_groups[0].fact_ids, ['ds1'])
  assert.throws(() => vetAnalysis('bukan objek', facts, retrieved, [], 'test', ''))
})

test('negasi dibedakan saat tokenisasi', () => {
  assert.deepEqual(tokenize('Pasien tidak sesak'), ['tidak_sesak'])
  assert.deepEqual(tokenize('Batuk tidak efektif'), ['batuk', 'tidak_efektif'])
})

test('retrieval bank data menemukan diagnosis yang relevan pada contoh kasus', () => {
  const top = (id: string, n = 3) => { const c = sample(id); return retrieve(c, buildFacts(c)).slice(0, n).map(r => r.label.toLowerCase()) }
  assert.ok(top('kmb-pneumonia').includes('bersihan jalan napas tidak efektif'))
  assert.ok(top('anak-diare').includes('diare'))
  assert.ok(top('maternitas-post-sc', 6).includes('nyeri akut'))
  assert.ok(top('gadar-nyeri-dada', 10).includes('penurunan curah jantung'))
  assert.ok(top('gadar-nyeri-dada', 10).includes('gangguan pertukaran gas'))
})

test('versi "Risiko X" dibuang bila masalah aktual X sudah dipilih', () => {
  const c = sample('anak-diare')
  const facts = buildFacts(c)
  const id = (label: string) => BANK.diagnoses.find(d => d.label === label)!.id
  const cand = (dx_id: string) => ({ dx_id, priority: 'sedang', evidence_ids: ['do1'], rationale: '', outcome_goal: '', interventions: [], uncertainty: '' })
  const raw = { summary: '', evidence_groups: [], data_gaps: [], learning_questions: [], danger_signs: [], student_feedback: null,
    candidates: [cand(id('Hipovolemia')), cand(id('Risiko hipovolemia')), cand(id('Diare'))] }
  const a = vetAnalysis(raw, facts, retrieve(c, facts), [], 'test', '')
  assert.deepEqual(a.candidates.map(x => x.label), ['Hipovolemia', 'Diare'])
  assert.equal(a.dropped, 1)
})

test('parseCase membatasi field dan menormalkan nilai tak dikenal', () => {
  const c = parseCase({ stase: 'hacker', sex: 'X', subjective: 'a'.repeat(9000), vitals: 'x' })
  assert.equal(c.stase, 'kmb')
  assert.equal(c.sex, '')
  assert.equal(c.subjective.length, 2500)
  assert.equal(c.vitals.spo2, '')
})

test('prompt memuat hasil retrieval + sisa diagnosis bank, tanpa inisial pasien', () => {
  const c = sample('anak-diare')
  const facts = buildFacts(c)
  const retrieved = retrieve(c, facts)
  const prompt = JSON.parse(buildUserPrompt(c, facts, retrieved))
  assert.equal(prompt.KANDIDAT_BANK_DATA.length + prompt.DAFTAR_DIAGNOSIS_LAIN.split('; ').length, BANK.diagnoses.length)
  assert.ok(!JSON.stringify(prompt).includes('An. D'))
})

test('pujian hanya dipertahankan bila mengutip jawaban mahasiswa', () => {
  const student = 'Hipertermia\nSuhu 38,6 dan pasien lemas'
  const kept = vetStrengths([
    { quote: 'suhu 38,6', comment: 'Data suhu dipakai sebagai bukti.' },
    { quote: 'menyebutkan kebutuhan cairan', comment: 'Pujian karangan.' },
    { quote: 'x', comment: 'Terlalu pendek.' },
  ], student)
  assert.deepEqual(kept.map(k => k.quote), ['suhu 38,6'])
  assert.deepEqual(vetStrengths([{ quote: 'suhu', comment: 'c' }], ''), [])
})

test('semua kasus evaluasi lolos filter privasi dan punya data cukup', async () => {
  const { EVAL_CASES } = await import('../eval/cases.ts')
  assert.equal(EVAL_CASES.length, 20)
  assert.equal(new Set(EVAL_CASES.map(c => c.id)).size, 20)
  for (const c of EVAL_CASES) {
    assert.deepEqual(privacyIssues(c.data), [], c.id)
    assert.ok(buildFacts(c.data).filter(f => f.kind !== 'TTV').length >= 3, c.id)
  }
})

test('tanda bahaya bertingkat, sesuai usia dan stase', async () => {
  const { ageInMonths } = await import('../src/lib/redflags.ts')
  assert.equal(ageInMonths('3 tahun'), 36)
  assert.equal(ageInMonths('8 bulan'), 8)
  assert.ok(Math.abs(ageInMonths('4 hari')! - 0.13) < 0.01)
  const flagsOf = (patch: Partial<typeof c>) => { const x = { ...c, ...patch }; return screenRedFlags(x, buildFacts(x)) }
  const c = emptyCase()
  c.chief_complaint = 'Kontrol'; c.subjective = 'Pasien mengatakan baik'
  // RR 30: napas cepat untuk anak 3 tahun? Tidak (batas 40). Untuk dewasa: segera.
  assert.deepEqual(flagsOf({ age: '3 tahun', stase: 'anak', vitals: { ...c.vitals, rr: '30' } }), [])
  assert.equal(flagsOf({ age: '30 tahun', vitals: { ...c.vitals, rr: '30' } })[0].level, 'segera')
  assert.equal(flagsOf({ age: '8 bulan', stase: 'anak', vitals: { ...c.vitals, rr: '52' } })[0].level, 'laporkan')
  // SpO2 93: laporkan; 88: segera.
  assert.equal(flagsOf({ vitals: { ...c.vitals, spo2: '93' } })[0].level, 'laporkan')
  assert.equal(flagsOf({ vitals: { ...c.vitals, spo2: '88' } })[0].level, 'segera')
  // TD 168/100: bukan tanda bahaya umum, tetapi 170/110 pada maternitas: segera.
  assert.deepEqual(flagsOf({ vitals: { ...c.vitals, sbp: '168', dbp: '100' } }), [])
  assert.equal(flagsOf({ stase: 'maternitas', vitals: { ...c.vitals, sbp: '170', dbp: '110' } })[0].id, 'ht-hamil')
  // Gula darah dari teks DO.
  assert.equal(flagsOf({ objective: 'GDS 386 mg/dL' })[0].id, 'hiperglikemia')
  assert.equal(flagsOf({ objective: 'Gula darah sewaktu 54 mg/dL' })[0].id, 'hipoglikemia')
  // Negasi dan konteks: "tidak memukul" bukan tanda bahaya; "sulit berbicara" (afasia) bukan sesak.
  assert.deepEqual(flagsOf({ objective: 'Pasien tidak memukul atau mengancam' }), [])
  assert.ok(!flagsOf({ objective: 'Pasien sulit berbicara dan bicaranya tidak jelas' }).some(f => f.id === 'sesak-berat'))
})

test('istilah klinis tidak dianggap alamat, alamat sungguhan tetap ditolak', () => {
  const withText = (t: string) => ({ ...emptyCase(), student_diagnosis: t })
  for (const ok of ['Bersihan jalan napas tidak efektif', 'Bersihan Jalan Napas Tidak Efektif', 'Pasien belum bisa berjalan ke kamar mandi'])
    assert.deepEqual(privacyIssues(withText(ok)), [], ok)
  for (const bad of ['Tinggal di Jl. Sudirman', 'Rumah di Jalan Merdeka Barat No. 12', 'gg. mawar'])
    assert.ok(privacyIssues(withText(bad)).some(i => i.includes('alamat')), bad)
})
