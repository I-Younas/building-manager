"use client";

import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { buttonClasses } from "@/components/ui";

export function RichTextEditor({
  name,
  defaultValue,
  onChangeHtml,
}: {
  name: string;
  defaultValue?: string;
  onChangeHtml?: (html: string) => void;
}) {
  const [html, setHtml] = useState(defaultValue ?? "");
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: defaultValue ?? "",
    onUpdate: ({ editor }) => {
      const next = editor.getHTML();
      setHtml(next);
      onChangeHtml?.(next);
    },
    editorProps: {
      attributes: {
        class: "min-h-[150px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none",
      },
    },
  });

  if (!editor) return null;

  return (
    <div>
      <div className="mb-2 flex gap-1">
        <button
          type="button"
          className={buttonClasses(editor.isActive("bold") ? "primary" : "secondary", "sm")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          Bold
        </button>
        <button
          type="button"
          className={buttonClasses(editor.isActive("italic") ? "primary" : "secondary", "sm")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          Italic
        </button>
        <button
          type="button"
          className={buttonClasses(editor.isActive("bulletList") ? "primary" : "secondary", "sm")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          Bullets
        </button>
        <button
          type="button"
          className={buttonClasses(editor.isActive("link") ? "primary" : "secondary", "sm")}
          onClick={() => {
            const url = window.prompt("Link URL");
            if (url) editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
          }}
        >
          Link
        </button>
      </div>
      <EditorContent editor={editor} />
      <input type="hidden" name={name} value={html} />
    </div>
  );
}
