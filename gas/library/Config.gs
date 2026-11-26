/**
 * Config.gs
 * APIのURLとキーは、このライブラリの「スクリプト プロパティ」に保存する（コードに書かない）。
 *   API_URL … 送信先（今は社員管理表ウェブアプリの …/exec）。空なら「テスト送信」になる
 *   API_KEY … 署名に使う秘密の文字列（社員管理表のスクリプト プロパティ API_KEY と同じ値）
 * 設定場所：左の歯車「プロジェクトの設定」→ スクリプト プロパティ
 */
function getConfig() {
  var p = PropertiesService.getScriptProperties();
  return {
    apiUrl: p.getProperty('API_URL') || '',
    apiKey: p.getProperty('API_KEY') || ''
  };
}
