import { COLORS } from '../theme'
import { Card, StatCard, Button } from '../components/UI'
import type { DashboardStats, PageKey } from '../types'

interface DashboardPageProps {
  stats: DashboardStats
  onNav: (key: PageKey) => void
}

export function DashboardPage({ stats, onNav }: DashboardPageProps) {
  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>仪表盘</h2>
        <p style={{ fontSize: 14, color: COLORS.textSec }}>欢迎回来，管理员 ✨</p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16, marginBottom: 32,
      }}>
        <StatCard label="待审核" value={stats.pending} icon="⏳" color={COLORS.warning} sub="需要处理" />
        <StatCard label="已通过" value={stats.approved} icon="✅" color={COLORS.success} sub="审核通过" />
        <StatCard label="已发布" value={stats.published} icon="📄" color={COLORS.info} sub="公众号发布" />
        <StatCard label="邀请码" value={stats.totalCodes} icon="🎫" color={COLORS.accent} sub={`已使用 ${stats.usedCodes}`} />
      </div>

      {/* Quick Actions */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: COLORS.textSec }}>快速操作</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Button variant="soft" onClick={() => onNav('profiles')}>👥 审核资料</Button>
          <Button variant="ghost" onClick={() => onNav('invitations')}>➕ 生成邀请码</Button>
        </div>
      </Card>

      {/* System Info */}
      <Card>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: COLORS.textSec }}>系统信息</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {([
            ['应用版本', 'v1.0.0'],
            ['API 状态', '🟢 运行中'],
            ['数据库', 'SQLite'],
            ['环境', '开发模式'],
          ] as [string, string][]).map(([k, v]) => (
            <div key={k} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '10px 14px', background: COLORS.bg, borderRadius: 8,
            }}>
              <span style={{ fontSize: 13, color: COLORS.textMuted }}>{k}</span>
              <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{v}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
