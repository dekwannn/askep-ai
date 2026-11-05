"""Ubah workbook kunci jawaban yang sudah diisi ahli menjadi eval/kunci_jawaban.csv.

Pemakaian (dari folder mvp):
  python eval/excel_to_csv.py eval/Kunci_Jawaban_Evaluasi_AskepTutorAI.xlsx
  npm run eval
"""
import csv
import sys

from openpyxl import load_workbook

OUT_DEFAULT = 'eval/kunci_jawaban.csv'


def main(path, out=OUT_DEFAULT):
    ws = load_workbook(path, data_only=True)['Kasus & Kunci']
    header = [str(c.value or '').strip() for c in ws[1]]
    col = {h: i for i, h in enumerate(header)}
    pick = lambda row, prefix: [str(row[i] or '').strip() for h, i in col.items() if h.startswith(prefix)]

    rows, filled = [], 0
    for row in ws.iter_rows(min_row=2, values_only=True):
        case_id = str(row[col['ID kasus']] or '').strip()
        if not case_id:
            continue
        primary = [x for x in pick(row, 'Diagnosis utama') if x]
        acceptable = [x for x in pick(row, 'Dapat diterima') if x]
        red_flag = str(row[col['Ada tanda bahaya?']] or '').strip().lower()
        note = str(row[col['Koreksi kasus / catatan']] or '').strip()
        filled += bool(primary)
        rows.append([case_id, row[col['Judul']], '|'.join(primary), '|'.join(acceptable), red_flag, note])

    with open(out, 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.writer(f, delimiter=';', lineterminator='\r\n')
        w.writerow(['case_id', 'judul', 'diagnosis_utama', 'diagnosis_dapat_diterima', 'tanda_bahaya', 'catatan_ahli'])
        w.writerows(rows)
    print(f'OK: {out} ({filled} dari {len(rows)} kasus sudah memiliki diagnosis utama)')


if __name__ == '__main__':
    main(*(sys.argv[1:] or ['eval/Kunci_Jawaban_Evaluasi_AskepTutorAI.xlsx']))
