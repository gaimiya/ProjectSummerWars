// 担当：全員（共通部品）。変更する前に同じフォルダか担当フォルダの README.md を読み、担当外の人は担当者に相談する
package app.kintai.common;

import java.util.regex.Pattern;

/** Google のURL（…/d/XXXX/edit、…/folders/XXXX）からIDを取り出す */
public final class Ids {
    private static final Pattern ID = Pattern.compile("[-\\w]{25,}");
    private Ids() {}

    public static String of(String url) {
        if (url == null) return null;
        var m = ID.matcher(url);
        return m.find() ? m.group() : null;
    }
}
