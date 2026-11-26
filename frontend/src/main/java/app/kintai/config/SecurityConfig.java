package app.kintai.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

/**
 * ログイン。管理者（山本さん）1人を環境変数 ADMIN_USER / ADMIN_PASSWORD から作る。
 * 利用者を増やすときは、ここを DB のユーザー表に置き換える。
 */
@Configuration
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(a -> a
                    .requestMatchers("/login", "/css/**", "/actuator/health").permitAll()
                    .anyRequest().authenticated())
            .formLogin(f -> f.loginPage("/login").defaultSuccessUrl("/employees", true).permitAll())
            .logout(l -> l.logoutSuccessUrl("/login?logout").permitAll());
        return http.build();
    }

    @Bean
    UserDetailsService users(@Value("${app.admin-user}") String user,
                             @Value("${app.admin-password}") String pass, PasswordEncoder enc) {
        return new InMemoryUserDetailsManager(User.withUsername(user).password(enc.encode(pass)).roles("ADMIN").build());
    }

    @Bean
    PasswordEncoder passwordEncoder() { return PasswordEncoderFactories.createDelegatingPasswordEncoder(); }
}
