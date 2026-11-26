# templates：画面（Thymeleaf）　担当：指輪

| ファイル | 画面 |
|---|---|
| fragments/layout.html | 共通（頭・左メニュー・お知らせ表示） |
| login.html | ログイン |
| employees/list.html・form.html | 社員一覧・社員の登録／詳細 |
| monthly/index.html | 月次集計 |
| settings/index.html | 設定 |

見た目は static/css/app.css。

## やること
- [ ] 山本さんに画面を触ってもらい、使いにくいところを直す
- [ ] 案件・参画履歴の「行を足す」ボタンが要るか確認する（今は保存すると空の行が2つ増える）
- [ ] スマホで見る必要があるか確認する

## 守ること
- 画面に計算や判断を書かない（Controller・Service に書く）
- フォームは th:action を使う（ログインの安全対策の値が自動で入る）
