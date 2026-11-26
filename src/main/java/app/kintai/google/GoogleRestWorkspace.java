package app.kintai.google;

import com.google.auth.oauth2.GoogleCredentials;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.*;

/**
 * 本物の Google（Sheets API v4・Drive API v3）を REST で呼ぶ。
 * サービスアカウントのメールアドレスに、ひな型・社員フォルダの親・フォームの回答シートを「編集者」で共有しておくこと。
 */
public class GoogleRestWorkspace implements GoogleWorkspace {
    private static final String SHEETS = "https://sheets.googleapis.com/v4/spreadsheets/";
    private static final String DRIVE = "https://www.googleapis.com/drive/v3/files";
    private final GoogleCredentials credentials;
    private final RestClient http = RestClient.create();

    public GoogleRestWorkspace(String credentialsPath) {
        try (var in = new FileInputStream(credentialsPath)) {
            credentials = GoogleCredentials.fromStream(in).createScoped(List.of(
                    "https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"));
        } catch (IOException e) {
            throw new UncheckedIOException("Google の鍵ファイルを読めません：" + credentialsPath, e);
        }
    }

    private String token() {
        try { credentials.refreshIfExpired(); return credentials.getAccessToken().getTokenValue(); }
        catch (IOException e) { throw new UncheckedIOException("Google にログインできません", e); }
    }

    private RestClient.RequestHeadersSpec<?> auth(RestClient.RequestHeadersSpec<?> spec) {
        return spec.header(HttpHeaders.AUTHORIZATION, "Bearer " + token());
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<List<String>> readValues(String id, String range) {
        Map<String, Object> res = auth(http.get().uri(SHEETS + "{id}/values/{range}?valueRenderOption=FORMATTED_VALUE", id, range))
                .retrieve().body(Map.class);
        List<List<Object>> values = res == null ? null : (List<List<Object>>) res.get("values");
        if (values == null) return List.of();
        return values.stream().map(r -> r.stream().map(o -> o == null ? "" : o.toString()).toList()).toList();
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> sheetProps(String id) {
        Map<String, Object> res = auth(http.get().uri(SHEETS + "{id}?fields=sheets.properties(sheetId,title,index)", id))
                .retrieve().body(Map.class);
        List<Map<String, Object>> sheets = res == null ? List.of() : (List<Map<String, Object>>) res.get("sheets");
        return sheets.stream().map(s -> (Map<String, Object>) s.get("properties")).toList();
    }

    @Override
    public List<String> sheetTitles(String id) { return sheetProps(id).stream().map(p -> String.valueOf(p.get("title"))).toList(); }

    @Override
    public void duplicateSheet(String id, String fromTitle, String newTitle) {
        List<Map<String, Object>> props = sheetProps(id);
        Object sourceId = props.stream().filter(p -> fromTitle.equals(p.get("title"))).findFirst()
                .orElseThrow(() -> new IllegalStateException("「" + fromTitle + "」シートがありません")).get("sheetId");
        Map<String, Object> req = Map.of("requests", List.of(Map.of("duplicateSheet", Map.of(
                "sourceSheetId", sourceId, "newSheetName", newTitle, "insertSheetIndex", props.size()))));
        auth(http.post().uri(SHEETS + "{id}:batchUpdate", id).contentType(MediaType.APPLICATION_JSON).body(req)).retrieve().toBodilessEntity();
    }

    @Override
    public void writeCell(String id, String range, String value) {
        Map<String, Object> body = Map.of("values", List.of(List.of(value)));
        auth(http.put().uri(SHEETS + "{id}/values/{range}?valueInputOption=USER_ENTERED", id, range)
                .contentType(MediaType.APPLICATION_JSON).body(body)).retrieve().toBodilessEntity();
    }

    @Override
    @SuppressWarnings("unchecked")
    public String createFolder(String name, String parentId) {
        Map<String, Object> body = new HashMap<>(Map.of("name", name, "mimeType", "application/vnd.google-apps.folder"));
        if (parentId != null) body.put("parents", List.of(parentId));
        Map<String, Object> res = auth(http.post().uri(DRIVE + "?supportsAllDrives=true&fields=id")
                .contentType(MediaType.APPLICATION_JSON).body(body)).retrieve().body(Map.class);
        return "https://drive.google.com/drive/folders/" + res.get("id");
    }

    @Override
    @SuppressWarnings("unchecked")
    public String copySpreadsheet(String fileId, String name, String folderId) {
        Map<String, Object> body = new HashMap<>(Map.of("name", name));
        if (folderId != null) body.put("parents", List.of(folderId));
        Map<String, Object> res = auth(http.post().uri(DRIVE + "/{id}/copy?supportsAllDrives=true&fields=id", fileId)
                .contentType(MediaType.APPLICATION_JSON).body(body)).retrieve().body(Map.class);
        return "https://docs.google.com/spreadsheets/d/" + res.get("id") + "/edit";
    }

    @Override
    public void share(String fileId, String email, String role) {
        Map<String, Object> body = Map.of("type", "user", "role", role, "emailAddress", email);
        auth(http.post().uri(DRIVE + "/{id}/permissions?supportsAllDrives=true&sendNotificationEmail=true", fileId)
                .contentType(MediaType.APPLICATION_JSON).body(body)).retrieve().toBodilessEntity();
    }

    @Override
    @SuppressWarnings("unchecked")
    public void unshare(String fileId, String email) {
        Map<String, Object> res = auth(http.get().uri(DRIVE + "/{id}/permissions?supportsAllDrives=true&fields=permissions(id,emailAddress)", fileId))
                .retrieve().body(Map.class);
        List<Map<String, Object>> list = res == null ? List.of() : (List<Map<String, Object>>) res.get("permissions");
        for (Map<String, Object> p : list) {
            if (email.equalsIgnoreCase(String.valueOf(p.get("emailAddress")))) {
                auth(http.delete().uri(DRIVE + "/{id}/permissions/{pid}?supportsAllDrives=true", fileId, p.get("id")))
                        .retrieve().toBodilessEntity();
            }
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public void moveToFolder(String fileId, String folderId) {
        Map<String, Object> res = auth(http.get().uri(DRIVE + "/{id}?supportsAllDrives=true&fields=parents", fileId)).retrieve().body(Map.class);
        List<String> parents = res == null || res.get("parents") == null ? List.of() : (List<String>) res.get("parents");
        auth(http.patch().uri(DRIVE + "/{id}?supportsAllDrives=true&addParents={add}&removeParents={rm}", fileId, folderId, String.join(",", parents))
                .contentType(MediaType.APPLICATION_JSON).body(Map.of())).retrieve().toBodilessEntity();
    }
}
