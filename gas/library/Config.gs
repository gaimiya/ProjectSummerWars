/**
 * Config.gs
 * APIのURLとキーは、このライブラリの「スクリプト プロパティ」に保存する（コードに書かない）。
 *   API_URL … 山川さんの提出API（例：https://xxx/api/submissions）。空なら「テスト送信」になる
 *   API_KEY … 署名に使う秘密の文字列
 */
function getConfig() {
  var p = PropertiesService.getScriptProperties();
  return {
    apiUrl: p.getProperty('API_URL') || '',
    apiKey: p.getProperty('API_KEY') || ''
  };
}
