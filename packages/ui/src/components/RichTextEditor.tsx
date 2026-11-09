import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import DOMPurify from 'dompurify';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Unlink,
  Undo,
  Redo,
} from 'lucide-react';
import { cn } from '@abrainoconscious/shared';

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Sanitizes rich text HTML with DOMPurify.
 * Strips script tags, evil event attributes (onerror, onload, onclick, javascript:),
 * and only permits safe YouTube/Vimeo iframes.
 */
export function sanitizeRichText(html: string): string {
  if (!html) return '';

  // Detect DOMPurify in browser and ESM/CJS environments
  const purify =
    typeof (DOMPurify as any)?.sanitize === 'function'
      ? DOMPurify
      : typeof (DOMPurify as any)?.default?.sanitize === 'function'
      ? (DOMPurify as any).default
      : null;

  let sanitized = html;

  if (purify && typeof window !== 'undefined' && typeof window.DOMParser !== 'undefined') {
    sanitized = purify.sanitize(html, {
      ALLOWED_TAGS: [
        'p',
        'b',
        'i',
        'em',
        'strong',
        'h2',
        'h3',
        'ul',
        'ol',
        'li',
        'blockquote',
        'a',
        'br',
        'iframe',
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'src', 'allow', 'allowfullscreen', 'frameborder'],
    });
  } else {
    // Robust Node / Vitest SSR fallback
    sanitized = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/\s*on\w+=(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
      .replace(/href=["']?\s*javascript:[^"'>]*["']?/gi, 'href="#"');
  }

  // Filter iframes: only allow YouTube or Vimeo embeds
  return sanitized.replace(/<iframe\b[^>]*>(.*?)<\/iframe>/gi, (match) => {
    const isYouTube =
      match.includes('src="https://www.youtube.com/') ||
      match.includes('src="https://www.youtube-nocookie.com/');
    const isVimeo = match.includes('src="https://player.vimeo.com/');
    return isYouTube || isVimeo ? match : '';
  });
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write full description, syllabus outline, key takeaways...',
  className,
  disabled = false,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
        link: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-amber-400 underline hover:text-amber-300 transition-colors',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
    ],
    content: value || '',
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const rawHtml = editor.getHTML();
      const cleanHtml = sanitizeRichText(rawHtml);
      onChange(cleanHtml);
    },
  });

  // Sync external value changes if needed (e.g. form reset or initial load)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div className="rounded-xl border border-[#1A373E] bg-[#040C0E] p-4 text-xs text-[#8D9FA4] animate-pulse">
        Loading editor...
      </div>
    );
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter link URL (e.g. https://...):', previousUrl);

    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div
      className={cn(
        'rounded-xl border border-[#1A373E] bg-[#040C0E] overflow-hidden focus-within:border-amber-500/50 transition-colors',
        className
      )}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-[#1A373E] bg-[#081619] px-3 py-2 text-[#8D9FA4]">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(
            'rounded p-1.5 hover:bg-[#0E2024] hover:text-white transition-colors',
            editor.isActive('heading', { level: 2 }) && 'bg-[#0E2024] text-amber-400 font-bold'
          )}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={cn(
            'rounded p-1.5 hover:bg-[#0E2024] hover:text-white transition-colors',
            editor.isActive('heading', { level: 3 }) && 'bg-[#0E2024] text-amber-400 font-bold'
          )}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </button>

        <div className="mx-1 h-4 w-[1px] bg-[#1A373E]" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            'rounded p-1.5 hover:bg-[#0E2024] hover:text-white transition-colors',
            editor.isActive('bold') && 'bg-[#0E2024] text-amber-400 font-bold'
          )}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            'rounded p-1.5 hover:bg-[#0E2024] hover:text-white transition-colors',
            editor.isActive('italic') && 'bg-[#0E2024] text-amber-400 font-bold'
          )}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>

        <div className="mx-1 h-4 w-[1px] bg-[#1A373E]" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            'rounded p-1.5 hover:bg-[#0E2024] hover:text-white transition-colors',
            editor.isActive('bulletList') && 'bg-[#0E2024] text-amber-400'
          )}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            'rounded p-1.5 hover:bg-[#0E2024] hover:text-white transition-colors',
            editor.isActive('orderedList') && 'bg-[#0E2024] text-amber-400'
          )}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn(
            'rounded p-1.5 hover:bg-[#0E2024] hover:text-white transition-colors',
            editor.isActive('blockquote') && 'bg-[#0E2024] text-amber-400'
          )}
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </button>

        <div className="mx-1 h-4 w-[1px] bg-[#1A373E]" />

        <button
          type="button"
          onClick={setLink}
          className={cn(
            'rounded p-1.5 hover:bg-[#0E2024] hover:text-white transition-colors',
            editor.isActive('link') && 'bg-[#0E2024] text-amber-400'
          )}
          title="Insert Link"
        >
          <LinkIcon className="h-4 w-4" />
        </button>
        {editor.isActive('link') && (
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            className="rounded p-1.5 hover:bg-[#0E2024] text-red-400 hover:text-red-300 transition-colors"
            title="Remove Link"
          >
            <Unlink className="h-4 w-4" />
          </button>
        )}

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="rounded p-1.5 hover:bg-[#0E2024] hover:text-white disabled:opacity-30 transition-colors"
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="rounded p-1.5 hover:bg-[#0E2024] hover:text-white disabled:opacity-30 transition-colors"
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[180px] p-4 text-xs text-[#E1E8EA] leading-relaxed selection:bg-amber-500/30">
        <EditorContent editor={editor} placeholder={placeholder} />
      </div>
    </div>
  );
};
