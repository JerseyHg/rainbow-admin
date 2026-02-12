import { useState } from 'react'
import { COLORS } from '../theme'
import { Card, Button } from '../components/UI'
import { api } from '../api'
import type { ToastType } from '../types'

interface InvitationsPageProps {
  showToast: (message: string, type?: ToastType) => void
}

export function InvitationsPage({ showToast }: InvitationsPageProps) {
  const [count, setCount] = useState(10)
  const [notes, setNotes] = useState('')
  const [codes, setCodes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(-1)

  const generate = async () => {
    if (count < 1 || count > 100) return
    setLoading(true)
    try {
      const res = await api.generateCodes(count, notes)
      setCodes(res.data?.codes || [])
      showToast(`成功生成 ${count} 个邀请码`, 'success')
    } catch (e: any) {
      showToast(e.message, 'error')
    }
    setLoading(false)
  }

  const copyCode = (code: string, idx: number) => {
    navigator.clipboard?.writeText(code)
    setCopied(idx)
    setTimeout(() => setCopied(-1), 1500)
  }

  const copyAll = () => {
    navigator.clipboard?.writeText(codes.join('\n'))
    showToast('已复制全部邀请码', 'success')
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>邀请码管理</h2>
        <p style={{ fontSize: 14, color: COLORS.textSec }}>生成和管理邀请码</p>
      </div>

      {/* Generator */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>
          ➕ 生成邀请码
        </h3>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '0 0 140px' }}>
            <label style={{
              display: 'block', fontSize: 12, color: COLORS.textMuted,
              marginBottom: 8, fontWeight: 500,
            }}>数量</label>
            <input
              type="number"
              value={count}
              onChange={e => setCount(Math.min(100, Math.max(1, +e.target.value)))}
              min={1}
              max={100}
              style={{ width: '100%', height: 42 }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{
              display: 'block', fontSize: 12, color: COLORS.textMuted,
              marginBottom: 8, fontWeight: 500,
            }}>备注（可选）</label>
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="例：线下活动用"
              style={{ width: '100%', height: 42 }}
              onKeyDown={e => e.key === 'Enter' && generate()}
            />
          </div>
          <Button onClick={generate} loading={loading} style={{ height: 42 }}>
            🎫 生成
          </Button>
        </div>
      </Card>

      {/* Results */}
      {codes.length > 0 ? (
        <Card>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 20,
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>
              <span style={{ color: COLORS.success }}>✓</span> 已生成 {codes.length} 个邀请码
            </h3>
            <Button variant="ghost" onClick={copyAll} size="sm">📋 复制全部</Button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 8,
          }}>
            {codes.map((code, i) => (
              <div
                key={code}
                onClick={() => copyCode(code, i)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', background: COLORS.bg, borderRadius: 10,
                  cursor: 'pointer',
                  border: `1px solid ${copied === i ? COLORS.success : COLORS.border}`,
                  transition: 'all 0.2s',
                  animation: 'fadeIn 0.3s ease forwards',
                  animationDelay: `${i * 0.03}s`,
                  opacity: 0,
                }}
                onMouseEnter={e => {
                  if (copied !== i) e.currentTarget.style.borderColor = COLORS.borderLight
                }}
                onMouseLeave={e => {
                  if (copied !== i) e.currentTarget.style.borderColor = COLORS.border
                }}
              >
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 15, fontWeight: 600, letterSpacing: '0.12em',
                  color: copied === i ? COLORS.success : COLORS.text,
                }}>
                  {code}
                </span>
                <span style={{
                  fontSize: 11,
                  color: copied === i ? COLORS.success : COLORS.textMuted,
                }}>
                  {copied === i ? '✓' : '复制'}
                </span>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎫</div>
          <p style={{ color: COLORS.textMuted, fontSize: 14 }}>设置参数后点击"生成"按钮</p>
        </Card>
      )}
    </div>
  )
}
