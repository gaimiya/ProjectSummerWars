# 勤怠・給与集計システム

社員管理・月次集計・交通費/経費フォームの取り込み・社労士へのCSV送付を、1つの Java（Spring Boot）の画面で行う。
給与計算そのものは社労士が行う。このシステムは、社労士に渡すデータ（1人×1か月）を正しく集めてまとめる。

## 画面
| 画面 | できること |
|---|---|
| 社員管理 | 社員の登録・変更・削除、案件・参画履歴、勤怠シート（新しく作る／既存のシートを登録・差し替え） |
| 月次集計 | ① 全員の勤怠シートに月のシートを作る → ② 集計 → ③ CSV ダウンロード・社労士へメール → ④ 確定 |
| 設定 | 勤怠表のひな型、社員フォルダの場所、交通費・経費フォーム（既存のフォームも登録できる）、社労士のメール |

## フォルダ（src/main/java/app/kintai）
| パッケージ | 中身 | 主に触る人 |
|---|---|---|
| employee | 社員の登録・変更・削除、勤怠シートの作成・共有（毎朝7時に入社日の人へ共有） | 宮谷 |
| attendance | 勤怠シートの読み取りと入力チェック、月のシート作成 | 横田 |
| **aggregate** | **集計（計算）ルール。残業・深夜・休日などの出し方は AggregationRules だけを直す** | **横田** |
| expense | 交通費・経費フォームの回答シートから、承認済みの金額を合計 | 山川 |
| monthly | 月次集計の保存・画面・CSV・社労士へのメール・確定 | 山川 |
| google | Google（スプレッドシート・ドライブ）を触る窓口。鍵がないときは仮データ | 宮谷 |
| settings | 画面「設定」の値（URL やメールはコードに書かず、ここに保存） | 指輪 |
| config | ログイン、トップ画面 | 指輪 |

画面（HTML）は src/main/resources/templates、見た目は static/css/app.css（担当：指輪）。
DB の表は src/main/resources/db/migration（Flyway。表を変えるときは V4__… を足す。既存のファイルは直さない）。

## 動かす（Codespaces・自分のPC）
```
gradle bootRun            # http://localhost:8080 （ユーザー名 yamamoto ／ パスワード change-me）
gradle test               # テスト（集計ルール・画面の流れ）
```
何も設定しなければ、DB はファイル（./data）、Google は仮データで動く（どの勤怠シートも平日 9:30〜18:30 として読む）。

## 本番の設定（環境変数）
| 名前 | 中身 |
|---|---|
| SPRING_PROFILES_ACTIVE | prod（PostgreSQL を使う。docker compose up -d で開発用DBも立てられる） |
| DB_URL / DB_USER / DB_PASSWORD | PostgreSQL の接続先 |
| ADMIN_USER / ADMIN_PASSWORD | ログイン（必ず変える） |
| GOOGLE_CREDENTIALS | サービスアカウントの鍵ファイル（JSON）の場所。鍵は Git に入れない |
| SPRING_MAIL_HOST / SPRING_MAIL_USERNAME / SPRING_MAIL_PASSWORD | 社労士へメールを送るとき（Gmail はアプリパスワード） |

### Google の準備（1回だけ）
1. Google Cloud でプロジェクトを作り、Google Sheets API と Google Drive API を有効にする
2. サービスアカウントを作り、鍵（JSON）をダウンロードする
3. サービスアカウントのメールアドレスに、次を「編集者」で共有する：勤怠表のひな型、社員フォルダの親フォルダ、退職者フォルダ、フォームの回答シート、既存の社員の勤怠シート
4. 画面「設定」に、それぞれの URL を貼る

## 集計（計算）を作るとき
1. 社労士に確認したルールを、まず src/test/java/app/kintai/aggregate/AggregationRulesTest に例として書く
2. AggregationRules を直して、gradle test が通ることを確かめる
3. 月次集計の列を足すときは、monthly/MonthlyColumns・MonthlyRecord・db/migration を同じ順番で足す

詳しい設計は docs/設計.md。
