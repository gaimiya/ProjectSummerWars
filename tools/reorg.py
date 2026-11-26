#!/usr/bin/env python3
"""リポジトリの整理（1回だけ実行）。git のルートで python3 tools/reorg.py を実行する。
- Java パッケージ jp.sashiwa.kintai → app.kintai（個人名を外す）
- 使わなくなった gas/library・gas/template・整える.gs を削除
- gas/employee-admin を gas/ に移し、役割ごとにファイルを分ける（計算ルールは Rules.gs に分離）
- 集計（計算）を作るための置き場所を backend にも用意
"""
import os, re, subprocess, pathlib

def run(*a): subprocess.run(a, check=True)
def rd(p): return pathlib.Path(p).read_text(encoding='utf-8')
def wr(p, s):
    pathlib.Path(p).parent.mkdir(parents=True, exist_ok=True)
    pathlib.Path(p).write_text(s, encoding='utf-8')
def cut(src, start, end=None):
    """src から start〜（end の直前 or 末尾）を取り出す。(残り, 取り出した部分)"""
    i = src.index(start); j = src.index(end, i) if end else len(src)
    return src[:i] + src[j:], src[i:j]

# ---------- Java：個人名を外す ----------
for kind in ('main', 'test'):
    old = f'backend/src/{kind}/java/jp/sashiwa/kintai'
    if os.path.isdir(old):
        os.makedirs(f'backend/src/{kind}/java/app', exist_ok=True)
        run('git', 'mv', old, f'backend/src/{kind}/java/app/kintai')
for root, _, files in os.walk('backend/src'):
    for f in files:
        if f.endswith('.java'):
            p = os.path.join(root, f); s = rd(p)
            if 'jp.sashiwa.kintai' in s: wr(p, s.replace('jp.sashiwa.kintai', 'app.kintai'))
wr('backend/build.gradle', rd('backend/build.gradle').replace("group = 'jp.sashiwa'", "group = 'app.kintai'"))

wr('backend/src/main/java/app/kintai/attendance/package-info.java', '''/**
 * 勤怠の取り込み（これから作る）。
 * 各社員の勤怠シート（月のシート B11:G41）を読み、日ごとの出勤・退勤・休憩・備考を受け取る。
 * GAS 版では gas/Collect.gs の collectAll_ / validateMonth_ が同じことをしている。
 */
package app.kintai.attendance;
''')
wr('backend/src/main/java/app/kintai/aggregate/package-info.java', '''/**
 * 集計（計算）ルール（これから作る）。
 * 日ごとの勤怠から、出勤日数・総労働・残業・深夜・土曜・休日・休日深夜・有給・特別休暇を出す。
 * ルールは社労士に確認して決める。GAS 版の仮ルールは gas/Rules.gs の aggregateMonth_ にある。
 * 入力と出力の形（MonthlySummary など）を先に決めて、テストを書きながら作る。
 */
package app.kintai.aggregate;
''')

# ---------- GAS：不要なものを消して、役割ごとに分ける ----------
for p in ('gas/library', 'gas/template'):
    if os.path.exists(p): run('git', 'rm', '-r', '-q', p)
for f in os.listdir('gas/employee-admin'):
    run('git', 'mv', f'gas/employee-admin/{f}', f'gas/{f}')

# Code.gs → Main.gs（定数・画面・メニュー・初回準備） ＋ Employee.gs（社員の登録・変更・削除・シート）
code = rd('gas/Code.gs')
code, emp = cut(code, '/* ---------- 画面から呼ぶ関数 ---------- */')
code = code.replace('''/**
 * 社員管理画面（GAS版）
 * 「社員管理表」に付いたスクリプトに置く。デプロイ → ウェブアプリ で画面が開く。
 * データは「社員一覧」「参画履歴」シートに保存する。
 */''', '''/**
 * Main.gs：設定・画面・メニュー・初回準備
 * 「社員管理表」に付いたスクリプト。デプロイ → ウェブアプリ で社員管理画面が開く。
 *
 * ファイルの役割（詳しくは gas/README.md）
 *   Main.gs       設定・画面・メニュー
 *   Employee.gs   社員の登録・変更・削除、勤怠シートの作成・共有
 *   MonthSheet.gs 全員の勤怠シートに月のシートを作る
 *   Collect.gs    全員の勤怠シートを読んでチェックし、月次集計を作る
 *   Rules.gs      集計（計算）ルール ← 計算はここを直す
 *   Forms.gs      交通費・経費フォーム
 *   Export.gs     月次集計シートへの書き込み、社労士へのCSV送付
 */''')
wr('gas/Main.gs', code.rstrip() + '\n')
wr('gas/Employee.gs', '/**\n * Employee.gs：社員の登録・変更・削除と、勤怠シート・個人フォルダの作成・共有\n */\n' + emp)
run('git', 'rm', '-q', '--cached', 'gas/Code.gs'); os.remove('gas/Code.gs')

# Collect.gs → 計算ルールを Rules.gs、月のシート作成を MonthSheet.gs へ
col = rd('gas/Collect.gs')
col, month = cut(col, '/* ---------- 月のシートを全員分つくる')
col, rules = cut(col, '/* ---------- 集計（仮ルール。社労士に確認して直す） ---------- */')
col = col.replace('''/**
 * Collect.gs（社員管理表）''', '''/**
 * Collect.gs：月次集計を作る''')
wr('gas/Collect.gs', col.rstrip() + '\n')
wr('gas/Rules.gs', '''/**
 * Rules.gs：集計（計算）ルール
 * 入力：勤怠シートの月のシート（B日付・C出勤・D退勤・E休憩・G備考、J10 標準時間）
 * 出力：{ workDays, workMin, overtimeMin, nightMin, saturdayMin, holidayMin, holidayNightMin, paidLeaveDays, specialLeaveDays }
 *       時間はすべて「分」。月次集計シートには Export.gs が「8:30」の形で書く。
 *
 * 今は仮ルール。社労士に確認して、ここだけを直せば集計が変わる。
 *  ・平日：1日の勤務が標準時間（J10、なければ8:00）を超えた分を「残業」
 *  ・土曜：勤務した時間をすべて「土曜出勤」
 *  ・日曜・祝日（「休日」シート）：勤務した時間をすべて「休日出勤」
 *  ・22:00〜翌5:00 は「深夜」（日曜・祝日は「休日深夜」）。休憩は深夜から引かない
 *  ・備考「有給」→1日（「半休」「半日」は0.5日）、「特別休暇」「夏季休暇」→特別休暇1日
 *  ・欠勤は数えない
 */
''' + rules.replace('/* ---------- 集計（仮ルール。社労士に確認して直す） ---------- */\n', ''))
wr('gas/MonthSheet.gs', '/**\n * MonthSheet.gs：全員の勤怠シートに「YYYY年MM月」のシートを作る（ひな型の「テンプレ」シートを複製）\n */\n' +
   month.replace('/* ---------- 月のシートを全員分つくる（ひな型の「勤怠」メニューの代わり） ---------- */\n', ''))

# Receive.gs → Export.gs（提出の受け取り・APIキー・通知メールは使わなくなったので外す）
r = rd('gas/Receive.gs')
r, _ = cut(r, 'function doPost(e) {', 'function saveMonthly_(emp, d) {')
r, _ = cut(r, 'function out_(code, obj) {', '/* ---------- メール ---------- */')
r, _ = cut(r, '/** 提出を受け付けたら、内容を知らせる */', '/** 管理者用：選んだ月の')
r, _ = cut(r, 'function testMail() {')
r = r.replace('''/**
 * Receive.gs（社員管理表）
 * 勤怠シートの「提出」を受け取り、社員情報と合わせて「月次集計」シートにまとめる。
 * ここが社労士に渡すデータの元になる（1行＝1人×1か月）。
 *
 * 準備：スクリプト プロパティ API_KEY（勤怠提出ライブラリと同じ値）
 *       デプロイ → ウェブアプリ のアクセスを「全員」にする（社員のシートから送れるように）
 */''', '''/**
 * Export.gs：「月次集計」シートへの書き込みと、社労士へのCSV送付
 * 月次集計（1行＝1人×1か月）が社労士に渡すデータの元になる。
 */''')
r = re.sub(r"/\* ---------- メール ---------- \*/\n//[^\n]*\nvar MAIL_TO = '[^']*';\n", lambda _: '''/* ---------- 社労士へ送る ---------- */
// 送り先はコードに書かず、スクリプト プロパティ MAIL_TO に入れる（未設定なら実行した人自身に送る＝試験用）
function mailTo_() {
  return PropertiesService.getScriptProperties().getProperty('MAIL_TO') || Session.getEffectiveUser().getEmail();
}
''', r)
r = r.replace("  if (ui.alert(MAIL_TO + ' へ '", "  var to = mailTo_();\n  if (ui.alert(to + ' へ '").replace('    to: MAIL_TO,', '    to: to,')
r = r.replace("'受付番号', '提出回数'", "'受付番号', '集計回数'").replace("MCOLS.indexOf('提出回数')", "MCOLS.indexOf('集計回数')")
r = r.replace("'状態', '提出日時'", "'状態', '集計日時'")
r = r.replace("d.state || (count ? '再提出' : '提出済み')", "d.state || '集計済み'")
r = r.replace("    message: (count ? '再提出' : '提出') + 'を受け付けました（' + d.targetMonth + '・' + emp.name + ' さん）。' };",
              "    message: d.targetMonth + '・' + emp.name + ' さんを集計しました。' };")
r = r.replace("' は確定済みのため、提出できません。山本さんへ連絡してください。'", "' は確定済みのため、集計し直せません。'")
r = r.replace("ui.alert(ym + ' の提出はまだありません。')", "ui.alert(ym + ' の月次集計はまだありません。先に「月次集計を作る」を実行してください。')")
r = r.replace('（試験中は指輪さん）', '').replace("(v || ''); }\n/* ----", "(v || ''); }\n\n/* ----")
wr('gas/Export.gs', r.rstrip() + '\n')
run('git', 'rm', '-q', '--cached', 'gas/Receive.gs'); os.remove('gas/Receive.gs')
os.rmdir('gas/employee-admin') if os.path.isdir('gas/employee-admin') and not os.listdir('gas/employee-admin') else None

wr('gas/README.md', '''# GAS（社員管理表に付けるスクリプト）

今いちばん動いている形。「社員管理表」スプレッドシート →「拡張機能 → Apps Script」に、このフォルダのファイルを同じ名前で置く。

| ファイル | 役割 | 主に触る人 |
|---|---|---|
| Main.gs | 設定（ひな型のID・シート名）、社員管理画面の表示、メニュー、初回準備 | 指輪 |
| Employee.gs | 社員の登録・変更・削除。勤怠シート・個人フォルダの作成、既存シートの登録、本人への共有 | 指輪・宮谷 |
| Index.html | 社員管理画面（社員一覧・詳細・フォーム設定） | 指輪 |
| MonthSheet.gs | 全員の勤怠シートに月のシートを作る | 指輪 |
| Collect.gs | 全員の勤怠シートを読み、入力チェックして月次集計を作る | 横田 |
| **Rules.gs** | **集計（計算）ルール。残業・深夜・休日などの出し方はここだけを直す** | **横田** |
| Forms.gs | 交通費・経費フォームの作成・既存フォームの登録、承認済み金額の合計 | 山川 |
| Export.gs | 月次集計シートへの書き込み、社労士へのCSV送付 | 山川 |

## 月の流れ
1. メニュー「全員の勤怠シートに月のシートを作る」
2. 社員が自分の勤怠シートに入力（交通費・経費はフォームから申請 → 山本さんが「承認」にチェック）
3. メニュー「月次集計を作る」→「月次集計」シートを確認
4. メニュー「月次集計を社労士へ送る（CSV）」

## 設定（スクリプト プロパティ）
- MAIL_TO：社労士のメールアドレス（未設定なら実行した人自身に送る）
- FORM_TRANSPORT・FORM_EXPENSE：フォームのID（画面の「フォーム設定」で自動で入る）
- ROOT_FOLDER_ID：社員フォルダの親フォルダ（初回に自動で入る）

## 計算を作るとき
- 入力（勤怠シートの読み方）は Collect.gs、計算は Rules.gs、出力（月次集計の列）は Export.gs の MCOLS。
- 列を足すときは MCOLS と saveMonthly_ の row を同じ順番で足す（古い形の月次集計シートは自動で「_旧」に名前が変わる）。
''')

# ---------- README（全体） ----------
readme = rd('README.md')
readme = readme.replace('''| gas/library | 勤怠提出ライブラリ（勤怠シートのメニュー・チェック・提出） | 指輪・横田・山川・宮谷 |
| gas/template | 勤怠表_ひな型に付けるコード | 指輪 |
| gas/employee-admin | 社員管理画面のGAS版（社員管理表に付ける。試用・つなぎ用） | 指輪 |''', '''| gas | 社員管理表に付けるGAS（社員管理画面・月次集計・フォーム・社労士送付）。今動いている形。詳しくは gas/README.md | 指輪・横田・山川 |''')
readme = readme.replace('| backend | Java 21 / Spring Boot 3（社員管理API） | 山川（土台）・宮谷（社員管理） |',
  '| backend | Java 21 / Spring Boot 3（社員管理API。集計は attendance・aggregate に作る） | 山川（土台）・宮谷（社員管理）・横田（集計） |')
readme = readme.replace('## まだ仮のところ', '''## 集計（計算）をこれから作る場所
| どこ | 何を作る |
|---|---|
| gas/Rules.gs | 今の仮ルール（GAS）。社労士に確認したルールをまずここで試す |
| backend/src/main/java/app/kintai/attendance | 勤怠シートの取り込み（Java） |
| backend/src/main/java/app/kintai/aggregate | 集計ルール（Java）。GAS の Rules.gs と同じ結果になるようにテストを書く |

## まだ仮のところ''')
wr('README.md', readme)

# ---------- 自分（このスクリプト）を消す ----------
if os.path.exists('tools/reorg.py'):
    run('git', 'rm', '-q', '--cached', 'tools/reorg.py'); os.remove('tools/reorg.py')
    if os.path.isdir('tools') and not os.listdir('tools'): os.rmdir('tools')
run('git', 'add', '-A', 'backend', 'gas', 'README.md')
print('整理できました。git commit と git push をしてください。')
