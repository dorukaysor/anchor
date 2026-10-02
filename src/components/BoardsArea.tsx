import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { useActivePageBoards, useAnchorStore } from '../Store';
import type { Board, LinkItem } from '../Schema';
import {
  Modal,
  ModalField,
  ModalInput,
  ModalActions,
  BtnGhost,
  BtnPrimary,
} from './Modal';
import { SearchBar } from './SearchBar';
import { IconPlus, IconPencil, IconTrash, IconEmptyBoards } from './icons';
import { staggerContainer, staggerItem } from '../lib/theme';

/* ── Favicon ── */
function faviconUrl(url: string) {
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`;
  } catch {
    return '';
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   BoardsArea
══════════════════════════════════════════════════════════════════════════════ */
export function BoardsArea() {
  const boards = useActivePageBoards();
  const addBoard = useAnchorStore((s) => s.addBoard);
  const reorderLinks = useAnchorStore((s) => s.reorderLinks);
  const moveLinkToBoard = useAnchorStore((s) => s.moveLinkToBoard);
  const reorderBoards = useAnchorStore((s) => s.reorderBoards);
  const activePageId = useAnchorStore((s) => s.activePageId);
  const bookmarkDisplay = useAnchorStore((s) => s.bookmarkDisplay);

  const [addBoardOpen, setAddBoardOpen] = useState(false);
  const [addBoardInput, setAddBoardInput] = useState('');
  const [activeLink, setActiveLink] = useState<
    (LinkItem & { boardId: string }) | null
  >(null);
  const [activeBoard, setActiveBoard] = useState<Board | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function onDragStart(e: DragStartEvent) {
    const d = e.active.data.current as any;
    if (d?.type === 'board') {
      setActiveBoard(d.board);
    } else if (d?.link) {
      setActiveLink({ ...d.link, boardId: d.boardId! });
    }
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveLink(null);
    setActiveBoard(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ad = active.data.current as any;
    const od = over.data.current as any;

    if (ad?.type === 'board' && od?.type === 'board') {
      const oIdx = boards.findIndex((b) => b.id === active.id);
      const nIdx = boards.findIndex((b) => b.id === over.id);
      if (oIdx !== -1 && nIdx !== -1) {
        const arr = [...boards];
        const [m] = arr.splice(oIdx, 1);
        arr.splice(nIdx, 0, m);
        reorderBoards(
          activePageId,
          arr.map((b) => b.id),
        );
      }
      return;
    }

    if (!ad?.link) return;
    const fromBoardId = ad.boardId!;
    if (od?.link) {
      const toBoardId = od.boardId!;
      if (fromBoardId === toBoardId) {
        const board = boards.find((b) => b.id === fromBoardId)!;
        const sorted = [...board.links].sort((a, b) => a.order - b.order);
        const oIdx = sorted.findIndex((l) => l.id === active.id);
        const nIdx = sorted.findIndex((l) => l.id === over.id);
        if (oIdx !== -1 && nIdx !== -1) {
          const arr = [...sorted];
          const [m] = arr.splice(oIdx, 1);
          arr.splice(nIdx, 0, m);
          reorderLinks(
            fromBoardId,
            arr.map((l) => l.id),
          );
        }
      } else {
        moveLinkToBoard(
          fromBoardId,
          toBoardId,
          active.id as string,
          over.id as string,
        );
      }
    } else if (od?.type === 'board') {
      const toBoardId = od.board.id;
      if (fromBoardId !== toBoardId) {
        moveLinkToBoard(fromBoardId, toBoardId, active.id as string);
      }
    }
  }

  function openAdd() {
    setAddBoardInput('');
    setAddBoardOpen(true);
  }
  function commitAdd() {
    if (addBoardInput.trim()) addBoard(addBoardInput.trim());
    setAddBoardOpen(false);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <SearchBar onAddBoard={openAdd} />

      <motion.div
        id='boards-area'
        className='flex-1 overflow-auto p-5 pt-4 flex flex-wrap content-start gap-4'
        variants={staggerContainer}
        initial='hidden'
        animate='show'
      >
        <SortableContext
          items={boards.map((b) => b.id)}
          strategy={rectSortingStrategy}
        >
          {boards.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              bookmarkDisplay={bookmarkDisplay}
            />
          ))}
        </SortableContext>

        {boards.length === 0 && (
          <div className='flex-1 flex flex-col items-center justify-center gap-3 text-ghost min-h-50'>
            <IconEmptyBoards />
            <p className='text-[14px]'>
              Click <span className='font-semibold text-tertiary'>+ Board</span>{' '}
              to get started
            </p>
          </div>
        )}
      </motion.div>

      <DragOverlay>
        {activeBoard ?
          <div style={{ opacity: 0.8 }}>
            <BoardCard
              key={activeBoard.id}
              board={activeBoard}
              bookmarkDisplay={bookmarkDisplay}
            />
          </div>
        : activeLink ?
          <LinkRow
            link={activeLink}
            boardId={activeLink.boardId}
            bookmarkDisplay={bookmarkDisplay}
            overlay
          />
        : null}
      </DragOverlay>

      {addBoardOpen && (
        <Modal title='New Board' onClose={() => setAddBoardOpen(false)}>
          <ModalField label='Board name' htmlFor='new-board-name'>
            <ModalInput
              id='new-board-name'
              value={addBoardInput}
              onChange={setAddBoardInput}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitAdd();
              }}
              placeholder='e.g. Research, GitHub…'
              autoFocus
            />
          </ModalField>
          <ModalActions>
            <BtnGhost onClick={() => setAddBoardOpen(false)}>Cancel</BtnGhost>
            <BtnPrimary onClick={commitAdd}>Create</BtnPrimary>
          </ModalActions>
        </Modal>
      )}
    </DndContext>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   BoardCard
══════════════════════════════════════════════════════════════════════════════ */
interface BoardCardProps {
  board: Board;
  bookmarkDisplay: 'title-url' | 'title-only';
}

function BoardCard({ board, bookmarkDisplay }: BoardCardProps) {
  const renameBoard = useAnchorStore((s) => s.renameBoard);
  const deleteBoard = useAnchorStore((s) => s.deleteBoard);
  const addLink = useAnchorStore((s) => s.addLink);

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameInput, setRenameInput] = useState(board.title);
  const [addLinkOpen, setAddLinkOpen] = useState(false);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const sorted = [...board.links].sort((a, b) => a.order - b.order);
  const linkIds = sorted.map((l) => l.id);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: board.id,
    data: { type: 'board', board },
  });

  function submitLink() {
    if (!linkTitle.trim() || !linkUrl.trim()) return;
    const url =
      linkUrl.startsWith('http') ? linkUrl.trim() : `https://${linkUrl.trim()}`;
    addLink(board.id, linkTitle.trim(), url);
    setLinkTitle('');
    setLinkUrl('');
    setAddLinkOpen(false);
  }

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      variants={staggerItem}
      id={`board-${board.id}`}
      className='group w-68 shrink-0 flex flex-col rounded-2xl glass-card hover:border-emphasis hover:shadow-lg transition-[border-color,box-shadow] duration-150'
    >
      {/* Header */}
      <div
        className='flex items-center justify-between px-4 pt-3.5 pb-2 cursor-grab active:cursor-grabbing'
        {...attributes}
        {...listeners}
      >
        <span className='text-[11px] font-bold tracking-[0.09em] uppercase text-tertiary'>
          {board.title}
        </span>
        <div
          className='flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150'
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            className='w-6 h-6 flex items-center justify-center rounded-md text-tertiary hover:bg-surface-1 hover:text-secondary transition-all duration-150 cursor-pointer'
            onClick={(e) => {
              e.stopPropagation();
              setRenameInput(board.title);
              setRenameOpen(true);
            }}
            title='Rename board'
          >
            <IconPencil />
          </button>
          <button
            className='w-6 h-6 flex items-center justify-center rounded-md text-tertiary hover:bg-surface-1 hover:text-secondary transition-all duration-150 cursor-pointer'
            onClick={(e) => {
              e.stopPropagation();
              setLinkTitle('');
              setLinkUrl('');
              setAddLinkOpen(true);
            }}
            title='Add link'
          >
            <IconPlus />
          </button>
          <button
            className='w-6 h-6 flex items-center justify-center rounded-md text-tertiary hover:bg-red-500/10 hover:text-red-400 transition-all duration-150 cursor-pointer'
            onClick={(e) => {
              e.stopPropagation();
              deleteBoard(board.id);
            }}
            title='Delete board'
          >
            <IconTrash />
          </button>
        </div>
      </div>

      {/* Links */}
      <SortableContext items={linkIds} strategy={verticalListSortingStrategy}>
        <div
          className='flex flex-col px-2 pb-3 gap-px min-h-11'
          id={`board-links-${board.id}`}
        >
          {sorted.map((link) => (
            <LinkRow
              key={link.id}
              link={link}
              boardId={board.id}
              bookmarkDisplay={bookmarkDisplay}
            />
          ))}
          {sorted.length === 0 && (
            <span className='px-2 py-3 text-[12px] italic text-ghost'>
              Drop links here
            </span>
          )}
        </div>
      </SortableContext>

      {/* Rename modal */}
      {renameOpen && (
        <Modal title='Rename Board' onClose={() => setRenameOpen(false)}>
          <ModalField label='Board name' htmlFor='rename-board-input'>
            <ModalInput
              id='rename-board-input'
              value={renameInput}
              onChange={setRenameInput}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  renameBoard(board.id, renameInput);
                  setRenameOpen(false);
                }
              }}
              autoFocus
            />
          </ModalField>
          <ModalActions>
            <BtnGhost onClick={() => setRenameOpen(false)}>Cancel</BtnGhost>
            <BtnPrimary
              onClick={() => {
                renameBoard(board.id, renameInput);
                setRenameOpen(false);
              }}
            >
              Rename
            </BtnPrimary>
          </ModalActions>
        </Modal>
      )}

      {/* Add link modal */}
      {addLinkOpen && (
        <Modal title='Add Link' onClose={() => setAddLinkOpen(false)}>
          <ModalField label='Title' htmlFor='new-link-title'>
            <ModalInput
              id='new-link-title'
              value={linkTitle}
              onChange={setLinkTitle}
              placeholder='e.g. GitHub'
              autoFocus
            />
          </ModalField>
          <ModalField label='URL' htmlFor='new-link-url'>
            <ModalInput
              id='new-link-url'
              value={linkUrl}
              onChange={setLinkUrl}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitLink();
              }}
              placeholder='https://…'
            />
          </ModalField>
          <ModalActions>
            <BtnGhost onClick={() => setAddLinkOpen(false)}>Cancel</BtnGhost>
            <BtnPrimary onClick={submitLink}>Add</BtnPrimary>
          </ModalActions>
        </Modal>
      )}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   LinkRow (sortable)
══════════════════════════════════════════════════════════════════════════════ */
interface LinkRowProps {
  link: LinkItem;
  boardId: string;
  bookmarkDisplay: 'title-url' | 'title-only';
  overlay?: boolean;
}

function LinkRow({ link, boardId, bookmarkDisplay, overlay }: LinkRowProps) {
  const editLink = useAnchorStore((s) => s.editLink);
  const deleteLink = useAnchorStore((s) => s.deleteLink);

  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(link.title);
  const [editUrl, setEditUrl] = useState(link.url);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: link.id,
    data: { link, boardId },
  });

  const fav = faviconUrl(link.url);
  const displayUrl = link.url.replace(/^https?:\/\//, '').replace(/\/$/, '');

  function submitEdit() {
    if (!editTitle.trim() || !editUrl.trim()) return;
    const url =
      editUrl.startsWith('http') ? editUrl.trim() : `https://${editUrl.trim()}`;
    editLink(boardId, link.id, editTitle.trim(), url);
    setEditOpen(false);
  }

  return (
    <>
      <a
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition: isDragging ? 'none' : transition,
          opacity: isDragging && !overlay ? 0.25 : 1,
        }}
        {...attributes}
        {...listeners}
        className='group/link flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-surface-1 transition-colors duration-150 cursor-pointer'
        href={link.url}
        id={`link-${link.id}`}
        onClick={(e) => {
          if (isDragging) e.preventDefault();
        }}
      >
        {fav ?
          <img
            src={fav}
            alt=''
            className='w-4 h-4 rounded-full flex-shrink-0 bg-surface-2 object-contain'
            aria-hidden='true'
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        : <div className='w-4 h-4 rounded-full bg-surface-2 flex-shrink-0' />}

        <div className='flex-1 min-w-0'>
          <p className='text-[13px] font-medium text-secondary truncate group-hover/link:text-primary transition-colors'>
            {link.title}
          </p>
          {bookmarkDisplay === 'title-url' && (
            <p className='text-[11px] text-ghost truncate mt-px'>
              {displayUrl}
            </p>
          )}
        </div>

        {!overlay && (
          <div className='flex gap-1 opacity-0 group-hover/link:opacity-100 transition-opacity duration-150'>
            <button
              className='w-5 h-5 flex items-center justify-center rounded text-tertiary hover:bg-surface-2 hover:text-secondary transition-all duration-150 cursor-pointer'
              title='Edit'
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setEditTitle(link.title);
                setEditUrl(link.url);
                setEditOpen(true);
              }}
            >
              <IconPencil />
            </button>
            <button
              className='w-5 h-5 flex items-center justify-center rounded text-tertiary hover:bg-red-500/10 hover:text-red-400 transition-all duration-150 cursor-pointer'
              title='Delete'
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                deleteLink(boardId, link.id);
              }}
            >
              <IconTrash />
            </button>
          </div>
        )}
      </a>

      {editOpen && (
        <Modal title='Edit Link' onClose={() => setEditOpen(false)}>
          <ModalField label='Title' htmlFor='edit-link-title'>
            <ModalInput
              id='edit-link-title'
              value={editTitle}
              onChange={setEditTitle}
              autoFocus
            />
          </ModalField>
          <ModalField label='URL' htmlFor='edit-link-url'>
            <ModalInput
              id='edit-link-url'
              value={editUrl}
              onChange={setEditUrl}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitEdit();
              }}
            />
          </ModalField>
          <ModalActions>
            <BtnGhost onClick={() => setEditOpen(false)}>Cancel</BtnGhost>
            <BtnPrimary onClick={submitEdit}>Save</BtnPrimary>
          </ModalActions>
        </Modal>
      )}
    </>
  );
}
