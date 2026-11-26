package app.kintai.google;

import java.util.List;

/**
 * Google（スプレッドシート・ドライブ）を触る窓口。
 * 本番は GoogleRestWorkspace（サービスアカウント）、鍵がないときは FakeGoogleWorkspace（仮データ）が動く。
 * ID は URL の …/d/XXXX の部分（common.Ids.of で取り出す）。
 */
public interface GoogleWorkspace {
    /** 表示どおりの文字で読む。range は「'2026年12月'!B11:G41」の形 */
    List<List<String>> readValues(String spreadsheetId, String range);

    /** シート名の一覧 */
    List<String> sheetTitles(String spreadsheetId);

    /** fromTitle のシートを複製して newTitle にする（いちばん右に置く） */
    void duplicateSheet(String spreadsheetId, String fromTitle, String newTitle);

    /** 1つのセルに値か数式を入れる（=DATE(2026,12,1) など） */
    void writeCell(String spreadsheetId, String range, String value);

    /** フォルダを作り、URLを返す */
    String createFolder(String name, String parentFolderId);

    /** ファイルをコピーし、コピーのスプレッドシートURLを返す */
    String copySpreadsheet(String fileId, String name, String folderId);

    /** 本人に共有する（role は writer / reader） */
    void share(String fileId, String email, String role);

    /** 共有を外す */
    void unshare(String fileId, String email);

    /** 別のフォルダへ移す */
    void moveToFolder(String fileId, String folderId);

    /** 仮データで動いているか（画面に表示する） */
    default boolean isFake() { return false; }
}
