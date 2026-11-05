import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'Askep Tutor AI',
  description: 'Tutor AI penalaran asuhan keperawatan untuk mahasiswa profesi Ners, berlatih dengan kasus simulasi.',
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <header className="topbar">
          <div className="container">
            <Link href="/" className="brand"><span className="brand-mark" aria-hidden>AT</span>Askep Tutor AI</Link>
            <nav className="nav">
              <Link href="/#cara-kerja" className="btn ghost small hide-sm">Cara kerja</Link>
              <Link href="/tutor" className="btn small">Mulai latihan</Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="footer">
          <div className="container">
            Askep Tutor AI adalah alat bantu belajar untuk <strong>kasus simulasi</strong>. Bukan alat diagnosis, tidak untuk
            data pasien nyata, dan tidak menggantikan bimbingan CI/dosen maupun standar resmi keperawatan.
          </div>
        </footer>
      </body>
    </html>
  )
}
