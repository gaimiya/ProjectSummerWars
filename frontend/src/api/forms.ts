import { request } from './client'
import type { FormSetting } from '../types/employee'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

/** 交通費・経費フォームの登録（既存フォームのURLを登録・差し替え） */
export const formApi = USE_MOCK ? mockApi() : {
  list: () => request<FormSetting[]>('GET', '/api/settings/forms'),
  save: (key: FormSetting['key'], url: string) => request<FormSetting>('PUT', `/api/settings/forms/${key}`, { url }),
}

function mockApi() {
  const db: FormSetting[] = [
    { key: 'TRANSPORT', title: '交通費申請', url: '' },
    { key: 'EXPENSE', title: '経費申請', url: '' },
  ]
  const wait = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(structuredClone(v)), 150))
  return {
    list: () => wait(db),
    save: (key: FormSetting['key'], url: string) => { const f = db.find((x) => x.key === key)!; f.url = url; return wait(f) },
  }
}
