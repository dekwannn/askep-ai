'use client'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CaseForm } from './CaseForm'
import { AnalysisView, FactList, RedFlags, RetrievalList, type Decision } from './AnalysisView'
import { emptyCase } from '@/lib/input'
import { SAMPLE_CASES } from '@/lib/samples'
import type { Analysis, CaseInput, Fact, RedFlag } from '@/lib/types'

type Mode = 'tutor' | 'eksplorasi'
type Saved = {
  id: string; saved_at: string; input: CaseInput; analysis: Analysis
  decisions: Record<string, Decision>; reflection: string; revealed: boolean
}
type Failure = { message: string; issues?: string[]; red_flags?: RedFlag[]; facts?: Fact[]; retrieval?: Analysis['retrieval'] }

const STORAGE_KEY = 'askep-tutor-history-v2'
const loadHistory = (): Saved[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Saved[] } catch { return [] }
}
const storeHistory = (items: Saved[]) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 20))) } catch { /* penyimpanan lokal opsional */ }
}

export function Workspace() {
  const params = useSearchParams()
  const [input, setInput] = useState<CaseInput>(emptyCase)
  const [confirmed, setConfirmed] = useState(false)
  const [mode, setMode] = useState<Mode>('tutor')
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<Failure | null>(null)
  const [current, setCurrent] = useState<Saved | null>(null)
  const [history, setHistory] = useState<Saved[]>([])
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setHistory(loadHistory())
    const sample = SAMPLE_CASES.find(s => s.id === params.get('contoh'))
    if (sample) setInput(structuredClone(sample.data))
  }, [params])

  // Simpan keputusan & refleksi ke riwayat lokal setiap kali berubah.
  useEffect(() => {
    if (!current) return
    setHistory(prev => {
      const next = [current, ...prev.filter(h => h.id !== current.id)]
      storeHistory(next)
      return next
    })
  }, [current])

  function loadSample(id: string) {
    const sample = SAMPLE_CASES.find(s => s.id === id)
    if (!sample) return
    setInput(structuredClone(sample.data))
    setCurrent(null); setFailure(null)
  }

  async function analyze(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setFailure(null)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case: input, confirm_simulation: confirmed }),
      })
      const data = await res.json().catch(() => ({ message: 'Respons server tidak valid.' }))
      if (!res.ok) { setFailure(data as Failure); setCurrent(null); return }
      setCurrent({
        id: crypto.randomUUID(), saved_at: new Date().toISOString(), input, analysis: data.analysis,
        decisions: {}, reflection: '', revealed: mode === 'eksplorasi',
      })
    } catch {
      setFailure({ message: 'Tidak dapat terhubung ke server. Periksa koneksi internet.' })
    } finally {
      setBusy(false)
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    }
  }

  const needsAnswer = mode === 'tutor' && input.student_diagnosis.trim() === ''

  function reset() {
    setInput(emptyCase()); setCurrent(null); setFailure(null); setConfirmed(false)
  }

  function removeHistory(id: string) {
    setHistory(prev => { const next = prev.filter(h => h.id !== id); storeHistory(next); return next })
    if (current?.id === id) setCurrent(null)
  }

  return (
    <div className="workspace">
      <form className="card" onSubmit={analyze}>
        <div className="panel-head">
          <h1 style={{ fontSize: '1.4rem', margin: 0 }}>Kasus simulasi</h1>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <select aria-label="Muat contoh kasus" value="" onChange={e => loadSample(e.target.value)} style={{ width: 'auto' }}>
              <option value="">Muat contoh kasus…</option>
              {SAMPLE_CASES.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
            <button type="button" className="btn subtle small" onClick={reset}>Kosongkan</button>
          </div>
        </div>
        <p className="notice warn small">Gunakan <strong>kasus fiktif</strong> saja. Jangan masukkan nama, NIK, nomor rekam medis, alamat, atau data pasien nyata.</p>
        <CaseForm value={input} onChange={setInput} />
        <div className="stack" style={{ marginTop: 16 }}>
          <fieldset>
            <legend>Mode latihan</legend>
            <label className="check">
              <input type="radio" name="mode" checked={mode === 'tutor'} onChange={() => setMode('tutor')} />
              <span><strong>Mode tutor (disarankan)</strong>: tulis diagnosismu dulu, terima umpan balik, baru buka pembahasan AI.</span>
            </label>
            <label className="check" style={{ marginTop: 8 }}>
              <input type="radio" name="mode" checked={mode === 'eksplorasi'} onChange={() => setMode('eksplorasi')} />
              <span><strong>Mode eksplorasi</strong>: langsung tampilkan pembahasan lengkap.</span>
            </label>
          </fieldset>
          {needsAnswer && <p className="notice warn small">Mode tutor: isi dulu <strong>diagnosis keperawatan menurutmu</strong> di bagian 3.</p>}
          <label className="check">
            <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />
            <span>Saya menyatakan kasus ini fiktif/simulasi dan memahami bahwa hasil AI hanya untuk belajar.</span>
          </label>
          <button className="btn" type="submit" disabled={!confirmed || busy || needsAnswer} style={{ width: '100%' }}>
            {busy ? <><span className="spinner" aria-hidden /> AI sedang menganalisis…</> : 'Analisis dengan Tutor AI'}
          </button>
        </div>
      </form>

      <div ref={resultRef} className="stack">
        <section className="card" aria-live="polite">
          <div className="panel-head">
            <h2 style={{ margin: 0 }}>Hasil analisis</h2>
            {current && <button type="button" className="btn subtle small no-print" onClick={() => window.print()}>Cetak / simpan PDF</button>}
          </div>
          {busy && <p className="empty"><span className="spinner" style={{ display: 'inline-block' }} /> Menganalisis kasus, biasanya 5–20 detik…</p>}
          {!busy && failure && (
            <div className="stack">
              <div className="notice danger" role="alert">
                <strong>{failure.message}</strong>
                {failure.issues && <ul>{failure.issues.map(i => <li key={i}>{i}</li>)}</ul>}
              </div>
              {failure.red_flags && <RedFlags flags={failure.red_flags} />}
              {failure.facts && <><h3>Fakta yang terbaca</h3><FactList facts={failure.facts} highlight={new Set()} /></>}
              {failure.retrieval && <RetrievalList items={failure.retrieval} />}
            </div>
          )}
          {!busy && !failure && current && (
            <AnalysisView
              key={current.id}
              analysis={current.analysis}
              decisions={current.decisions}
              onDecide={(id, d) => setCurrent({ ...current, decisions: { ...current.decisions, [id]: d } })}
              reflection={current.reflection}
              onReflect={text => setCurrent({ ...current, reflection: text })}
              revealed={current.revealed}
              onReveal={() => setCurrent({ ...current, revealed: true })}
            />
          )}
          {!busy && !failure && !current && (
            <div className="empty">
              <p><strong>Belum ada analisis.</strong></p>
              <p className="small">Isi kasus atau muat contoh kasus, centang pernyataan simulasi, lalu tekan “Analisis dengan Tutor AI”.</p>
            </div>
          )}
        </section>

        {history.length > 0 && (
          <section className="card no-print">
            <h2>Riwayat latihan (tersimpan di perangkat ini)</h2>
            <ul className="history">
              {history.map(h => (
                <li key={h.id}>
                  <button type="button" className="btn ghost small" style={{ textAlign: 'left' }}
                    onClick={() => { setInput(h.input); setCurrent(h); setFailure(null) }}>
                    {h.input.label || 'Kasus'} · {h.input.chief_complaint.slice(0, 40) || 'tanpa keluhan'}
                  </button>
                  <span className="meta">{new Date(h.saved_at).toLocaleString('id-ID')}
                    {' '}<button type="button" className="btn subtle small" aria-label="Hapus riwayat" onClick={() => removeHistory(h.id)}>Hapus</button>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}
