import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { employeeApi } from '../../api/employee'
import { ApiError } from '../../api/client'
import { Toast } from '../../components/Feedback'
import { AllowanceFields, BasicFields, PayFields, emptyForm, toFieldErrors } from './EmployeeForm'

export function EmployeeNew() {
  const nav = useNavigate()
  const [f, setF] = useState(emptyForm())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (p: Partial<typeof f>) => setF({ ...f, ...p })

  const submit = async () => {
    setBusy(true); setError('')
    try {
      const r = await employeeApi.create(f)
      nav('/employees', { state: { message: r.message } })
    } catch (e) {
      if (e instanceof ApiError) { setErrors(toFieldErrors(e.errors)); setError(e.message) } else setError(String(e))
      setBusy(false)
    }
  }

  return (
    <>
      <Link className="back" to="/employees">← 社員一覧へ戻る</Link>
      <h1>社員を登録</h1>
      <p className="muted lead">登録すると勤怠シートと個人フォルダを作成し、入社日の朝に本人へ共有します。<span className="req">*</span> は必須です。</p>
      <Toast text={error} error />
      <div className="card pad stack">
        <BasicFields f={f} set={set} errors={errors} isNew />
        <PayFields f={f} set={set} errors={errors} />
        <AllowanceFields f={f} set={set} errors={errors} />
      </div>
      <div className="row" style={{ marginTop: 18 }}>
        <button className="btn" onClick={submit} disabled={busy}>{busy ? '作成中…' : '登録して勤怠シートを作成'}</button>
        <button className="btn-sub" onClick={() => nav('/employees')}>キャンセル</button>
      </div>
    </>
  )
}
