import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { employeeApi } from '../../api/employee'
import { ApiError } from '../../api/client'
import type { EmployeeDetail as Detail, EmployeeForm } from '../../types/employee'
import { ConfirmBox, Tag, Toast, shareTone } from '../../components/Feedback'
import { Tabs } from '../../components/Tabs'
import { AllowanceFields, BasicFields, HistoryFields, PayFields, SheetFields, toFieldErrors } from './EmployeeForm'

type TabKey = 'basic' | 'pay' | 'allow' | 'proj' | 'sheet'
const TABS: [TabKey, string][] = [['basic', '基本情報'], ['pay', '給与条件'], ['allow', '手当'], ['proj', '案件・参画履歴'], ['sheet', '勤怠シート']]

export function EmployeeDetail() {
  const { no = '' } = useParams()
  const nav = useNavigate()
  const [d, setD] = useState<Detail | null>(null)
  const [f, setF] = useState<EmployeeForm | null>(null)
  const [tab, setTab] = useState<TabKey>('basic')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = () => employeeApi.get(no).then((x) => { setD(x); setF(x) }).catch((e) => setError(e.message))
  useEffect(() => { load() }, [no]) // eslint-disable-line react-hooks/exhaustive-deps

  if (error && !d) return <><Link className="back" to="/employees">← 社員一覧へ戻る</Link><Toast text={error} error /></>
  if (!d || !f) return <p className="muted">読み込み中…</p>
  const set = (p: Partial<EmployeeForm>) => setF({ ...f, ...p })

  const save = async () => {
    setBusy(true); setError(''); setMessage('')
    try {
      const r = await employeeApi.update(no, f)
      setErrors({}); setMessage(r.message); await load()
    } catch (e) {
      if (e instanceof ApiError) { setErrors(toFieldErrors(e.errors)); setError(e.message) } else setError(String(e))
    } finally { setBusy(false) }
  }
  const remove = async () => {
    setBusy(true)
    try {
      const r = await employeeApi.remove(no)
      nav('/employees', { state: { message: r.message } })
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); setBusy(false) }
  }

  return (
    <>
      <Link className="back" to="/employees">← 社員一覧へ戻る</Link>
      <Toast text={message} onClose={() => setMessage('')} />
      <Toast text={error} error />
      <div className="row between mb" style={{ alignItems: 'flex-end' }}>
        <div>
          <div className="muted">{d.no}　{d.dept}</div>
          <h1>{d.name} <span className="kana">{d.kana}</span></h1>
        </div>
        <div className="row">
          <button className="btn-danger" onClick={() => setConfirm(true)}>この社員を削除</button>
          <button className="btn" onClick={save} disabled={busy}>変更を保存</button>
        </div>
      </div>
      {confirm && (
        <ConfirmBox title={`${d.name} さんを削除しますか？`} okLabel="削除する" onOk={remove} onCancel={() => setConfirm(false)} busy={busy}>
          退職などで削除すると、社員一覧から消え、勤怠シートの本人への共有を止めます。勤怠シートと個人フォルダは「退職者」フォルダに移して残します。
        </ConfirmBox>
      )}
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      <div className="card pad">
        {tab === 'basic' && <BasicFields f={f} set={set} errors={errors} isNew={false} />}
        {tab === 'pay' && <><PayFields f={f} set={set} errors={errors} /><p className="muted" style={{ marginTop: 16 }}>給与計算は社労士が行います。ここでは社労士に渡す条件を登録します。</p></>}
        {tab === 'allow' && <AllowanceFields f={f} set={set} errors={errors} />}
        {tab === 'proj' && <HistoryFields f={f} set={set} errors={errors} />}
        {tab === 'sheet' && (
          <div className="stack">
            <SheetFields f={f} set={set} errors={errors} isNew={false} />
            <div className="row">
              {d.sheetUrl && <a href={d.sheetUrl} target="_blank" rel="noreferrer">勤怠シートを開く</a>}
              {d.folderUrl && <a href={d.folderUrl} target="_blank" rel="noreferrer">個人フォルダを開く</a>}
            </div>
            <div><span className="muted">本人への共有：</span><Tag text={d.shareState} tone={shareTone(d.shareState)} /></div>
            <p className="muted">URLを書き換えて「変更を保存」を押すと、既存の別のシートに差し替えられます。</p>
          </div>
        )}
      </div>
    </>
  )
}
