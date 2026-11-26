// 担当：全員（起動クラス）。変更する前に同じフォルダか担当フォルダの README.md を読み、担当外の人は担当者に相談する
package app.kintai;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/** 勤怠・給与集計システム（社員管理・月次集計・フォーム設定を1つの画面で行う） */
@SpringBootApplication
@EnableScheduling
public class KintaiApplication {
    public static void main(String[] args) { SpringApplication.run(KintaiApplication.class, args); }
}
