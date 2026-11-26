# config：ログイン・トップ画面　担当：山川（ログイン）・指輪

| ファイル | 中身 |
|---|---|
| SecurityConfig | ログイン（今は管理者1人。ADMIN_USER / ADMIN_PASSWORD） |
| HomeController | トップ（/ → 社員管理）、ログイン画面 |

## やること
- [ ] 本番前に ADMIN_PASSWORD を必ず変える
- [ ] ログインする人を増やすか決める（増やすなら、ユーザーの表を作って SecurityConfig を DB から読む形にする）
- [ ] 画面ごとに見られる人を分けるか決める（例：月次集計は山本さんだけ）
