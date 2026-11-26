/**
 * 社員管理画面（GAS版）
 * 「社員管理表」に付いたスクリプトに置く。デプロイ → ウェブアプリ で画面が開く。
 * データは「社員一覧」「参画履歴」シートに保存する。
 */
var TEMPLATE_ID = '1XqVl8lImFSEyKatpcVyyGn-oZ8KKy7AArZMRndN3BIc'; // 勤怠表_ひな型
var ROOT_FOLDER_NAME = '勤怠システム_社員';                          // なければ自動で作る
var EMP = '社員一覧', HIS = '参画履歴';
var COLS = ['社員番号', '氏名', 'フリガナ', 'メール', '所属', '雇用形態', '入社日', '在籍',
  '給与形態', '基本給', '標準時間', '通勤手当', '住宅手当', '固定手当', '固定手当名',
  '勤怠シートURL', '個人フォルダURL', '共有状態', '登録日時', '更新日時', '削除日時'];
var KEYS = ['no', 'name', 'kana', 'mail', 'dept', 'type', 'joined', 'status',
  'payType', 'base', 'stdTime', 'commute', 'housing', 'fixed', 'fixedName',
  'sheetUrl', 'folderUrl', 'shareState', 'createdAt', 'updatedAt', 'deletedAt'];
var HCOLS = ['社員番号', '案件', 'インセンティブ月額', '参画開始', '参画終了'];

/* ---------- 画面 ---------- */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('社員管理')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('社員管理')
    .addItem('（初回）表を準備する', 'setup')
    .addItem('入社日を迎えた社員に共有する（手動実行）', 'shareDueSheets')
    .addSeparator()
    .addItem('月次集計を作る（全員の勤怠シートを読む）', 'collectMonth')
    .addItem('月次集計を社労士へ送る（CSV）', 'sendMonthlyCsv')
    .addSeparator()
    .addItem('交通費・経費フォームを作る／URLを見る', 'setupForms')
    .addToUi();
}

/* ---------- 初回準備 ---------- */
function setup() {
  var ss = SpreadsheetApp.getActive();
  ss.setSpreadsheetTimeZone('Asia/Tokyo');
  var e = sheet_(EMP, COLS), h = sheet_(HIS, HCOLS);
  monthlySheet_();
  e.getRange('G:G').setNumberFormat('yyyy/m/d');
  h.getRange('D:E').setNumberFormat('yyyy/m/d');
  // 毎朝7時に「入社日を迎えた社員への共有」を動かす
  var has = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'shareDueSheets'; });
  if (!has) ScriptApp.newTrigger('shareDueSheets').timeBased().everyDays(1).atHour(7).create();
  rootFolder_();
  // エディタから実行したときに確認ダイアログで止まらないよう、結果はログに出す
  console.log('準備できました：社員一覧・参画履歴シート、毎朝7時の共有、保存先フォルダ ' + rootFolder_().getUrl());
}

function sheet_(name, cols) {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight('bold').setBackground('#deeaf6');
    sh.setFrozenRows(1);
  }
  return sh;
}

/* ---------- 画面から呼ぶ関数 ---------- */
function listEmployees() {
  return rows_().filter(function (r) { return !r.deletedAt; }).map(view_);
}

function getEmployee(no) {
  var r = find_(no);
  if (!r || r.deletedAt) throw new Error('社員が見つかりません：' + no);
  var v = view_(r);
  v.history = histRows_().filter(function (h) { return h.no === no; });
  return v;
}

function saveEmployee(input, isNew) {
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var errs = validate_(input, isNew);
    if (errs.length) return { ok: false, errors: errs };
    var sh = sheet_(EMP, COLS), now = new Date();
    var rec = isNew ? {} : find_(input.no);
    if (!isNew && !rec) return { ok: false, errors: ['社員が見つかりません'] };
    ['no', 'name', 'kana', 'mail', 'dept', 'type', 'status', 'payType', 'fixedName'].forEach(function (k) { rec[k] = (input[k] || '').toString().trim(); });
    ['base', 'commute', 'housing', 'fixed'].forEach(function (k) { rec[k] = num_(input[k]); });
    rec.stdTime = input.stdTime || '8:00';
    rec.joined = toDate_(input.joined);
    rec.updatedAt = now;
    if (isNew) { rec.status = rec.status || '在籍'; rec.createdAt = now; rec.shareState = '未作成'; }
    var row = KEYS.map(function (k) { return rec[k] === undefined ? '' : rec[k]; });
    if (isNew) sh.appendRow(row); else sh.getRange(rec._row, 1, 1, KEYS.length).setValues([row]);
    if (input.history) saveHistory_(rec.no, input.history);
    var msg = rec.name + ' さんを保存しました。';
    if (isNew) {
      try { createSheetFor_(rec.no); msg = rec.name + ' さんを登録しました。勤怠シートと個人フォルダを作成しました（入社日の朝7時ごろ本人へ共有します）。'; }
      catch (x) { msg = rec.name + ' さんを登録しました。ただし勤怠シートの作成に失敗しました：' + x.message; }
    }
    return { ok: true, message: msg, no: rec.no };
  } finally { lock.releaseLock(); }
}

function deleteEmployee(no) {
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var r = find_(no);
    if (!r || r.deletedAt) throw new Error('社員が見つかりません：' + no);
    var note = '';
    try {
      var root = rootFolder_(), old = sub_(root, '退職者');
      if (r.sheetUrl) {
        var f = DriveApp.getFileById(idOf_(r.sheetUrl));
        if (r.mail) try { f.removeEditor(r.mail); } catch (x) {}
      }
      if (r.folderUrl) {
        var d = DriveApp.getFolderById(idOf_(r.folderUrl));
        if (r.mail) try { d.removeViewer(r.mail); } catch (x) {}
        d.moveTo(old);
      }
    } catch (x) { note = '（シートの移動に失敗：' + x.message + '）'; }
    var sh = sheet_(EMP, COLS);
    sh.getRange(r._row, KEYS.indexOf('deletedAt') + 1).setValue(new Date());
    sh.getRange(r._row, KEYS.indexOf('shareState') + 1).setValue('共有停止');
    return { ok: true, message: r.name + ' さんを削除しました。勤怠シートの共有を止め、「退職者」フォルダに移しました。' + note };
  } finally { lock.releaseLock(); }
}

function recreateSheet(no) {
  var r = find_(no);
  if (r.folderUrl) try { DriveApp.getFolderById(idOf_(r.folderUrl)).setName(r.no + '_' + r.name + '_旧'); } catch (x) {}
  createSheetFor_(no);
  if (r.shareState === '共有済み') shareOne_(find_(no));
  return { ok: true, message: '勤怠シートを作り直しました。' };
}

/* ---------- 勤怠シート・フォルダ ---------- */
function createSheetFor_(no) {
  var r = find_(no);
  var folder = rootFolder_().createFolder(r.no + '_' + r.name);
  var file = DriveApp.getFileById(TEMPLATE_ID).makeCopy('勤怠表_' + r.no + '_' + r.name, folder);
  var t = SpreadsheetApp.openById(file.getId()).getSheetByName('テンプレ');
  if (t) { t.getRange('G7').setValue(r.dept); t.getRange('G8').setValue(r.name); }
  var sh = sheet_(EMP, COLS);
  sh.getRange(r._row, KEYS.indexOf('sheetUrl') + 1).setValue(file.getUrl());
  sh.getRange(r._row, KEYS.indexOf('folderUrl') + 1).setValue(folder.getUrl());
  sh.getRange(r._row, KEYS.indexOf('shareState') + 1).setValue('入社日に共有予定');
  // 入社日が今日以前なら、すぐ共有する
  if (r.joined && r.joined <= new Date()) shareOne_(find_(no));
}

function shareDueSheets() {
  var today = new Date();
  rows_().forEach(function (r) {
    if (!r.deletedAt && r.shareState === '入社日に共有予定' && r.joined && r.joined <= today) shareOne_(r);
  });
}

function shareOne_(r) {
  if (!r.mail || !r.sheetUrl) return;
  DriveApp.getFileById(idOf_(r.sheetUrl)).addEditor(r.mail);
  DriveApp.getFolderById(idOf_(r.folderUrl)).addViewer(r.mail);
  sheet_(EMP, COLS).getRange(r._row, KEYS.indexOf('shareState') + 1).setValue('共有済み');
}

function rootFolder_() {
  var p = PropertiesService.getScriptProperties(), id = p.getProperty('ROOT_FOLDER_ID');
  if (id) try { return DriveApp.getFolderById(id); } catch (x) {}
  var f = DriveApp.createFolder(ROOT_FOLDER_NAME);
  p.setProperty('ROOT_FOLDER_ID', f.getId());
  return f;
}
function sub_(parent, name) { var it = parent.getFoldersByName(name); return it.hasNext() ? it.next() : parent.createFolder(name); }
function idOf_(url) { var m = String(url).match(/[-\w]{25,}/); return m ? m[0] : ''; }

/* ---------- 読み書きの下まわり ---------- */
function rows_() {
  var sh = sheet_(EMP, COLS), n = sh.getLastRow() - 1;
  if (n < 1) return [];
  return sh.getRange(2, 1, n, KEYS.length).getValues().map(function (v, i) {
    var o = { _row: i + 2 }; KEYS.forEach(function (k, j) { o[k] = v[j]; }); o.no = String(o.no); return o;
  }).filter(function (o) { return o.no; });
}
function find_(no) { return rows_().filter(function (r) { return r.no === String(no); })[0]; }
function histRows_() {
  var sh = sheet_(HIS, HCOLS), n = sh.getLastRow() - 1;
  if (n < 1) return [];
  return sh.getRange(2, 1, n, 5).getValues().map(function (v) {
    return { no: String(v[0]), project: v[1], amount: v[2], from: fmt_(v[3]), to: fmt_(v[4]) };
  });
}
function saveHistory_(no, list) {
  var sh = sheet_(HIS, HCOLS), all = histRows_().filter(function (h) { return h.no !== no; });
  list.filter(function (h) { return h.project; }).forEach(function (h) {
    all.push({ no: no, project: h.project, amount: num_(h.amount), from: h.from, to: h.to });
  });
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 5).clearContent();
  if (all.length) sh.getRange(2, 1, all.length, 5).setValues(all.map(function (h) {
    return [h.no, h.project, h.amount, toDate_(h.from) || '', toDate_(h.to) || ''];
  }));
}
function view_(r) {
  var o = {}; KEYS.forEach(function (k) { o[k] = r[k]; });
  o.joined = fmt_(r.joined);
  ['createdAt', 'updatedAt', 'deletedAt'].forEach(function (k) { o[k] = r[k] ? String(r[k]) : ''; });
  if (o.stdTime instanceof Date) o.stdTime = Utilities.formatDate(o.stdTime, 'Asia/Tokyo', 'H:mm');
  return o;
}
function validate_(x, isNew) {
  var e = [];
  if (!x.no) e.push('社員番号を入力してください');
  if (!x.name) e.push('氏名を入力してください');
  if (!x.mail) e.push('メールアドレスを入力してください');
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x.mail)) e.push('メールアドレスの形が正しくありません');
  if (!x.joined) e.push('入社日を入力してください');
  if (isNew && x.no && find_(x.no)) e.push('社員番号「' + x.no + '」はすでに使われています');
  ['base', 'commute', 'housing', 'fixed'].forEach(function (k) {
    if (x[k] !== '' && x[k] != null && isNaN(num_(x[k]))) e.push('金額は数字で入力してください');
  });
  return e;
}
function num_(v) { if (v === '' || v == null) return 0; return Number(String(v).replace(/[,円\s]/g, '')); }
function toDate_(s) { if (!s) return ''; if (s instanceof Date) return s; var m = String(s).match(/(\d{4})\D(\d{1,2})\D(\d{1,2})/); return m ? Utilities.parseDate(m[1] + '-' + m[2] + '-' + m[3], 'Asia/Tokyo', 'yyyy-M-d') : ''; }
function fmt_(d) { return d instanceof Date ? Utilities.formatDate(d, 'Asia/Tokyo', 'yyyy-MM-dd') : (d || ''); }
