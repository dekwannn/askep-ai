// Mengemas bank data NERSCARE (milik tim) menjadi JSON ringkas untuk aplikasi.
// Pemakaian: node scripts/build-bank.mjs <folder data NERSCARE>
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = process.argv[2]
if (!dir) throw new Error('Berikan path folder data NERSCARE, mis. ../services/nerscare-v0.6/data')
const load = name => JSON.parse(readFileSync(join(dir, `${name}.json`), 'utf8'))

const DOMAIN = {
  RESPIRASI: 'Respirasi', KARDIO_METABOLIK: 'Kardiovaskular & metabolik', CAIRAN_GINJAL: 'Cairan & eliminasi urin',
  NUTRISI_GI: 'Nutrisi & pencernaan', TERMAL_INFEKSI: 'Termoregulasi & infeksi', NYERI_KENYAMANAN: 'Nyeri & kenyamanan',
  MOBILITAS_KEAMANAN: 'Aktivitas & keamanan', TIDUR_PSIKOSOSIAL: 'Istirahat & psikososial', LUKA_PASCAOPERASI: 'Luka & pascaoperasi',
  KESEHATAN_PERILAKU: 'Perilaku kesehatan', KEBIDANAN_NEONATUS: 'Maternitas & neonatus', KELUARGA: 'Keluarga',
  KOGNISI_KOMUNIKASI: 'Kognisi & komunikasi', ANAK_TUMBUH_KEMBANG: 'Tumbuh kembang anak', KRISIS_PERILAKU: 'Krisis perilaku',
}

const diagnoses = load('diagnoses').map(d => ({
  id: d.id, label: d.label, type: d.diagnosis_type,
  domain: (d.clinical_domain ?? []).map(x => DOMAIN[x] ?? x).join(', '),
  follow_up: d.follow_up_question ?? '',
}))
const cues = load('evidence_cues').map(c => ({
  id: c.cue_id, dx: c.diagnosis_id, type: c.evidence_type, text: c.cue_text, weight: c.weight_provisional ?? 2,
}))
const aliases = load('phrase_aliases').map(a => ({ phrase: a.phrase, cue: a.suggested_cue_id }))
const group = (rows, key) => rows.reduce((m, r) => ((m[r.diagnosis_id] ??= []).includes(r[key]) || m[r.diagnosis_id].push(r[key]), m), {})
const meta = load('metadata')

const bank = {
  source: `NERSCARE bank data v${meta.version} (dikembangkan tim sebelum kompetisi)`,
  notice: 'Indikator S/O/R adalah rancangan operasional NERSCARE, bukan kriteria resmi SDKI. Label luaran/intervensi adalah kandidat untuk review.',
  diagnoses, cues, aliases,
  slki: group(load('slki_candidates'), 'slki_label_candidate'),
  siki: group(load('siki_candidates'), 'siki_label_candidate'),
}
writeFileSync(new URL('../src/data/nerscare-bank.json', import.meta.url), JSON.stringify(bank))
console.log(`OK: ${diagnoses.length} diagnosis, ${cues.length} cue, ${aliases.length} alias`)
