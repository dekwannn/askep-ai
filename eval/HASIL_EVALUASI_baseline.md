# Hasil Evaluasi Askep Tutor AI

Tanggal: 5/11/2026, 13.30.04

| Metrik | Nilai |
|---|---|
| Kasus dievaluasi | 20 (AI berhasil: 19) |
| Retrieval saja: diagnosis utama di 3 teratas | 90% |
| Retrieval saja: recall diagnosis utama di 10 teratas | 62% |
| Retrieval + AI: kandidat pertama = diagnosis utama | 84% |
| Retrieval + AI: diagnosis utama di 3 teratas | 100% |
| Retrieval + AI: recall diagnosis utama | 76% |
| Retrieval + AI: presisi (kandidat yang benar) | 68% |
| Skrining tanda bahaya sesuai kunci | 70% |
| Rata-rata waktu analisis AI | 3.5 detik |

| Kasus | Kunci (utama) | Retrieval top-3 | AI | Ret@3 | AI@1 | AI@3 |
|---|---|---|---|---|---|---|
| e01-kmb-pneumonia | Bersihan jalan napas tidak efektif, Pola napas tidak efektif, Hipertermia | Bersihan jalan napas tidak efektif, Gangguan pertukaran gas, Hipertermia | Bersihan jalan napas tidak efektif, Pola napas tidak efektif, Gangguan pertukaran gas, Risiko defisit nutrisi | ✔ | ✔ | ✔ |
| e02-maternitas-post-sc | Nyeri akut | Risiko gangguan neurovaskular perifer, Nyeri akut, Risiko infeksi | Nyeri akut, Risiko infeksi, Gangguan mobilitas fisik, Ansietas | ✔ | ✔ | ✔ |
| e03-anak-diare | Hipovolemia, Diare | Hipertermia, Diare, Hipovolemia | Hipovolemia, Diare, Hipertermia | ✔ | ✔ | ✔ |
| e04-gadar-nyeri-dada | Gangguan pertukaran gas, Perfusi perifer tidak efektif, Nyeri akut | Gangguan pertukaran gas, Gangguan rasa nyaman, Risiko penurunan curah jantung | Nyeri akut, Gangguan pertukaran gas, Penurunan curah jantung | ✔ | ✔ | ✔ |
| e05-kmb-dm | Ketidakstabilan kadar glukosa darah, Manajemen kesehatan tidak efektif, Gangguan integritas kulit/jaringan | Hipovolemia, Ketidakstabilan kadar glukosa darah, Risiko ketidakstabilan kadar glukosa darah | Ketidakstabilan kadar glukosa darah, Risiko infeksi, Gangguan integritas kulit/jaringan | ✔ | ✔ | ✔ |
| e06-kmb-fraktur | Nyeri akut, Gangguan mobilitas fisik | Gangguan mobilitas fisik, Risiko defisit perawatan diri, Risiko gangguan neurovaskular perifer | Nyeri akut, Gangguan mobilitas fisik, Risiko defisit perawatan diri | ✔ | ✔ | ✔ |
| e07-kmb-chf | Hipervolemia, Gangguan pertukaran gas, Intoleransi aktivitas | Hipervolemia, Penurunan curah jantung, Gangguan pertukaran gas | Hipervolemia, Penurunan curah jantung, Gangguan pertukaran gas, Risiko ketidakseimbangan cairan | ✔ | ✔ | ✔ |
| e08-kmb-stroke | Gangguan menelan, Gangguan mobilitas fisik, Gangguan komunikasi verbal | Gangguan komunikasi verbal, Risiko aspirasi, Berat badan lebih | Risiko aspirasi, Gangguan komunikasi verbal | ✔ | ✘ | ✔ |
| e09-mat-menyusui | Menyusui tidak efektif, Defisit pengetahuan | Ikterik neonatus, Menyusui tidak efektif | Menyusui tidak efektif, Defisit pengetahuan, Nyeri akut, Gangguan integritas kulit/jaringan | ✔ | ✔ | ✔ |
| e10-mat-preeklampsia | Risiko cedera, Ansietas | Ansietas, Defisit pengetahuan, Gangguan rasa nyaman | Risiko penurunan curah jantung, Ansietas | ✔ | ✘ | ✔ |
| e11-anak-dbd | Hipertermia, Risiko perdarahan | Hipertermia, Nausea, Risiko hipovolemia | ERROR | ✔ | - | - |
| e12-anak-bronkopneumonia | Bersihan jalan napas tidak efektif, Gangguan pertukaran gas, Pola napas tidak efektif | Hipertermia, Pola napas tidak efektif, Bersihan jalan napas tidak efektif | Pola napas tidak efektif, Gangguan pertukaran gas, Hipertermia, Hipovolemia | ✔ | ✔ | ✔ |
| e13-neonatus-ikterik | Ikterik neonatus, Risiko defisit nutrisi | Ikterik neonatus, Risiko ikterik neonatus, Pola napas tidak efektif | Ikterik neonatus, Pola napas tidak efektif | ✔ | ✔ | ✔ |
| e14-gadar-trauma | Hipovolemia, Perfusi perifer tidak efektif, Gangguan integritas kulit/jaringan | Hipovolemia, Risiko penurunan curah jantung, Risiko perdarahan | Hipovolemia, Risiko syok, Penurunan curah jantung, Risiko perdarahan | ✔ | ✔ | ✔ |
| e15-gadar-asma | Gangguan pertukaran gas, Pola napas tidak efektif | Pola napas tidak efektif, Gangguan pertukaran gas, Gangguan ventilasi spontan | Gangguan pertukaran gas, Pola napas tidak efektif, Ansietas, Risiko perfusi perifer tidak efektif | ✔ | ✔ | ✔ |
| e16-jiwa-halusinasi | Gangguan persepsi sensori, Isolasi sosial | Isolasi sosial | Isolasi sosial, Ansietas, Gangguan komunikasi verbal | ✔ | ✔ | ✔ |
| e17-jiwa-rpk | Risiko perilaku kekerasan | Risiko penurunan curah jantung | Ansietas, Risiko penurunan curah jantung, Risiko perilaku kekerasan | ✘ | ✘ | ✔ |
| e18-jiwa-hdr | Harga diri rendah situasional, Isolasi sosial |  | Harga diri rendah situasional, Isolasi sosial, Risiko bunuh diri | ✘ | ✔ | ✔ |
| e19-komunitas-ht | Manajemen kesehatan tidak efektif, Defisit pengetahuan | Diare, Risiko ketidakstabilan kadar glukosa darah, Defisit pengetahuan | Manajemen kesehatan tidak efektif, Defisit pengetahuan, Ketidakpatuhan | ✔ | ✔ | ✔ |
| e20-gerontik-jatuh | Risiko jatuh | Risiko jatuh, Risiko penurunan curah jantung, Diare | Risiko jatuh, Ansietas, Defisit perawatan diri, Defisit pengetahuan | ✔ | ✔ | ✔ |

Catatan: kunci jawaban disusun oleh anggota tim bidang keperawatan. Hasil AI dapat sedikit berbeda di setiap run.