package jp.sashiwa.kintai.api;

import jp.sashiwa.kintai.service.BusinessException;
import jp.sashiwa.kintai.service.NotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;
import java.util.Map;

/** エラーを決まった形で返す：{ "errors": [ { "field": "...", "message": "..." } ] } */
@RestControllerAdvice
public class ApiErrorHandler {

    public record FieldError(String field, String message) {}

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, List<FieldError>>> invalid(MethodArgumentNotValidException ex) {
        List<FieldError> list = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> new FieldError(e.getField(), e.getDefaultMessage())).toList();
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(Map.of("errors", list));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, List<FieldError>>> unreadable(HttpMessageNotReadableException ex) {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                .body(Map.of("errors", List.of(new FieldError(null, "入力の形が正しくありません（日付・数字を確認してください）"))));
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Map<String, List<FieldError>>> business(BusinessException ex) {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                .body(Map.of("errors", List.of(new FieldError(ex.getField(), ex.getMessage()))));
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<Map<String, List<FieldError>>> notFound(NotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("errors", List.of(new FieldError(null, ex.getMessage()))));
    }
}
