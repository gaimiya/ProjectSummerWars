# monthly：月次集計・社労士への送付　担当：山川

勤怠（attendance）→ 計算（aggregate）→ 手当・インセンティブ・交通費・経費を足して、1人×1か月で保存する。CSV にして社労士へ送る。

| ファイル | 中身 |
|---|---|
| MonthlyService | 集計の流れ、確定、CSV、メール送信 |
| MonthlyController | 画面「月次集計」（/monthly） |
| MonthlyRecord / MonthlyRecordRepository | 月次集計の表（monthly_record） |
| MonthlyColumns | 画面の表とCSVの列（列を足すときはここ） |
| CsvExporter | CSV にする（BOM付き） |

## やること
- [ ] 社労士の給与計算ソフトが読める CSV の形（列の順番・名前・時間の書き方）を確認し、MonthlyColumns を合わせる
- [ ] メール送信の設定（SPRING_MAIL_HOST など）を用意する
- [ ] 「確定」を取り消す機能が要るか決める
- [ ] 社労士から給与明細（PDF）を受け取って配る流れを作るか決める

## 列を足すとき
1. db/migration に V4__… を足して monthly_record に列を足す
2. MonthlyRecord に項目、MonthlyService.fill に値を入れる処理を足す
3. MonthlyColumns の HEADER と row に同じ順番で足す

> **担当へのお願い（2026-11-26）**：【山川さん担当】月次集計：社労士が読めるCSVの形を確認し、MonthlyColumnsを合わせてください
