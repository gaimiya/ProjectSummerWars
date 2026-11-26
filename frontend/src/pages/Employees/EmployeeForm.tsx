import { TextField, SelectField } from '../../components/Field'
import type { EmployeeForm as Form } from '../../types/employee'

export const TYPES = ['正社員', '契約社員', 'パート・アルバイト']
export const PAYS = ['月給', '日給', '時給']
export const HOUSING_NOTE = '在籍7か月以上の社員は 10,000 円'

export const emptyForm = (): Form => ({
  no: '', name: '', kana: '', mail: '', dept: '', type: '正社員', joined: '', status: '在籍',
  payType: '月給', base: 0, stdTime: '8:00', commute: 0, housing: 0, fixed: 0, fixedName: '', history: [],
  sheetUrl: '', folderUrl: '',
})

type Props = { f: Form; set: (patch: Partial<Form>) => void; errors: Record<string, string> }
const num = (v: string) => (v === '' ? 0 : Number(v.replace(/[,円\s]/g, '')))

export function BasicFields({ f, set, errors, isNew }: Props & { isNew: boolean }) {
  return (
    <div className="grid">
      <TextField label="社員番号" required value={f.no} readOnly={!isNew} placeholder="E0004" error={errors.no} onChange={(e) => set({ no: e.target.value })} />
      <TextField label="氏名" required value={f.name} placeholder="例：佐藤 花子" error={errors.name} onChange={(e) => set({ name: e.target.value })} />
      <TextField label="フリガナ" value={f.kana ?? ''} placeholder="サトウ ハナコ" onChange={(e) => set({ kana: e.target.value })} />
      <TextField label="メールアドレス" required type="email" value={f.mail} placeholder="hanako@example.com" error={errors.mail} onChange={(e) => set({ mail: e.target.value })} />
      <TextField label="所属" value={f.dept ?? ''} placeholder="開発部" onChange={(e) => set({ dept: e.target.value })} />
      <SelectField label="雇用形態" value={f.type} options={TYPES} onChange={(v) => set({ type: v })} />
      <TextField label="入社日" required type="date" value={f.joined} error={errors.joined} onChange={(e) => set({ joined: e.target.value })} />
      {!isNew && <SelectField label="在籍" value={f.status} options={['在籍', '休職']} onChange={(v) => set({ status: v as Form['status'] })} />}
    </div>
  )
}

export function PayFields({ f, set, errors }: Props) {
  return (
    <div className="grid">
      <SelectField label="給与形態" value={f.payType} options={PAYS} onChange={(v) => set({ payType: v })} />
      <TextField label="基本給（円）" inputMode="numeric" value={String(f.base || '')} placeholder="250000" error={errors.base} onChange={(e) => set({ base: num(e.target.value) })} />
      <TextField label="1日の標準時間" value={f.stdTime} placeholder="8:00" error={errors.stdTime} onChange={(e) => set({ stdTime: e.target.value })} />
    </div>
  )
}

export function AllowanceFields({ f, set, errors }: Props) {
  return (
    <div className="grid">
      <TextField label="通勤手当（月額・円）" inputMode="numeric" value={String(f.commute || '')} placeholder="10000" error={errors.commute} onChange={(e) => set({ commute: num(e.target.value) })} />
      <TextField label="住宅手当（月額・円）" inputMode="numeric" value={String(f.housing || '')} placeholder="0" note={HOUSING_NOTE} error={errors.housing} onChange={(e) => set({ housing: num(e.target.value) })} />
      <TextField label="固定手当（月額・円）" inputMode="numeric" value={String(f.fixed || '')} placeholder="0" error={errors.fixed} onChange={(e) => set({ fixed: num(e.target.value) })} />
      <TextField label="固定手当の名前" value={f.fixedName ?? ''} placeholder="例：資格手当" onChange={(e) => set({ fixedName: e.target.value })} />
    </div>
  )
}

export function HistoryFields({ f, set }: Props) {
  const rows = f.history
  const update = (i: number, patch: Partial<Form['history'][number]>) =>
    set({ history: rows.map((r, j) => (j === i ? { ...r, ...patch } : r)) })
  return (
    <>
      <div className="table-wrap">
        <table className="table" style={{ minWidth: 600 }}>
          <thead><tr><th>案件</th><th>インセンティブ月額（円）</th><th>参画開始</th><th>参画終了</th><th /></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td><input aria-label="案件名" value={r.project} placeholder="案件名" onChange={(e) => update(i, { project: e.target.value })} /></td>
                <td><input aria-label="インセンティブ月額" inputMode="numeric" value={String(r.amount || '')} placeholder="30000" onChange={(e) => update(i, { amount: num(e.target.value) })} /></td>
                <td><input aria-label="参画開始" type="date" value={r.from ?? ''} onChange={(e) => update(i, { from: e.target.value || null })} /></td>
                <td><input aria-label="参画終了" type="date" value={r.to ?? ''} onChange={(e) => update(i, { to: e.target.value || null })} /></td>
                <td><button className="btn-sub" onClick={() => set({ history: rows.filter((_, j) => j !== i) })}>削除</button></td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={5} className="muted">参画履歴はまだありません。</td></tr>}
          </tbody>
        </table>
      </div>
      <button className="btn-outline" style={{ marginTop: 14 }} onClick={() => set({ history: [...rows, { project: '', amount: 0, from: null, to: null }] })}>＋ 参画を追加</button>
    </>
  )
}

/** backend のエラー一覧を「項目名 → メッセージ」に変える */
export function toFieldErrors(list: { field: string | null; message: string }[]) {
  const m: Record<string, string> = {}
  list.forEach((e) => { if (e.field && !m[e.field]) m[e.field] = e.message })
  return m
}

/** 勤怠シート・個人フォルダのURL（既存のシートを使う／差し替える） */
export function SheetFields({ f, set, errors, isNew }: Props & { isNew: boolean }) {
  return (
    <div className="grid">
      <TextField label="勤怠シートのURL" value={f.sheetUrl ?? ''} placeholder="https://docs.google.com/spreadsheets/d/…" error={errors.sheetUrl}
        note={isNew ? '空なら、ひな型から新しく作ります。既存のシートを使うときはURLを貼ってください' : '既存の別のスプレッドシートに差し替えるときは、そのURLを貼ります'}
        onChange={(e) => set({ sheetUrl: e.target.value })} />
      <TextField label="個人フォルダのURL（任意）" value={f.folderUrl ?? ''} placeholder="https://drive.google.com/drive/folders/…" error={errors.folderUrl}
        onChange={(e) => set({ folderUrl: e.target.value })} />
    </div>
  )
}
