// Mehrzad ArianMehr©
// Top header: flame logo + brand (left); credits + Your account / Connect Wallet (right).

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, ChevronDown, Copy, Check, Wallet, LogOut, User, BarChart3, BadgeCheck } from 'lucide-react'
import { useApp } from '@/lib/store'
import { popover } from '@/lib/motion'
import { cn } from '@/lib/utils'

export function AppHeader() {
  const { connected, address, credits } = useApp((s) => s.wallet)
  const setConnectModal = useApp((s) => s.setConnectModal)
  const disconnect = useApp((s) => s.disconnect)
  const setPage = useApp((s) => s.setPage)
  const [menuOpen, setMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  function copyAddr() {
    if (!address) return
    navigator.clipboard.writeText(address).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 px-5">
      {/* brand */}
      <div className="flex items-center gap-2">
        <div className="uc-iridescent flex h-7 w-7 items-center justify-center rounded-[9px] shadow-[0_4px_14px_-2px_rgba(245,158,11,0.5)]">
          <Flame className="h-4 w-4 text-white" />
        </div>
        <span className="text-[15px] font-semibold tracking-tight">LeonAI</span>
      </div>

      {/* right side */}
      <div className="flex items-center gap-2.5">
        {connected ? (
          <>
            <div className="hidden text-right sm:block">
              <div className="text-[13px] font-medium leading-tight">
                {credits.toLocaleString()} Credits used
              </div>
            </div>
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="uc-pressable uc-focus inline-flex h-8 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 text-[13px] font-medium"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500">
                  <User className="h-3 w-3 text-white" />
                </span>
                Your account
                <ChevronDown className={cn('h-3.5 w-3.5 transition', menuOpen && 'rotate-180')} />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                    <motion.div
                      variants={popover}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      className="uc-glass-strong absolute right-0 top-11 z-40 w-60 overflow-hidden rounded-2xl p-1.5"
                    >
                      <MenuItem
                        icon={<Wallet className="h-4 w-4" />}
                        title="Main wallet"
                        sub={address ?? ''}
                        onClick={copyAddr}
                        trailing={
                          copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-white/40" />
                        }
                      />
                      <MenuItem
                        icon={<User className="h-4 w-4" />}
                        title="Portfolio"
                        onClick={() => { setPage('account'); setMenuOpen(false) }}
                      />
                      <MenuItem
                        icon={<BarChart3 className="h-4 w-4" />}
                        title="Earnings"
                        onClick={() => { setPage('staking'); setMenuOpen(false) }}
                      />
                      <div className="my-1 h-px bg-white/8" />
                      <MenuItem
                        icon={<LogOut className="h-4 w-4" />}
                        title="Disconnect"
                        danger
                        onClick={() => { disconnect(); setMenuOpen(false) }}
                      />
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <button
            onClick={() => setConnectModal(true)}
            className="uc-pressable uc-focus inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-semibold text-black"
          >
            <Wallet className="h-3.5 w-3.5" />
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  )
}

function MenuItem({
  icon,
  title,
  sub,
  trailing,
  danger,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  sub?: string
  trailing?: React.ReactNode
  danger?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition hover:bg-white/8',
        danger ? 'text-red-400' : 'text-white/90'
      )}
    >
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium leading-tight">{title}</span>
        {sub && <span className="block truncate text-[11px] text-white/40">{sub}</span>}
      </span>
      {trailing}
    </button>
  )
}
