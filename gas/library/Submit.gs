/**
 * Submit.gs
 * 開いている月のシートをチェック → 送信 → 結果を表示する。
 */
function submitMonth() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  var m = sheet.getName().match(MONTH_SHEET_PATTERN);
  if (!m) {
    showDialog_('提出できません', ['「2026年11月」のような月のシートを開いてから提出してください。'], true);
    return;
  }

  // ① 入力チェック
  var result = validateSheet(sheet);
  if (result.errors.length) {
    showDialog_(result.errors.length + '件の入力エラーがあります', result.errors, true);
    return;
  }

  // ② 送るデータ
  var body = JSON.stringify({
    spreadsheetId: ss.getId(),
    sheetName: sheet.getName(),
    targetMonth: m[1] + '-' + m[2],
    rows: result.rows
  });

  var cfg = getConfig();
  if (!cfg.apiUrl) {
    // API がまだ無い間のテスト：送る内容を表示するだけ
    showDialog_('テスト送信（API未設定）', ['送信内容：' + result.rows.length + '日分', body.slice(0, 1500)], false);
    return;
  }

  // ③ 署名を付けて送信
  var timestamp = String(Math.floor(Date.now() / 1000));
  var requestId = Utilities.getUuid();
  var sig = Utilities.computeHmacSha256Signature(timestamp + '.' + body, cfg.apiKey)
    .map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');

  var res;
  try {
    res = UrlFetchApp.fetch(cfg.apiUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: body,
      headers: { 'X-Timestamp': timestamp, 'X-Signature': sig, 'X-Request-Id': requestId },
      muteHttpExceptions: true
    });
  } catch (err) {
    showDialog_('送信できませんでした', ['時間をおいて、もう一度押してください。', String(err)], true);
    return;
  }

  // ④ 結果を表示
  var code = res.getResponseCode();
  var json = {};
  try { json = JSON.parse(res.getContentText()); } catch (e) {}

  if (code === 200) {
    sheet.getRange('G2').setValue('提出：' + Utilities.formatDate(new Date(), 'Asia/Tokyo', 'M/d HH:mm'));
    showDialog_('提出しました', ['提出を受け付けました。内容に問題があれば山本さんから連絡があります。'], false, json.submissionId || '-');
  } else if (code === 422) {
    var list = (json.errors || []).map(function (e) { return e.message || JSON.stringify(e); });
    showDialog_('入力内容にエラーがあります', list.length ? list : ['内容を確認してください。'], true);
  } else if (code === 409) {
    showDialog_('提出できません', ['この月は確定済みです。山本さんへ連絡してください。'], true);
  } else {
    showDialog_('提出できませんでした（' + code + '）', ['山本さんへ連絡してください。'], true);
  }
}

function showDialog_(title, messages, isError, receiptNo) {
  var t = HtmlService.createTemplateFromFile('Dialog');
  t.messages = messages;
  t.isError = isError;
  t.receiptNo = receiptNo || '';
  SpreadsheetApp.getUi().showModalDialog(t.evaluate().setWidth(460).setHeight(320), title);
}
