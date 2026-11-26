# settings：画面「設定」　担当：指輪

URL やメールアドレスをコードに書かず、画面から変えられるようにする（表 app_setting）。GAS版からの取り込みボタンもここ。

| ファイル | 中身 |
|---|---|
| AppSettings | 設定の読み書き（キーの一覧もここ） |
| SettingsController | 画面「設定」（/settings）、GAS版からの取り込み（/settings/import） |

## やること
- [ ] 本番の値（ひな型・フォルダ・フォーム・社労士のメール）を入れる
- [ ] 設定を足すときは、AppSettings にキーを足し、templates/settings/index.html に入力欄を足す

> **担当へのお願い（2026-11-26）**：【指輪担当】設定画面：本番の値（ひな型・フォルダ・フォーム・社労士メール）を入れてください
