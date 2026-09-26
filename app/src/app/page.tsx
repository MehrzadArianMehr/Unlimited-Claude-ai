'use client'
// Mehrzad ArianMehr©

import { useRef, useEffect } from 'react'
import { Sidebar } from '@/components/chat/sidebar'
import { ChatArea } from '@/components/chat/chat-area'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { PanelRight } from 'lucide-react'
import { useState } from 'react'
import { useChatStore } from '@/lib/chat-store'

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const createChat = useChatStore((s) => s.createChat)

  // Global keyboard shortcuts (Apple-style: ⌘K new chat, ⌘/ focus search)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        void createChat().then((id) => {
          if (id) {
            // focus the message input after creating a chat
            const ta = document.querySelector<HTMLTextAreaElement>(
              'textarea[data-chat-input]'
            )
            ta?.focus()
          }
        })
      } else if (mod && e.key === '/') {
        e.preventDefault()
        searchRef.current?.focus()
        searchRef.current?.select()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [createChat])

  return (
    <div className="flex h-[100dvh] min-h-[100dvh] w-full flex-col bg-background">
      <div className="flex min-h-0 flex-1">
        {/* Main chat area (left) */}
        <ChatArea onOpenSidebar={() => setMobileOpen(true)} />

        {/* Right sidebar (desktop) */}
        <aside className="hidden w-[300px] shrink-0 border-l border-border/40 lg:flex">
          <Sidebar searchRef={searchRef} />
        </aside>
      </div>

      {/* Mobile sidebar trigger (floating button) */}
      <div className="fixed right-3 top-3 z-30 lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              size="icon"
              className="uc-pressable uc-material-strong rounded-full shadow-lg ring-1 ring-black/10 dark:ring-white/10"
            >
              <PanelRight className="h-4 w-4" />
              <span className="sr-only">Open chat list</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] p-0">
            <Sidebar
              searchRef={searchRef}
              onCloseMobile={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
