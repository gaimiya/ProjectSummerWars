import type { InputHTMLAttributes } from 'react'

type Base = { label: string; required?: boolean; error?: string; note?: string }

/** ラベル付き入力欄 */
export function TextField({ label, required, error, note, ...input }: Base & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="field">
      <span>{label}{required && <span className="req"> *</span>}</span>
      <input {...input} className={error ? 'bad' : undefined} aria-invalid={!!error} />
      {note && <small>{note}</small>}
      {error && <small className="field-error">{error}</small>}
    </label>
  )
}

/** ラベル付きセレクト */
export function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </label>
  )
}
