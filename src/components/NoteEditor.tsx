"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useRef } from "react";

interface Props {
  contentHtml: string;
  onChange: (html: string) => void;
}

const BUTTONS: {
  label: string;
  title: string;
  isActive: (e: NonNullable<ReturnType<typeof useEditor>>) => boolean;
  run: (e: NonNullable<ReturnType<typeof useEditor>>) => void;
  className?: string;
}[] = [
  {
    label: "B",
    title: "Grassetto",
    isActive: (e) => e.isActive("bold"),
    run: (e) => e.chain().focus().toggleBold().run(),
    className: "font-bold",
  },
  {
    label: "I",
    title: "Corsivo",
    isActive: (e) => e.isActive("italic"),
    run: (e) => e.chain().focus().toggleItalic().run(),
    className: "italic",
  },
  {
    label: "S",
    title: "Barrato",
    isActive: (e) => e.isActive("strike"),
    run: (e) => e.chain().focus().toggleStrike().run(),
    className: "line-through",
  },
  {
    label: "H1",
    title: "Titolo 1",
    isActive: (e) => e.isActive("heading", { level: 1 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    label: "H2",
    title: "Titolo 2",
    isActive: (e) => e.isActive("heading", { level: 2 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    label: "H3",
    title: "Titolo 3",
    isActive: (e) => e.isActive("heading", { level: 3 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    label: "•",
    title: "Elenco puntato",
    isActive: (e) => e.isActive("bulletList"),
    run: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    label: "1.",
    title: "Elenco numerato",
    isActive: (e) => e.isActive("orderedList"),
    run: (e) => e.chain().focus().toggleOrderedList().run(),
  },
  {
    label: "“",
    title: "Citazione",
    isActive: (e) => e.isActive("blockquote"),
    run: (e) => e.chain().focus().toggleBlockquote().run(),
  },
  {
    label: "</>",
    title: "Codice",
    isActive: (e) => e.isActive("codeBlock"),
    run: (e) => e.chain().focus().toggleCodeBlock().run(),
  },
];

/** Editor rich-text della nota (Tiptap) con la toolbar delle schermate. */
export function NoteEditor({ contentHtml, onChange }: Props) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Scrivi o rielabora la tua nota…" }),
    ],
    content: contentHtml,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "tiptap note-prose" },
    },
    onUpdate: ({ editor }) => onChangeRef.current(editor.getHTML()),
  });

  // Aggiorna il contenuto se cambia dall'esterno (es. dopo trascrizione).
  useEffect(() => {
    if (editor && contentHtml !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(contentHtml);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentHtml, editor]);

  if (!editor) return <div className="min-h-[180px]" />;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-1 border-b border-ink/15 pb-3">
        {BUTTONS.map((b, i) => (
          <button
            key={b.title}
            type="button"
            title={b.title}
            onClick={() => b.run(editor)}
            className={`min-w-9 rounded px-2 py-1.5 text-sm transition-colors hover:bg-ink/10 ${
              b.isActive(editor) ? "bg-ink text-paper hover:bg-ink" : ""
            } ${b.className ?? ""} ${i === 3 || i === 6 ? "ml-3" : ""}`}
          >
            {b.label}
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
