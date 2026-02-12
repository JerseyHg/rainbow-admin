import { useState, useEffect, useCallback } from 'react'
import { COLORS, STATUS_MAP, STATUS_LABEL } from '../theme'
import { Card, Badge, StatCard, Button, Modal, Empty } from '../components/UI'
import { api } from '../api'
import type { ToastType } from '../types'

// ============================================================
// Types
// ============================================================
interface QualityInfo {
  invited_count: number
  approved_count: number
  rejected_count: number
  pending_count: number
  approval_rate: number | null
  quality_score: string | null
  quality_label: string
}

interface TreeNode {
  id: number
  serial_number: string | null
  name: string
  gender: string
  age: number
  work_location: string | null
  status: string
  create_time: string | null
  referred_by: string | null
  depth: number
  quality: QualityInfo
  descendant_count: number
  children: TreeNode[]
}

interface InviterRank {
  id: number
  name: string
  serial_number: string | null
  invited_count: number
  approved_count: number
  rejected_count: number
  approval_rate: number | null
  quality_score: string | null
  quality_label: string
}

interface NetworkStats {
  total_users: number
  total_approved: number
  total_rejected: number
  total_pending: number
  overall_approval_rate: number
  max_depth: number
  top_inviters: InviterRank[]
  worst_inviters: InviterRank[]
}

interface UserNetworkDetail {
  user: {
    id: number
    name: string
    serial_number: string | null
    gender: string
    age: number
    work_location: string | null
    status: string
    create_time: string | null
    referred_by: string | null
  }
  inviter: { id: number; name: string; serial_number: string | null; status: string } | null
  invitees: {
    id: number; name: string; serial_number: string | null
    gender: string; age: number; work_location: string | null
    status: string; create_time: string | null
  }[]
  quality: { invited_count: number; approved_count: number; rejected_count: number; approval_rate: number | null }
}

interface NetworkPageProps {
  showToast: (message: string, type?: ToastType) => void
}

// ============================================================
// Quality color helpers
// ============================================================
const QUALITY_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  A: { bg: 'rgba(52,211,153,0.15)', color: '#34D399', border: '#34D39944' },
  B: { bg: 'rgba(96,165,250,0.15)', color: '#60A5FA', border: '#60A5FA44' },
  C: { bg: 'rgba(251,191,36,0.15)', color: '#FBBF24', border: '#FBBF2444' },
  D: { bg: 'rgba(248,113,113,0.15)', color: '#F87171', border: '#F8717144' },
}

function getQualityStyle(score: string | null) {
  if (!score) return { bg: COLORS.surfaceHover, color: COLORS.textMuted, border: COLORS.border }
  return QUALITY_COLORS[score] || { bg: COLORS.surfaceHover, color: COLORS.textMuted, border: COLORS.border }
}

function getStatusDot(status: string) {
  const map: Record<string, string> = {
    approved: COLORS.success,
    published: COLORS.info,
    rejected: COLORS.danger,
    pending: COLORS.warning,
  }
  return map[status] || COLORS.textMuted
}

// ============================================================
// TreeNodeCard - 单个节点
// ============================================================
function TreeNodeCard({
  node,
  onSelect,
  collapsed,
  onToggle,
}: {
  node: TreeNode
  onSelect: (id: number) => void
  collapsed: boolean
  onToggle: () => void
}) {
  const qs = getQualityStyle(node.quality.quality_score)
  const hasChildren = node.children.length > 0

  return (
    <div
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '10px 14px', borderRadius: 12,
        background: COLORS.surface,
        border: `1px solid ${qs.border}`,
        cursor: 'pointer',
        transition: 'all 0.2s',
        minWidth: 180,
      }}
      onClick={() => onSelect(node.id)}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = qs.color
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = qs.border
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* 状态点 */}
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: getStatusDot(node.status), flexShrink: 0,
      }} />

      {/* 信息 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: 13, fontWeight: 600, color: COLORS.text,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {node.name}
          </span>
          <span style={{
            fontSize: 11, color: COLORS.textMuted,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            #{node.serial_number}
          </span>
        </div>
        <div style={{ fontSize: 11, color: COLORS.textSec, marginTop: 2 }}>
          {node.gender} · {node.age}岁
          {node.quality.invited_count > 0 && (
            <span style={{ marginLeft: 6, color: qs.color, fontWeight: 600 }}>
              邀{node.quality.invited_count}人
              {node.quality.approval_rate !== null && ` · ${node.quality.approval_rate}%通过`}
            </span>
          )}
        </div>
      </div>

      {/* 质量评分 */}
      {node.quality.quality_score && (
        <div style={{
          width: 26, height: 26, borderRadius: 8,
          background: qs.bg, color: qs.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, flexShrink: 0,
        }}>
          {node.quality.quality_score}
        </div>
      )}

      {/* 展开/折叠 */}
      {hasChildren && (
        <div
          onClick={e => { e.stopPropagation(); onToggle() }}
          style={{
            width: 22, height: 22, borderRadius: 6,
            background: COLORS.bg, border: `1px solid ${COLORS.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, color: COLORS.textMuted, flexShrink: 0,
            cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.accent}
          onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.border}
        >
          {collapsed ? `+${node.descendant_count}` : '−'}
        </div>
      )}
    </div>
  )
}

// ============================================================
// TreeBranch - 递归渲染树
// ============================================================
function TreeBranch({
  nodes,
  onSelect,
  collapsedSet,
  onToggle,
  depth = 0,
}: {
  nodes: TreeNode[]
  onSelect: (id: number) => void
  collapsedSet: Set<number>
  onToggle: (id: number) => void
  depth?: number
}) {
  if (nodes.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {nodes.map((node, i) => {
        const isCollapsed = collapsedSet.has(node.id)
        const hasChildren = node.children.length > 0

        return (
          <div key={node.id} style={{
            animation: 'fadeIn 0.3s ease',
            animationDelay: `${i * 0.03}s`,
            animationFillMode: 'forwards',
            opacity: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
              {/* 连线区域 */}
              {depth > 0 && (
                <div style={{
                  width: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative', flexShrink: 0, alignSelf: 'stretch',
                }}>
                  {/* 垂直线 + 水平线 */}
                  <div style={{
                    position: 'absolute', left: '50%', top: 0, bottom: i === nodes.length - 1 ? '50%' : 0,
                    width: 1, background: COLORS.border,
                  }} />
                  <div style={{
                    position: 'absolute', left: '50%', top: '50%', right: 0,
                    height: 1, background: COLORS.border,
                    transform: 'translateY(-50%)',
                  }} />
                </div>
              )}

              {/* 节点 + 子节点 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <TreeNodeCard
                  node={node}
                  onSelect={onSelect}
                  collapsed={isCollapsed}
                  onToggle={() => onToggle(node.id)}
                />

                {/* 子节点 */}
                {hasChildren && !isCollapsed && (
                  <div style={{ marginLeft: 16, marginTop: 6 }}>
                    <TreeBranch
                      nodes={node.children}
                      onSelect={onSelect}
                      collapsedSet={collapsedSet}
                      onToggle={onToggle}
                      depth={depth + 1}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============================================================
// InviterRankCard - 邀请人排行
// ============================================================
function InviterRankCard({ inviter, rank, variant }: { inviter: InviterRank; rank: number; variant: 'good' | 'bad' }) {
  const qs = getQualityStyle(inviter.quality_score)
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px', background: COLORS.bg, borderRadius: 10,
      border: `1px solid ${COLORS.border}`,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: variant === 'good' ? COLORS.successDim : COLORS.dangerDim,
        color: variant === 'good' ? COLORS.success : COLORS.danger,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700,
      }}>
        {rank}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>
          {inviter.name}
          <span style={{
            fontSize: 11, color: COLORS.textMuted, marginLeft: 6,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            #{inviter.serial_number}
          </span>
        </div>
        <div style={{ fontSize: 12, color: COLORS.textSec, marginTop: 2 }}>
          邀请 {inviter.invited_count} 人 · 通过 {inviter.approved_count} · 拒绝 {inviter.rejected_count}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{
          fontSize: 16, fontWeight: 700, color: qs.color,
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {inviter.approval_rate !== null ? `${inviter.approval_rate}%` : '-'}
        </div>
        <div style={{ fontSize: 11, color: COLORS.textMuted }}>通过率</div>
      </div>
    </div>
  )
}

// ============================================================
// NetworkPage - 主页面
// ============================================================
export function NetworkPage({ showToast }: NetworkPageProps) {
  const [loading, setLoading] = useState(true)
  const [tree, setTree] = useState<TreeNode[]>([])
  const [stats, setStats] = useState<NetworkStats | null>(null)
  const [collapsedSet, setCollapsedSet] = useState<Set<number>>(new Set())

  // 用户详情弹窗
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [userDetail, setUserDetail] = useState<UserNetworkDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // 视图模式
  const [viewMode, setViewMode] = useState<'tree' | 'ranking'>('tree')

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.getNetworkTree()
      if (res.data) {
        setTree(res.data.tree || [])
        setStats(res.data.stats || null)
      }
    } catch (e: any) {
      showToast(e.message, 'error')
    }
    setLoading(false)
  }, [showToast])

  useEffect(() => { loadData() }, [loadData])

  // 选中用户 -> 加载详情
  const handleSelectUser = async (id: number) => {
    setSelectedUserId(id)
    setDetailLoading(true)
    try {
      const res = await api.getNetworkUserDetail(id)
      setUserDetail(res.data || null)
    } catch (e: any) {
      showToast(e.message, 'error')
    }
    setDetailLoading(false)
  }

  // 折叠/展开
  const handleToggle = (id: number) => {
    setCollapsedSet(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // 全部展开/折叠
  const collectAllIds = (nodes: TreeNode[]): number[] => {
    const ids: number[] = []
    for (const n of nodes) {
      if (n.children.length > 0) ids.push(n.id)
      ids.push(...collectAllIds(n.children))
    }
    return ids
  }

  const expandAll = () => setCollapsedSet(new Set())
  const collapseAll = () => setCollapsedSet(new Set(collectAllIds(tree)))

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>邀请关系网络</h2>
          <p style={{ fontSize: 14, color: COLORS.textSec }}>查看用户邀请链路与质量分析 🔗</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="ghost" size="sm" onClick={loadData}>🔄 刷新</Button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: COLORS.textMuted }}>
          <div style={{ animation: 'pulse 1.2s infinite', fontSize: 16 }}>加载中...</div>
        </div>
      ) : (
        <>
          {/* Stats Row */}
          {stats && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12, marginBottom: 24,
            }}>
              <StatCard label="总用户" value={stats.total_users} icon="👥" color={COLORS.accent} />
              <StatCard label="已通过" value={stats.total_approved} icon="✅" color={COLORS.success} />
              <StatCard label="已拒绝" value={stats.total_rejected} icon="❌" color={COLORS.danger} />
              <StatCard label="总通过率" value={`${stats.overall_approval_rate}%`} icon="📊" color={COLORS.info} />
              <StatCard label="最大深度" value={stats.max_depth} icon="🌳" color={COLORS.warning} sub="邀请层级" />
            </div>
          )}

          {/* View Mode Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {([
              { key: 'tree' as const, label: '🌳 关系树', },
              { key: 'ranking' as const, label: '🏆 质量排行' },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setViewMode(tab.key)}
                style={{
                  padding: '8px 18px', borderRadius: 8, border: 'none',
                  cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  fontFamily: 'inherit', transition: 'all 0.2s',
                  background: viewMode === tab.key ? COLORS.accent : COLORS.surface,
                  color: viewMode === tab.key ? '#fff' : COLORS.textSec,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ====== Tree View ====== */}
          {viewMode === 'tree' && (
            <Card style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: COLORS.textSec }}>邀请关系树</h3>
                  {/* 图例 */}
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: COLORS.textMuted }}>
                    {[
                      { label: '优质 A', color: QUALITY_COLORS.A.color },
                      { label: '良好 B', color: QUALITY_COLORS.B.color },
                      { label: '一般 C', color: QUALITY_COLORS.C.color },
                      { label: '较差 D', color: QUALITY_COLORS.D.color },
                    ].map(item => (
                      <span key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{
                          width: 8, height: 8, borderRadius: 3,
                          background: item.color, display: 'inline-block',
                        }} />
                        {item.label}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button variant="ghost" size="sm" onClick={expandAll}>展开全部</Button>
                  <Button variant="ghost" size="sm" onClick={collapseAll}>折叠全部</Button>
                </div>
              </div>

              {tree.length === 0 ? (
                <Empty text="暂无邀请关系数据" />
              ) : (
                <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
                  {/* 管理员根节点标识 */}
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '8px 14px', borderRadius: 10,
                    background: COLORS.gradient, backgroundSize: '200% 200%',
                    marginBottom: 12, fontSize: 13, fontWeight: 600, color: '#fff',
                  }}>
                    🌈 管理员直邀
                  </div>
                  <TreeBranch
                    nodes={tree}
                    onSelect={handleSelectUser}
                    collapsedSet={collapsedSet}
                    onToggle={handleToggle}
                  />
                </div>
              )}
            </Card>
          )}

          {/* ====== Ranking View ====== */}
          {viewMode === 'ranking' && stats && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* 优质邀请人 */}
              <Card>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: COLORS.success, marginBottom: 16 }}>
                  🌟 优质邀请人 TOP 5
                </h3>
                {stats.top_inviters.length === 0 ? (
                  <Empty text="暂无数据" />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {stats.top_inviters.map((inv, i) => (
                      <InviterRankCard key={inv.id} inviter={inv} rank={i + 1} variant="good" />
                    ))}
                  </div>
                )}
              </Card>

              {/* 需关注的邀请人 */}
              <Card>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: COLORS.danger, marginBottom: 16 }}>
                  ⚠️ 需关注的邀请人
                </h3>
                {stats.worst_inviters.length === 0 ? (
                  <Empty text="暂无数据" />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {stats.worst_inviters.map((inv, i) => (
                      <InviterRankCard key={inv.id} inviter={inv} rank={i + 1} variant="bad" />
                    ))}
                  </div>
                )}
                <div style={{
                  marginTop: 16, padding: '10px 14px', borderRadius: 8,
                  background: COLORS.dangerDim, fontSize: 12, color: COLORS.danger,
                  lineHeight: 1.6,
                }}>
                  💡 这些用户邀请的人被拒绝比例较高，建议关注其邀请码使用情况。
                </div>
              </Card>
            </div>
          )}
        </>
      )}

      {/* ====== User Detail Modal ====== */}
      <Modal
        open={selectedUserId !== null}
        onClose={() => { setSelectedUserId(null); setUserDetail(null) }}
        title="用户邀请详情"
        width={600}
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: 40, color: COLORS.textMuted }}>加载中...</div>
        ) : userDetail ? (
          <div>
            {/* 用户基本信息 */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '16px 20px', background: COLORS.bg, borderRadius: 12, marginBottom: 20,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, background: COLORS.gradient,
                backgroundSize: '200% 200%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 700, color: '#fff',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {userDetail.user.serial_number || '?'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 700 }}>{userDetail.user.name}</span>
                  <Badge variant={userDetail.user.status}>
                    {STATUS_LABEL[userDetail.user.status] || userDetail.user.status}
                  </Badge>
                </div>
                <div style={{ fontSize: 13, color: COLORS.textSec, marginTop: 4 }}>
                  {userDetail.user.gender} · {userDetail.user.age}岁 · {userDetail.user.work_location || '未填'}
                </div>
              </div>
            </div>

            {/* 邀请来源 */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSec, marginBottom: 8 }}>邀请来源</div>
              <div style={{
                padding: '10px 14px', background: COLORS.bg, borderRadius: 8,
                fontSize: 13, color: COLORS.text,
              }}>
                {userDetail.inviter ? (
                  <span>
                    由 <strong>{userDetail.inviter.name}</strong>
                    <span style={{ color: COLORS.textMuted }}> (#{userDetail.inviter.serial_number})</span> 邀请
                  </span>
                ) : (
                  <span style={{ color: COLORS.textMuted }}>
                    {userDetail.user.referred_by || '管理员直接邀请'}
                  </span>
                )}
              </div>
            </div>

            {/* 邀请质量统计 */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSec, marginBottom: 8 }}>邀请质量</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[
                  { label: '邀请人数', value: userDetail.quality.invited_count, color: COLORS.accent },
                  { label: '已通过', value: userDetail.quality.approved_count, color: COLORS.success },
                  { label: '已拒绝', value: userDetail.quality.rejected_count, color: COLORS.danger },
                  { label: '通过率', value: userDetail.quality.approval_rate !== null ? `${userDetail.quality.approval_rate}%` : '-', color: COLORS.info },
                ].map(item => (
                  <div key={item.label} style={{
                    padding: '12px', background: COLORS.bg, borderRadius: 10, textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: item.color, fontFamily: "'JetBrains Mono', monospace" }}>
                      {item.value}
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 邀请的人列表 */}
            {userDetail.invitees.length > 0 && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSec, marginBottom: 8 }}>
                  邀请的用户 ({userDetail.invitees.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
                  {userDetail.invitees.map(inv => (
                    <div key={inv.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', background: COLORS.bg, borderRadius: 10,
                    }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: getStatusDot(inv.status), flexShrink: 0,
                      }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{inv.name}</span>
                        <span style={{
                          fontSize: 11, color: COLORS.textMuted, marginLeft: 6,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}>#{inv.serial_number}</span>
                      </div>
                      <div style={{ fontSize: 12, color: COLORS.textSec }}>
                        {inv.gender} · {inv.age}岁
                      </div>
                      <Badge variant={inv.status}>
                        {STATUS_LABEL[inv.status] || inv.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {userDetail.invitees.length === 0 && (
              <div style={{
                padding: '20px', textAlign: 'center', color: COLORS.textMuted,
                background: COLORS.bg, borderRadius: 10, fontSize: 13,
              }}>
                该用户暂未邀请任何人
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
