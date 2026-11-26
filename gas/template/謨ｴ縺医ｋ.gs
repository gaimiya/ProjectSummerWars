/**
 * 整える.gs（一度だけ実行する用）
 * 「テンプレ」シートの数式と色をまとめて直す。
 * 実行：Apps Script の上で関数「setupTemplate」を選んで ▶実行
 */
function setupTemplate() {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName('テンプレ');
  var first = 11, last = 41, n = last - first + 1;

  // 期間とタイトルを年月(G6)と連動
  sh.getRange('C2').setFormula('=G6');
  sh.getRange('C3').setFormula('=EOMONTH(G6,0)');
  sh.getRange('B4').setFormula('=+G6');

  // 日付・勤務時間・曜日区分・欠勤日数
  var b = [], f = [], h = [], i = [];
  for (var r = first; r <= last; r++) {
    b.push([r === first ? '=C2' : '=IF(B' + (r - 1) + '="","",IF((B' + (r - 1) + '+1)>$C$3,"",B' + (r - 1) + '+1))']);
    f.push(['=IF(B' + r + '="","",IF(C' + r + '="","-",MOD(D' + r + '-C' + r + ',1)-E' + r + '))']);
    h.push(['=IF(B' + r + '="","",IF(COUNTIF(休日!$A:$A,B' + r + ')>0,"祝",IF(WEEKDAY(B' + r + ')=1,"日",IF(WEEKDAY(B' + r + ')=7,"土",""))))']);
    i.push(['=IF(B' + r + '="","",IF(OR(COUNTIF(G' + r + ',"*有給*")>0,COUNTIF(G' + r + ',"*夏季休暇*")>0),0,IF(H' + r + '<>"","",IF(C' + r + '="",1,IF(F' + r + '>=$J$10,"",1-F' + r + '/$J$10)))))']);
  }
  sh.getRange(first, 2, n, 1).setFormulas(b);
  sh.getRange(first, 6, n, 1).setFormulas(f).setHorizontalAlignment('right');
  sh.getRange(first, 8, n, 1).setFormulas(h);
  sh.getRange(first, 9, n, 1).setFormulas(i);
  ['I', 'L', 'M', 'N', 'O'].forEach(function (c) { sh.getRange(c + '43').setFormula('=SUM(' + c + first + ':' + c + last + ')'); });

  // 縞模様・古い色を消して、土日祝だけ薄い水色に
  sh.getBandings().forEach(function (bd) { bd.remove(); });
  var body = sh.getRange(first, 2, n, 6); // B〜G
  body.setBackground('#ffffff');
  var rule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND($B11<>"",OR(WEEKDAY($B11)=1,WEEKDAY($B11)=7,COUNTIF(INDIRECT("休日!$A:$A"),$B11)>0))')
    .setBackground('#ddebf7').setRanges([body]).build();
  sh.setConditionalFormatRules([rule]);

  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert('テンプレを整えました。');
}
