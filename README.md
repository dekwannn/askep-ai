# Askep Tutor AI

## Description

Askep Tutor AI adalah web app untuk **mahasiswa profesi Ners** yang ingin melatih penalaran asuhan keperawatan
(askep) dengan **kasus simulasi**. Mahasiswa memasukkan data pengkajian, menulis diagnosis versinya sendiri, lalu
tutor AI memberi umpan balik: pengelompokan data DS/DO, kandidat diagnosis keperawatan yang **wajib mengutip
fakta kasus sebagai bukti**, data yang masih kurang, dan pertanyaan reflektif seperti saat bimbingan.

> Alat bantu belajar. Bukan alat diagnosis, tidak untuk data pasien nyata, dan tidak menggantikan CI/dosen
> maupun standar resmi keperawatan.

## Problem & Target User

- **Pengguna utama:** mahasiswa profesi Ners (stase KMB, maternitas, anak, gadar, jiwa, komunitas, gerontik).
- **Pengguna pendukung:** CI/dosen pembimbing yang ingin mahasiswanya datang ke bimbingan dengan analisis yang lebih matang.
- **Masalah:** menyusun askep menuntut penalaran klinis (mengelompokkan data, menegakkan diagnosis, memprioritaskan),
  tetapi waktu bimbingan terbatas dan umpan balik sering baru diterima setelah laporan dikumpulkan.

## Key Features

- **Mode tutor (default):** mahasiswa wajib menulis diagnosisnya dulu; umpan balik dan pertanyaan reflektif muncul
  lebih dulu, sedangkan pembahasan AI (kandidat diagnosis, bukti, intervensi) baru dibuka setelah mahasiswa memilih.
  Tersedia juga mode eksplorasi untuk melihat pembahasan langsung.
- Form pengkajian terstruktur: keluhan utama, DS, DO, tanda vital, tingkat kesadaran, **PQRST**, riwayat.
- **Bank data NERSCARE** (83 diagnosis, 1.015 indikator, 76 alias) sebagai sumber retrieval kandidat.
- **Analisis tutor AI**: ringkasan, pengelompokan DS/DO, maksimal 4 kandidat diagnosis keperawatan berprioritas
  dengan bukti, tujuan, ide intervensi, dan catatan ketidakpastian.
- **Umpan balik atas jawaban mahasiswa**: setiap pujian wajib mengutip kata-kata mahasiswa; server membuang kutipan
  yang tidak benar-benar ada di jawaban (mencegah pujian karangan AI).
- **Sorot bukti**: memilih kandidat akan menyorot fakta kasus yang dikutip AI.
- **Skrining tanda bahaya berbasis aturan** (SpO2, RR, nadi, TD, suhu, kesadaran, kata kunci) yang tetap berjalan meski AI gagal.
- **Penjaga privasi**: menolak NIK, nomor telepon, email, nama lengkap, alamat, dan nomor rekam medis.
- Penilaian setiap saran (setuju/ragu/tolak), kolom refleksi, riwayat latihan di perangkat, dan cetak/simpan PDF.
- 4 contoh kasus fiktif siap pakai untuk juri.

## Tech Stack

| Lapisan | Teknologi |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, CSS murni |
| Backend | Next.js Route Handler (`/api/analyze`, Node.js runtime) |
| Database / storage | Tidak ada database server; riwayat disimpan di `localStorage` browser pengguna |
| AI | Retrieval bank data NERSCARE (TypeScript) + Groq API, model default `openai/gpt-oss-120b` (structured output JSON Schema strict) |
| Hosting | Vercel (rekomendasi) |

## AI Implementation

Kategori AI: **LLM / Generative AI** + **NLP** (memahami teks pengkajian bebas) + **Recommendation System**
(retrieval & ranking kandidat diagnosis dari bank data). Alurnya *retrieval-augmented* dua tahap:

1. **Fakta kasus.** Server mengubah input menjadi fakta berlabel (`ku`, `ds1..`, `do1..`, `td`, `nadi`, `rr`,
   `suhu`, `spo2`, `gcs`, `p/q/r/s/t`, `rw1..`). Inisial pasien **tidak** dikirim ke AI.
2. **Tahap 1: retrieval dari bank data NERSCARE** ([src/lib/retrieval.ts](src/lib/retrieval.ts)). Bank data milik tim
   berisi 83 diagnosis, 1.015 indikator S/O/R berbobot, 76 alias frasa sehari-hari, serta kandidat luaran/intervensi.
   Fakta dicocokkan secara leksikal (normalisasi, penanda negasi `tidak_`, pencocokan awalan kata, alias frasa, dan
   konversi angka TTV ke istilah klinis), lalu diagnosis di-ranking dengan bobot indikator. Hasilnya: 10 kandidat teratas.
3. **Tahap 2: penalaran LLM** ([src/lib/prompt.ts](src/lib/prompt.ts), [src/lib/groq.ts](src/lib/groq.ts)).
   Groq `openai/gpt-oss-120b` menerima fakta, 10 kandidat beserta indikator yang cocok, daftar 73 diagnosis lain di bank,
   dan jawaban mahasiswa. LLM membuang kecocokan yang keliru, boleh memilih diagnosis lain dari bank bila didukung fakta,
   memprioritaskan, dan memberi umpan balik. Output dipaksa mengikuti JSON Schema strict (`dx_id` = enum id bank).
4. **Validasi output** ([src/lib/validate.ts](src/lib/validate.ts)): kandidat yang tidak ada di bank data atau tidak
   mengutip id fakta yang benar-benar ada **dibuang**; jumlah yang dibuang ditampilkan ke pengguna.
5. **Output:** kartu kandidat (bukti kasus, indikator bank data yang cocok, indikator yang perlu dikaji, pertanyaan
   lanjutan, kandidat luaran/intervensi), umpan balik untuk mahasiswa, data yang kurang, dan pertanyaan reflektif.

**Mengapa dua tahap?** Bank data memberi landasan yang konsisten dan dapat ditelusuri (bukan jawaban "dari udara"),
sekaligus memperkecil prompt sehingga muat di kuota gratis. Tetapi pencocokan kata saja sering keliru (mis. kata
"nyeri" cocok ke banyak diagnosis) dan tidak bisa menilai alasan mahasiswa. Di situlah LLM diperlukan. Bagian yang
menuntut kepastian (tanda bahaya, privasi) sengaja dibuat **berbasis aturan** agar tidak bergantung pada AI.

**Penanganan error:** API key kosong/ditolak, rate limit Groq (429), timeout 45 detik, dan output tidak valid
masing-masing menghasilkan pesan yang jelas. Output tidak valid/gangguan sementara dicoba ulang 1x. Saat AI gagal,
hasil skrining tanda bahaya dan retrieval bank data tetap ditampilkan. Server juga membatasi 8 permintaan/menit per IP.

## Evaluation

Akurasi diukur terhadap kunci jawaban dari anggota tim bidang keperawatan pada 20 kasus fiktif ([eval/cases.ts](eval/cases.ts)).

Ahli keperawatan mengisi workbook [eval/Kunci_Jawaban_Evaluasi_AskepTutorAI.xlsx](eval/Kunci_Jawaban_Evaluasi_AskepTutorAI.xlsx)
(kolom kuning, dropdown dari 83 diagnosis bank data). Setelah dikirim kembali:

```bash
python eval/excel_to_csv.py eval/Kunci_Jawaban_Evaluasi_AskepTutorAI.xlsx   # → eval/kunci_jawaban.csv
npm run eval          # jalankan retrieval & AI, hasil di eval/HASIL_EVALUASI.md
```

Membuat ulang workbook bila kasus diubah: `node --experimental-strip-types eval/export_cases.ts eval/_cases.json`
lalu `python eval/build_excel.py eval/_cases.json eval/Kunci_Jawaban_Evaluasi_AskepTutorAI.xlsx`.

Metrik: ketepatan retrieval saja (top-3, recall top-10) dibandingkan retrieval + AI (top-1, top-3, recall, presisi),
kesesuaian skrining tanda bahaya, dan rata-rata waktu analisis.

**Hasil (5 November 2026, 20 kasus, kunci dari anggota tim bidang keperawatan):**

| Metrik | Retrieval saja | AI: baseline | AI: setelah perbaikan |
|---|---|---|---|
| Analisis AI berhasil | – | 19/20 | **20/20** |
| Diagnosis utama ahli muncul di 3 teratas | 90% | 100% | **100%** |
| Kandidat pertama = diagnosis utama ahli | – | 84% | **90%** |
| Recall diagnosis utama | 62% (dari 10 kandidat) | 76% | 73% |
| Presisi kandidat (sesuai kunci utama/dapat diterima) | – | 68% | **72%** |
| Rata-rata jumlah kandidat AI | – | 3,3 | 2,8 |
| Skrining tanda bahaya sesuai penilaian ahli (aturan) | – | 70% | 100%* |
| Rata-rata waktu analisis | – | 3,5 detik | 3,4 detik |

\* Perbaikan (ambang tanda bahaya bertingkat sesuai usia/stase, model cadangan Qwen, aturan presisi pada prompt)
disusun berdasarkan catatan ahli pada **20 kasus yang sama**, sehingga angka "setelah perbaikan", terutama skrining
100%, belum menjadi bukti generalisasi. Uji ulang dengan kasus baru yang belum pernah dipakai sedang disiapkan.

AI menemukan diagnosis yang terlewat oleh retrieval pada kasus jiwa (perilaku kekerasan, harga diri rendah).
Hasil AI dapat sedikit berbeda di setiap run. Rincian per kasus: [eval/HASIL_EVALUASI.md](eval/HASIL_EVALUASI.md)
(baseline: [eval/HASIL_EVALUASI_baseline.md](eval/HASIL_EVALUASI_baseline.md)).

## Architecture / Data Flow

```
Pengguna (browser)
   │  isi kasus simulasi + centang pernyataan simulasi
   ▼
Next.js frontend (/tutor) ── riwayat ──► localStorage (perangkat pengguna)
   │  POST /api/analyze
   ▼
Route handler (server)
   ├─ parseCase      → batasi panjang & normalisasi input
   ├─ privacyIssues  → tolak data mirip identitas nyata (422)
   ├─ buildFacts     → fakta berlabel (tanpa inisial)
   ├─ screenRedFlags → skrining tanda bahaya berbasis aturan
   ├─ retrieve       → Tahap 1: cocokkan fakta dengan bank data NERSCARE, ranking 10 kandidat
   ├─ Groq API       → Tahap 2: LLM menalar ulang kandidat (JSON Schema strict)
   └─ vetAnalysis    → buang saran tanpa bukti / di luar bank data
   ▼
Hasil: tanda bahaya + kandidat + umpan balik + pertanyaan reflektif
```

## Installation / Run Instructions

Prasyarat: Node.js ≥ 20.9 dan API key Groq gratis dari <https://console.groq.com/keys>.

```bash
npm install
cp .env.example .env.local   # lalu isi GROQ_API_KEY
npm run dev                  # buka http://localhost:3000
```

Perintah lain:

```bash
npm test          # unit test (privasi, fakta, red flag, retrieval, validasi output AI)
npm run typecheck
npm run build && npm start
```

Bank data sudah dikemas di `src/data/nerscare-bank.json`. Untuk membangun ulang dari data sumber NERSCARE:

```bash
node scripts/build-bank.mjs <folder data NERSCARE>
```

Deploy ke Vercel: import repository, tambahkan environment variable `GROQ_API_KEY` (opsional `GROQ_MODEL`), lalu deploy.

## Deployment URL

**https://askep-ai.vercel.app** (langsung bisa dicoba tanpa login; gunakan menu "Muat contoh kasus")

## Demo Account

Tidak diperlukan. Aplikasi bisa langsung dicoba tanpa login; gunakan menu **Muat contoh kasus**.

## Known Limitations

- Indikator di bank data NERSCARE adalah rancangan operasional tim, **bukan** kriteria mayor/minor resmi SDKI, dan
  belum divalidasi panel ahli. Label diagnosis/luaran/intervensi merujuk terminologi standar keperawatan Indonesia
  tanpa menyalin definisi, kode, atau kriteria resmi. Mahasiswa tetap wajib merujuk buku standar resmi.
- Retrieval masih leksikal (pencocokan kata), sehingga sinonim yang tidak ada di alias bisa terlewat; LLM membantu
  menutup celah ini dengan daftar diagnosis lengkap.
- Output AI belum divalidasi oleh panel ahli keperawatan; bisa keliru dan wajib direview manusia.
- Ambang tanda bahaya bersifat edukatif, bukan protokol triase resmi. Deteksi negasi masih sederhana.
- Filter privasi berbasis pola (heuristik) dan tidak menjamin de-identifikasi.
- Belum ada akun mahasiswa/dosen; riwayat hanya tersimpan di browser masing-masing.
- Bergantung pada kuota gratis Groq; bila penuh, pengguna diminta mencoba lagi.

## Third-party Resources / Credits

- [Next.js](https://nextjs.org) dan [React](https://react.dev) (MIT)
- [Groq API](https://groq.com) dengan model open-weight `openai/gpt-oss-120b` (Apache 2.0)
- Font [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) (SIL Open Font License)
- Bank data NERSCARE: dikembangkan oleh tim sebelum kompetisi (lihat DISCLOSURE.md).
- Semua contoh kasus adalah fiktif dan ditulis oleh tim.

Rincian lengkap ada di [DISCLOSURE.md](DISCLOSURE.md).

## Team Members

| Nama | Peran |
|---|---|
| _(isi, ketua)_ | Programmer: arsitektur, integrasi AI (retrieval + LLM), backend API |
| _(isi)_ | Programmer: frontend/UI, pengujian, deployment |
| _(isi)_, S.Kep., Ns., M.Kep. _(sesuaikan gelar)_ | Domain expert keperawatan: penggagas ide, kurasi bank data, kunci jawaban evaluasi, validasi klinis output |
