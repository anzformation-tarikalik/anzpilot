import React, { ReactNode, CSSProperties } from 'react'

// ═══ TOKENS ════════════════════════════════════════════════
export const tokens = {
  bg: '#050c1a',
  surface: 'rgba(255,255,255,.04)',
  surfaceHover: 'rgba(255,255,255,.06)',
  border: 'rgba(255,255,255,.08)',
  borderHover: 'rgba(255,255,255,.12)',
  text: '#fff',
  textMuted: '#94a3b8',
  textDim: '#64748b',
  textFaint: '#475569',
  primary: '#0ea5e9',
  primary2: '#2563eb',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#a855f7',
  fontSans: 'DM Sans, system-ui',
  fontDisplay: 'Sora, Georgia',
}

// ═══ BUTTON ═══════════════════════════════════════════════
interface ButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
  icon?: string
  style?: CSSProperties
  fullWidth?: boolean
}

export function Button({ children, variant='primary', size='md', onClick, disabled, type='button', icon, style, fullWidth }: ButtonProps) {
  const sizes = {
    sm: { padding: '6px 12px', fontSize: 12 },
    md: { padding: '10px 18px', fontSize: 13 },
    lg: { padding: '12px 22px', fontSize: 14 },
  }
  const variants: Record<string, CSSProperties> = {
    primary:   { background: `linear-gradient(135deg,${tokens.primary},${tokens.primary2})`, color: '#fff', border: 'none' },
    secondary: { background: tokens.surface, color: tokens.textMuted, border: `1px solid ${tokens.border}` },
    danger:    { background: 'rgba(239,68,68,.1)', color: tokens.danger, border: '1px solid rgba(239,68,68,.3)' },
    success:   { background: `linear-gradient(135deg,${tokens.success},#059669)`, color: '#fff', border: 'none' },
    ghost:     { background: 'transparent', color: tokens.textMuted, border: 'none' },
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      ...sizes[size], ...variants[variant],
      borderRadius: 9, fontWeight: 600, fontFamily: tokens.fontSans,
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .5 : 1,
      display: 'inline-flex', alignItems: 'center', gap: 8,
      width: fullWidth ? '100%' : 'auto', justifyContent: 'center',
      transition: 'all .15s', ...style
    }}>
      {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
      {children}
    </button>
  )
}

// ═══ CARD ═════════════════════════════════════════════════
interface CardProps {
  children: ReactNode
  title?: string
  subtitle?: string
  actions?: ReactNode
  padding?: number
  style?: CSSProperties
}

export function Card({ children, title, subtitle, actions, padding=20, style }: CardProps) {
  return (
    <div style={{ background: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: 14, padding, ...style }}>
      {(title || actions) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 14, gap: 14 }}>
          <div>
            {title && <h3 style={{ fontFamily: tokens.fontDisplay, fontSize: 15, fontWeight: 700, color: tokens.text, margin: 0 }}>{title}</h3>}
            {subtitle && <p style={{ fontSize: 12, color: tokens.textDim, margin: '4px 0 0' }}>{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  )
}

// ═══ BADGE ════════════════════════════════════════════════
interface BadgeProps {
  children: ReactNode
  color?: string
  icon?: string
}

export function Badge({ children, color = tokens.textMuted, icon }: BadgeProps) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
      background: color + '22', color, fontFamily: tokens.fontSans
    }}>
      {icon && <span>{icon}</span>}{children}
    </span>
  )
}

// ═══ INPUT ════════════════════════════════════════════════
interface InputProps {
  value: string | number
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  label?: string
  required?: boolean
  hint?: string
  fullWidth?: boolean
  rows?: number
  options?: Array<{value: string, label: string}>
}

export function Input({ value, onChange, type='text', placeholder, label, required, hint, fullWidth=true, rows, options }: InputProps) {
  const inputStyle: CSSProperties = {
    width: fullWidth ? '100%' : 'auto',
    background: tokens.bg, border: `1px solid ${tokens.border}`, borderRadius: 8,
    padding: '10px 12px', fontSize: 13, color: tokens.text,
    fontFamily: tokens.fontSans, outline: 'none', resize: rows ? 'vertical' as const : undefined
  }
  return (
    <div style={{ width: fullWidth ? '100%' : 'auto' }}>
      {label && (
        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: tokens.textMuted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.06em' }}>
          {label}{required && <span style={{ color: tokens.danger }}> *</span>}
        </label>
      )}
      {options ? (
        <select value={value} onChange={e => onChange(e.target.value)} style={inputStyle}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : rows ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={inputStyle}/>
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle}/>
      )}
      {hint && <div style={{ fontSize: 11, color: tokens.textDim, marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

// ═══ MODAL ════════════════════════════════════════════════
interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  maxWidth?: number
}

export function Modal({ open, onClose, title, subtitle, children, footer, maxWidth=500 }: ModalProps) {
  if (!open) return null
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:20 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#0a1628', border:`1px solid ${tokens.border}`, borderRadius:14, padding:24, maxWidth, width:'100%', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ marginBottom: 18 }}>
          <h3 style={{ fontFamily: tokens.fontDisplay, fontSize: 18, fontWeight: 700, color: tokens.text, margin: '0 0 4px' }}>{title}</h3>
          {subtitle && <p style={{ fontSize: 12, color: tokens.textDim, margin: 0 }}>{subtitle}</p>}
        </div>
        <div>{children}</div>
        {footer && <div style={{ marginTop: 18, display: 'flex', gap: 8 }}>{footer}</div>}
      </div>
    </div>
  )
}

// ═══ KPI CARD ═════════════════════════════════════════════
interface KpiCardProps {
  label: string
  value: string | number
  icon: string
  color?: string
  delta?: { value: string, direction: 'up' | 'down' | 'flat' }
  loading?: boolean
}

export function KpiCard({ label, value, icon, color = tokens.primary, delta, loading }: KpiCardProps) {
  return (
    <Card padding={20}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
        <div style={{ fontSize: 26 }}>{icon}</div>
        {delta && (
          <span style={{ fontSize: 11, fontWeight: 600, color: delta.direction === 'up' ? tokens.success : delta.direction === 'down' ? tokens.danger : tokens.textDim }}>
            {delta.direction === 'up' ? '↑' : delta.direction === 'down' ? '↓' : '→'} {delta.value}
          </span>
        )}
      </div>
      <div style={{ fontFamily: tokens.fontDisplay, fontSize: 26, fontWeight: 700, color, lineHeight: 1.1 }}>
        {loading ? '...' : value}
      </div>
      <div style={{ fontSize: 12, color: tokens.textDim, marginTop: 6 }}>{label}</div>
    </Card>
  )
}

// ═══ TABS ═════════════════════════════════════════════════
interface TabsProps {
  tabs: Array<{ id: string, label: string, icon?: string, count?: number }>
  active: string
  onChange: (id: string) => void
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 24, borderBottom: `1px solid ${tokens.border}`, paddingBottom: 0 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          padding: '10px 16px', border: 'none', background: 'transparent',
          color: active === t.id ? tokens.primary : tokens.textMuted,
          borderBottom: active === t.id ? `2px solid ${tokens.primary}` : '2px solid transparent',
          fontSize: 13, fontWeight: 600, fontFamily: tokens.fontSans, cursor: 'pointer',
          marginBottom: -1, display: 'inline-flex', alignItems: 'center', gap: 8
        }}>
          {t.icon && <span>{t.icon}</span>}<span>{t.label}</span>
          {t.count !== undefined && <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 10, background: active === t.id ? tokens.primary+'22' : tokens.surface, color: active === t.id ? tokens.primary : tokens.textDim }}>{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

// ═══ EMPTY STATE ══════════════════════════════════════════
interface EmptyStateProps {
  icon: string
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card padding={48} style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 14 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: tokens.text, marginBottom: 6 }}>{title}</div>
      {description && <div style={{ fontSize: 13, color: tokens.textDim, marginBottom: action ? 18 : 0 }}>{description}</div>}
      {action}
    </Card>
  )
}

