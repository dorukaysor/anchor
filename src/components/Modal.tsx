import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { createPortal } from 'react-dom'
import { springs } from '../lib/theme'

interface ModalProps {
  title: string
  onClose: () => void
  children: React.ReactNode
  wide?: boolean
}

export function Modal({ title, onClose, children, wide }: ModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={springs.gentle}
      ref={backdropRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md"
      onClick={e => { if (e.target === backdropRef.current) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <motion.div
        initial={{ y: 20, scale: 0.95, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 15, scale: 0.95, opacity: 0 }}
        transition={springs.snappy}
        className={`
          glass-overlay rounded-2xl p-6 shadow-2xl flex flex-col gap-4
          w-full ${wide ? 'max-w-lg' : 'max-w-sm'}
        `}
      >
        <h2 id="modal-title" className="text-[15px] font-bold text-primary">{title}</h2>
        {children}
      </motion.div>
    </motion.div>
  )

  return createPortal(content, document.body)
}

/* Reusable sub-components for modal content */
export function ModalField({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={htmlFor} className="text-[10px] font-semibold uppercase tracking-widest text-tertiary">
          {label}
        </label>
      )}
      {children}
    </div>
  )
}

export function ModalInput({ id, value, onChange, onKeyDown, placeholder, autoFocus, type = 'text' }: {
  id?: string; value: string; onChange: (v: string) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  placeholder?: string; autoFocus?: boolean; type?: string
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className="w-full px-3 py-2.5 rounded-lg bg-surface-1 border border-default text-primary text-[13px] font-normal placeholder:text-ghost outline-none focus:border-[var(--accent)] focus:bg-accent-muted transition-all duration-150 font-sans"
    />
  )
}

export function ModalActions({ children }: { children: React.ReactNode }) {
  return <div className="flex justify-end gap-2 pt-1">{children}</div>
}

export function BtnGhost({ onClick, children, id }: { onClick: () => void; children: React.ReactNode; id?: string }) {
  return (
    <button
      id={id}
      onClick={onClick}
      className="px-4 py-2 rounded-lg bg-surface-1 border border-default text-secondary text-[13px] font-semibold hover:bg-surface-2 hover:text-primary transition-all duration-150"
    >
      {children}
    </button>
  )
}

export function BtnPrimary({ onClick, children, id }: { onClick: () => void; children: React.ReactNode; id?: string }) {
  return (
    <button
      id={id}
      onClick={onClick}
      className="px-4 py-2 rounded-lg bg-[var(--accent)] text-primary text-[13px] font-semibold hover:bg-[var(--accent)] transition-all duration-150 shadow-lg"
    >
      {children}
    </button>
  )
}
