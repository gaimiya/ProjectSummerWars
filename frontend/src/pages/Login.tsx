import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../api/client'
import { employeeApi } from '../api/employee'
import { TextField } from '../components/Field'
import { Toast } from '../components/Feedback'

/** 山本さん用ログイン（仮。本格版は山川さん担当で置き換え） */
export function Login() {
  const nav = useNavigate()
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    auth.set(user, pass)
    try { await employeeApi.list(); nav('/employees') }
    catch { auth.clear(); setError('ユーザー名かパスワードが違います') }
  }
  return (
    <div className="login">
      <form className="card pad stack" onSubmit={submit}>
        <h1>勤怠・給与集計</h1>
        <Toast text={error} error />
        <TextField label="ユーザー名" value={user} onChange={(e) => setUser(e.target.value)} autoComplete="username" />
        <TextField label="パスワード" type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" />
        <button className="btn" type="submit">ログイン</button>
      </form>
    </div>
  )
}
