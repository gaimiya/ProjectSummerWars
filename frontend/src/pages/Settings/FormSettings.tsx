import { useEffect, useState } from 'react'
import { formApi } from '../../api/forms'
import type { FormSetting } from '../../types/employee'
import { Tag, Toast } from '../../components/Feedback'

/** 交通費・経費の Google フォームを登録・変更する（既存のフォームも使える） */
export function FormSettings() {
  const [list, setList] = useState<FormSetting[]>([])
  const [input, setInput] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')

  const load = () => formApi.list().then((l) => { setList(l); setInput(Object.fromEntries(l.map((f) => [f.key, f.url]))) }).catch((e) => setError(e.message))
  useEffect(() => { load() }, [])

  const save = async (f: FormSetting) => {
    setBusy(f.key); setError(''); setMessage('')
    try {
      await formApi.save(f.key, (input[f.key] ?? '').trim())
      setMessage(`${f.title}フォームを保存しました。`); await load()
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) } finally { setBusy('') }
  }

  return (
    <>
      <h1>フォーム設定</h1>
      <p className="muted lead">交通費・経費の申請に使う Google フォームを登録します。既存のフォームを使うときは、そのURLを貼って「保存」。
        回答は社員管理表の同じ名前のシートに入り、「承認」にチェックしたものだけ月次集計に入ります。</p>
      <Toast text={message} onClose={() => setMessage('')} />
      <Toast text={error} error />
      {list.map((f) => (
        <div className="card pad mb" key={f.key}>
          <div className="row between mb">
            <strong>{f.title}</strong>
            {f.url ? <Tag text="登録済み" tone="ok" /> : <Tag text="未登録" tone="gray" />}
          </div>
          <div className="row">
            <input style={{ flex: '1 1 360px' }} aria-label={`${f.title}フォームのURL`} placeholder="https://docs.google.com/forms/d/…/edit"
              value={input[f.key] ?? ''} onChange={(e) => setInput({ ...input, [f.key]: e.target.value })} />
            <button className="btn" onClick={() => save(f)} disabled={busy === f.key}>{busy === f.key ? '保存中…' : '保存'}</button>
            {f.url && <a href={f.url} target="_blank" rel="noreferrer">フォームを開く</a>}
          </div>
        </div>
      ))}
    </>
  )
}
