'use client'
import { useState } from 'react'
import type { Analysis, Fact, RedFlag } from '@/lib/types'

export type Decision = 'setuju' | 'ragu' | 'tolak'
type Props = {
  analysis: Analysis
  decisions: Record<string, Decision>
  onDecide: (id: string, d: Decision) => void
  reflection: string
  onReflect: (text: string) => void
  /** Mode tutor: pembahasan AI baru dibuka setelah mahasiswa membaca umpan balik. */
  revealed: boolean
  onReveal: () => void
}

export function RedFlags({ flags }: { flags: RedFlag[] }) {
  if (!flags.length) return null
  const urgent = flags.filter(f => f.level === 'segera'), report = flags.filter(f => f.level !== 'segera')
  return (
    <div className="stack">
      {urgent.length > 0 && (
        <div className="notice danger" role="alert">
          <strong>Tanda bahaya: nilai dan lapor SEGERA (skrining berbasis aturan)</strong>
          <ul>{urgent.map(f => <li key={f.id}>{f.message}</li>)}</ul>
        </div>
      )}
      {report.length > 0 && (
        <div className="notice warn" role={urgent.length ? undefined : 'alert'}>
          <strong>Perlu dilaporkan ke perawat penanggung jawab/CI</strong>
          <ul>{report.map(f => <li key={f.id}>{f.message}</li>)}</ul>
        </div>
      )}
      <p className="small muted" style={{ margin: 0 }}>Ambang bersifat edukatif, bukan protokol triase resmi. Pada situasi nyata lakukan penilaian langsung.</p>
    </div>
  )
}

export function FactList({ facts, highlight }: { facts: Fact[]; highlight: Set<string> }) {
  return (
    <div className="facts">
      {facts.map(f => (
        <span key={f.id} className={`fact${highlight.has(f.id) ? ' hl' : ''}`} title={f.kind}><b>{f.id}</b>{f.text}</span>
      ))}
    </div>
  )
}

export function RetrievalList({ items }: { items: Analysis['retrieval'] }) {
  return (
    <details>
      <summary>Tahap 1: hasil pencocokan bank data ({items.length} diagnosis)</summary>
      <p className="small muted" style={{ marginTop: 6 }}>
        Fakta kasus dicocokkan dengan 1.015 indikator di bank data NERSCARE. Daftar ini lalu dinilai ulang oleh AI;
        kecocokan kata belum tentu bermakna klinis.
      </p>
      {items.length === 0
        ? <p className="small">Tidak ada indikator yang cocok.</p>
        : <ol className="small">{items.map(r => <li key={r.dx_id}>{r.label} <span className="meta">(skor {r.score})</span></li>)}</ol>}
    </details>
  )
}

export function AnalysisView({ analysis: a, decisions, onDecide, reflection, onReflect, revealed, onReveal }: Props) {
  const [active, setActive] = useState<string | null>(a.candidates[0]?.dx_id ?? null)
  const activeCand = a.candidates.find(c => c.dx_id === active)
  const highlight = new Set(activeCand?.evidence_ids ?? [])
  const factText = new Map(a.facts.map(f => [f.id, f.text]))

  return (
    <div className="stack">
      <RedFlags flags={a.red_flags} />
      {a.danger_signs.length > 0 && (
        <div className="notice warn">
          <strong>Catatan tanda bahaya dari AI</strong>
          <ul>{a.danger_signs.map((d, i) => <li key={i}>{d}</li>)}</ul>
        </div>
      )}

      {a.student_feedback && (
        <section className="card" style={{ background: 'var(--brand-soft)', borderColor: 'transparent' }}>
          <h2>Umpan balik untuk analisismu</h2>
          <p><strong>{a.student_feedback.verdict}</strong></p>
          {a.student_feedback.strengths.length > 0 && <>
            <h3>Yang sudah tepat</h3>
            <ul>{a.student_feedback.strengths.map((x, i) => <li key={i}><q>{x.quote}</q>: {x.comment}</li>)}</ul>
          </>}
          {a.student_feedback.improvements.length > 0 && <>
            <h3>Yang perlu diperbaiki</h3>
            <ul>{a.student_feedback.improvements.map((x, i) => <li key={i}>{x}</li>)}</ul>
          </>}
        </section>
      )}

      {!revealed && (
        <section className="card no-print" style={{ borderStyle: 'dashed' }}>
          <h2>Pembahasan AI masih tertutup</h2>
          <p className="small muted">
            Baca umpan balik, data yang perlu dilengkapi, dan pertanyaan di bawah. Kamu bisa memperbaiki jawabanmu di
            form lalu menganalisis ulang, atau membuka pembahasan lengkap (kandidat diagnosis, bukti, dan intervensi).
          </p>
          <button type="button" className="btn" onClick={onReveal}>Buka pembahasan AI</button>
        </section>
      )}

      {revealed && <>
      <section>
        <h2>Ringkasan</h2>
        <p>{a.summary}</p>
      </section>

      <section>
        <h2>Kandidat diagnosis keperawatan</h2>
        <p className="small muted">Pilih kartu untuk menyorot fakta pendukungnya. Nilai setiap saran sebelum dipakai.</p>
        {a.candidates.length === 0 && <p className="notice warn">AI tidak menemukan kandidat yang didukung data. Lengkapi pengkajian lalu coba lagi.</p>}
        <div className="stack">
          {a.candidates.map(c => (
            <article key={c.dx_id} className={`cand${active === c.dx_id ? ' active' : ''}`}
              onClick={() => setActive(c.dx_id)}>
              <div className="cand-head">
                <div>
                  <h3 style={{ margin: 0 }}>{c.label}</h3>
                  <span className="meta">{c.dx_type} · {c.domain}</span>
                </div>
                <span className={`chip ${c.priority}`}>Prioritas {c.priority}</span>
              </div>
              <p className="small" style={{ margin: '6px 0 0' }}>
                {c.bank
                  ? <span className="chip src-bank">Bank data NERSCARE · skor {c.bank.score} · dinalar AI</span>
                  : <span className="chip src-ai">Diusulkan AI dari daftar bank data</span>}
              </p>
              <p style={{ marginTop: 8 }}>{c.rationale}</p>
              <p className="small"><strong>Bukti dari kasus:</strong>{' '}
                {c.evidence_ids.map(id => <span key={id} className="chip" title={factText.get(id)} style={{ marginRight: 4 }}>{id}</span>)}
              </p>
              {c.bank && c.bank.matched.length > 0 && <>
                <strong className="small">Indikator bank data yang cocok</strong>
                <ul className="small">{c.bank.matched.map(m => <li key={m.cue_id}>{m.text} <span className="meta">({m.type} ← {m.fact_ids.join(', ')})</span></li>)}</ul>
              </>}
              {c.bank && c.bank.missing.length > 0 && <>
                <strong className="small">Indikator lain yang bisa dikaji untuk konfirmasi</strong>
                <ul className="small">{c.bank.missing.map((m, i) => <li key={i}>{m}</li>)}</ul>
              </>}
              {c.follow_up && <p className="small"><strong>Pertanyaan pengkajian lanjutan:</strong> {c.follow_up}</p>}
              {c.outcome_goal && <p className="small"><strong>Tujuan/luaran:</strong> {c.outcome_goal}</p>}
              {c.interventions.length > 0 && <>
                <strong className="small">Ide intervensi keperawatan</strong>
                <ul className="small">{c.interventions.map((x, i) => <li key={i}>{x}</li>)}</ul>
              </>}
              {(c.slki.length > 0 || c.siki.length > 0) && (
                <p className="small muted">
                  <strong>Kandidat luaran/intervensi di bank data (perlu review):</strong>{' '}
                  {[...c.slki.map(x => `Luaran: ${x}`), ...c.siki.map(x => `Intervensi: ${x}`)].join(' · ')}
                </p>
              )}
              {c.uncertainty && <p className="small muted"><strong>Ketidakpastian:</strong> {c.uncertainty}</p>}
              <div className="decision no-print" onClick={e => e.stopPropagation()}>
                {(['setuju', 'ragu', 'tolak'] as Decision[]).map(d => (
                  <button key={d} type="button" className={`btn subtle small${decisions[c.dx_id] === d ? ' on' : ''}`}
                    aria-pressed={decisions[c.dx_id] === d} onClick={() => onDecide(c.dx_id, d)}>
                    {d === 'setuju' ? 'Setuju' : d === 'ragu' ? 'Ragu, perlu dicek' : 'Tolak'}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>Fakta kasus</h2>
        <FactList facts={a.facts} highlight={highlight} />
      </section>

      <RetrievalList items={a.retrieval} />

      {a.evidence_groups.length > 0 && (
        <section>
          <h2>Pengelompokan data</h2>
          {a.evidence_groups.map((g, i) => (
            <p key={i}><span className="chip">{g.kind}</span> {g.fact_ids.join(', ')}: {g.meaning}</p>
          ))}
        </section>
      )}
      </>}

      {a.data_gaps.length > 0 && (
        <section>
          <h2>Data yang perlu dilengkapi</h2>
          <ul>{a.data_gaps.map((x, i) => <li key={i}>{x}</li>)}</ul>
        </section>
      )}

      {a.learning_questions.length > 0 && (
        <section>
          <h2>Pertanyaan untuk direnungkan</h2>
          <ol>{a.learning_questions.map((x, i) => <li key={i}>{x}</li>)}</ol>
        </section>
      )}

      <section>
        <h2>Refleksimu</h2>
        <textarea value={reflection} maxLength={2000} placeholder="Apa yang kamu pelajari? Saran mana yang kamu tolak dan mengapa?"
          onChange={e => onReflect(e.target.value)} />
      </section>

      <p className="meta">
        Model: {a.model} · {new Date(a.created_at).toLocaleString('id-ID')}
        {a.dropped > 0 && ` · ${a.dropped} saran AI dibuang karena tidak didukung data/katalog`}
      </p>
      <p className="notice warn small">
        Untuk simulasi pendidikan. Bukan diagnosis final, instruksi penanganan, atau pengesahan kompetensi.
        Rujuk standar resmi keperawatan dan diskusikan dengan CI/dosen.
      </p>
    </div>
  )
}
