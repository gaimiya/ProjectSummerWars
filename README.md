# 勤怠・給与集計システム（社員管理画面）

| フォルダ | 中身 | 担当 |
|---|---|---|
| gas/library | 勤怠提出ライブラリ（勤怠シートのメニュー・チェック・提出） | 指輪・横田・山川・宮谷 |
| gas/template | 勤怠表_ひな型に付けるコード | 指輪 |
| gas/employee-admin | 社員管理画面のGAS版（社員管理表に付ける。試用・つなぎ用） | 指輪 |
| backend | Java 21 / Spring Boot 3（社員管理API） | 山川（土台）・宮谷（社員管理） |
| frontend | React + TypeScript（社員管理画面） | 横田（土台）・宮谷（画面） |
| docs | API一覧など | 全員 |

## 画面だけ動かす（backend なし・仮データ）
```
cd frontend
npm install
VITE_USE_MOCK=true npm run dev      # Windows（PowerShell）は  $env:VITE_USE_MOCK="true"; npm run dev
```
http://localhost:5173 を開く。

## backend と一緒に動かす
```
cd backend
docker compose up -d                # PostgreSQL を起動
gradle wrapper                      # 初回だけ（gradlew を作る）
./gradlew bootRun                   # http://localhost:8080
./gradlew test                      # テスト
```
別のターミナルで `cd frontend && npm run dev`。ログインは ユーザー名 yamamoto ／ パスワード change-me（本番は環境変数で必ず変える）。

## まだ仮のところ
- 勤怠シート・フォルダの自動作成：backend は `NoopSheetProvisioner`（仮URLを返すだけ）。Drive API 版を `SheetProvisioner` の実装として作る（宮谷さん）
- ログイン：HTTP Basic の仮。セッション＋ログイン画面に置き換える（山川さん）
- 入社日の朝の共有：Drive 版と一緒に、毎朝動く処理（@Scheduled）を作る（宮谷さん）
