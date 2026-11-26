export type Status = '在籍' | '休職'
export type ShareState = '未作成' | '入社日に共有予定' | '共有済み' | '共有停止'

export type EmployeeSummary = {
  no: string; name: string; kana: string | null; dept: string | null; type: string
  joined: string; status: Status; housing: number; shareState: ShareState
}

export type Assignment = { project: string; amount: number; from: string | null; to: string | null }

export type EmployeeDetail = {
  no: string; name: string; kana: string | null; mail: string; dept: string | null; type: string
  joined: string; status: Status; payType: string; base: number; stdTime: string
  commute: number; housing: number; fixed: number; fixedName: string | null
  sheetUrl: string | null; folderUrl: string | null; shareState: ShareState
  history: Assignment[]
}

/** 登録・変更で送る形（sheetUrl・folderUrl：新規で空ならひな型から作る。既存シートを使うときはURL） */
export type EmployeeForm = Omit<EmployeeDetail, 'shareState'>

/** 交通費・経費フォームの設定 */
export type FormSetting = { key: 'TRANSPORT' | 'EXPENSE'; title: string; url: string }

export type Result = { message: string; no: string }
export type FieldError = { field: string | null; message: string }
