import type { FieldError } from '../types/employee'

/** backend が返したエラー（422 など） */
export class ApiError extends Error {
  constructor(public status: number, public errors: FieldError[]) {
    super(errors.map((e) => e.message).join(' ／ ') || `エラー（${status}）`)
  }
}

const KEY = 'kintai-auth'
export const auth = {
  set: (user: string, pass: string) => sessionStorage.setItem(KEY, btoa(unescape(encodeURIComponent(`${user}:${pass}`)))),
  clear: () => sessionStorage.removeItem(KEY),
  has: () => !!sessionStorage.getItem(KEY),
}

/** backend を呼ぶ共通処理（fetch はここだけに書く） */
export async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(auth.has() ? { Authorization: `Basic ${sessionStorage.getItem(KEY)}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (res.status === 401) {
    auth.clear()
    throw new ApiError(401, [{ field: null, message: 'ログインしてください' }])
  }
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, json.errors ?? [])
  return json as T
}
