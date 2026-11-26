/**
 * Collect.gs（社員管理表）
 * 社員の勤怠シートには「提出」ボタンを置かない。
 * 社員管理表のメニュー「月次集計を作る」で、登録済みの全員の勤怠シートを読みに行き、
 * 入力チェック → 集計 → 交通費・経費（承認済み）を足して「月次集計」シートに1人1行で書く。
 */

/** メニュー「月次集計を作る」 */
function collectMonth() {
  var ui = SpreadsheetApp.getUi();
  var def = Utilities.formatDate(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), 'Asia/Tokyo', 'yyyy-MM');
  var res = ui.prompt('月次集計を作る', '集計する月を入力してください（例：' + def + '）\n空のままOKで ' + def + ' を集計します。', ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;
  var ym = normYm_(res.getResponseText() || def);
  if (!ym) { ui.alert('「2026-12」の形で入力してください。'); return; }

  var r = collectAll_(ym);
  var msg = [ym + ' の集計が終わりました。', '',
    '集計できた人：' + r.ok.length + '人' + (r.ok.length ? '（' + r.ok.join('、') + '）' : '')];
  if (r.ng.length) msg.push('', '集計できなかった人：' + r.ng.length + '人', r.ng.join('\n'));
  msg.push('', '「月次集計」シートを確認してから、「月次集計を社労士へ送る（CSV）」で送ってください。');
  ui.alert('月次集計', msg.join('\n'), ui.ButtonSet.OK);
}

/** ym（2026-12）の全員分を集計する。戻り値：{ok:[氏名], ng:['氏名：理由']} */
function collectAll_(ym) {
  var y = Number(ym.slice(0, 4)), m = Number(ym.slice(5, 7));
  var sheetName = y + '年' + m + '月';
  var exp = expenseTotals_(ym);
  var ok = [], ng = [];

  var emps = rows_().filter(function (e) { return !e.deletedAt && e.sheetUrl; });
  // 試験中：勤怠表_ひな型も「TEST」として集計する（本番前にこの1行を消す）
  emps.push({ no: 'TEST', name: 'ひな型テスト', dept: '', type: '', payType: '', base: 0, stdTime: '', commute: 0, housing: 0, fixed: 0, fixedName: '', sheetUrl: 'https://docs.google.com/spreadsheets/d/' + TEMPLATE_ID });
  var lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    emps.forEach(function (emp) {
      try {
        var ss = SpreadsheetApp.openById(idOf_(emp.sheetUrl));
        var sh = ss.getSheetByName(sheetName);
        if (!sh) { ng.push(emp.name + '：「' + sheetName + '」シートがありません'); return; }
        var v = validateMonth_(sh);
        if (v.length) { ng.push(emp.name + '：入力エラー ' + v.length + '件（' + v.slice(0, 3).join(' / ') + (v.length > 3 ? ' …' : '') + '）'); return; }
        var e = exp[String(emp.no)] || { transport: 0, other: 0 };
        saveMonthly_(emp, { targetMonth: ym, summary: aggregateMonth_(sh), expense: e, state: '集計済み' });
        ok.push(emp.name);
      } catch (err) {
        ng.push(emp.name + '：シートを開けません（' + err.message + '）');
      }
    });
  } finally { lock.releaseLock(); }
  return { ok: ok, ng: ng };
}

function normYm_(s) {
  var m = String(s).trim().match(/^(\d{4})\D?(\d{1,2})/);
  return m ? m[1] + '-' + ('0' + m[2]).slice(-2) : '';
}

/** 「月次集計」シート。列が古い形なら「月次集計_旧」に名前を変えて作り直す */
function monthlySheet_() {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(MON);
  if (sh && sh.getLastColumn() > 0) {
    var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].join('|');
    if (head !== MCOLS.join('|')) sh.setName(MON + '_旧_' + Utilities.formatDate(new Date(), 'Asia/Tokyo', 'MMdd_HHmm'));
  }
  var out = sheet_(MON, MCOLS);
  out.setFrozenColumns(3);
  return out;
}

/* ---------- 勤怠シートのチェック（B11:G41。社員のシートのエラー箇所を赤くする） ---------- */
function validateMonth_(sheet) {
  var tz = sheet.getParent().getSpreadsheetTimeZone();
  var range = sheet.getRange(11, 2, 31, 6);
  var values = range.getValues(), disp = range.getDisplayValues(), errors = [];
  sheet.getRange(11, 3, 31, 3).setBackground(null);
  values.forEach(function (v, i) {
    var date = v[0], t = disp[i], row = 11 + i;
    if (!(date instanceof Date)) return;
    var label = Utilities.formatDate(date, tz, 'M/d');
    var hasIn = t[1].trim() !== '', hasOut = t[2].trim() !== '';
    if (hasIn !== hasOut) { errors.push(label + ' 出勤/退勤の片方だけ'); sheet.getRange(row, hasIn ? 4 : 3).setBackground('#f4cccc'); return; }
    if (!hasIn) return;
    var a = tMin_(t[1]), b = tMin_(t[2]);
    if (a === null || b === null || (t[3].trim() && tMin_(t[3]) === null)) { errors.push(label + ' 時刻の形式'); sheet.getRange(row, 3, 1, 2).setBackground('#f4cccc'); return; }
    if (b <= a) b += 1440;
    if ((tMin_(t[3]) || 0) >= b - a) { errors.push(label + ' 休憩が長すぎる'); sheet.getRange(row, 5).setBackground('#f4cccc'); }
  });
  return errors;
}

/* ---------- 集計（仮ルール。社労士に確認して直す） ---------- */
function aggregateMonth_(sheet) {
  var ss = sheet.getParent(), tz = ss.getSpreadsheetTimeZone();
  var range = sheet.getRange(11, 2, 31, 6);
  var values = range.getValues(), disp = range.getDisplayValues();
  var std = tMin_(sheet.getRange('J10').getDisplayValue()) || 480;
  var hol = {}, hs = ss.getSheetByName('休日');
  if (hs && hs.getLastRow() > 1) hs.getRange(2, 1, hs.getLastRow() - 1, 1).getValues().forEach(function (r) {
    if (r[0] instanceof Date) hol[Utilities.formatDate(r[0], tz, 'yyyy-MM-dd')] = true;
  });
  var s = { workDays: 0, workMin: 0, overtimeMin: 0, nightMin: 0, saturdayMin: 0, holidayMin: 0, holidayNightMin: 0, paidLeaveDays: 0, specialLeaveDays: 0 };
  var ov = function (a1, a2, b1, b2) { return Math.max(0, Math.min(a2, b2) - Math.max(a1, b1)); };
  values.forEach(function (v, i) {
    var date = v[0], t = disp[i];
    if (!(date instanceof Date)) return;
    var dow = Number(Utilities.formatDate(date, tz, 'u'));
    var isHol = dow === 7 || hol[Utilities.formatDate(date, tz, 'yyyy-MM-dd')];
    var note = String(v[5] || '');
    if (note.indexOf('有給') >= 0) s.paidLeaveDays += /半休|半日/.test(note) ? 0.5 : 1;
    if (/特別休暇|夏季休暇/.test(note)) s.specialLeaveDays += 1;
    var a = tMin_(t[1]), b = tMin_(t[2]);
    if (a === null || b === null) return;
    if (b <= a) b += 1440;
    var work = Math.max(0, b - a - (tMin_(t[3]) || 0));
    var night = ov(a, b, 0, 300) + ov(a, b, 1320, 1740) + ov(a, b, 2760, 3180);
    s.workDays++; s.workMin += work;
    if (isHol) { s.holidayMin += work; s.holidayNightMin += night; }
    else { s.nightMin += night; if (dow === 6) s.saturdayMin += work; else s.overtimeMin += Math.max(0, work - std); }
  });
  return s;
}

function tMin_(s) {
  var m = String(s || '').trim().match(/^(\d{1,2}):(\d{2})/);
  return m ? (Number(m[1]) * 60 + Number(m[2])) % 1440 : null;
}
