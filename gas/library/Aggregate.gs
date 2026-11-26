/**
 * Aggregate.gs
 * 月のシートから、社労士の給与計算に必要な数字をまとめる。
 * 時間はすべて「分」で持つ（画面では 8:30 の形で見せる）。
 *
 * ルール（社労士に確認して直す前提の仮ルール）
 * ・平日：1日の勤務が標準時間（J10、なければ8:00）を超えた分を「残業」
 * ・土曜：勤務した時間をすべて「土曜出勤」
 * ・日曜・祝日（「休日」シート）：勤務した時間をすべて「休日出勤」
 * ・22:00〜翌5:00 の勤務は「深夜」（日曜・祝日は「休日深夜」）。休憩は深夜から引かない
 * ・備考に「有給」→有給1日（「半休」「半日」を含めば0.5日）、「特別休暇」「夏季休暇」→特別休暇1日
 * ・欠勤は数えない（必要になったらここに足す）
 */
function aggregateSheet(sheet) {
  var ss = sheet.getParent();
  var tz = ss.getSpreadsheetTimeZone();
  var range = sheet.getRange(11, 2, 31, 7);              // B〜H
  var values = range.getValues();
  var disp = range.getDisplayValues();                    // 時刻は表示の文字（9:30）で読む（1899年の時差ずれを避ける）
  var stdMin = toMin_(sheet.getRange('J10').getDisplayValue()) || 480;
  var holidays = holidaySet_(ss, tz);

  var s = { workDays: 0, workMin: 0, overtimeMin: 0, nightMin: 0, saturdayMin: 0,
            holidayMin: 0, holidayNightMin: 0, paidLeaveDays: 0, specialLeaveDays: 0 };

  values.forEach(function (v, i) {
    var t = disp[i];
    var date = v[0];
    if (!(date instanceof Date)) return;
    var key = Utilities.formatDate(date, tz, 'yyyy-MM-dd');
    var dow = Number(Utilities.formatDate(date, tz, 'u')); // 1=月 … 7=日
    var isHoliday = dow === 7 || holidays[key];
    var note = String(v[5] || '');

    if (note.indexOf('有給') >= 0) s.paidLeaveDays += (/半休|半日/.test(note) ? 0.5 : 1);
    if (/特別休暇|夏季休暇/.test(note)) s.specialLeaveDays += 1;

    var inM = toMin_(t[1]), outM = toMin_(t[2]);
    if (inM === null || outM === null) return;
    if (outM <= inM) outM += 1440;                 // 日またぎ（夜勤）
    var work = Math.max(0, outM - inM - (toMin_(t[3]) || 0));
    var night = overlap_(inM, outM, 0, 300) + overlap_(inM, outM, 1320, 1740) + overlap_(inM, outM, 2760, 3180);

    s.workDays += 1;
    s.workMin += work;
    if (isHoliday) { s.holidayMin += work; s.holidayNightMin += night; }
    else {
      s.nightMin += night;
      if (dow === 6) s.saturdayMin += work;
      else s.overtimeMin += Math.max(0, work - stdMin);
    }
  });
  s.standardMin = stdMin;
  return s;
}

/** 画面に見せる一覧（ラベルと値） */
function summaryLines(s) {
  return [
    ['出勤日数', s.workDays + '日'],
    ['総労働時間', hhmm_(s.workMin)],
    ['残業（平日・標準時間超え）', hhmm_(s.overtimeMin)],
    ['深夜（22時〜5時）', hhmm_(s.nightMin)],
    ['土曜出勤', hhmm_(s.saturdayMin)],
    ['休日出勤（日曜・祝日）', hhmm_(s.holidayMin)],
    ['休日深夜', hhmm_(s.holidayNightMin)],
    ['有給', s.paidLeaveDays + '日'],
    ['特別休暇', s.specialLeaveDays + '日']
  ];
}

function hhmm_(m) { return Math.floor(m / 60) + ':' + ('0' + (m % 60)).slice(-2); }

/** 「9:30」「31:00」→ 分（24時以降は日またぎとして0〜24時に直す）。空なら null */
function toMin_(s) {
  var m = String(s || '').trim().match(/^(\d{1,2}):(\d{2})/);
  return m ? (Number(m[1]) * 60 + Number(m[2])) % 1440 : null;
}

function overlap_(a1, a2, b1, b2) { return Math.max(0, Math.min(a2, b2) - Math.max(a1, b1)); }

function holidaySet_(ss, tz) {
  var set = {}, sh = ss.getSheetByName('休日');
  if (!sh || sh.getLastRow() < 2) return set;
  sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().forEach(function (r) {
    if (r[0] instanceof Date) set[Utilities.formatDate(r[0], tz, 'yyyy-MM-dd')] = true;
  });
  return set;
}
