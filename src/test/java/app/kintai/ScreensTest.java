package app.kintai;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** 画面が開けること・登録から月次集計までの流れ（Google は仮データ） */
@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH")
@AutoConfigureMockMvc
class ScreensTest {
    @Autowired MockMvc mvc;

    @Test
    void ログインしていなければログイン画面へ() throws Exception {
        mvc.perform(get("/employees")).andExpect(status().is3xxRedirection());
    }

    @Test
    @WithMockUser
    void 社員を登録して月次集計まで() throws Exception {
        mvc.perform(get("/employees")).andExpect(status().isOk());
        mvc.perform(get("/employees/new")).andExpect(status().isOk());
        mvc.perform(post("/settings").with(csrf()).param("TEMPLATE_SHEET_URL", "https://docs.google.com/spreadsheets/d/TEMPLATE00000000000000000000000/edit"))
                .andExpect(status().is3xxRedirection());
        mvc.perform(post("/employees/new").with(csrf())
                        .param("no", "E0001").param("name", "山田 太郎").param("mail", "taro@example.com")
                        .param("joined", "2025-04-01").param("type", "正社員").param("status", "在籍").param("payType", "月給")
                        .param("base", "250000").param("stdTime", "8:00").param("commute", "10000").param("housing", "10000").param("fixed", "0")
                        .param("history[0].project", "案件A").param("history[0].amount", "30000"))
                .andExpect(status().is3xxRedirection());
        mvc.perform(get("/employees/E0001")).andExpect(status().isOk());
        mvc.perform(post("/monthly/sheets").with(csrf()).param("ym", "2026-12")).andExpect(status().is3xxRedirection());
        mvc.perform(post("/monthly/collect").with(csrf()).param("ym", "2026-12")).andExpect(status().is3xxRedirection());
        mvc.perform(get("/monthly").param("ym", "2026-12")).andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("山田 太郎")));
        mvc.perform(get("/monthly/csv").param("ym", "2026-12")).andExpect(status().isOk());
        mvc.perform(get("/settings")).andExpect(status().isOk());
    }
}
