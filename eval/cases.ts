import { emptyCase } from '../src/lib/input.ts'
import { SAMPLE_CASES } from '../src/lib/samples.ts'
import type { CaseInput } from '../src/lib/types.ts'

/**
 * Kasus FIKTIF untuk mengukur akurasi. Draf ditulis tim programmer; anggota tim bidang
 * keperawatan WAJIB mereview isi kasus dan mengisi kunci jawaban di eval/kunci_jawaban.csv.
 */
type EvalCase = { id: string; title: string; data: CaseInput }
const base = (patch: Partial<CaseInput>): CaseInput => ({ ...emptyCase(), ...patch })
const v = (sbp: string, dbp: string, hr: string, rr: string, temp: string, spo2: string) => ({ sbp, dbp, hr, rr, temp, spo2 })

const NEW_CASES: EvalCase[] = [
  { id: 'e05-kmb-dm', title: 'KMB: diabetes dengan gula darah tinggi', data: base({
    label: 'Ny. R', age: '52 tahun', sex: 'P', stase: 'kmb', setting: 'Ruang rawat inap penyakit dalam',
    chief_complaint: 'Lemas dan sering haus sejak 1 minggu',
    subjective: 'Pasien mengatakan sering haus dan sering buang air kecil terutama malam hari.\nPasien mengatakan badan lemas dan cepat lelah.\nPasien mengatakan jarang minum obat diabetes karena merasa sudah sehat.',
    objective: 'GDS 386 mg/dL.\nMukosa bibir kering.\nPasien tampak lemah.\nTerdapat luka kecil di telapak kaki kanan, kemerahan di sekitar luka.',
    vitals: v('140', '90', '96', '20', '37.4', '98'), consciousness: 'compos_mentis',
    history: 'Diabetes melitus tipe 2 sejak 6 tahun.' }) },
  { id: 'e06-kmb-fraktur', title: 'KMB: post operasi fraktur femur', data: base({
    label: 'Tn. A', age: '24 tahun', sex: 'L', stase: 'kmb', setting: 'Ruang bedah, hari ke-2 post ORIF femur kanan',
    chief_complaint: 'Nyeri pada paha kanan bekas operasi',
    subjective: 'Pasien mengatakan nyeri pada paha kanan.\nPasien mengatakan belum berani menggerakkan kaki kanan.\nPasien mengatakan butuh bantuan untuk ke kamar mandi.',
    objective: 'Pasien tampak meringis saat kaki digeser.\nKekuatan otot ekstremitas bawah kanan 2.\nRentang gerak kaki kanan terbatas.\nBalutan luka operasi kering.',
    vitals: v('120', '80', '92', '20', '37.2', '99'), consciousness: 'compos_mentis',
    pqrst: { p: 'Nyeri bertambah saat digerakkan', q: 'Berdenyut', r: 'Paha kanan, tidak menjalar', s: '5 dari 10', t: 'Hilang timbul' },
    history: 'Kecelakaan sepeda motor 3 hari lalu.' }) },
  { id: 'e07-kmb-chf', title: 'KMB: gagal jantung dengan edema', data: base({
    label: 'Tn. W', age: '67 tahun', sex: 'L', stase: 'kmb', setting: 'Ruang rawat jantung',
    chief_complaint: 'Sesak napas dan kaki bengkak',
    subjective: 'Pasien mengatakan sesak bertambah saat berbaring dan harus tidur dengan 3 bantal.\nPasien mengatakan kedua kaki bengkak sejak 1 minggu.\nPasien mengatakan cepat lelah saat berjalan ke kamar mandi.',
    objective: 'Edema pitting derajat 2 pada kedua tungkai.\nTerdengar ronki basah di kedua basal paru.\nBerat badan naik 3 kg dalam 5 hari.\nJVP meningkat.',
    vitals: v('150', '95', '104', '26', '36.8', '93'), consciousness: 'compos_mentis',
    history: 'Riwayat gagal jantung dan hipertensi.' }) },
  { id: 'e08-kmb-stroke', title: 'KMB: stroke non hemoragik', data: base({
    label: 'Ny. K', age: '61 tahun', sex: 'P', stase: 'kmb', setting: 'Ruang rawat saraf, hari ke-3',
    chief_complaint: 'Lemah anggota gerak kanan',
    subjective: 'Keluarga mengatakan pasien sulit menggerakkan tangan dan kaki kanan.\nKeluarga mengatakan pasien sulit berbicara dan bicaranya tidak jelas.\nKeluarga mengatakan pasien tersedak saat minum.',
    objective: 'Kekuatan otot ekstremitas kanan 1, kiri 5.\nBicara pelo, pasien sulit menyusun kata.\nPasien tampak batuk saat diberi minum air.\nSeluruh aktivitas dibantu keluarga.',
    vitals: v('160', '90', '84', '20', '36.9', '97'), consciousness: 'compos_mentis',
    history: 'Hipertensi tidak terkontrol.' }) },
  { id: 'e09-mat-menyusui', title: 'Maternitas: ibu nifas kesulitan menyusui', data: base({
    label: 'Ny. D', age: '23 tahun', sex: 'P', stase: 'maternitas', setting: 'Ruang nifas, hari ke-2 post partum spontan',
    chief_complaint: 'ASI belum lancar',
    subjective: 'Ibu mengatakan ASI keluar sedikit.\nIbu mengatakan puting terasa lecet dan perih saat menyusui.\nIbu mengatakan bingung cara menyusui yang benar dan bayi sering menangis.',
    objective: 'Puting kanan tampak lecet.\nPerlekatan bayi tidak tepat, hanya puting yang masuk ke mulut bayi.\nBayi tampak rewel setelah menyusu.\nPayudara teraba lunak.',
    vitals: v('110', '70', '84', '18', '36.8', '99'), consciousness: 'compos_mentis',
    history: 'P1A0, anak pertama.' }) },
  { id: 'e10-mat-preeklampsia', title: 'Maternitas: hamil 34 minggu dengan tekanan darah tinggi', data: base({
    label: 'Ny. S', age: '35 tahun', sex: 'P', stase: 'maternitas', setting: 'Ruang bersalin',
    chief_complaint: 'Pusing dan pandangan kabur',
    subjective: 'Pasien mengatakan kepala pusing berat sejak pagi.\nPasien mengatakan pandangan mata kabur.\nPasien mengatakan cemas dengan kondisi bayinya.',
    objective: 'Edema pada wajah dan kedua tungkai.\nProteinuria +3.\nPasien tampak gelisah dan sering bertanya tentang janinnya.\nDJJ 142 x/menit.',
    vitals: v('170', '110', '98', '22', '36.7', '98'), consciousness: 'compos_mentis',
    history: 'G2P1A0 usia kehamilan 34 minggu.' }) },
  { id: 'e11-anak-dbd', title: 'Anak: demam berdarah', data: base({
    label: 'An. P', age: '8 tahun', sex: 'P', stase: 'anak', setting: 'Ruang rawat anak, demam hari ke-4',
    chief_complaint: 'Demam tinggi sejak 4 hari',
    subjective: 'Ibu mengatakan anak demam naik turun sejak 4 hari.\nIbu mengatakan anak mimisan tadi pagi.\nIbu mengatakan anak tidak mau makan dan mual.',
    objective: 'Tampak bintik merah di kedua lengan.\nTrombosit 62.000/µL.\nHematokrit 44%.\nAkral hangat.',
    vitals: v('100', '70', '112', '24', '38.9', '98'), consciousness: 'compos_mentis' }) },
  { id: 'e12-anak-bronkopneumonia', title: 'Anak: bronkopneumonia', data: base({
    label: 'An. R', age: '1 tahun', sex: 'L', stase: 'anak', setting: 'Ruang rawat anak',
    chief_complaint: 'Batuk berdahak dan sesak',
    subjective: 'Ibu mengatakan anak batuk berdahak sejak 5 hari dan dahak sulit keluar.\nIbu mengatakan anak tampak sesak dan rewel.\nIbu mengatakan anak malas menyusu.',
    objective: 'Terdengar ronki di kedua lapang paru.\nTampak retraksi dinding dada.\nPernapasan cuping hidung.\nAnak tampak rewel.',
    vitals: v('', '', '148', '52', '38.2', '91'), consciousness: 'compos_mentis' }) },
  { id: 'e13-neonatus-ikterik', title: 'Anak: neonatus kuning', data: base({
    label: 'By. M', age: '4 hari', sex: 'L', stase: 'anak', setting: 'Ruang perinatologi',
    chief_complaint: 'Kulit bayi tampak kuning',
    subjective: 'Ibu mengatakan bayi tampak kuning sejak kemarin.\nIbu mengatakan bayi malas menyusu dan banyak tidur.',
    objective: 'Kulit dan sklera tampak ikterik sampai perut.\nBilirubin total 16 mg/dL.\nBayi tampak lemah saat menghisap.',
    vitals: v('', '', '142', '44', '36.9', '98'), consciousness: 'compos_mentis',
    history: 'Lahir cukup bulan, berat lahir 2.800 gram.' }) },
  { id: 'e14-gadar-trauma', title: 'Gawat darurat: kecelakaan dengan perdarahan', data: base({
    label: 'Tn. B', age: '30 tahun', sex: 'L', stase: 'gadar', setting: 'IGD',
    chief_complaint: 'Luka robek di paha kiri setelah kecelakaan',
    subjective: 'Pasien mengatakan pusing dan merasa sangat lemas.\nPasien mengatakan haus.',
    objective: 'Luka robek 10 cm di paha kiri dengan perdarahan aktif.\nAkral dingin dan pucat.\nCRT 4 detik.\nPasien tampak gelisah.',
    vitals: v('84', '50', '128', '28', '36.0', '95'), consciousness: 'compos_mentis' }) },
  { id: 'e15-gadar-asma', title: 'Gawat darurat: serangan asma', data: base({
    label: 'Nn. T', age: '19 tahun', sex: 'P', stase: 'gadar', setting: 'IGD',
    chief_complaint: 'Sesak napas berat sejak 2 jam',
    subjective: 'Pasien mengatakan sesak berat dan dada terasa berat.\nPasien mengatakan sulit berbicara satu kalimat penuh.',
    objective: 'Terdengar wheezing di kedua lapang paru.\nPasien menggunakan otot bantu napas.\nPasien duduk membungkuk ke depan.\nPasien tampak cemas.',
    vitals: v('130', '80', '122', '32', '36.8', '89'), consciousness: 'compos_mentis',
    history: 'Riwayat asma sejak kecil.' }) },
  { id: 'e16-jiwa-halusinasi', title: 'Jiwa: halusinasi pendengaran', data: base({
    label: 'Tn. G', age: '28 tahun', sex: 'L', stase: 'jiwa', setting: 'Ruang rawat jiwa',
    chief_complaint: 'Mendengar suara-suara',
    subjective: 'Pasien mengatakan sering mendengar suara yang menyuruhnya pergi dari rumah.\nPasien mengatakan suara muncul terutama saat sendirian di malam hari.',
    objective: 'Pasien tampak berbicara dan tertawa sendiri.\nPasien sering memiringkan kepala seperti sedang mendengarkan sesuatu.\nKontak mata kurang.\nPasien lebih banyak menyendiri di kamar.',
    vitals: v('120', '80', '86', '18', '36.6', '99'), consciousness: 'compos_mentis' }) },
  { id: 'e17-jiwa-rpk', title: 'Jiwa: perilaku marah dan mengancam', data: base({
    label: 'Tn. J', age: '35 tahun', sex: 'L', stase: 'jiwa', setting: 'Ruang rawat jiwa',
    chief_complaint: 'Marah-marah dan membanting barang di rumah',
    subjective: 'Keluarga mengatakan pasien sering marah dan memukul pintu.\nPasien mengatakan kesal karena merasa diremehkan keluarganya.',
    objective: 'Pasien berbicara dengan nada tinggi dan kasar.\nMata melotot dan tangan mengepal.\nPasien mondar-mandir.',
    vitals: v('140', '90', '104', '22', '36.7', '99'), consciousness: 'compos_mentis',
    history: 'Riwayat dirawat dengan keluhan serupa 1 tahun lalu.' }) },
  { id: 'e18-jiwa-hdr', title: 'Jiwa: merasa tidak berharga setelah kehilangan pekerjaan', data: base({
    label: 'Ny. L', age: '41 tahun', sex: 'P', stase: 'jiwa', setting: 'Poli jiwa',
    chief_complaint: 'Merasa tidak berguna',
    subjective: 'Pasien mengatakan merasa tidak berguna sejak di-PHK dari pekerjaannya di hotel.\nPasien mengatakan malu bertemu tetangga.\nPasien mengatakan tidak punya kemampuan apa-apa.',
    objective: 'Pasien banyak menunduk.\nSuara pelan dan kontak mata kurang.\nPasien tampak menolak saat diajak berkenalan dengan pasien lain.',
    vitals: v('120', '80', '80', '18', '36.6', '99'), consciousness: 'compos_mentis' }) },
  { id: 'e19-komunitas-ht', title: 'Komunitas: hipertensi pada keluarga di banjar', data: base({
    label: 'Tn. N', age: '58 tahun', sex: 'L', stase: 'komunitas', setting: 'Kunjungan rumah, binaan posyandu lansia banjar',
    chief_complaint: 'Sering pusing dan tengkuk terasa berat',
    subjective: 'Pasien mengatakan sering pusing dan tengkuk terasa berat.\nPasien mengatakan tidak rutin minum obat darah tinggi karena lupa dan merasa sudah sembuh.\nPasien mengatakan suka makanan asin dan lawar.\nKeluarga mengatakan tidak tahu batas garam yang dianjurkan.',
    objective: 'Obat antihipertensi masih tersisa banyak di rumah.\nPasien tampak bingung saat ditanya tentang komplikasi hipertensi.',
    vitals: v('168', '100', '88', '18', '36.6', '98'), consciousness: 'compos_mentis' }) },
  { id: 'e20-gerontik-jatuh', title: 'Gerontik: lansia dengan riwayat jatuh', data: base({
    label: 'Ny. W', age: '78 tahun', sex: 'P', stase: 'gerontik', setting: 'Panti werdha',
    chief_complaint: 'Pernah jatuh di kamar mandi 2 minggu lalu',
    subjective: 'Pasien mengatakan sering pusing saat bangun dari tempat tidur.\nPasien mengatakan penglihatan sudah kabur.\nPasien mengatakan takut jatuh lagi.',
    objective: 'Pasien berjalan dengan langkah pendek dan berpegangan pada dinding.\nLantai kamar mandi licin tanpa pegangan.\nPasien memakai sandal yang longgar.',
    vitals: v('110', '70', '78', '18', '36.5', '97'), consciousness: 'compos_mentis',
    history: 'Hipertensi, rutin minum obat penurun tekanan darah.' }) },
]

export const EVAL_CASES: EvalCase[] = [
  ...SAMPLE_CASES.map((s, i) => ({ ...s, id: `e0${i + 1}-${s.id}` })),
  ...NEW_CASES,
]
