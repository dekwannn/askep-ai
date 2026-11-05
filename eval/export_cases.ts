// Ekspor kasus evaluasi + daftar diagnosis bank ke JSON (input untuk eval/build_excel.py).
import { writeFileSync } from 'node:fs'
import { BANK } from '../src/lib/bank.ts'
import { EVAL_CASES } from './cases.ts'

writeFileSync(process.argv[2] ?? 'eval/_cases.json', JSON.stringify({ cases: EVAL_CASES, diagnoses: BANK.diagnoses }))
