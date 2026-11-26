import { request, ApiError } from './client'
import type { EmployeeDetail, EmployeeForm, EmployeeSummary, Result } from '../types/employee'

/** VITE_USE_MOCK=true のときは backend なしで仮データで動く */
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const employeeApi = USE_MOCK ? mockApi() : {
  list: (q = '', status = 'すべて') =>
    request<EmployeeSummary[]>('GET', `/api/employees?q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}`),
  get: (no: string) => request<EmployeeDetail>('GET', `/api/employees/${encodeURIComponent(no)}`),
  create: (f: EmployeeForm) => request<Result>('POST', '/api/employees', f),
  update: (no: string, f: EmployeeForm) => request<Result>('PUT', `/api/employees/${encodeURIComponent(no)}`, f),
  remove: (no: string) => request<Result>('DELETE', `/api/employees/${encodeURIComponent(no)}`),
}

function mockApi() {
  const db: EmployeeDetail[] = [
    { no: 'E0001', name: '山田 太郎', kana: 'ヤマダ タロウ', mail: 'taro@example.com', dept: '開発部', type: '正社員', joined: '2025-04-01', status: '在籍', payType: '月給', base: 250000, stdTime: '8:00', commute: 10000, housing: 10000, fixed: 0, fixedName: null, sheetUrl: '#', folderUrl: '#', shareState: '共有済み', history: [{ project: '案件A', amount: 30000, from: '2026-04-01', to: null }] },
    { no: 'E0002', name: '鈴木 一郎', kana: 'スズキ イチロウ', mail: 'ichiro@example.com', dept: '開発部', type: '契約社員', joined: '2026-10-01', status: '在籍', payType: '月給', base: 220000, stdTime: '8:00', commute: 8000, housing: 0, fixed: 0, fixedName: null, sheetUrl: '#', folderUrl: '#', shareState: '共有済み', history: [] },
  ]
  const wait = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(structuredClone(v)), 150))
  const find = (no: string) => {
    const e = db.find((x) => x.no === no)
    if (!e) throw new ApiError(404, [{ field: null, message: '社員が見つかりません' }])
    return e
  }
  return {
    list: (q = '', status = 'すべて') => wait(db.filter((e) =>
      (status === 'すべて' || e.status === status) && (!q || [e.name, e.kana ?? '', e.no].some((s) => s.includes(q))))),
    get: (no: string) => wait(find(no)),
    create: (f: EmployeeForm) => {
      if (db.some((e) => e.no === f.no)) return Promise.reject(new ApiError(422, [{ field: 'no', message: `社員番号「${f.no}」はすでに使われています` }]))
      db.push({ ...f, status: '在籍', sheetUrl: f.sheetUrl || '#', folderUrl: f.folderUrl || '#', shareState: '入社日に共有予定' })
      return wait({ message: `${f.name} さんを登録しました（仮データ）。`, no: f.no })
    },
    update: (no: string, f: EmployeeForm) => { Object.assign(find(no), f); return wait({ message: `${f.name} さんの変更を保存しました（仮データ）。`, no }) },
    remove: (no: string) => { const e = find(no); db.splice(db.indexOf(e), 1); return wait({ message: `${e.name} さんを削除しました（仮データ）。`, no }) },
  }
}
