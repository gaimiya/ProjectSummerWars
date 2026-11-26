/**
 * Receive.gs（社員管理表）
 * 勤怠シートの「提出」を受け取り、社員情報と合わせて「月次集計」シートにまとめる。
 * ここが社労士に渡すデータの元になる（1行＝1人×1か月）。
 *
 * 準備：スクリプト プロパティ API_KEY（勤怠提出ライブラリと同じ値）
 *       デプロイ → ウェブアプリ のアクセスを「全員」にする（社員のシートから送れるように）
 */
var MON = '月次集計';
var MCOLS = ['対象月', '社員番号', '氏名', '所属', '雇用形態', '給与形態', '基本給', '標準時間',
  '出勤日数', '総労働時間', '残業', '深夜', '土曜出勤', '休日出勤', '休日深夜', '有給（日）', '特別休暇（日）',
  '通勤手当', '住宅手当', '固定手当', '固定手当名', 'インセンティブ', 'インセンティブ内訳',
  '交通費精算', '経費精算', '状態', '提出日時', '受付番号', '提出回数', '勤怠シート'];

function doPost(e) {
  try {
    var body = e.postData ? e.postData.contents : '';
    var p = e.parameter || {};
    // ① 署名の確認（5分以内・API_KEYで作った署名か）
    var key = PropertiesService.getScriptProperties().getProperty('API_KEY');
    if (!key) return out_(500, { message: '受け取り側の API_KEY が未設定です' });
    var now = Math.floor(Date.now() / 1000);
    if (!p.ts || Math.abs(now - Number(p.ts)) > 300) return out_(403, { message: '送信の有効期限が切れています。もう一度押してください。' });
    var sig = Utilities.computeHmacSha256Signature(p.ts + '.' + body, key)
      .map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
    if (sig !== p.sig) return out_(403, { message: '送信元を確認できませんでした（キーが違います）' });

    var d = JSON.parse(body);
    // ② 登録済みの勤怠シートか（ひな型はテスト用に受け付ける）
    var emp = rows_().filter(function (r) { return !r.deletedAt && idOf_(r.sheetUrl) === d.spreadsheetId; })[0];
    if (!emp && d.spreadsheetId === TEMPLATE_ID) emp = { no: 'TEST', name: d.employeeName || 'ひな型テスト', dept: d.department, type: '', payType: '', base: 0, stdTime: '', commute: 0, housing: 0, fixed: 0, fixedName: '', sheetUrl: 'https://docs.google.com/spreadsheets/d/' + TEMPLATE_ID };
    if (!emp) return out_(403, { message: 'この勤怠シートは社員管理に登録されていません。山本さんへ連絡してください。' });

    var lock = LockService.getScriptLock(); lock.waitLock(20000);
    var r;
    try { r = saveMonthly_(emp, d); } finally { lock.releaseLock(); }
    if (r.code === 200) { try { notifySubmitted_(emp, d, r); } catch (x) { r.message += '（通知メールは送れませんでした）'; } }
    return out_(200, r);
  } catch (err) {
    return out_(500, { message: '受け付けでエラーが起きました：' + err.message });
  }
}

function saveMonthly_(emp, d) {
  var sh = monthlySheet_();
  var last = sh.getLastRow();
  var found = 0, count = 0;
  if (last > 1) {
    var keys = sh.getRange(2, 1, last - 1, 2).getDisplayValues();
    for (var i = 0; i < keys.length; i++) if (keys[i][0] === d.targetMonth && keys[i][1] === String(emp.no)) { found = i + 2; break; }
  }
  if (found) {
    var state = sh.getRange(found, MCOLS.indexOf('状態') + 1).getValue();
    if (state === '確定') return { code: 409, message: d.targetMonth + ' は確定済みのため、提出できません。山本さんへ連絡してください。' };
    count = Number(sh.getRange(found, MCOLS.indexOf('提出回数') + 1).getValue()) || 0;
  }
  var s = d.summary, inc = incentive_(emp.no, d.targetMonth);
  var receipt = d.targetMonth.replace('-', '') + '-' + emp.no + '-' + (count + 1);
  var row = ["'" + d.targetMonth, emp.no, emp.name, emp.dept, emp.type, emp.payType, emp.base, stdText_(emp.stdTime),
    s.workDays, h_(s.workMin), h_(s.overtimeMin), h_(s.nightMin), h_(s.saturdayMin), h_(s.holidayMin), h_(s.holidayNightMin),
    s.paidLeaveDays, s.specialLeaveDays,
    emp.commute, emp.housing, emp.fixed, emp.fixedName, inc.total, inc.detail,
    (d.expense || {}).transport || 0, (d.expense || {}).other || 0,
    d.state || (count ? '再提出' : '提出済み'), new Date(), receipt, count + 1, emp.sheetUrl];
  if (found) sh.getRange(found, 1, 1, row.length).setValues([row]); else sh.appendRow(row);
  return { code: 200, receiptNo: receipt,
    message: (count ? '再提出' : '提出') + 'を受け付けました（' + d.targetMonth + '・' + emp.name + ' さん）。' };
}

/** その月に参画していた案件のインセンティブ合計 */
function incentive_(no, ym) {
  var first = ym + '-01', lastDay = Utilities.formatDate(new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)), 0), 'Asia/Tokyo', 'yyyy-MM-dd');
  var list = histRows_().filter(function (h) {
    return h.no === String(no) && (!h.from || h.from <= lastDay) && (!h.to || h.to >= first);
  });
  return { total: list.reduce(function (a, h) { return a + (Number(h.amount) || 0); }, 0),
           detail: list.map(function (h) { return h.project + ' ' + Number(h.amount || 0).toLocaleString() + '円'; }).join('、') };
}

function h_(m) { m = Number(m) || 0; return Math.floor(m / 60) + ':' + ('0' + (m % 60)).slice(-2); }
function stdText_(v) { return v instanceof Date ? Utilities.formatDate(v, 'Asia/Tokyo', 'H:mm') : (v || ''); }
function out_(code, obj) {
  obj.code = obj.code || code;
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** 管理者用：API_KEY を作って表示する（勤怠提出ライブラリにも同じ値を入れる） */
function makeApiKey() {
  var p = PropertiesService.getScriptProperties();
  var k = p.getProperty('API_KEY');
  if (!k) { k = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, ''); p.setProperty('API_KEY', k); }
  console.log('API_KEY：' + k);
}

/* ---------- メール ---------- */
// 送り先（試験中は指輪さん。本番は社労士のアドレスに変える）
var MAIL_TO = 'sashiwa0713naoto@gmail.com';

/** 提出を受け付けたら、内容を知らせる */
function notifySubmitted_(emp, d, r) {
  var s = d.summary;
  var lines = [
    emp.name + ' さん（' + emp.no + '）から ' + d.targetMonth + ' 分の勤怠が提出されました。',
    '受付番号：' + r.receiptNo, '',
    '出勤日数：' + s.workDays + '日', '総労働時間：' + h_(s.workMin), '残業：' + h_(s.overtimeMin),
    '深夜：' + h_(s.nightMin), '土曜出勤：' + h_(s.saturdayMin), '休日出勤：' + h_(s.holidayMin),
    '休日深夜：' + h_(s.holidayNightMin), '有給：' + s.paidLeaveDays + '日', '特別休暇：' + s.specialLeaveDays + '日', '',
    '勤怠シート：' + emp.sheetUrl,
    '月次集計：' + SpreadsheetApp.getActive().getUrl()
  ];
  MailApp.sendEmail(MAIL_TO, '【勤怠提出】' + d.targetMonth + '　' + emp.name, lines.join('\n'));
}

/** 管理者用：選んだ月の「月次集計」をCSVにして、社労士（試験中は指輪さん）へメールで送る */
function sendMonthlyCsv() {
  var ui = SpreadsheetApp.getUi();
  var res = ui.prompt('社労士へ送る', '送る月を入力してください（例：2026-12）', ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;
  var ym = res.getResponseText().trim().replace('/', '-').replace(/-(\d)$/, '-0$1');
  var sh = monthlySheet_();
  var all = sh.getDataRange().getDisplayValues();
  var rows = all.slice(1).filter(function (r) { return r[0] === ym; });
  if (!rows.length) { ui.alert(ym + ' の提出はまだありません。'); return; }
  var csv = [all[0]].concat(rows).map(function (r) {
    return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(',');
  }).join('\r\n');
  var blob = Utilities.newBlob('﻿' + csv, 'text/csv', '勤怠集計_' + ym + '.csv'); // Excelで文字化けしないようBOM付き
  if (ui.alert(MAIL_TO + ' へ ' + ym + ' 分（' + rows.length + '人）を送ります。よろしいですか？', ui.ButtonSet.OK_CANCEL) !== ui.Button.OK) return;
  MailApp.sendEmail({
    to: MAIL_TO,
    subject: '【勤怠集計】' + ym + '分（' + rows.length + '名）',
    body: 'いつもお世話になっております。\n' + ym + ' 分の勤怠集計を送付いたします。\n給与計算をよろしくお願いいたします。\n\n添付：勤怠集計_' + ym + '.csv（' + rows.length + '名分）',
    attachments: [blob]
  });
  ui.alert('送りました。');
}

function testMail() {
  MailApp.sendEmail(MAIL_TO, '【テスト】勤怠システム', 'これが届けばメール送信はOKです');
  console.log('送信しました。今日あと送れる数：' + MailApp.getRemainingDailyQuota());
}
