package app.kintai.common;

/** 「9:30」「31:00」と分（570）の変換 */
public final class TimeText {
    private TimeText() {}

    /** 「9:30」→ 570。24時以降（31:00）は日またぎとして 0〜24時に直す。読めなければ null */
    public static Integer toMinutes(String s) {
        if (s == null) return null;
        var m = java.util.regex.Pattern.compile("^(\\d{1,2}):(\\d{2})").matcher(s.trim());
        if (!m.find()) return null;
        return (Integer.parseInt(m.group(1)) * 60 + Integer.parseInt(m.group(2))) % 1440;
    }

    /** 570 → 「9:30」 */
    public static String format(int minutes) {
        return (minutes / 60) + ":" + String.format("%02d", minutes % 60);
    }
}
