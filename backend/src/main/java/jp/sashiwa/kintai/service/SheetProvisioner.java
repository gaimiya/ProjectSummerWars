package jp.sashiwa.kintai.service;

import jp.sashiwa.kintai.domain.employee.Employee;

/**
 * 勤怠シートと個人フォルダを作る・片付ける窓口。
 * 本番は Google Drive API（サービスアカウント・共有ドライブ）で実装する（宮谷さん担当）。
 * それまでは NoopSheetProvisioner が仮のURLを返す。
 */
public interface SheetProvisioner {
    record Created(String sheetUrl, String folderUrl) {}

    /** ひな型をコピーして「社員番号_氏名」フォルダに入れ、所属・氏名を記入する */
    Created create(Employee e);

    /** 本人への共有を止め、「退職者」フォルダへ移す */
    void archive(Employee e);
}
