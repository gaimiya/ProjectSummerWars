import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { employeeApi } from '../../api/employee'
import type { EmployeeSummary } from '../../types/employee'
import { Tag, Toast, shareTone } from '../../components/Feedback'

const FILTERS = ['すべて', '在籍', '休職']
const yen = (n: number) => `${n.toLocaleString()}円`

export function EmployeeList() {
  const nav = useNavigate()
  const loc = useLocation()
  const [rows, setRows] = useState<EmployeeSummary[] | null>(null)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('すべて')
  const [message, setMessage] = useState<string>((loc.state as { message?: string } | null)?.message ?? '')
  const [error, setError] = useState('')

  useEffect(() => {
    const t = setTimeout(() => {
      employeeApi.list(q, filter).then(setRows).catch((e) => setError(e.message))
    }, 200) // 入力のたびに呼ばないよう少し待つ
    return () => clearTimeout(t)
  }, [q, filter])

  return (
    <>
      <Toast text={message} onClose={() => setMessage('')} />
      <Toast text={error} error />
      <div className="row between mb">
        <h1>社員一覧</h1>
        <button className="btn" onClick={() => nav('/employees/new')}>＋ 社員を登録</button>
      </div>
      <div className="row mb">
        <input className="search" placeholder="氏名・フリガナ・社員番号で検索" aria-label="検索" value={q} onChange={(e) => setQ(e.target.value)} />
        {FILTERS.map((f) => (
          <button key={f} className={filter === f ? 'pill on' : 'pill'} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>
      <div className="card table-wrap">
        <table className="table">
          <thead><tr><th>社員番号</th><th>氏名</th><th>所属</th><th>雇用形態</th><th>入社日</th><th>在籍</th><th>住宅手当</th><th>勤怠シート</th><th /></tr></thead>
          <tbody>
            {rows === null && <tr><td colSpan={9} className="muted">読み込み中…</td></tr>}
            {rows?.map((e) => (
              <tr key={e.no}>
                <td>{e.no}</td>
                <td className="strong">{e.name}</td>
                <td>{e.dept}</td>
                <td>{e.type}</td>
                <td>{e.joined}</td>
                <td><Tag text={e.status} tone={e.status === '休職' ? 'wait' : 'ok'} /></td>
                <td>{yen(e.housing)}</td>
                <td><Tag text={e.shareState} tone={shareTone(e.shareState)} /></td>
                <td><Link className="btn-outline" to={`/employees/${encodeURIComponent(e.no)}`}>詳細</Link></td>
              </tr>
            ))}
            {rows?.length === 0 && <tr><td colSpan={9} className="muted">該当する社員はいません。</td></tr>}
          </tbody>
        </table>
      </div>
      {rows && <p className="muted">{rows.length}件を表示中</p>}
    </>
  )
}
