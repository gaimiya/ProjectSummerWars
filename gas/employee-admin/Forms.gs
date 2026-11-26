/**
 * Forms.gs（社員管理表）
 * 交通費申請・経費申請の Google フォームを作り、回答をこの表の「交通費申請」「経費申請」シートに入れる。
 * 回答シートの「承認」にチェックが入ったものだけ、月次集計（利用日の月）に合計して入れる。
 */
var FORM_DEFS = [
  { key: 'TRANSPORT', sheet: '交通費申請', title: '交通費申請',
    desc: '業務で使った交通費を申請してください（通勤手当で出ているものは除く）。1回の移動ごとに1件送ってください。' },
  { key: 'EXPENSE', sheet: '経費申請', title: '経費申請',
    desc: '立て替えた経費を申請してください。領収書は山本さんへ提出してください。' }
];
var AMOUNT_TITLE = '金額（円）', DATE_TITLE = '利用日', NO_TITLE = '社員番号', OK_TITLE = '承認';

/** メニュー「交通費・経費フォームを作る」（一度だけ。作り済みならURLを表示） */
function setupForms() {
  var ss = SpreadsheetApp.getActive(), p = PropertiesService.getScriptProperties(), out = [];
  FORM_DEFS.forEach(function (d) {
    var id = p.getProperty('FORM_' + d.key), form;
    if (id) { try { form = FormApp.openById(id); } catch (e) { form = null; } }
    if (!form) {
      form = FormApp.create(d.title).setDescription(d.desc).setConfirmationMessage('申請を受け付けました。');
      form.addTextItem().setTitle(NO_TITLE).setHelpText('例：E0001').setRequired(true);
      form.addTextItem().setTitle('氏名').setRequired(true);
      form.addDateItem().setTitle(DATE_TITLE).setRequired(true);
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
      form.addTextItem().setTitle(AMOUNT_TITLE).setHelpText('数字だけ（例：1200）').setRequired(true)
        .setValidation(FormApp.createTextValidation().requireWholeNumber().setHelpText('数字だけで入力してください').build());
      form.addParagraphTextItem().setTitle('備考');
      form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
      p.setProperty('FORM_' + d.key, form.getId());
      SpreadsheetApp.flush();
      Utilities.sleep(2000);
      // 回答シート（フォームのURLで探す）の名前を変え、「承認」列を足す
      var sh = ss.getSheets().filter(function (s) { return s.getFormUrl() && s.getFormUrl().indexOf(form.getId()) >= 0; })[0];
      if (sh) {
        if (!ss.getSheetByName(d.sheet)) sh.setName(d.sheet);
        var col = sh.getLastColumn() + 1;
        sh.getRange(1, col).setValue(OK_TITLE).setFontWeight('bold');
        sh.getRange(2, col, 999, 1).insertCheckboxes();
        sh.getRange(1, col + 1).setValue('承認者・メモ').setFontWeight('bold');
      }
    }
    out.push(d.title + '：' + form.getPublishedUrl());
  });
  var text = '社員に配るURL（ブックマーク・社内連絡で共有してください）\n\n' + out.join('\n\n');
  console.log(text);
  try { SpreadsheetApp.getUi().alert('交通費・経費フォーム', text, SpreadsheetApp.getUi().ButtonSet.OK); } catch (e) {}
}

/** ym（2026-12）の承認済み合計を社員番号ごとに返す：{E0001:{transport:1200, other:3000}} */
function expenseTotals_(ym) {
  var ss = SpreadsheetApp.getActive(), out = {};
  FORM_DEFS.forEach(function (d) {
    var sh = ss.getSheetByName(d.sheet);
    if (!sh || sh.getLastRow() < 2) return;
    var v = sh.getDataRange().getValues(), h = v[0];
    var iNo = h.indexOf(NO_TITLE), iDate = h.indexOf(DATE_TITLE), iAmt = h.indexOf(AMOUNT_TITLE), iOk = h.indexOf(OK_TITLE);
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
