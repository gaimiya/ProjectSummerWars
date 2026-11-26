package jp.sashiwa.kintai.service;

/** 入力は正しい形だが、業務上受け付けられないとき（422 で返す） */
public class BusinessException extends RuntimeException {
    private final String field;
    public BusinessException(String field, String message) { super(message); this.field = field; }
    public String getField() { return field; }
}
