package app.kintai.common;

/** 画面に出す業務エラー（field は入力欄の名前。全体のエラーなら null） */
public class BusinessException extends RuntimeException {
    private final String field;
    public BusinessException(String field, String message) { super(message); this.field = field; }
    public String getField() { return field; }
}
