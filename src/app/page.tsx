import Link from 'next/link'

export default function Home() {
  return (
    <main className="container">
      <section className="hero">
        <div>
          <p className="eyebrow">Untuk mahasiswa profesi Ners</p>
          <h1>Latih penalaran asuhan keperawatan bersama tutor AI.</h1>
          <p className="lead">
            Masukkan kasus simulasi, tulis diagnosis versimu, lalu dapatkan umpan balik: pengelompokan data DS/DO,
            kandidat diagnosis keperawatan beserta <strong>bukti yang dikutip</strong>, data yang masih kurang, dan
            pertanyaan reflektif seperti saat bimbingan.
          </p>
          <div className="hero-actions">
            <Link href="/tutor" className="btn">Mulai latihan</Link>
            <Link href="/tutor?contoh=kmb-pneumonia" className="btn ghost">Coba contoh kasus</Link>
          </div>
        </div>
        <div className="hero-panel" id="cara-kerja">
          <h2>Cara kerja</h2>
          <ol className="flow">
            <li><span><strong>Isi kasus simulasi</strong>: keluhan, data subjektif/objektif, TTV, dan PQRST.</span></li>
            <li><span><strong>Tulis diagnosismu</strong> beserta alasannya (opsional, tapi disarankan).</span></li>
            <li><span><strong>Skrining tanda bahaya</strong> berbasis aturan langsung berjalan.</span></li>
            <li><span><strong>Bank data NERSCARE</strong> (83 diagnosis, 1.015 indikator) mencocokkan fakta kasus dan menyaring kandidat.</span></li>
            <li><span><strong>AI menalar ulang</strong> kandidat tersebut dan wajib mengutip fakta kasus sebagai bukti; saran tanpa bukti dibuang otomatis.</span></li>
            <li><span><strong>Kamu menilai</strong> setiap saran (setuju/ragu/tolak) dan menulis refleksi.</span></li>
          </ol>
        </div>
      </section>

      <section className="section grid-3">
        <div className="card">
          <h3>Masalahnya</h3>
          <p className="muted">Menyusun askep butuh penalaran klinis, tapi waktu bimbingan CI/dosen terbatas dan umpan balik sering baru datang setelah laporan dikumpulkan.</p>
        </div>
        <div className="card">
          <h3>Solusinya</h3>
          <p className="muted">Tutor AI yang tersedia kapan saja untuk latihan mandiri, memberi umpan balik atas cara berpikir mahasiswa, bukan sekadar jawaban jadi.</p>
        </div>
        <div className="card">
          <h3>Aman &amp; bertanggung jawab</h3>
          <p className="muted">Hanya kasus fiktif, identitas berupa inisial, deteksi data pribadi, output divalidasi server, dan semua saran wajib direview manusia.</p>
        </div>
      </section>
    </main>
  )
}
