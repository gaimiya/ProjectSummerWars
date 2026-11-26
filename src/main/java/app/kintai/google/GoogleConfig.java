// 担当：宮谷さん（Google連携）。変更する前に同じフォルダか担当フォルダの README.md を読み、担当外の人は担当者に相談する
package app.kintai.google;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * app.google.credentials（サービスアカウントの鍵ファイルの場所）があれば本物の Google を使う。
 * なければ仮データ（FakeGoogleWorkspace）で動く。鍵ファイルは Git に入れない。
 */
@Configuration
public class GoogleConfig {
    @Bean
    GoogleWorkspace googleWorkspace(@Value("${app.google.credentials:}") String credentials) {
        return credentials.isBlank() ? new FakeGoogleWorkspace() : new GoogleRestWorkspace(credentials);
    }
}
