// 担当：全員（共通部品）。変更する前に同じフォルダか担当フォルダの README.md を読み、担当外の人は担当者に相談する
package app.kintai.common;

/** 画面に出す業務エラー（field は入力欄の名前。全体のエラーなら null） */
public class BusinessException extends RuntimeException {
    private final String field;
    public BusinessException(String field, String message) { super(message); this.field = field; }
    public String getField() { return field; }
}
