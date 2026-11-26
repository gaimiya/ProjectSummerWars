/**
 * Month.gs
 * 「テンプレ」シートを複製して「YYYY年MM月」のシートを作る。
 * （もとの createMonthlyAttendance の処理を、年月を入力して作る形にしたもの）
 */
var TEMPLATE_SHEET_NAME = 'テンプレ';
var MONTH_SHEET_PATTERN = /^(\d{4})年(\d{2})月$/;

function createMonth() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 初期値は来月
  var now = new Date();
  var next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  var defaultText = next.getFullYear() + '/' + (next.getMonth() + 1);

  var res = ui.prompt('新しい月のシートを作成',
    '作成する年月を入力してください（例：' + defaultText + '）',
    ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;

  var text = res.getResponseText().trim() || defaultText;
  var m = text.match(/^(\d{4})[\/\-年](\d{1,2})月?$/);
  if (!m) {
    ui.alert('「2026/12」の形で入力してください。');
    return;
  }

  // 同じ月のシートがすでにあれば、作らずにそのタブを開く
  var name = m[1] + '年' + ('0' + m[2]).slice(-2) + '月';
  var exists = ss.getSheetByName(name);
  if (exists) {
    ss.setActiveSheet(exists);
    ui.alert('「' + name + '」はすでにあるので、そのシートを開きました。');
    return;
  }

  try {
    var sheet = generateMonthlyAttendance(ss, Number(m[1]), Number(m[2]));
    ss.setActiveSheet(sheet);
    ui.alert('「' + sheet.getName() + '」を作成しました。');
  } catch (err) {
    ui.alert('シートを作成できませんでした。\n' + err.message);
  }
}

function generateMonthlyAttendance(ss, year, month) {
  if (year < 2000 || month < 1 || month > 12) throw new Error('年月が正しくありません。');

  var template = ss.getSheetByName(TEMPLATE_SHEET_NAME);
  if (!template) throw new Error('「' + TEMPLATE_SHEET_NAME + '」シートが見つかりません。');

  var name = year + '年' + ('0' + month).slice(-2) + '月';
  if (ss.getSheetByName(name)) throw new Error('「' + name + '」は既にあります。');

  var sheet = null;
  try {
    // ① テンプレートを複製して年月を入れる
    sheet = template.copyTo(ss).setName(name);
    // タイムゾーンのずれで前月末日にならないよう、シート上で日付を作る
    sheet.getRange('G6').setFormula('=DATE(' + year + ',' + month + ',1)');
    SpreadsheetApp.flush();

    // 年月が正しく入ったか確認（ずれていたら止める）
    var g6 = sheet.getRange('G6').getDisplayValue();
    if (g6.indexOf(year + '年' + month + '月') < 0) {
      throw new Error('年月がずれています（G6=' + g6 + '）。ファイル → 設定 → タイムゾーン を「(GMT+09:00) 東京」にしてください。');
    }

    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();

    // ② 残す数式を保存（F勤務時間・L〜O列と、43・44行目の合計）
    var keepCols = [6, 12, 13, 14, 15];
    var saved = [];
    keepCols.forEach(function (col) {
      sheet.getRange(11, col, 31, 1).getFormulas().forEach(function (r, i) {
        if (r[0]) saved.push({ row: i + 11, col: col, f: r[0] });
      });
    });
    [43, 44].forEach(function (row) {
      if (lastRow < row) return;
      sheet.getRange(row, 1, 1, lastCol).getFormulas()[0].forEach(function (f, i) {
        if (f) saved.push({ row: row, col: i + 1, f: f });
      });
    });

    // ③ 日付などを値に固定し、④ 残す数式を戻す
    var all = sheet.getRange(1, 1, lastRow, lastCol);
    all.copyTo(all, SpreadsheetApp.CopyPasteType.PASTE_VALUES, false);
    saved.forEach(function (s) { sheet.getRange(s.row, s.col).setFormula(s.f); });

    // ⑤ 月のタブを左から古い順に並べる（テンプレの右隣に置く）
    ss.setActiveSheet(sheet);
    ss.moveActiveSheet(ss.getNumSheets());

    SpreadsheetApp.flush();
    return sheet;
  } catch (err) {
    if (sheet) ss.deleteSheet(sheet);
    throw err;
  }
}
