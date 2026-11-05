# Hasil Evaluasi Askep Tutor AI

Tanggal: 5/11/2026, 14.02.53

| Metrik | Nilai |
|---|---|
| Kasus dievaluasi | 20 (AI berhasil: 20) |
| Retrieval saja: diagnosis utama di 3 teratas | 90% |
| Retrieval saja: recall diagnosis utama di 10 teratas | 62% |
| Retrieval + AI: kandidat pertama = diagnosis utama | 90% |
| Retrieval + AI: diagnosis utama di 3 teratas | 100% |
| Retrieval + AI: recall diagnosis utama | 73% |
| Retrieval + AI: presisi (kandidat yang benar) | 72% |
| Skrining tanda bahaya sesuai kunci | 100% |
| Rata-rata waktu analisis AI | 3.4 detik |

| Kasus | Kunci (utama) | Retrieval top-3 | AI | Ret@3 | AI@1 | AI@3 |
|---|---|---|---|---|---|---|
| e01-kmb-pneumonia | Bersihan jalan napas tidak efektif, Pola napas tidak efektif, Hipertermia | Bersihan jalan napas tidak efektif, Gangguan pertukaran gas, Pola napas tidak efektif | Bersihan jalan napas tidak efektif, Gangguan pertukaran gas, Pola napas tidak efektif, Risiko defisit nutrisi | ✔ | ✔ | ✔ |
| e02-maternitas-post-sc | Nyeri akut | Risiko gangguan neurovaskular perifer, Nyeri akut, Risiko infeksi | Nyeri akut, Risiko infeksi, Gangguan mobilitas fisik | ✔ | ✔ | ✔ |
| e03-anak-diare | Hipovolemia, Diare | Diare, Hipertermia, Hipovolemia | Hipovolemia, Diare, Hipertermia | ✔ | ✔ | ✔ |
| e04-gadar-nyeri-dada | Gangguan pertukaran gas, Perfusi perifer tidak efektif, Nyeri akut | Gangguan pertukaran gas, Gangguan rasa nyaman, Risiko penurunan curah jantung | Nyeri akut, Gangguan pertukaran gas, Risiko syok, Pola napas tidak efektif | ✔ | ✔ | ✔ |
| e05-kmb-dm | Ketidakstabilan kadar glukosa darah, Manajemen kesehatan tidak efektif, Gangguan integritas kulit/jaringan | Hipovolemia, Ketidakstabilan kadar glukosa darah, Risiko ketidakstabilan kadar glukosa darah | Ketidakstabilan kadar glukosa darah, Hipovolemia, Risiko infeksi, Penurunan curah jantung | ✔ | ✔ | ✔ |
| e06-kmb-fraktur | Nyeri akut, Gangguan mobilitas fisik | Gangguan mobilitas fisik, Risiko defisit perawatan diri, Risiko gangguan neurovaskular perifer | Nyeri akut, Gangguan mobilitas fisik, Risiko defisit perawatan diri | ✔ | ✔ | ✔ |
| e07-kmb-chf | Hipervolemia, Gangguan pertukaran gas, Intoleransi aktivitas | Hipervolemia, Penurunan curah jantung, Gangguan pertukaran gas | Hipervolemia, Penurunan curah jantung, Gangguan pertukaran gas, Risiko ketidakseimbangan cairan | ✔ | ✔ | ✔ |
| e08-kmb-stroke | Gangguan menelan, Gangguan mobilitas fisik, Gangguan komunikasi verbal | Gangguan komunikasi verbal, Risiko aspirasi, Berat badan lebih | Gangguan komunikasi verbal, Risiko aspirasi | ✔ | ✔ | ✔ |
| e09-mat-menyusui | Menyusui tidak efektif, Defisit pengetahuan | Ikterik neonatus, Menyusui tidak efektif | Menyusui tidak efektif, Defisit pengetahuan, Nyeri akut | ✔ | ✔ | ✔ |
| e10-mat-preeklampsia | Risiko cedera, Ansietas | Risiko penurunan curah jantung, Ansietas, Defisit pengetahuan | Ansietas, Hipovolemia, Defisit pengetahuan | ✔ | ✔ | ✔ |
| e11-anak-dbd | Hipertermia, Risiko perdarahan | Hipertermia, Nausea, Risiko hipovolemia | Risiko perdarahan, Hipertermia, Risiko defisit nutrisi | ✔ | ✔ | ✔ |
| e12-anak-bronkopneumonia | Bersihan jalan napas tidak efektif, Gangguan pertukaran gas, Pola napas tidak efektif | Pola napas tidak efektif, Gangguan pertukaran gas, Hipertermia | Gangguan pertukaran gas, Bersihan jalan napas tidak efektif | ✔ | ✔ | ✔ |
| e13-neonatus-ikterik | Ikterik neonatus, Risiko defisit nutrisi | Ikterik neonatus, Risiko ikterik neonatus, Pola napas tidak efektif | Ikterik neonatus | ✔ | ✔ | ✔ |
| e14-gadar-trauma | Hipovolemia, Perfusi perifer tidak efektif, Gangguan integritas kulit/jaringan | Hipovolemia, Risiko penurunan curah jantung, Risiko perdarahan | Hipovolemia, Risiko syok, Penurunan curah jantung | ✔ | ✔ | ✔ |
| e15-gadar-asma | Gangguan pertukaran gas, Pola napas tidak efektif | Pola napas tidak efektif, Gangguan pertukaran gas, Gangguan ventilasi spontan | Gangguan pertukaran gas, Pola napas tidak efektif | ✔ | ✔ | ✔ |
| e16-jiwa-halusinasi | Gangguan persepsi sensori, Isolasi sosial | Isolasi sosial | Ansietas, Isolasi sosial | ✔ | ✘ | ✔ |
| e17-jiwa-rpk | Risiko perilaku kekerasan | Risiko penurunan curah jantung | Risiko perilaku kekerasan, Ansietas, Risiko penurunan curah jantung | ✘ | ✔ | ✔ |
| e18-jiwa-hdr | Harga diri rendah situasional, Isolasi sosial |  | Ansietas, Harga diri rendah situasional | ✘ | ✘ | ✔ |
| e19-komunitas-ht | Manajemen kesehatan tidak efektif, Defisit pengetahuan | Diare, Risiko ketidakstabilan kadar glukosa darah, Defisit pengetahuan | Manajemen kesehatan tidak efektif, Defisit pengetahuan, Defisit nutrisi | ✔ | ✔ | ✔ |
| e20-gerontik-jatuh | Risiko jatuh | Risiko jatuh, Risiko penurunan curah jantung, Diare | Risiko jatuh | ✔ | ✔ | ✔ |

Catatan: kunci jawaban disusun oleh anggota tim bidang keperawatan. Hasil AI dapat sedikit berbeda di setiap run.