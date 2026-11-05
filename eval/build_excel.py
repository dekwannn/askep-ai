"""Buat workbook kunci jawaban evaluasi untuk anggota tim bidang keperawatan.

Pemakaian (dari folder mvp):
  node --experimental-strip-types eval/export_cases.ts eval/_cases.json
  python eval/build_excel.py eval/_cases.json eval/Kunci_Jawaban_Evaluasi.xlsx
"""
import json
import sys

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.worksheet.datavalidation import DataValidation

FONT = 'Arial'
HEADER_FILL = PatternFill('solid', fgColor='0F6B5C')
INPUT_FILL = PatternFill('solid', fgColor='FFF2B3')  # kolom yang diisi ahli
CASE_FILL = PatternFill('solid', fgColor='F2F6F5')
THIN = Side(style='thin', color='C9D3CF')
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
WRAP_TOP = Alignment(wrap_text=True, vertical='top')

STASE = {'kmb': 'Medikal Bedah', 'maternitas': 'Maternitas', 'anak': 'Anak', 'gadar': 'Gawat Darurat',
         'jiwa': 'Jiwa', 'komunitas': 'Komunitas', 'gerontik': 'Gerontik'}
N_DX = 3  # jumlah kolom dropdown per kelompok diagnosis

# Kolom kunci jawaban (dibaca kembali oleh eval/excel_to_csv.py; jangan diubah urutannya).
INPUT_HEADERS = ([f'Diagnosis utama {i}' for i in range(1, N_DX + 1)]
                 + [f'Dapat diterima {i}' for i in range(1, N_DX + 1)]
                 + ['Ada tanda bahaya?', 'Koreksi kasus / catatan'])


def font(**kw):
    return Font(name=FONT, **kw)


def case_text(d):
    v, p = d['vitals'], d['pqrst']
    ttv = (f"TD {v['sbp'] or '-'}/{v['dbp'] or '-'} mmHg, N {v['hr'] or '-'} x/mnt, RR {v['rr'] or '-'} x/mnt, "
           f"S {v['temp'] or '-'} °C, SpO2 {v['spo2'] or '-'}%")
    pqrst = ' | '.join(f'{k.upper()}: {p[k]}' for k in 'pqrst' if p[k]) or '-'
    sex = {'L': 'laki-laki', 'P': 'perempuan'}.get(d['sex'], '-')
    return {
        'identitas': f"{d['label']}, {d['age']}, {sex}\n{d['setting']}",
        'keluhan': d['chief_complaint'],
        'ds': '\n'.join(f'• {x}' for x in d['subjective'].split('\n') if x.strip()),
        'do': '\n'.join(f'• {x}' for x in d['objective'].split('\n') if x.strip()),
        'ttv': ttv, 'pqrst': pqrst, 'riwayat': d['history'] or '-',
    }


def build(src, out):
    data = json.load(open(src, encoding='utf-8'))
    cases, diagnoses = data['cases'], data['diagnoses']
    wb = Workbook()

    # ---------- Sheet 1: Petunjuk ----------
    ws = wb.active
    ws.title = 'Petunjuk'
    ws.column_dimensions['A'].width = 4
    ws.column_dimensions['B'].width = 100
    rows = [
        ('Evaluasi Akurasi Askep Tutor AI', font(bold=True, size=16, color='0F6B5C')),
        ('Untuk: anggota tim bidang keperawatan', font(italic=True, color='5A6B66')),
        ('', None),
        ('Tujuan', font(bold=True, size=12)),
        ('Kunci jawaban ini dipakai untuk mengukur seberapa tepat AI mengusulkan diagnosis keperawatan. '
         'Hasilnya (mis. "AI tepat pada X dari 20 kasus") akan dicantumkan di proposal lomba sebagai bukti yang dinilai ahli.', font()),
        ('', None),
        ('Cara mengisi (sheet "Kasus & Kunci")', font(bold=True, size=12)),
        ('1. Baca kasus di kolom berwarna abu-abu (identitas, DS, DO, TTV, PQRST, riwayat). Semua kasus FIKTIF.', font()),
        ('2. Isi HANYA kolom berwarna KUNING.', font(bold=True)),
        ('3. "Diagnosis utama 1-3": diagnosis keperawatan yang menurut Anda WAJIB muncul, urut dari prioritas tertinggi. '
         'Pilih dari dropdown (daftar lengkap ada di sheet "Daftar Diagnosis"). Boleh hanya 1 atau 2.', font()),
        ('4. "Dapat diterima 1-3": diagnosis lain yang masih benar bila disebut AI, tetapi tidak wajib. Boleh dikosongkan.', font()),
        ('5. "Ada tanda bahaya?": pilih ya/tidak, apakah kasus ini memiliki tanda bahaya yang harus segera dilaporkan.', font()),
        ('6. "Koreksi kasus / catatan": tulis bila isi kasus tidak realistis, atau ada catatan lain. '
         'Kasus nomor 5-20 adalah draf tim programmer, mohon dikoreksi bila perlu.', font()),
        ('7. Mohon isi tanpa melihat jawaban AI agar penilaian tetap objektif.', font()),
        ('', None),
        ('Contoh pengisian (bukan bagian dari 20 kasus)', font(bold=True, size=12)),
    ]
    for i, (text, f) in enumerate(rows, start=1):
        c = ws.cell(row=i, column=2, value=text)
        c.alignment = WRAP_TOP
        if f:
            c.font = f
    ex_row = len(rows) + 1
    example = [('Kasus', 'Ny. X, 45 th: nyeri ulu hati, mual, muntah 3x, porsi makan habis 1/4, BB turun 3 kg/bulan'),
               ('Diagnosis utama 1', 'Defisit nutrisi'), ('Diagnosis utama 2', 'Nausea'),
               ('Dapat diterima 1', 'Nyeri akut'), ('Ada tanda bahaya?', 'tidak'),
               ('Koreksi kasus / catatan', 'Sebutkan juga hasil penimbangan BB terakhir')]
    for j, (k, val) in enumerate(example):
        r = ex_row + j
        ws.cell(row=r, column=2, value=f'{k}: {val}').font = font(color='5A6B66')
        if k != 'Kasus':
            ws.cell(row=r, column=1).fill = INPUT_FILL
    note_row = ex_row + len(example) + 1
    ws.cell(row=note_row, column=2, value='Keterangan warna').font = font(bold=True, size=12)
    ws.cell(row=note_row + 1, column=1).fill = INPUT_FILL
    ws.cell(row=note_row + 1, column=2, value='Kuning = diisi oleh ahli keperawatan').font = font()
    ws.cell(row=note_row + 2, column=1).fill = CASE_FILL
    ws.cell(row=note_row + 2, column=2, value='Abu-abu = isi kasus (boleh dikoreksi lewat kolom catatan)').font = font()
    ws.cell(row=note_row + 4, column=2,
            value='Setelah selesai, simpan file ini dan kirim kembali ke tim programmer.').font = font(bold=True)

    # ---------- Sheet 3: Daftar Diagnosis (dibuat dulu untuk referensi validasi) ----------
    wd = wb.create_sheet('Daftar Diagnosis')
    head = ['No', 'Diagnosis', 'Jenis', 'Domain']
    for col, h in enumerate(head, start=1):
        c = wd.cell(row=1, column=col, value=h)
        c.font = font(bold=True, color='FFFFFF')
        c.fill = HEADER_FILL
        c.border = BORDER
    for i, d in enumerate(sorted(diagnoses, key=lambda x: x['label'].lower()), start=2):
        for col, val in enumerate([i - 1, d['label'], d['type'], d['domain']], start=1):
            c = wd.cell(row=i, column=col, value=val)
            c.font = font()
            c.border = BORDER
    for col, w in zip('ABCD', [6, 44, 12, 34]):
        wd.column_dimensions[col].width = w
    wd.freeze_panes = 'A2'
    last_dx_row = len(diagnoses) + 1

    # ---------- Sheet 2: Kasus & Kunci ----------
    wk = wb.create_sheet('Kasus & Kunci', 1)
    case_headers = ['No', 'ID kasus', 'Stase', 'Judul', 'Identitas & setting', 'Keluhan utama',
                    'Data subjektif (DS)', 'Data objektif (DO)', 'Tanda vital', 'PQRST', 'Riwayat']
    headers = case_headers + INPUT_HEADERS
    widths = [5, 22, 13, 28, 26, 24, 46, 46, 26, 30, 24] + [26] * (2 * N_DX) + [12, 36]
    for col, (h, w) in enumerate(zip(headers, widths), start=1):
        c = wk.cell(row=1, column=col, value=h)
        c.font = font(bold=True, color='FFFFFF')
        c.fill = HEADER_FILL
        c.alignment = Alignment(wrap_text=True, vertical='center', horizontal='center')
        c.border = BORDER
        wk.column_dimensions[c.column_letter].width = w
    wk.row_dimensions[1].height = 36

    first_input_col = len(case_headers) + 1
    for i, case in enumerate(cases, start=2):
        t = case_text(case['data'])
        values = [i - 1, case['id'], STASE.get(case['data']['stase'], case['data']['stase']), case['title'],
                  t['identitas'], t['keluhan'], t['ds'], t['do'], t['ttv'], t['pqrst'], t['riwayat']]
        for col, val in enumerate(values, start=1):
            c = wk.cell(row=i, column=col, value=val)
            c.font = font(size=10)
            c.alignment = WRAP_TOP
            c.fill = CASE_FILL
            c.border = BORDER
        for col in range(first_input_col, len(headers) + 1):
            c = wk.cell(row=i, column=col)
            c.fill = INPUT_FILL
            c.font = font(size=10)
            c.alignment = WRAP_TOP
            c.border = BORDER
        wk.row_dimensions[i].height = 120
    last_row = len(cases) + 1

    dx_list = DataValidation(type='list', formula1=f"='Daftar Diagnosis'!$B$2:$B${last_dx_row}", allow_blank=True)
    dx_list.error = 'Pilih diagnosis dari daftar (sheet "Daftar Diagnosis").'
    dx_list.errorTitle = 'Diagnosis tidak ada di daftar'
    dx_list.prompt = 'Pilih dari dropdown'
    yn = DataValidation(type='list', formula1='"ya,tidak"', allow_blank=True)
    wk.add_data_validation(dx_list)
    wk.add_data_validation(yn)
    for k in range(2 * N_DX):
        letter = wk.cell(row=1, column=first_input_col + k).column_letter
        dx_list.add(f'{letter}2:{letter}{last_row}')
    yn_letter = wk.cell(row=1, column=first_input_col + 2 * N_DX).column_letter
    yn.add(f'{yn_letter}2:{yn_letter}{last_row}')

    wk.freeze_panes = 'E2'
    wk.auto_filter.ref = f'A1:{wk.cell(row=1, column=len(headers)).column_letter}{last_row}'
    wk.sheet_view.zoomScale = 90

    wb.save(out)
    print(f'OK: {out} ({len(cases)} kasus, {len(diagnoses)} diagnosis)')


if __name__ == '__main__':
    build(sys.argv[1], sys.argv[2])
