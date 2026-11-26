import type { ReactNode } from 'react'

/** 完了（緑）・エラー（赤）のメッセージ */
export function Toast({ text, error, onClose }: { text: string; error?: boolean; onClose?: () => void }) {
  if (!text) return null
  return (
    <div className={error ? 'toast toast-error' : 'toast'} role={error ? 'alert' : 'status'}>
      <span>{text}</span>
      {onClose && <button className="toast-close" onClick={onClose} aria-label="閉じる">×</button>}
    </div>
  )
}

/** 削除などの確認枠（赤） */
export function ConfirmBox({ title, children, okLabel, onOk, onCancel, busy }:
  { title: string; children: ReactNode; okLabel: string; onOk: () => void; onCancel: () => void; busy?: boolean }) {
  return (
    <div className="confirm">
      <div className="confirm-title">{title}</div>
      <div className="confirm-body">{children}</div>
      <div className="row">
        <button className="btn-danger-fill" onClick={onOk} disabled={busy}>{okLabel}</button>
        <button className="btn-sub" onClick={onCancel}>キャンセル</button>
      </div>
    </div>
  )
}

/** 状態の小さなラベル */
export function Tag({ text, tone }: { text: string; tone: 'ok' | 'wait' | 'gray' }) {
  return <span className={`tag tag-${tone}`}>{text}</span>
}
export const shareTone = (s: string) => (s === '共有済み' ? 'ok' : s === '共有停止' || s === '未作成' ? 'gray' : 'wait')
