import { emptyCase } from './input.ts'
import type { CaseInput } from './types.ts'

/** Kasus FIKTIF untuk latihan dan demo. Tidak berasal dari pasien nyata. */
export const SAMPLE_CASES: Array<{ id: string; title: string; data: CaseInput }> = [
  {
    id: 'kmb-pneumonia',
    title: 'KMB: batuk berdahak dan sesak',
    data: {
      ...emptyCase(), label: 'Tn. K', age: '58 tahun', sex: 'L', stase: 'kmb', setting: 'Ruang rawat inap penyakit dalam',
      chief_complaint: 'Sesak napas dan batuk berdahak sejak 4 hari',
      subjective: 'Pasien mengatakan dahak kental dan sulit dikeluarkan.\nPasien mengatakan sesak bertambah saat berbaring datar.\nPasien mengatakan badan terasa lemas dan nafsu makan menurun.',
      objective: 'Batuk tidak efektif, sputum kental kekuningan.\nTerdengar ronki di paru kanan bawah.\nPasien tampak menggunakan otot bantu napas.\nPorsi makan habis 1/2.',
      vitals: { sbp: '130', dbp: '80', hr: '108', rr: '28', temp: '38.6', spo2: '93' }, consciousness: 'compos_mentis',
      history: 'Perokok aktif 30 tahun. Bekerja sebagai petani.',
    },
  },
  {
    id: 'maternitas-post-sc',
    title: 'Maternitas: nyeri post sectio caesarea',
    data: {
      ...emptyCase(), label: 'Ny. P', age: '29 tahun', sex: 'P', stase: 'maternitas', setting: 'Ruang nifas, hari ke-1 post SC',
      chief_complaint: 'Nyeri pada luka operasi',
      subjective: 'Pasien mengatakan nyeri pada luka bekas operasi.\nPasien mengatakan takut bergerak karena nyeri.\nPasien mengatakan ASI baru keluar sedikit dan bayi sering menangis.',
      objective: 'Pasien tampak meringis saat mengubah posisi.\nLuka operasi tertutup kasa, tidak ada rembesan.\nPasien lebih banyak berbaring.\nPayudara lunak, puting menonjol, kolostrum sedikit.',
      vitals: { sbp: '125', dbp: '80', hr: '96', rr: '20', temp: '37.2', spo2: '98' }, consciousness: 'compos_mentis',
      pqrst: { p: 'Nyeri bertambah saat bergerak/batuk, berkurang saat diam', q: 'Seperti disayat', r: 'Perut bagian bawah, tidak menjalar', s: '6 dari 10 (NRS)', t: 'Terus-menerus, memberat saat bergerak' },
      history: 'G1P1A0, persalinan SC atas indikasi gawat janin.',
    },
  },
  {
    id: 'anak-diare',
    title: 'Anak: diare dengan tanda dehidrasi',
    data: {
      ...emptyCase(), label: 'An. D', age: '3 tahun', sex: 'L', stase: 'anak', setting: 'Ruang rawat anak',
      chief_complaint: 'BAB cair sejak 2 hari',
      subjective: 'Ibu mengatakan anak BAB cair 6-7 kali sehari tanpa darah.\nIbu mengatakan anak muntah 2 kali dan tidak mau makan.\nIbu mengatakan anak terus minta minum.',
      objective: 'Mukosa bibir kering.\nTurgor kulit kembali lambat.\nMata tampak cekung.\nAnak tampak rewel.\nBising usus meningkat.',
      vitals: { sbp: '', dbp: '', hr: '132', rr: '30', temp: '37.9', spo2: '98' }, consciousness: 'compos_mentis',
      history: 'Riwayat jajan di luar rumah sehari sebelum sakit.',
    },
  },
  {
    id: 'gadar-nyeri-dada',
    title: 'Gawat darurat: nyeri dada (ada tanda bahaya)',
    data: {
      ...emptyCase(), label: 'Tn. M', age: '64 tahun', sex: 'L', stase: 'gadar', setting: 'IGD',
      chief_complaint: 'Nyeri dada kiri sejak 1 jam',
      subjective: 'Pasien mengatakan nyeri dada seperti ditindih benda berat.\nPasien mengatakan nyeri menjalar ke lengan kiri.\nPasien mengatakan mual dan berkeringat dingin.',
      objective: 'Pasien tampak gelisah dan memegangi dada.\nAkral dingin dan berkeringat.\nCRT 3 detik.',
      vitals: { sbp: '88', dbp: '60', hr: '118', rr: '26', temp: '36.4', spo2: '88' }, consciousness: 'compos_mentis',
      pqrst: { p: 'Muncul saat istirahat, tidak berkurang dengan istirahat', q: 'Seperti ditindih', r: 'Dada kiri menjalar ke lengan kiri', s: '8 dari 10', t: 'Terus-menerus sejak 1 jam' },
      history: 'Riwayat hipertensi dan diabetes melitus.',
    },
  },
]
