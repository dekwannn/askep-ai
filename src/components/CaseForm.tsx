'use client'
import type { CaseInput } from '@/lib/types'

type Props = { value: CaseInput; onChange: (next: CaseInput) => void }

const STASE_OPTIONS: Array<[CaseInput['stase'], string]> = [
  ['kmb', 'Medikal Bedah (KMB)'], ['maternitas', 'Maternitas'], ['anak', 'Anak'], ['gadar', 'Gawat Darurat'],
  ['jiwa', 'Jiwa'], ['komunitas', 'Komunitas/Keluarga'], ['gerontik', 'Gerontik'],
]

const VITALS: Array<[keyof CaseInput['vitals'], string, string]> = [
  ['sbp', 'TD sistolik', 'mmHg'], ['dbp', 'TD diastolik', 'mmHg'], ['hr', 'Nadi', 'x/menit'],
  ['rr', 'Napas', 'x/menit'], ['temp', 'Suhu', '°C'], ['spo2', 'SpO2', '%'],
]

const PQRST: Array<[keyof CaseInput['pqrst'], string, string]> = [
  ['p', 'P: Provokatif/paliatif', 'Apa yang memicu/meredakan?'],
  ['q', 'Q: Kualitas', 'Seperti ditusuk, disayat, ditekan…'],
  ['r', 'R: Region/radiasi', 'Lokasi dan penjalaran'],
  ['s', 'S: Skala', 'mis. 6 dari 10 (NRS)'],
  ['t', 'T: Waktu', 'Kapan, berapa lama, hilang-timbul?'],
]

export function CaseForm({ value: c, onChange }: Props) {
  const set = <K extends keyof CaseInput>(key: K, v: CaseInput[K]) => onChange({ ...c, [key]: v })
  const hasPain = /nyeri|sakit/i.test(`${c.chief_complaint} ${c.subjective}`) || Object.values(c.pqrst).some(Boolean)

  return (
    <div className="stack">
      <fieldset>
        <legend>1. Identitas simulasi</legend>
        <div className="row">
          <label className="field"><span>Inisial</span>
            <input value={c.label} placeholder="Tn. K" maxLength={20} onChange={e => set('label', e.target.value)} />
          </label>
          <label className="field"><span>Usia</span>
            <input value={c.age} placeholder="58 tahun" maxLength={20} onChange={e => set('age', e.target.value)} />
          </label>
          <label className="field"><span>Jenis kelamin</span>
            <select value={c.sex} onChange={e => set('sex', e.target.value as CaseInput['sex'])}>
              <option value="">-</option><option value="L">Laki-laki</option><option value="P">Perempuan</option>
            </select>
          </label>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <label className="field"><span>Stase</span>
            <select value={c.stase} onChange={e => set('stase', e.target.value as CaseInput['stase'])}>
              {STASE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label className="field"><span>Setting</span>
            <input value={c.setting} placeholder="Ruang rawat inap" maxLength={120} onChange={e => set('setting', e.target.value)} />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>2. Pengkajian</legend>
        <div className="stack">
          <label className="field"><span>Keluhan utama</span>
            <input value={c.chief_complaint} maxLength={400} onChange={e => set('chief_complaint', e.target.value)} />
          </label>
          <label className="field"><span>Data subjektif (DS)</span>
            <textarea value={c.subjective} maxLength={2500} placeholder={'Satu pernyataan per baris, mis.\nPasien mengatakan …'}
              onChange={e => set('subjective', e.target.value)} />
          </label>
          <label className="field"><span>Data objektif (DO)</span>
            <textarea value={c.objective} maxLength={2500} placeholder={'Satu temuan per baris, mis.\nPasien tampak …'}
              onChange={e => set('objective', e.target.value)} />
          </label>
          <div>
            <span className="field"><span>Tanda vital</span></span>
            <div className="vitals" style={{ marginTop: 6 }}>
              {VITALS.map(([k, l, unit]) => (
                <label className="field" key={k}><small>{l} ({unit})</small>
                  <input inputMode="decimal" value={c.vitals[k]} maxLength={6}
                    onChange={e => set('vitals', { ...c.vitals, [k]: e.target.value })} />
                </label>
              ))}
            </div>
          </div>
          <label className="field"><span>Tingkat kesadaran</span>
            <select value={c.consciousness} onChange={e => set('consciousness', e.target.value as CaseInput['consciousness'])}>
              <option value="">Belum dinilai</option><option value="compos_mentis">Compos mentis</option>
              <option value="apatis">Apatis</option><option value="somnolen">Somnolen</option>
              <option value="sopor">Sopor</option><option value="koma">Koma</option>
            </select>
          </label>
          <details open={hasPain}>
            <summary>Pengkajian nyeri PQRST {hasPain ? '' : '(jika ada keluhan nyeri)'}</summary>
            <div className="stack" style={{ marginTop: 10 }}>
              {PQRST.map(([k, l, ph]) => (
                <label className="field" key={k}><span>{l}</span>
                  <input value={c.pqrst[k]} placeholder={ph} maxLength={200}
                    onChange={e => set('pqrst', { ...c.pqrst, [k]: e.target.value })} />
                </label>
              ))}
            </div>
          </details>
          <label className="field"><span>Riwayat singkat</span>
            <textarea value={c.history} maxLength={1200} style={{ minHeight: 64 }} onChange={e => set('history', e.target.value)} />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>3. Analisismu</legend>
        <p className="small muted">Tulis dulu diagnosis keperawatan versimu supaya AI bisa memberi umpan balik atas cara berpikirmu.</p>
        <div className="stack">
          <label className="field"><span>Diagnosis keperawatan menurutmu</span>
            <input value={c.student_diagnosis} maxLength={300} placeholder="mis. Bersihan jalan napas tidak efektif"
              onChange={e => set('student_diagnosis', e.target.value)} />
          </label>
          <label className="field"><span>Alasan / data pendukung</span>
            <textarea value={c.student_rationale} maxLength={1000} style={{ minHeight: 70 }}
              onChange={e => set('student_rationale', e.target.value)} />
          </label>
        </div>
      </fieldset>
    </div>
  )
}
