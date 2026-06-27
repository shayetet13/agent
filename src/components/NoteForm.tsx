"use client";

import { useRef, useTransition } from "react";
import { addNote, deleteNote } from "@/actions/notes";
import { formatDateTime } from "@/lib/format";
import type { Note } from "@/lib/types";

function DeleteNoteButton({ id, dealId }: { id: string; dealId: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("dealId", dealId);
    startTransition(() => deleteNote(fd));
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleClick}
      className="text-xs text-muted hover:text-red-500 disabled:opacity-40 transition-colors"
    >
      {pending ? "…" : "ลบ"}
    </button>
  );
}

export function NotesList({
  notes,
  dealId,
  isBroker = false,
}: {
  notes: Note[];
  dealId: string;
  isBroker?: boolean;
}) {
  if (notes.length === 0) {
    return <p className="text-sm text-muted py-2">ยังไม่มีโน้ต</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {notes.map((note) => (
        <li key={note.id} className="flex items-start gap-2 group">
          <div className="flex-1 bg-slate-50 rounded-lg px-3 py-2">
            <p className="text-sm whitespace-pre-wrap text-foreground">{note.text}</p>
            <p className="text-xs text-muted mt-1">{formatDateTime(note.createdAt)}</p>
          </div>
          {!isBroker && <DeleteNoteButton id={note.id} dealId={dealId} />}
        </li>
      ))}
    </ul>
  );
}

export function NoteForm({ dealId }: { dealId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await addNote(fd);
      formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex gap-2 items-stretch">
      <div className="flex-1">
        <textarea
          name="text"
          required
          rows={2}
          placeholder="เพิ่มโน้ต เช่น 'โทรหาลูกค้าแล้ว รอ approve'..."
          className="w-full h-full px-3 py-2 text-sm border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
        />
        <input type="hidden" name="dealId" value={dealId} />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 px-4 text-sm font-medium rounded-lg bg-accent text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {pending ? "…" : "บันทึก"}
      </button>
    </form>
  );
}
