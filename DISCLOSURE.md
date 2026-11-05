# AI & Technology Disclosure

Mengikuti Lampiran C Panduan Peserta AI Web Innovation Challenge Bali DigiFest 2026.
Bagian bertanda _(isi)_ wajib dilengkapi dan diperiksa kebenarannya oleh tim sebelum submit.

| Komponen | Isi |
|---|---|
| Nama Produk | Askep Tutor AI |
| Framework / Frontend | Next.js 16 (App Router), React 19, TypeScript, CSS murni |
| Backend / Runtime | Next.js Route Handler di Node.js (`/api/analyze`) |
| Database / Storage | Tanpa database server. Riwayat latihan disimpan di `localStorage` browser pengguna |
| Hosting / Deployment | Vercel (https://askep-ai.vercel.app) |
| AI Model / API / Method | Alur dua tahap: (1) retrieval & ranking leksikal atas bank data NERSCARE (TypeScript, tanpa model); (2) LLM via Groq Chat Completions API, model `openai/gpt-oss-120b` (dapat diganti lewat `GROQ_MODEL`), structured output JSON Schema strict. Validasi output berbasis aturan di server |
| Peran AI dalam Produk | Inti produk: menalar ulang kandidat dari bank data, mengelompokkan data DS/DO, menentukan kandidat diagnosis keperawatan berbukti dan prioritasnya, memberi umpan balik atas jawaban mahasiswa, menyusun pertanyaan reflektif |
| Dataset / Data Source | Tidak memakai data pasien. **Bank data NERSCARE** (83 diagnosis, 1.015 indikator S/O/R, 76 alias, kandidat luaran/intervensi) dikembangkan tim. Indikatornya ditulis sendiri oleh tim; label diagnosis merujuk terminologi standar keperawatan Indonesia (SDKI/SLKI/SIKI, PPNI) tanpa menyalin definisi, kode, atau kriteria resmi. _(Tim: pastikan pernyataan ini sesuai faktanya.)_ 4 contoh kasus fiktif ditulis tim |
| Open-source Libraries | next, react, react-dom, typescript, @types/* |
| Template / Boilerplate | Tidak memakai template; struktur proyek Next.js standar |
| AI Coding Assistant | Claude Code (Anthropic) dipakai untuk membantu menulis dan merapikan kode. _(tambahkan tools lain yang dipakai, mis. ChatGPT/Codex)_. Tim telah membaca, menguji, dan bertanggung jawab atas seluruh kode |
| Pre-existing Components | _(isi dengan jujur: siapa di tim yang membuat bank data NERSCARE & prototipe ASKEP)_ Ide produk berasal dari anggota tim bidang keperawatan (mantan dosen keperawatan). Proyek ini disederhanakan dari prototipe sebelumnya, "ASKEP NERS" (Next.js + Supabase + layanan Python NERSCARE), yang dikembangkan sebelum kompetisi. Yang dipakai ulang: bank data NERSCARE (dikemas ulang lewat `scripts/build-bank.mjs`) dan konsep validasi output AI berbasis bukti. Yang dibuat untuk kompetisi: aplikasi web ini, retrieval TypeScript, alur dua tahap dengan LLM, UI tutor, dan umpan balik mahasiswa. Database multi-kampus, sistem langganan, dan engine Python NERSCARE **tidak** dipakai |
| Third-party Assets / Credits | Font Plus Jakarta Sans (Google Fonts, OFL) |

## Data Privacy & Responsible AI

- Hanya untuk kasus simulasi. Pengguna wajib mencentang pernyataan simulasi sebelum analisis.
- Server menolak input yang mirip data pribadi (NIK, telepon, email, nama lengkap, alamat, nomor RM).
- Inisial pasien tidak dikirim ke model AI. Tidak ada data yang disimpan di server.
- Output AI divalidasi: saran di luar bank data atau tanpa bukti dari fakta kasus dibuang.
- Tanda bahaya dideteksi dengan aturan deterministik, bukan bergantung pada AI.
- Setiap hasil diberi disclaimer: bukan diagnosis final, bukan instruksi penanganan, wajib direview CI/dosen.

Pernyataan: Kami menyatakan bahwa informasi di atas benar dan lengkap. Kami bertanggung jawab atas penggunaan
teknologi, source code, data, library, API, model AI, dan aset yang digunakan pada produk.
