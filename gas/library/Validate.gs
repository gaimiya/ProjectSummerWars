/**
 * Validate.gs
 * 送信前の入力チェック。NGのセルを赤くして、エラー一覧を返す。
 * 対象：B11:G41（B日付・C出勤・D退勤・E休憩・F勤務時間・G備考）
 * 集計用の I〜O列（欠勤日数・標準時間・土曜/残業など）は I列の欠勤日数だけ送る。
 */
var FIRST_ROW = 11;
var LAST_ROW = 41;
var ERROR_COLOR = '#f4cccc';

function validateSheet(sheet) {
  var n = LAST_ROW - FIRST_ROW + 1;
  var values = sheet.getRange(FIRST_ROW, 2, n, 8).getValues(); // B〜I
  var errors = [];
  var rows = [];

  sheet.getRange(FIRST_ROW, 3, n, 3).setBackground(null); // C〜E の前回エラー色を消す

  values.forEach(function (v, i) {
    var rowNo = FIRST_ROW + i;
    var date = v[0], inT = v[1], outT = v[2], brk = v[3], note = String(v[5] || ''), absent = Number(v[7]) || 0;
    if (!(date instanceof Date)) return; // 月末の空行は対象外

    var label = Utilities.formatDate(date, tz_(), 'M/d');
    var hasIn = inT !== '' && inT !== null;
    var hasOut = outT !== '' && outT !== null;

    if (hasIn !== hasOut) {
      errors.push(label + '：出勤と退勤の片方だけ入力されています（V001）');
      sheet.getRange(rowNo, hasIn ? 4 : 3).setBackground(ERROR_COLOR);
      return;
    }
    if (!hasIn) {
      rows.push({ date: fmtDate(date), clockIn: null, clockOut: null, breakMinutes: 0, absentDays: absent, note: note });
      return;
    }
    if (!(inT instanceof Date) || !(outT instanceof Date)) {
      errors.push(label + '：時刻は 9:30 の形で入力してください（V002）');
      sheet.getRange(rowNo, 3, 1, 2).setBackground(ERROR_COLOR);
      return;
    }
    var breakMin = (brk instanceof Date) ? brk.getHours() * 60 + brk.getMinutes() : 0;
    var inMin = inT.getHours() * 60 + inT.getMinutes();
    var outMin = outT.getHours() * 60 + outT.getMinutes();
    if (outMin <= inMin) outMin += 24 * 60; // 夜勤（日またぎ）：退勤 7:00 でも 31:00 でもOK
    if (breakMin >= outMin - inMin) {
      errors.push(label + '：休憩時間が勤務時間以上です（V004）');
      sheet.getRange(rowNo, 5).setBackground(ERROR_COLOR);
      return;
    }
    rows.push({ date: fmtDate(date), clockIn: fmtTime(inT), clockOut: fmtTime(outT), breakMinutes: breakMin, absentDays: absent, note: note });
  });

  return { errors: errors, rows: rows };
}

function fmtDate(d) { return Utilities.formatDate(d, tz_(), 'yyyy-MM-dd'); }
function fmtTime(d) { return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }

// シートのタイムゾーンで日付を読む（スクリプトとシートの設定が違ってもずれないように）
function tz_() { return SpreadsheetApp.getActive().getSpreadsheetTimeZone(); }
