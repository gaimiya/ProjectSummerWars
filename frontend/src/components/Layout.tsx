import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

/** 左に濃紺のメニュー、右に内容 */
export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="app">
      <nav className="side">
        <div className="side-title">勤怠・給与集計</div>
        <NavLink to="/employees" className="side-item">社員管理</NavLink>
        <NavLink to="/settings/forms" className="side-item">フォーム設定</NavLink>
      </nav>
      <main className="main">{children}</main>
    </div>
  )
}
