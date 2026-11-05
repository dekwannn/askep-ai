import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Workspace } from '@/components/Workspace'

export const metadata: Metadata = { title: 'Latihan kasus · Askep Tutor AI' }

export default function TutorPage() {
  return (
    <main className="container">
      <Suspense fallback={<p className="empty">Memuat ruang latihan…</p>}>
        <Workspace />
      </Suspense>
    </main>
  )
}
