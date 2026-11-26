# API一覧（社員管理）

すべて `/api/**` はログインが必要（今は HTTP Basic。山本さん用ユーザーは環境変数 ADMIN_USER / ADMIN_PASSWORD）。

| URL | 内容 | 入力 | 出力 |
|---|---|---|---|
| GET /api/employees?q=&status= | 一覧（削除済みは出ない）。q は氏名・フリガナ・社員番号の部分一致、status は 在籍／休職／すべて | — | EmployeeSummary[] |
| GET /api/employees/{no} | 詳細 | — | EmployeeDetail |
| POST /api/employees | 登録。勤怠シートと個人フォルダも作る | EmployeeForm | { message, no } |
| PUT /api/employees/{no} | 変更（参画履歴は送った内容で置き換え） | EmployeeForm | { message, no } |
| DELETE /api/employees/{no} | 削除（論理削除。共有停止・退職者フォルダへ） | — | { message, no } |

エラー：入力・業務エラーは 422、見つからないは 404、未ログインは 401。
形：`{ "errors": [ { "field": "mail", "message": "メールアドレスの形が正しくありません" } ] }`

日付は `2026-12-01`、標準時間は `8:00`、金額は整数（円）。
