'use client';

import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from '@tiptap/react';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group';
import { Separator } from './separator';
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  CodeIcon,
  List,
  ListOrdered,
} from 'lucide-react';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Underline from '@tiptap/extension-underline';
import Code from '@tiptap/extension-code';
import Link from '@tiptap/extension-link';
import History from '@tiptap/extension-history';
import BulletList from '@tiptap/extension-bullet-list';
import ListItem from '@tiptap/extension-list-item';
import OrderedList from '@tiptap/extension-ordered-list';
import LinkPopover from './link-popover';
import TooltipWrapper from './tooltip-wrapper';
import { Skeleton } from './skeleton';
import { useEffect } from 'react';

export default function Editor({
  onChange,
  ref,
  onBlur,
  value,
  isError,
  isResetEditor,
  disabled = false,
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      Document,
      Paragraph,
      Text,
      History,
      Bold,
      Italic,
      Underline,
      Code,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
        protocols: ['http', 'https'],
        isAllowedUri: (url, ctx) => {
          try {
            // construct URL
            const parsedUrl = url.includes(':') ? new URL(url) : new URL(`${ctx.defaultProtocol}://${url}`);

            // use default validation
            if (!ctx.defaultValidate(parsedUrl.href)) {
              return false;
            }

            // only allow protocols specified in ctx.protocols
            const protocol = parsedUrl.protocol.replace(':', '');
            const allowedProtocols = ctx.protocols.map(p => (typeof p === 'string' ? p : p.scheme));

            if (!allowedProtocols.includes(protocol)) {
              return false;
            }

            // all checks have passed
            return true;
          } catch (err) {
            return false;
          }
        },
      }),
      BulletList,
      OrderedList,
      ListItem,
    ],
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    injectCSS: false,
    editorProps: {
      attributes: {
        class: 'max-w-full transition-[color,box-shadow] border border-input px-3 py-1.5 rounded-md selection:bg-primary selection:text-primary-foreground focus-visible:border-ring ring-ring/50 focus-visible:ring-[3px] transition-[color,box-shadow] outline-none min-h-30 prose prose-zinc dark:prose-invert prose-p:text-zinc-800 dark:prose-p:text-zinc-200 dark:prose-a:text-green-600 prose-a:text-green-700 prose-li:[&_p:first-child]:m-0 prose-li:first:mt-0 prose-li:last:mb-0 data-[error=true]:border-destructive focus-visible:data-[error=true]:border-destructive data-[error=true]:ring-destructive/20 dark:data-[error=true]:ring-destructive/40 [&[contenteditable=false]]:pointer-events-none [&[contenteditable=false]]:opacity-50',
        'data-error': isError,
      },
    },
  });

  // set initial value
  useEffect(() => {
    if (editor) {
      editor.commands.setContent(value);
    }
  }, [editor]);

  // when isError set form style to error
  useEffect(() => {
    if (editor) {
      editor.setOptions({
        editorProps: {
          attributes: {
            class: editor.options.editorProps.attributes.class,
            'data-error': isError,
          },
        },
      });
    }
  }, [isError, editor]);

  // when isSubmitting disable form and when success clear content
  useEffect(() => {
    if (editor && disabled) {
      editor.setEditable(false, false);
    } else if (editor) {
      editor.setEditable(true, false);

      if (isResetEditor?.current) {
        isResetEditor.current = false;
        editor.commands.clearContent();
      }
    }
  }, [disabled, editor]);

  if (!editor) return <Skeleton className="w-full h-30 rounded-md" />;

  return (
    <>
      <BubbleMenu
        className="shadow-sm bg-popover border rounded-lg p-0.5"
        tippyOptions={{ duration: 100 }}
        editor={editor}
      >
        <ToggleGroup type="multiple" className="gap-[0.125rem]">
          <TooltipWrapper text="Bold (Ctrl+B)">
            <ToggleGroupItem
              value="bold"
              aria-label="Toggle bold"
              className="hover:text-accent-foreground data-[state=on]:text-green-700 dark:data-[state=on]:text-green-600"
              onClick={() => editor.chain().focus().toggleBold().run()}
              disabled={!editor.can().chain().focus().toggleBold().run()}
              data-state={editor.isActive('bold') ? 'on' : 'off'}
            >
              <BoldIcon className="z-4" />
            </ToggleGroupItem>
          </TooltipWrapper>
          <TooltipWrapper text="Italic (Ctrl+I)">
            <ToggleGroupItem
              value="italic"
              aria-label="Toggle italic"
              className="hover:text-accent-foreground data-[state=on]:text-green-700 dark:data-[state=on]:text-green-600"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              disabled={!editor.can().chain().focus().toggleItalic().run()}
              data-state={editor.isActive('italic') ? 'on' : 'off'}
            >
              <ItalicIcon className="z-4" />
            </ToggleGroupItem>
          </TooltipWrapper>
          <TooltipWrapper text="Underline (Ctrl+U)">
            <ToggleGroupItem
              value="underline"
              aria-label="Toggle underline"
              className="hover:text-accent-foreground data-[state=on]:text-green-700 dark:data-[state=on]:text-green-600"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              disabled={!editor.can().chain().focus().toggleUnderline().run()}
              data-state={editor.isActive('underline') ? 'on' : 'off'}
            >
              <UnderlineIcon className="z-4" />
            </ToggleGroupItem>
          </TooltipWrapper>
          <TooltipWrapper text="Code (Ctrl+E)">
            <ToggleGroupItem
              value="code"
              aria-label="Toggle code"
              className="hover:text-accent-foreground data-[state=on]:text-green-700 dark:data-[state=on]:text-green-600"
              onClick={() => editor.chain().focus().toggleCode().run()}
              disabled={!editor.can().chain().focus().toggleCode().run()}
              data-state={editor.isActive('code') ? 'on' : 'off'}
            >
              <CodeIcon className="z-4" />
            </ToggleGroupItem>
          </TooltipWrapper>
          <Separator orientation="vertical" className="h-7!" />
          <TooltipWrapper text="Code (Ctrl+Shift+8)">
            <ToggleGroupItem
              value="bulletList"
              aria-label="Toggle bullet list"
              className="hover:text-accent-foreground data-[state=on]:text-green-700 dark:data-[state=on]:text-green-600"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              data-state={editor.isActive('bulletList') ? 'on' : 'off'}
            >
              <List className="z-4" />
            </ToggleGroupItem>
          </TooltipWrapper>
          <TooltipWrapper text="Code (Ctrl+Shift+7)">
            <ToggleGroupItem
              value="orderedList"
              aria-label="Toggle ordered list"
              className="hover:text-accent-foreground data-[state=on]:text-green-700 dark:data-[state=on]:text-green-600"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              data-state={editor.isActive('orderedList') ? 'on' : 'off'}
            >
              <ListOrdered className="z-4" />
            </ToggleGroupItem>
          </TooltipWrapper>
          <Separator orientation="vertical" className="h-7!" />
          <LinkPopover editor={editor} />
        </ToggleGroup>
      </BubbleMenu>
      <FloatingMenu
        tippyOptions={{ duration: 100 }}
        editor={editor}
        className="shadow-sm bg-popover border rounded-lg p-0.5"
      >
        <ToggleGroup type="multiple" className="gap-[0.125rem]">
          <TooltipWrapper text="Code (Ctrl+Shift+8)">
            <ToggleGroupItem
              value="bulletList"
              aria-label="Toggle bullet list"
              className="hover:text-accent-foreground data-[state=on]:text-green-700 dark:data-[state=on]:text-green-600"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              data-state={editor.isActive('bulletList') ? 'on' : 'off'}
            >
              <List className="z-4" />
            </ToggleGroupItem>
          </TooltipWrapper>
          <TooltipWrapper text="Code (Ctrl+Shift+7)">
            <ToggleGroupItem
              value="orderedList"
              aria-label="Toggle ordered list"
              className="hover:text-accent-foreground data-[state=on]:text-green-700 dark:data-[state=on]:text-green-600"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              data-state={editor.isActive('orderedList') ? 'on' : 'off'}
            >
              <ListOrdered className="z-4" />
            </ToggleGroupItem>
          </TooltipWrapper>
        </ToggleGroup>
      </FloatingMenu>
      <EditorContent editor={editor} ref={ref} onBlur={onBlur} data-error={true} />
    </>
  );
}
