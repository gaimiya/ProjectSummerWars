/**
 * Menu.gs
 * シートを開いたときにメニューを出す。
 * メニューから呼ぶ関数（createMonth / submitMonth / checkSetup）は、ひな型シート側のコード.gs に同じ名前で置く。
 */
function onOpen(e) {
  SpreadsheetApp.getUi()
    .createMenu('勤怠')
    .addItem('新しい月のシートを作成', 'createMonth')
    .addSeparator()
    .addItem('開いている月を提出', 'submitMonth')
    .addSeparator()
    .addSubMenu(SpreadsheetApp.getUi().createMenu('管理者')
      .addItem('動作確認（設定のチェック）', 'checkSetup'))
    .addToUi();
}

/** 管理者用：シートが正しく設定されているかを一覧で表示する */
function checkSetup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var cfg = getConfig();
  var tz = ss.getSpreadsheetTimeZone();
  var tpl = ss.getSheetByName(TEMPLATE_SHEET_NAME);
  var months = ss.getSheets().map(function (s) { return s.getName(); })
    .filter(function (n) { return MONTH_SHEET_PATTERN.test(n); });
  var ok = function (b) { return b ? '〇' : '×'; };

  var lines = [
    ok(tz === 'Asia/Tokyo') + ' タイムゾーン：' + tz + (tz === 'Asia/Tokyo' ? '' : '（ファイル → 設定 で東京に）'),
    ok(!!tpl) + ' 「' + TEMPLATE_SHEET_NAME + '」シート' + (tpl ? 'あり' : 'がありません'),
    ok(!!ss.getSheetByName('休日')) + ' 「休日」シート',
    ok(!!cfg.apiUrl) + ' 送信先（API_URL）' + (cfg.apiUrl ? '設定済み' : '未設定：提出はテスト表示になります'),
    ok(!!cfg.apiKey) + ' 送信キー（API_KEY）' + (cfg.apiKey ? '設定済み' : '未設定'),
    '・月のシート：' + (months.length ? months.join('、') : 'まだありません'),
    '・シートID：' + ss.getId()
  ];

  // API_URL があれば、届くかだけ確かめる（GET。中身は送らない）
  if (cfg.apiUrl) {
    try {
      var code = UrlFetchApp.fetch(cfg.apiUrl, { method: 'get', muteHttpExceptions: true }).getResponseCode();
      lines.push(ok(code < 500) + ' 送信先への接続：応答 ' + code);
    } catch (err) {
      lines.push('× 送信先への接続：つながりません（' + err.message + '）');
    }
  }
  showDialog_('動作確認', lines, false);
}
