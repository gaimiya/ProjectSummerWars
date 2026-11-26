/**
 * Menu.gs
 * シートを開いたときにメニューを出す。
 * 提出ボタンは置かない（月次集計は社員管理表の「月次集計を作る」でまとめて行う）。
 * メニューから呼ぶ関数（createMonth / checkMonth / checkSetup）は、ひな型シート側のコード.gs に同じ名前で置く。
 */
function onOpen(e) {
  SpreadsheetApp.getUi()
    .createMenu('勤怠')
    .addItem('新しい月のシートを作成', 'createMonth')
    .addItem('入力チェック', 'checkMonth')
    .addSeparator()
    .addSubMenu(SpreadsheetApp.getUi().createMenu('管理者')
      .addItem('動作確認（設定のチェック）', 'checkSetup'))
    .addToUi();
}

/** 管理者用：シートが正しく設定されているかを一覧で表示する */
function checkSetup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tz = ss.getSpreadsheetTimeZone();
  var tpl = ss.getSheetByName(TEMPLATE_SHEET_NAME);
  var months = ss.getSheets().map(function (s) { return s.getName(); })
    .filter(function (n) { return MONTH_SHEET_PATTERN.test(n); });
  var ok = function (b) { return b ? '〇' : '×'; };

  var lines = [
    ok(tz === 'Asia/Tokyo') + ' タイムゾーン：' + tz + (tz === 'Asia/Tokyo' ? '' : '（ファイル → 設定 で東京に）'),
    ok(!!tpl) + ' 「' + TEMPLATE_SHEET_NAME + '」シート' + (tpl ? 'あり' : 'がありません'),
    ok(!!ss.getSheetByName('休日')) + ' 「休日」シート',
    '・月のシート：' + (months.length ? months.join('、') : 'まだありません'),
    '・シートID：' + ss.getId()
  ];

  showDialog_('動作確認', lines, false);
}

/** 社員用：開いている月の入力チェックだけ（提出は社員管理側でまとめて集計する） */
function checkMonth() {
  var sheet = SpreadsheetApp.getActiveSheet();
  if (!MONTH_SHEET_PATTERN.test(sheet.getName())) { showDialog_('チェックできません', ['「2026年12月」のような月のシートを開いてください。'], true); return; }
  var r = validateSheet(sheet);
  if (r.errors.length) { showDialog_(r.errors.length + '件の入力エラーがあります', r.errors, true); return; }
  showDialog_('入力チェック', ['エラーはありません。', '月末に社員管理側でまとめて集計します。提出の操作は不要です。'], false);
}
