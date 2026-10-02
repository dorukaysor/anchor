import { useState, type KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { usePage, useAnchorStore, useActiveTodos } from '../Store'
import { Modal, ModalField, ModalInput, ModalActions, BtnGhost, BtnPrimary } from './Modal'
import { SettingsPanel } from './SettingsPanel'
import { IconPlus, IconTrash, IconRestore, IconSettings, IconCheck, IconX, IconChevronDown } from './icons'
import { springs } from '../lib/theme'

export function Sidebar() {
  const { pages, activePageId, setActivePage, addPage, renamePage, deletePage } = usePage()
  const todos       = useActiveTodos()
  const addTodo     = useAnchorStore(s => s.addTodo)
  const toggleTodo  = useAnchorStore(s => s.toggleTodo)
  const deleteTodo  = useAnchorStore(s => s.deleteTodo)
  const trash           = useAnchorStore(s => s.trash)
  const restoreLatest   = useAnchorStore(s => s.restoreLatest)
  const emptyTrash      = useAnchorStore(s => s.emptyTrash)

  const [addPageOpen, setAddPageOpen]     = useState(false)
  const [renameTarget, setRenameTarget]   = useState<string | null>(null)
  const [pageInput, setPageInput]         = useState('')
  const [todoText, setTodoText]           = useState('')
  const [settingsOpen, setSettingsOpen]   = useState(false)

  const sortedPages = [...pages].sort((a, b) => a.order - b.order)
  const pendingTodos = todos.filter(t => !t.done).sort((a, b) => a.order - b.order)
  const doneTodos    = todos.filter(t => t.done).sort((a, b) => a.order - b.order)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  function handlePageDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIdx = sortedPages.findIndex(p => p.id === active.id)
    const newIdx = sortedPages.findIndex(p => p.id === over.id)
    const newOrder = arrayMove(sortedPages, oldIdx, newIdx)
    useAnchorStore.getState().reorderPages(newOrder.map(p => p.id))
  }

  function handleTodoDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIdx = pendingTodos.findIndex(t => t.id === active.id)
    const newIdx = pendingTodos.findIndex(t => t.id === over.id)
    if (oldIdx !== -1 && newIdx !== -1) {
      const newOrder = arrayMove(pendingTodos, oldIdx, newIdx)
      useAnchorStore.getState().reorderTodos(activePageId, newOrder.map(t => t.id))
    }
  }

  function submitTodo() {
    if (todoText.trim()) { addTodo(todoText.trim()); setTodoText('') }
  }
  function onTodoKey(e: KeyboardEvent<HTMLInputElement>) { if (e.key === 'Enter') submitTodo() }

  return (
    <>
      <aside className="glass-surface w-65 min-w-60 h-full flex flex-col py-5 px-3.5 gap-0 overflow-hidden rounded-xl">

        {/* Brand */}
        <div className="px-2 pb-5">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-white/50 mb-1">Your homepage</p>
          <h1 className="text-[22px] font-extrabold tracking-tight text-white leading-none">Anchor</h1>
        </div>

        {/* Pages */}
        <p 
          className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/50 px-2 pb-2 cursor-pointer flex justify-between items-center group/section hover:text-white/80 transition-colors"
          onClick={() => useAnchorStore.getState().toggleSection('pages')}
        >
          Pages
          <motion.span
            animate={{ rotate: useAnchorStore(s => s.collapsedSections['pages']) ? 180 : 0 }}
            transition={springs.snappy}
            className="text-white/50 group-hover/section:text-white/80"
          >
            <IconChevronDown size={14} />
          </motion.span>
        </p>

        <AnimatePresence initial={false}>
          {!useAnchorStore(s => s.collapsedSections['pages']) && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={springs.snappy}
              className="flex flex-col gap-1 mb-3 overflow-hidden"
            >
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handlePageDragEnd}>
                <SortableContext items={sortedPages.map(p => p.id)} strategy={verticalListSortingStrategy}>
                  {sortedPages.map(page => (
                    <SortablePage
                      key={page.id}
                      page={page}
                      activePageId={activePageId}
                      setActivePage={setActivePage}
                      setRenameTarget={setRenameTarget}
                      setPageInput={setPageInput}
                      deletePage={deletePage}
                      pagesLength={pages.length}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          id="add-page-btn"
          className="flex items-center justify-center gap-1.5 w-full py-2 mb-4 rounded-xl border border-dashed border-white/15 text-white/55 text-[12.5px] font-medium hover:border-white/35 hover:text-white hover:bg-white/[0.04] transition-all duration-150 cursor-pointer"
          onClick={() => { setPageInput(''); setAddPageOpen(true) }}
        >
          <IconPlus size={14} /> New page
        </button>

        {/* Divider */}
        <div className="h-px bg-white/[0.07] mb-4" />

        {/* To-Do */}
        <p 
          className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/50 px-2 pb-2 mt-6 cursor-pointer flex justify-between items-center group/section hover:text-white/80 transition-colors"
          onClick={() => useAnchorStore.getState().toggleSection('todos')}
        >
          To Do
          <motion.span
            animate={{ rotate: useAnchorStore(s => s.collapsedSections['todos']) ? 180 : 0 }}
            transition={springs.snappy}
            className="text-white/50 group-hover/section:text-white/80"
          >
            <IconChevronDown size={14} />
          </motion.span>
        </p>

        <AnimatePresence initial={false}>
          {!useAnchorStore(s => s.collapsedSections['todos']) && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={springs.snappy}
              className="flex-1 flex flex-col min-h-0 overflow-hidden"
            >
              {/* Add todo */}
              <div className="flex gap-1.5 mb-3">
                <input
                  id="todo-input"
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-surface-1 border border-default text-primary text-[12.5px] placeholder:text-ghost outline-none focus:border-[var(--accent)] focus:bg-accent-muted transition-all duration-150 font-sans"
                  placeholder="Add task…"
                  value={todoText}
                  onChange={e => setTodoText(e.target.value)}
                  onKeyDown={onTodoKey}
                />
                <button
                  className="px-2.5 py-1.5 rounded-md bg-surface-1 border border-default text-secondary text-[12px] font-semibold hover:bg-[var(--accent)] hover:border-[var(--accent)] hover:text-primary transition-all duration-150 cursor-pointer"
                  onClick={submitTodo}
                >
                  Add
                </button>
              </div>

              {/* Todo list */}
              <div className="flex-1 overflow-y-auto flex flex-col gap-px min-h-0 relative">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleTodoDragEnd}>
                  <SortableContext items={[...pendingTodos, ...doneTodos].map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {[...pendingTodos, ...doneTodos].map(todo => (
                      <SortableTodo
                        key={todo.id}
                        todo={todo}
                        toggleTodo={toggleTodo}
                        deleteTodo={deleteTodo}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
                {todos.length === 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[12px] text-ghost px-1.5 py-1 italic absolute top-0"
                  >
                    No tasks yet.
                  </motion.p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trash controls */}
        {trash.length > 0 && (
          <div className="flex gap-1.5 pt-3 mt-2 border-t border-subtle">
            <button
              id="restore-btn"
              className="flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-default text-tertiary text-[11px] font-semibold hover:bg-surface-1 hover:text-secondary transition-all duration-150 cursor-pointer"
              onClick={restoreLatest}
            >
              <IconRestore size={12} /> Restore ({trash.length})
            </button>
            <button
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-default text-tertiary text-[11px] font-semibold hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all duration-150 cursor-pointer"
              onClick={emptyTrash}
            >
              <IconTrash size={12} /> Clear
            </button>
          </div>
        )}
      </aside>

      {/* Floating Settings FAB */}
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        transition={springs.bouncy}
        id="open-settings-btn"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full glass-overlay text-secondary text-[13px] font-semibold shadow-xl hover:shadow-[var(--shadow-glow)] hover:text-primary hover:bg-surface-2 transition-all duration-200 cursor-pointer"
        onClick={() => setSettingsOpen(true)}
        aria-label="Open settings"
      >
        <IconSettings size={14} /> Settings
      </motion.button>

      {/* Modals */}
      <AnimatePresence>
        {addPageOpen && (
          <Modal title="New Page" onClose={() => setAddPageOpen(false)}>
            <ModalField label="Page name" htmlFor="new-page-name">
              <ModalInput id="new-page-name" value={pageInput} onChange={setPageInput}
                onKeyDown={e => { if (e.key === 'Enter') { if (pageInput.trim()) addPage(pageInput); setAddPageOpen(false) } }}
                placeholder="e.g. Work, Research…" autoFocus />
            </ModalField>
            <ModalActions>
              <BtnGhost onClick={() => setAddPageOpen(false)}>Cancel</BtnGhost>
              <BtnPrimary onClick={() => { if (pageInput.trim()) addPage(pageInput); setAddPageOpen(false) }}>Create</BtnPrimary>
            </ModalActions>
          </Modal>
        )}

        {renameTarget && (
          <Modal title="Rename Page" onClose={() => setRenameTarget(null)}>
            <ModalField label="New name" htmlFor="rename-page-name">
              <ModalInput id="rename-page-name" value={pageInput} onChange={setPageInput}
                onKeyDown={e => { if (e.key === 'Enter') { renamePage(renameTarget, pageInput); setRenameTarget(null) } }}
                autoFocus />
            </ModalField>
            <ModalActions>
              <BtnGhost onClick={() => setRenameTarget(null)}>Cancel</BtnGhost>
              <BtnPrimary onClick={() => { renamePage(renameTarget, pageInput); setRenameTarget(null) }}>Rename</BtnPrimary>
            </ModalActions>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
      </AnimatePresence>
    </>
  )
}

// ── Sortable wrappers ──

function SortablePage({ page, activePageId, setActivePage, setRenameTarget, setPageInput, deletePage, pagesLength }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id })
  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.3 : 1,
  }
  const isActive = activePageId === page.id

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="group relative flex items-center cursor-grab active:cursor-grabbing">
      <button
        id={`page-btn-${page.id}`}
        className={`
          flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-[13.5px] text-left
          transition-colors duration-150 cursor-pointer
          ${isActive
            ? 'bg-white/[0.13] text-white font-semibold shadow-sm border border-white/12'
            : 'text-white/60 hover:bg-white/[0.05] hover:text-white/95 border border-transparent'
          }
        `}
        onClick={() => setActivePage(page.id)}
        onDoubleClick={() => { setRenameTarget(page.id); setPageInput(page.name) }}
        title="Double-click to rename"
      >
        {isActive && (
          <div
            className="w-1.5 h-1.5 rounded-full shrink-0 bg-[var(--accent)] shadow-xs"
          />
        )}
        <span className="truncate">{page.name}</span>
      </button>
      {pagesLength > 1 && (
        <button
          className="opacity-0 group-hover:opacity-100 absolute right-1.5 w-6 h-6 flex items-center justify-center rounded-lg text-white/40 hover:bg-red-500/15 hover:text-red-400 transition-colors duration-150 cursor-pointer"
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); deletePage(page.id) }}
          aria-label={`Delete ${page.name}`}
        >
          <IconTrash size={13} />
        </button>
      )}
    </div>
  )
}

function SortableTodo({ todo, toggleTodo, deleteTodo }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: todo.id })
  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.3 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="group flex items-start gap-2 px-1.5 py-1.5 rounded-lg hover:bg-white/[0.05] transition-colors duration-150 cursor-grab active:cursor-grabbing">
      <button
        className={`
          mt-[2px] w-4 h-4 rounded flex-shrink-0 flex items-center justify-center
          border transition-colors duration-150 cursor-pointer
          ${todo.done ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-white/30 hover:border-white/60'}
        `}
        onPointerDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); toggleTodo(todo.id) }}
        aria-label={todo.done ? `Uncheck: ${todo.text}` : `Check: ${todo.text}`}
      >
        {todo.done && (
          <IconCheck size={11} className="text-white" />
        )}
      </button>
      <span className={`flex-1 text-[12.5px] leading-[1.4] break-words ${todo.done ? 'line-through text-white/35' : 'text-white/90'}`}>
        {todo.text}
      </span>
      <button
        className="opacity-0 group-hover:opacity-100 w-4 h-4 mt-[2px] flex items-center justify-center text-white/30 hover:text-red-400 transition-all duration-150 flex-shrink-0 cursor-pointer"
        onPointerDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); deleteTodo(todo.id) }}
        aria-label={`Delete: ${todo.text}`}
      >
        <IconX size={12} />
      </button>
    </div>
  )
}
