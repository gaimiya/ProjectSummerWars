# employee：社員管理　担当：宮谷

社員の登録・変更・削除と、勤怠シート・個人フォルダの作成・共有。

| ファイル | 中身 |
|---|---|
| Employee / ProjectAssignment | 社員と案件・参画履歴（表 employee・project_assignment） |
| EmployeeRepository | 社員の検索 |
| EmployeeForm | 画面の入力（チェックのルールもここ） |
| EmployeeService | 登録・変更・削除、勤怠シートの作成・差し替え、毎朝7時の共有、GAS版からの取り込み |
| EmployeeController | 画面「社員管理」（/employees） |
| EmployeeImport | GAS版「社員管理表」を読む（切り替え用） |

## やること
- [ ] 本物の Google で、登録 → 勤怠シート作成 → 入社日の共有 → 削除（共有解除・退職者フォルダへ移動）を通しで確認する
- [ ] GAS版からの取り込みを、本物の社員管理表で確認する（docs/GAS停止手順.md）
- [ ] 入力チェックの追加（社員番号の形、入社日が未来すぎないか など）が要るか、山本さんに確認する
- [ ] 社員の変更履歴を残すか決める

## 守ること
- 画面の入力チェックは EmployeeForm、業務のチェック（社員番号の重複など）は EmployeeService に書く
- Google を触るときは google パッケージの GoogleWorkspace を使う（直接 API を呼ばない）

> **担当へのお願い（2026-11-26）**：【宮谷さん担当】社員管理：本物のGoogleで登録→勤怠シート作成→共有→削除を通しで確認してください
