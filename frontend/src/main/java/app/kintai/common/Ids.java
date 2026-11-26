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
