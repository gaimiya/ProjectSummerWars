/**
 * Forms.gs（社員管理表）
 * 交通費申請・経費申請の Google フォームを、この表につなぐ。
 *  ・新しく作る  … createForm_
 *  ・既存のフォームを使う … 社員管理画面「フォーム設定」でURLを登録（saveFormSettings）
 * 回答はこの表の「交通費申請」「経費申請」シートに入り、「承認」にチェックしたものだけ月次集計に入れる。
 */
var FORM_DEFS = [
  { key: 'TRANSPORT', sheet: '交通費申請', title: '交通費申請',
    desc: '業務で使った交通費を申請してください（通勤手当で出ているものは除く）。1回の移動ごとに1件送ってください。' },
  { key: 'EXPENSE', sheet: '経費申請', title: '経費申請',
    desc: '立て替えた経費を申請してください。領収書は山本さんへ提出してください。' }
];
var OK_TITLE = '承認';
// 既存フォームでも使えるよう、質問名は「含む」で探す
var NO_KEYS = ['社員番号'], DATE_KEYS = ['利用日', '日付', '使用日'], AMOUNT_KEYS = ['金額'];

/* ---------- 画面「フォーム設定」から呼ぶ ---------- */
function getFormSettings() {
  return FORM_DEFS.map(function (d) {
    var f = formOf_(d.key);
    return { key: d.key, title: d.title, sheet: d.sheet,
      editUrl: f ? f.getEditUrl() : '', publishedUrl: f ? f.getPublishedUrl() : '', formTitle: f ? f.getTitle() : '' };
  });
}

/** key の フォームを登録する。url が空なら新しく作る。既存フォームのURL（編集URL・回答URLどちらでも）なら、それを使う */
function saveFormSetting(key, url) {
  var d = FORM_DEFS.filter(function (x) { return x.key === key; })[0];
  if (!d) throw new Error('種類が正しくありません');
  var form;
  url = String(url || '').trim();
  if (url) {
    try { form = /^https?:/.test(url) ? FormApp.openByUrl(url) : FormApp.openById(url); }
    catch (e) { return { ok: false, message: 'フォームを開けません。編集用のURL（…/edit）を貼り、このアカウントに編集権限があるか確認してください。' }; }
  } else {
    form = createForm_(d);
  }
  PropertiesService.getScriptProperties().setProperty('FORM_' + key, form.getId());
  var warn = linkForm_(form, d);
  return { ok: true, message: d.title + 'フォームを登録しました。' + (warn ? '\n' + warn : '') };
}

/** メニュー用：未登録なら作り、URLを表示する */
function setupForms() {
  var out = FORM_DEFS.map(function (d) {
    var f = formOf_(d.key);
    if (!f) { saveFormSetting(d.key, ''); f = formOf_(d.key); }
    return d.title + '：' + f.getPublishedUrl();
  });
  var text = '社員に配るURL\n\n' + out.join('\n\n');
  console.log(text);
  try { SpreadsheetApp.getUi().alert('交通費・経費フォーム', text, SpreadsheetApp.getUi().ButtonSet.OK); } catch (e) {}
}

/* ---------- 下まわり ---------- */
function formOf_(key) {
  var id = PropertiesService.getScriptProperties().getProperty('FORM_' + key);
  if (!id) return null;
  try { return FormApp.openById(id); } catch (e) { return null; }
}

function createForm_(d) {
  var form = FormApp.create(d.title).setDescription(d.desc).setConfirmationMessage('申請を受け付けました。');
  form.addTextItem().setTitle('社員番号').setHelpText('例：E0001').setRequired(true);
  form.addTextItem().setTitle('氏名').setRequired(true);
  form.addDateItem().setTitle('利用日').setRequired(true);
  if (d.key === 'TRANSPORT') {
    form.addTextItem().setTitle('区間').setHelpText('例：梅田 → 本町').setRequired(true);
    form.addMultipleChoiceItem().setTitle('交通手段').setChoiceValues(['電車', 'バス', 'タクシー', 'その他']).setRequired(true);
    form.addMultipleChoiceItem().setTitle('片道・往復').setChoiceValues(['片道', '往復']).setRequired(true);
    form.addTextItem().setTitle('訪問先・目的').setRequired(true);
  } else {
    form.addListItem().setTitle('科目').setChoiceValues(['会議費', '消耗品費', '通信費', '書籍・研修費', '接待交際費', 'その他']).setRequired(true);
    form.addTextItem().setTitle('内容').setRequired(true);
    form.addTextItem().setTitle('支払先').setRequired(true);
  }
  form.addTextItem().setTitle('金額（円）').setHelpText('数字だけ（例：1200）').setRequired(true)
    .setValidation(FormApp.createTextValidation().requireWholeNumber().setHelpText('数字だけで入力してください').build());
  form.addParagraphTextItem().setTitle('備考');
  return form;
}

/** 回答先をこの表にし、回答シートの名前をそろえ、「承認」列を足す。注意点があれば文で返す */
function linkForm_(form, d) {
  var ss = SpreadsheetApp.getActive(), warn = [];
  var dest = '';
  try { dest = form.getDestinationId(); } catch (e) {}
  if (dest !== ss.getId()) {
    if (dest) warn.push('このフォームの回答先を、別のスプレッドシートからこの社員管理表に切り替えました（前の回答は元のシートに残ります）。');
    form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
    SpreadsheetApp.flush(); Utilities.sleep(2000);
  }
  var sh = ss.getSheets().filter(function (s) { var u = s.getFormUrl(); return u && u.indexOf(form.getId()) >= 0; })[0];
  if (!sh) return warn.concat(['回答シートが見つかりません。少し待ってから、もう一度登録してください。']).join('\n');
  var other = ss.getSheetByName(d.sheet);
  if (other && other.getSheetId() !== sh.getSheetId()) other.setName(d.sheet + '_旧_' + Utilities.formatDate(new Date(), 'Asia/Tokyo', 'MMdd_HHmm'));
  sh.setName(d.sheet);
  var head = sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getValues()[0];
  if (head.indexOf(OK_TITLE) < 0) {
    var col = sh.getLastColumn() + 1;
    sh.getRange(1, col).setValue(OK_TITLE).setFontWeight('bold');
    sh.getRange(2, col, Math.max(999, sh.getMaxRows() - 1), 1).insertCheckboxes();
    sh.getRange(1, col + 1).setValue('承認者・メモ').setFontWeight('bold');
  }
  var miss = [['社員番号', NO_KEYS], ['利用日（日付）', DATE_KEYS], ['金額', AMOUNT_KEYS]]
    .filter(function (m) { return colOf_(head, m[1]) < 0; }).map(function (m) { return m[0]; });
  if (miss.length) warn.push('フォームに「' + miss.join('」「') + '」の質問がないため、月次集計に入りません。質問を追加してください。');
  return warn.join('\n');
}

function colOf_(head, keys) {
  for (var i = 0; i < head.length; i++) for (var j = 0; j < keys.length; j++) if (String(head[i]).indexOf(keys[j]) >= 0) return i;
  return -1;
}

/** ym（2026-12）の承認済み合計を社員番号ごとに返す：{E0001:{transport:1200, other:3000}} */
function expenseTotals_(ym) {
  var ss = SpreadsheetApp.getActive(), out = {};
  FORM_DEFS.forEach(function (d) {
    var sh = ss.getSheetByName(d.sheet);
    if (!sh || sh.getLastRow() < 2) return;
    var v = sh.getDataRange().getValues(), h = v[0];
    var iNo = colOf_(h, NO_KEYS), iDate = colOf_(h, DATE_KEYS), iAmt = colOf_(h, AMOUNT_KEYS), iOk = h.indexOf(OK_TITLE);
    if (iNo < 0 || iDate < 0 || iAmt < 0 || iOk < 0) return;
    v.slice(1).forEach(function (r) {
      if (r[iOk] !== true || !(r[iDate] instanceof Date)) return;
      if (Utilities.formatDate(r[iDate], 'Asia/Tokyo', 'yyyy-MM') !== ym) return;
      var no = String(r[iNo]).trim().toUpperCase();
      var amt = Number(String(r[iAmt]).replace(/[,円\s]/g, '')) || 0;
      out[no] = out[no] || { transport: 0, other: 0 };
      out[no][d.key === 'TRANSPORT' ? 'transport' : 'other'] += amt;
    });
  });
  return out;
}
