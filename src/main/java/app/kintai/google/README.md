# google：Google（スプレッドシート・ドライブ）の窓口　担当：宮谷

システムから Google を触るときは、必ずここの GoogleWorkspace を通す。

| ファイル | 中身 |
|---|---|
| GoogleWorkspace | できること一覧（読む・シート複製・セルに書く・フォルダ作成・コピー・共有・共有解除・移動） |
| GoogleRestWorkspace | 本物（サービスアカウントで Sheets API・Drive API を呼ぶ） |
| FakeGoogleWorkspace | 仮データ（鍵がないとき・テストのとき） |
| GoogleConfig | 環境変数 GOOGLE_CREDENTIALS があれば本物、なければ仮データ |

## やること
- [ ] Google Cloud でプロジェクトとサービスアカウントを作り、Sheets API・Drive API を有効にする（README の「Google の準備」）
- [ ] 鍵ファイルを安全な場所に置き、GOOGLE_CREDENTIALS に場所を入れる（鍵は Git に入れない）
- [ ] GoogleRestWorkspace の全部の機能を、本物のファイルで1つずつ確認する
- [ ] 共有ドライブを使うか決める（使うなら共有ドライブにサービスアカウントを追加）
