// 担当：全員（共通部品）。変更する前に同じフォルダか担当フォルダの README.md を読み、担当外の人は担当者に相談する
package app.kintai.common;

public class NotFoundException extends RuntimeException {
    public NotFoundException(String message) { super(message); }
}
