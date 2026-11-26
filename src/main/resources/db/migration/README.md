# db/migration：DB の表　担当：山川

Flyway が、起動のときに V1 → V2 → … の順に1回だけ実行する。

| ファイル | 表 |
|---|---|
| V1__create_employee.sql | employee・project_assignment（社員・案件） |
| V2__create_app_setting.sql | app_setting（画面「設定」） |
| V3__create_monthly_record.sql | monthly_record（月次集計） |

## 守ること
- **一度 GitHub に入れたファイルは直さない。** 表を変えるときは V4__〇〇.sql を足す
- 開発用の DB（./data）を作り直したいときは、data フォルダを消して起動し直す
