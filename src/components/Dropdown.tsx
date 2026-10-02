import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { dropIn, springs } from '../lib/theme'

interface DropdownItem {
  label: string
  icon?: React.ReactNode
  danger?: boolean
  separator?: boolean
  active?: boolean
  onClick?: () => void
}

interface DropdownProps {
  trigger: React.ReactNode
  items: DropdownItem[]
  align?: 'left' | 'right'
}

export function Dropdown({ trigger, items, align = 'right' }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div ref={ref} className="relative inline-flex">
      <div onClick={e => { e.stopPropagation(); setOpen(v => !v) }} style={{ display: 'contents' }}>
        {trigger}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            variants={dropIn}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={springs.snappy}
            className={`
              absolute top-full mt-1 z-200 min-w-36 flex flex-col gap-px p-1
              rounded-xl glass-card shadow-2xl
              ${align === 'left' ? 'left-0' : 'right-0'}
            `}
            role="menu"
          >
            {items.map((item, i) => {
              if (item.separator) return <div key={i} className="h-px border-t border-subtle my-1" />
              return (
                <button
                  key={i}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium
                    transition-all duration-150 text-left whitespace-nowrap
                    ${item.danger
                      ? 'text-secondary hover:bg-red-500/10 hover:text-red-400'
                      : item.active
                      ? 'bg-accent-muted text-accent'
                      : 'text-secondary hover:bg-surface-2 hover:text-primary'
                    }
                  `}
                  onClick={() => { setOpen(false); item.onClick?.() }}
                  role="menuitem"
                >
                  {item.icon && <span className="opacity-70">{item.icon}</span>}
                  {item.label}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
