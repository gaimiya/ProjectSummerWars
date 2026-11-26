/**
 * Validate.gs
 * 送信前の入力チェック。NGのセルを赤くして、エラー一覧を返す。
 * 対象：B11:G41（B日付・C出勤・D退勤・E休憩・F勤務時間・G備考）
 */
var FIRST_ROW = 11;
var LAST_ROW = 41;
var ERROR_COLOR = '#f4cccc';

function validateSheet(sheet) {
  var n = LAST_ROW - FIRST_ROW + 1;
  var range = sheet.getRange(FIRST_ROW, 2, n, 8);   // B〜I
  var values = range.getValues();
  var disp = range.getDisplayValues();             // 時刻は表示の文字で読む
  var errors = [];
  var rows = [];

  sheet.getRange(FIRST_ROW, 3, n, 3).setBackground(null); // C〜E の前回エラー色を消す

  values.forEach(function (v, i) {
    var rowNo = FIRST_ROW + i;
    var date = v[0], inT = disp[i][1], outT = disp[i][2], brk = disp[i][3], note = String(v[5] || '');
    if (!(date instanceof Date)) return; // 月末の空行は対象外

    var label = Utilities.formatDate(date, tz_(), 'M/d');
    var hasIn = inT.trim() !== '';
    var hasOut = outT.trim() !== '';

    if (hasIn !== hasOut) {
      errors.push(label + '：出勤と退勤の片方だけ入力されています（V001）');
      sheet.getRange(rowNo, hasIn ? 4 : 3).setBackground(ERROR_COLOR);
      return;
    }
    if (!hasIn) {
      rows.push({ date: fmtDate(date), clockIn: null, clockOut: null, breakMinutes: 0, note: note });
      return;
    }
    var inMin = toMin_(inT), outMin = toMin_(outT);
    if (inMin === null || outMin === null || (brk.trim() && toMin_(brk) === null)) {
      errors.push(label + '：時刻は 9:30 の形で入力してください（V002）');
      sheet.getRange(rowNo, 3, 1, 2).setBackground(ERROR_COLOR);
      return;
    }
    var breakMin = toMin_(brk) || 0;
    if (outMin <= inMin) outMin += 24 * 60; // 夜勤（日またぎ）：退勤 7:00 でも 31:00 でもOK
    if (breakMin >= outMin - inMin) {
      errors.push(label + '：休憩時間が勤務時間以上です（V004）');
      sheet.getRange(rowNo, 5).setBackground(ERROR_COLOR);
      return;
    }
    rows.push({ date: fmtDate(date), clockIn: fmtTime(inMin), clockOut: fmtTime(outMin % 1440), breakMinutes: breakMin, note: note });
  });

  return { errors: errors, rows: rows };
}

function fmtDate(d) { return Utilities.formatDate(d, tz_(), 'yyyy-MM-dd'); }
function fmtTime(m) { return ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + (m % 60)).slice(-2); }

// シートのタイムゾーンで日付を読む（スクリプトとシートの設定が違ってもずれないように）
function tz_() { return SpreadsheetApp.getActive().getSpreadsheetTimeZone(); }
