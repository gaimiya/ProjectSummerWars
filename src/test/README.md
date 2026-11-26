# test：テスト　担当：全員

`gradle test` で全部動く。GitHub に push すると自動でも動く（Actions タブ）。

| テスト | 確かめること | 担当 |
|---|---|---|
| aggregate/AggregationRulesTest | 集計ルール | 横田 |
| attendance/MonthSheetParserTest | 勤怠シートの読み取り・入力チェック | 横田 |
| expense/ExpenseTotalsTest | 交通費・経費の合計 | 山川 |
| monthly/CsvExporterTest | CSV の形 | 山川 |
| employee/EmployeeImportTest | GAS版からの取り込み | 宮谷 |
| ScreensTest | 画面の流れ（ログイン → 登録 → 集計 → CSV） | 指輪 |

機能を足したら、テストも足す。Actions が赤くなったら、直してから次の作業をする。
