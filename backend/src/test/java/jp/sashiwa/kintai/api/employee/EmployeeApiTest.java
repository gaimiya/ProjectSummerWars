package jp.sashiwa.kintai.api.employee;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
@WithMockUser
class EmployeeApiTest {

    @Autowired MockMvc mvc;

    static final String TARO = """
        {"no":"E0001","name":"山田 太郎","kana":"ヤマダ タロウ","mail":"taro@example.com","dept":"開発部",
         "type":"正社員","joined":"2025-04-01","payType":"月給","base":250000,"stdTime":"8:00",
         "commute":10000,"housing":10000,"fixed":0}
        """;

    @Test
    void 登録して一覧と詳細に出る() throws Exception {
        mvc.perform(post("/api/employees").contentType(MediaType.APPLICATION_JSON).content(TARO))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.message", containsString("山田 太郎 さんを登録しました")));

        mvc.perform(get("/api/employees").param("q", "ヤマダ"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$", hasSize(1)))
           .andExpect(jsonPath("$[0].housing").value(10000))
           .andExpect(jsonPath("$[0].shareState").value("入社日に共有予定"));

        mvc.perform(get("/api/employees/E0001"))
           .andExpect(jsonPath("$.stdTime").value("8:00"))
           .andExpect(jsonPath("$.mail").value("taro@example.com"));
    }

    @Test
    void 必須漏れとメール形式は422() throws Exception {
        mvc.perform(post("/api/employees").contentType(MediaType.APPLICATION_JSON)
                   .content("{\"no\":\"E0002\",\"name\":\"\",\"mail\":\"abc\"}"))
           .andExpect(status().isUnprocessableEntity())
           .andExpect(jsonPath("$.errors[*].field", hasItems("name", "mail", "joined")));
    }

    @Test
    void 社員番号の重複は422() throws Exception {
        mvc.perform(post("/api/employees").contentType(MediaType.APPLICATION_JSON).content(TARO));
        mvc.perform(post("/api/employees").contentType(MediaType.APPLICATION_JSON).content(TARO))
           .andExpect(status().isUnprocessableEntity())
           .andExpect(jsonPath("$.errors[0].message", containsString("すでに使われています")));
    }

    @Test
    void 変更と参画履歴の保存() throws Exception {
        mvc.perform(post("/api/employees").contentType(MediaType.APPLICATION_JSON).content(TARO));
        String upd = TARO.replace("\"housing\":10000", "\"housing\":0")
                .replace("\"fixed\":0", "\"fixed\":0,\"status\":\"休職\",\"history\":[{\"project\":\"案件A\",\"amount\":30000,\"from\":\"2026-04-01\"}]");
        mvc.perform(put("/api/employees/E0001").contentType(MediaType.APPLICATION_JSON).content(upd))
           .andExpect(status().isOk());
        mvc.perform(get("/api/employees/E0001"))
           .andExpect(jsonPath("$.status").value("休職"))
           .andExpect(jsonPath("$.housing").value(0))
           .andExpect(jsonPath("$.history[0].project").value("案件A"));
    }

    @Test
    void 削除すると一覧から消え詳細は404() throws Exception {
        mvc.perform(post("/api/employees").contentType(MediaType.APPLICATION_JSON).content(TARO));
        mvc.perform(delete("/api/employees/E0001")).andExpect(status().isOk());
        mvc.perform(get("/api/employees")).andExpect(jsonPath("$", hasSize(0)));
        mvc.perform(get("/api/employees/E0001")).andExpect(status().isNotFound());
    }
}
