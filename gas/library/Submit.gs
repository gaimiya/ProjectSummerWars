/**
 * Submit.gs
 * ① 入力チェック → ② 集計して確認画面 → ③「この内容で提出」で送信 → ④ 結果を表示
 * 送信先は API_URL（社員管理表のウェブアプリ。将来は backend の提出API）
 */
function submitMonth() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  if (!MONTH_SHEET_PATTERN.test(sheet.getName())) {
    showDialog_('提出できません', ['「2026年12月」のような月のシートを開いてから提出してください。'], true);
    return;
  }
  var result = validateSheet(sheet);
  if (result.errors.length) {
    showDialog_(result.errors.length + '件の入力エラーがあります', result.errors, true);
    return;
  }
  var s = aggregateSheet(sheet);
  var t = HtmlService.createTemplateFromFile('Confirm');
  t.sheetName = sheet.getName();
  t.name = String(sheet.getRange('G8').getValue() || '');
  t.dept = String(sheet.getRange('G7').getValue() || '');
  t.lines = summaryLines(s);
  t.testMode = !getConfig().apiUrl;
  SpreadsheetApp.getUi().showModalDialog(t.evaluate().setWidth(480).setHeight(560), sheet.getName() + '　提出内容の確認');
}

/** 確認画面の「この内容で提出」から呼ばれる（ひな型側のコード.gsに sendMonth を置く） */
function sendMonth(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  var m = sheet && sheetName.match(MONTH_SHEET_PATTERN);
  if (!m) return { ok: false, messages: ['シートが見つかりません：' + sheetName] };

  var result = validateSheet(sheet);           // 確認中に書き換えられていないか、もう一度
  if (result.errors.length) return { ok: false, messages: result.errors };

  var body = JSON.stringify({
    spreadsheetId: ss.getId(),
    sheetName: sheetName,
    targetMonth: m[1] + '-' + m[2],
    employeeName: String(sheet.getRange('G8').getValue() || ''),
    department: String(sheet.getRange('G7').getValue() || ''),
    summary: aggregateSheet(sheet),
    rows: result.rows
  });

  var cfg = getConfig();
  if (!cfg.apiUrl) return { ok: true, test: true, messages: ['送信先（API_URL）が未設定のため、送信はしていません（テスト）。', '送る内容：' + body.length + '文字'] };

  var ts = String(Math.floor(Date.now() / 1000));
  var sig = Utilities.computeHmacSha256Signature(ts + '.' + body, cfg.apiKey)
    .map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
  var url = cfg.apiUrl + (cfg.apiUrl.indexOf('?') < 0 ? '?' : '&') + 'ts=' + ts + '&sig=' + sig + '&rid=' + Utilities.getUuid();

  var res;
  try {
    res = UrlFetchApp.fetch(url, { method: 'post', contentType: 'application/json', payload: body, muteHttpExceptions: true, followRedirects: true });
  } catch (err) {
    return { ok: false, messages: ['送信できませんでした。時間をおいて、もう一度押してください。', String(err)] };
  }
  var json = {};
  try { json = JSON.parse(res.getContentText()); } catch (e) {}
  if (!json.code) return { ok: false, messages: ['送信先から正しい返事がありませんでした（' + res.getResponseCode() + '）。', 'ウェブアプリのアクセス設定が「全員」になっているか、管理者に確認してください。'] };
  var code = json.code;

  if (code === 200) {
    sheet.getRange('G2').setValue('提出：' + Utilities.formatDate(new Date(), 'Asia/Tokyo', 'M/d HH:mm'));
    return { ok: true, receiptNo: json.receiptNo || '-', messages: [json.message || '提出を受け付けました。'] };
  }
  if (code === 409) return { ok: false, messages: [json.message || 'この月は確定済みです。山本さんへ連絡してください。'] };
  if (code === 422 || code === 403) return { ok: false, messages: (json.errors && json.errors.length) ? json.errors : [json.message || '内容を確認してください。'] };
  return { ok: false, messages: ['提出できませんでした（' + code + '）。山本さんへ連絡してください。'] };
}

function showDialog_(title, messages, isError, receiptNo) {
  var t = HtmlService.createTemplateFromFile('Dialog');
  t.messages = messages;
  t.isError = isError;
  t.receiptNo = receiptNo || '';
  SpreadsheetApp.getUi().showModalDialog(t.evaluate().setWidth(460).setHeight(320), title);
}
