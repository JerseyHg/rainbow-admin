import { COLORS } from '../theme'
import type { PageKey } from '../types'

interface SidebarProps {
  active: PageKey
  onNav: (key: PageKey) => void
  onLogout: () => void
}

const navItems: { key: PageKey; label: string; emoji: string }[] = [
  { key: 'dashboard',   label: '仪表盘',     emoji: '📊' },
  { key: 'profiles',    label: '资料审核',    emoji: '👥' },
  { key: 'invitations', label: '邀请码管理',  emoji: '🎫' },
]

export function Sidebar({ active, onNav, onLogout }: SidebarProps) {
  return (
    <div style={{
      width: 240, minHeight: '100vh', background: COLORS.surface,
      borderRight: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
    }}>
      {/* Brand */}
      <div style={{ padding: '28px 24px 20px', borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11,
            background: COLORS.gradient, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 20,
            backgroundSize: '200% 200%', animation: 'gradientShift 4s ease infinite',
          }}>🌈</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>彩虹注册</div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 500 }}>管理后台</div>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <div style={{ flex: 1, padding: '16px 12px' }}>
        {navItems.map(it => (
          <div
            key={it.key}
            onClick={() => onNav(it.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', borderRadius: 10, marginBottom: 4,
              cursor: 'pointer', fontSize: 14,
              fontWeight: active === it.key ? 600 : 400,
              color: active === it.key ? COLORS.text : COLORS.textSec,
              background: active === it.key ? COLORS.accentDim : 'transparent',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              if (active !== it.key) e.currentTarget.style.background = COLORS.surfaceHover
            }}
            onMouseLeave={e => {
              if (active !== it.key) e.currentTarget.style.background = 'transparent'
            }}
          >
            <span style={{ fontSize: 16 }}>{it.emoji}</span>
            {it.label}
          </div>
        ))}
      </div>

      {/* Logout */}
      <div style={{ padding: '16px 12px', borderTop: `1px solid ${COLORS.border}` }}>
        <div
          onClick={onLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
            fontSize: 13, color: COLORS.textMuted, transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = COLORS.dangerDim
            e.currentTarget.style.color = COLORS.danger
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = COLORS.textMuted
          }}
        >
          🚪 退出登录
        </div>
      </div>
    </div>
  )
}
