import React, {
  useState,
  useRef,
  useMemo,
  useCallback,
  useEffect,
  memo,
} from 'react';

import styled from 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    name: 'light' | 'dark';
  }
}

import JoditEditorImport from 'jodit-react';

// Handle ESM/CJS interop - jodit-react might export { default: Component } when bundled
const JoditEditor = (JoditEditorImport as any).default || JoditEditorImport;

import { DeepPartial, IJodit } from 'jodit/esm/types';
import { Config } from 'jodit/esm/config';

import { useIntl } from 'react-intl';

import { Field } from '@strapi/design-system';
import { Loader } from '@strapi/design-system';

import { useFetchClient, useStrapiApp } from '@strapi/strapi/admin';

import { DEFAULT_BUTTONS, STRAPI_MEDIA_BUTTON_NAME } from './config';
import cleanerImage from './cleaner.jpg';

const cursorPlaceholder = `current_cursor_placeholder`;
const cursorPlaceholderContent = `<${cursorPlaceholder}></${cursorPlaceholder}>`;
const visibleSelectedCellClass = 'jodit-cell-selection-visible';

const JoditContainer = styled.div`
  h1, h2, h3, h4, h5, h6 {
    font-weight: 700;
  }
  h1 {
    font-size: 4rem;
    margin-bottom: 1rem;
  }
  h2 {
    font-size: 3.5rem;
    margin-bottom: 0.75rem;
  }
  h3 {
    font-size: 3rem;
    margin-bottom: 0.5rem;
  }
  h4, h5, h6 {
    font-size: 2rem;
    margin-bottom: 0.25rem;
  }
  p {
    margin-bottom: 1rem;
    line-height: 1.6;
  }
  ul, ol {
    margin-bottom: 1rem;
    padding-left: 1.5rem;
  }
  ul {
    list-style-type: disc;
  }
  ol {
    list-style-type: decimal;
  }
  ul li, ol li {
    margin-bottom: 0.5rem;
  }
  blockquote {
    margin: 1rem 0;
    padding-left: 1rem;
    border-left: 4px solid #ccc;
    color: #666;
  }
  .jodit-toolbar-button_strapiMedia .jodit-icon {
    height: 19px;
    width: 19px;
  }

  /*.jodit-toolbar-button_strapiMedia svg {
    fill: ${({ theme }) => theme.colors.neutral800};
  }*/

  .jodit-wysiwyg {
    background: ${({ theme }) => theme.name === 'dark' ? '#4a4a6a' : theme.colors.neutral0};
    color: ${({ theme }) => theme.colors.neutral800};
  }

  .jodit-wysiwyg td.${visibleSelectedCellClass},
  .jodit-wysiwyg th.${visibleSelectedCellClass} {
    background-color: rgba(30, 136, 229, 0.26) !important;
    box-shadow: inset 0 0 0 2px #1e88e5 !important;
  }

  /* Визуализация кастомного класса в редакторе */
  .text-to-copy, .jodit-btn {
    background-color: #e3f2fd;
    border: 1px dashed #2196f3;
    padding: 2px 4px;
    border-radius: 3px;
    color: #0d47a1;
  }

`;

const AiModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(33, 33, 52, 0.48);
`;

const AiModalPanel = styled.div`
  width: min(960px, 100%);
  max-height: min(760px, 100%);
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.neutral0};
  color: ${({ theme }) => theme.colors.neutral800};
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.22);
`;

const AiModalTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
`;

const AiModalText = styled.div`
  font-size: 14px;
  line-height: 1.5;
`;

const AiModalImage = styled.img`
  width: min(360px, 100%);
  align-self: center;
  border-radius: 6px;
`;

const AiModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const AiModalButton = styled.button`
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid ${({ theme }) => theme.colors.neutral300};
  border-radius: 4px;
  background: ${({ theme }) => theme.colors.neutral0};
  color: ${({ theme }) => theme.colors.neutral800};
  cursor: pointer;
  font-weight: 600;

  &[data-variant='primary'] {
    border-color: #4945ff;
    background: #4945ff;
    color: #ffffff;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;

const AiEditorShell = styled.div`
  min-height: 360px;
  border: 1px solid ${({ theme }) => theme.colors.neutral200};
  border-radius: 4px;
  overflow: hidden;
`;

const AiEditorFallback = styled.textarea`
  width: 100%;
  min-height: 360px;
  padding: 12px;
  border: 0;
  resize: vertical;
  font-family: monospace;
  font-size: 13px;
  line-height: 1.45;
  color: ${({ theme }) => theme.colors.neutral800};
  background: ${({ theme }) => theme.colors.neutral0};
`;

// Utility function to prefix URLs (similar to CKEditor implementation)
const prefixFileUrlWithBackendUrl = (url: string) => {
  return url.startsWith('/') ? `${window.location.origin}${url}` : url;
};

// Utility function to generate HTML for different media types
const generateMediaHtml = (file: { url: string; alt?: string; mime: string; name?: string }) => {
  const { url, alt = '', mime, name = 'media' } = file;
  if (mime.startsWith('image/')) {
    return `
<img src="${url}" alt="${alt || name}" />`;
  } else if (mime.startsWith('video/')) {
    return `
<video controls style="max-width: 100%;">
  <source src="${url}" type="${mime}">
  Your browser does not support the video tag.
</video>`;
  } else if (mime.startsWith('audio/')) {
    return `
<audio controls>
  <source src="${url}" type="${mime}">
  Your browser does not support the audio tag.
</audio>`;
  } else {
    // For other file types, create a download link
    return `
<a href="${url}" download="${name}" target="_blank">${alt || name}</a>`;
  }
};

const removeVisibleCellSelection = (root?: ParentNode | null) => {
  root
    ?.querySelectorAll?.(`.${visibleSelectedCellClass}`)
    .forEach(cell => cell.classList.remove(visibleSelectedCellClass));
};

const getTableCell = (target: EventTarget | null): HTMLTableCellElement | null => {
  if (!(target instanceof Element)) {
    return null;
  }

  return target.closest('td, th') as HTMLTableCellElement | null;
};

const markVisibleCellRange = (
  table: HTMLTableElement,
  from: HTMLTableCellElement,
  to: HTMLTableCellElement
) => {
  removeVisibleCellSelection(table);

  const fromRow = (from.parentElement as HTMLTableRowElement | null)?.rowIndex ?? 0;
  const toRow = (to.parentElement as HTMLTableRowElement | null)?.rowIndex ?? fromRow;
  const startRow = Math.min(fromRow, toRow);
  const endRow = Math.max(fromRow, toRow);
  const startCell = Math.min(from.cellIndex, to.cellIndex);
  const endCell = Math.max(from.cellIndex, to.cellIndex);

  Array.from(table.rows).forEach(row => {
    if (row.rowIndex < startRow || row.rowIndex > endRow) {
      return;
    }

    Array.from(row.cells).forEach(cell => {
      if (cell.cellIndex >= startCell && cell.cellIndex <= endCell) {
        cell.classList.add(visibleSelectedCellClass);
      }
    });
  });
};

const stripVisibleCellSelectionFromHtml = (content: string): string => {
  if (
    !content ||
    !content.includes(visibleSelectedCellClass) ||
    typeof document === 'undefined'
  ) {
    return content;
  }

  const template = document.createElement('template');
  template.innerHTML = content;
  removeVisibleCellSelection(template.content);
  return template.innerHTML;
};

type AiButtonConfig = {
  name: string;
  label: string;
};

type AiModalState = {
  isOpen: boolean;
  status: 'loading' | 'review' | 'error';
  buttonName?: string;
  label?: string;
  content: string;
  error?: string;
};

const AceHtmlEditor = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const aceRef = useRef<any>(null);
  const [aceReady, setAceReady] = useState(false);

  useEffect(() => {
    const initAce = () => {
      const ace = (window as any).ace;
      if (!containerRef.current || !ace || aceRef.current) {
        return;
      }

      const editor = ace.edit(containerRef.current);
      aceRef.current = editor;
      editor.setTheme('ace/theme/idle_fingers');
      editor.session.setMode('ace/mode/html');
      editor.session.setUseWrapMode(true);
      editor.setValue(value || '', -1);
      editor.on('change', () => onChange(editor.getValue()));
      setAceReady(true);
    };

    initAce();

    if (!(window as any).ace) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.2/ace.js';
      script.async = true;
      script.onload = initAce;
      document.head.appendChild(script);

      return () => {
        aceRef.current?.destroy?.();
        aceRef.current = null;
        script.remove();
      };
    }

    return () => {
      aceRef.current?.destroy?.();
      aceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (aceRef.current && aceRef.current.getValue() !== value) {
      aceRef.current.setValue(value || '', -1);
    }
  }, [value]);

  return (
    <AiEditorShell>
      <div
        ref={containerRef}
        style={{ display: aceReady ? 'block' : 'none', width: '100%', minHeight: 360 }}
      />
      {!aceReady ? (
        <AiEditorFallback value={value} onChange={(event) => onChange(event.target.value)} />
      ) : null}
    </AiEditorShell>
  );
};

// IMAGE_SCHEMA_FIELDS from Strapi's official blocks implementation
const IMAGE_SCHEMA_FIELDS = [
  'name',
  'alternativeText',
  'url',
  'caption',
  'width',
  'height',
  'formats',
  'hash',
  'ext',
  'mime',
  'size',
  'previewUrl',
  'provider',
  'provider_metadata',
  'createdAt',
  'updatedAt'
];

const pick = (object: any, keys: string[]) => {
  const entries = keys.map((key) => [key, object[key]]);
  return Object.fromEntries(entries);
};

// MediaLib component using official Strapi ImageDialog exactly like CKEditor
const MediaLib = ({ isOpen = false, onChange = () => { }, onToggle = () => { } }: {
  isOpen: boolean;
  onChange: (files: any[]) => void;
  onToggle: () => void;
}) => {
  // Get media library component directly as in the original code
  const components = useStrapiApp('ImageDialog', (state: any) => state.components);
  if (!components || !isOpen) return null;
  // Make sure the component is defined before using it
  const ImageDialog = components?.['media-library'] ?? null;

  const handleSelectAssets = (files: any[]) => {
    const formattedFiles = files.map(f => {
      const expectedFile = pick(f, IMAGE_SCHEMA_FIELDS);
      const nodeFile = {
        ...expectedFile,
        alternativeText: expectedFile.alternativeText || expectedFile.name,
        url: prefixFileUrlWithBackendUrl(f.url),
        mime: f.mime,
        name: f.name,
      };
      return nodeFile;
    });
    console.log('📎 Jodit: Media library assets selected', formattedFiles);
    onChange(formattedFiles);
  };

  if (!isOpen || !ImageDialog) {
    return null;
  }

  // Use a type assertion to resolve the component properly
  const ComponentToRender = (ImageDialog as any)?.default || ImageDialog;

  return (
    <ComponentToRender
      onClose={onToggle}
      onSelectAssets={handleSelectAssets}
      allowedTypes={[
        "files",
        "images",
        "videos",
        "audios"
      ]}
    />
  );
};

interface JoditInputProps {
  name: string;
  value: string;
  onChange: (value: any) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string | boolean;
  description?: string;
  intlLabel: {
    id: string;
    defaultMessage: string;
  };
  customFieldUID?: string;
  attribute?: {
    options?: {
      height?: number;
      buttons?: string;
      removeButtons?: string;
      toolbar?: boolean;
      readonly?: boolean;
      fonts?: string;
      webp?: string;
    };
  };
  labelAction?: React.ReactNode;
  label?: string;
  hint?: string;
  placeholder?: string;
  forwardedAs?: string;
  fieldSchema?: {
    displayName?: string;
    description?: string;
    name?: string;
  };
  metadatas?: {
    label?: string;
    description?: string;
    placeholder?: string;
    visible?: boolean;
    editable?: boolean;
  };
}

const JoditInput: React.FC<JoditInputProps> = ({
  name,
  value,
  onChange,
  required = false,
  disabled = false,
  error,
  description,
  intlLabel,
  attribute,
  label,
  hint,
  placeholder,
  fieldSchema,
  metadatas,
}) => {

  const mediaLibButton = {
    name: 'strapiMedia',
    iconURL: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiIgd2lkdGg9IjMycHgiIGhlaWdodD0iMzJweCIgZmlsbD0iIzIxMjEzNCI+PHBhdGggZD0iTTI3IDVIOWEyIDIgMCAwIDAtMiAydjJINWEyIDIgMCAwIDAtMiAydjE0YTIgMiAwIDAgMCAyIDJoMThhMiAyIDAgMCAwIDItMnYtMmgyYTIgMiAwIDAgMCAyLTJWN2EyIDIgMCAwIDAtMi0ybS01LjUgNGExLjUgMS41IDAgMSAxIDAgMyAxLjUgMS41IDAgMCAxIDAtM00yMyAyNUg1VjExaDJ2MTBhMiAyIDAgMCAwIDIgMmgxNHptNC00SDl2LTQuNWw0LjUtNC41IDYuMjA4IDYuMjA4YTEgMSAwIDAgMCAxLjQxMyAwTDI0LjMzIDE1IDI3IDE3LjY3MnoiPjwvcGF0aD48L3N2Zz4=',
    tooltip: 'Strapi Media Library',
    exec: function (jodit: IJodit) {
      console.log(`📎 Jodit: Open Strapi media library`);
      jodit.selection.insertHTML(cursorPlaceholderContent);
      const newContent = jodit.value;
      onChange({ target: { name, value: newContent.split(cursorPlaceholderContent).join('').trim() } });
      toggleMediaLib();
    }
  }

  // --- Заготовка медиакнопки для темной темы ---
  /*const mediaLibButton = {
    name: 'strapiMedia',
    icon: `
    <svg viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M27 5H9a2 2 0 0 0-2 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2v-2h2a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3M23 25H5V11h2v10a2 2 0 0 0 2 2h14zm4-4H9v-4.5l4.5-4.5 6.208 6.208a1 1 0 0 0 1.413 0L24.33 15 27 17.67z"/>
    </svg>
  `,
    tooltip: 'Strapi Media Library',
    exec: function (jodit: IJodit) {
      console.log(`📎 Jodit: Open Strapi media library`);
      jodit.selection.insertHTML(cursorPlaceholderContent);
      const newContent = jodit.value;
      onChange({
        target: {
          name,
          value: newContent.split(cursorPlaceholderContent).join('').trim()
        }
      });
      toggleMediaLib();
    }
  };*/

  // --- КАСТОМНАЯ КНОПКА copytext ---
  const copyTextButton = {
    name: 'copytext',
    iconURL: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgLTk2MCA5NjAgOTYwIiB3aWR0aD0iMjQiIGZpbGw9IiMwMDAwMDAiPjxwYXRoIGQ9Ik0zNjAtMjQwcS0zMyAwLTU2LjUtMjMuNVQyODAtMzIwdi00ODBxMC0zMyAyMy41LTU2LjVUMzYwLTg4MGgzNjBxMzMgMCA1Ni41IDIzLjVUODAwLTgwMHY0ODBxMCAzMy0yMy41IDU2LjVUNzIwLTI0MEgzNjBabTAtODBoMzYwdi00ODBIMzYwdjQ4MFpNMjAwLTgwcS0zMyAwLTU2LjUtMjMuNVQxMjAtMTYwdi01NjBoODB2NTYwaDQ0MHY4MEgyMDBabTE2MC0yNDB2LTQ4MCA0ODB6Ii8+PC9zdmc+',
    tooltip: 'Делает текст копируемым',
    exec: function (jodit: IJodit) {
      console.log('text-to-copy btn pressed');
      const selectedHtml = jodit.selection.html;

      if (selectedHtml && selectedHtml.trim().length > 0) {
        // Если выделен текст - оборачиваем его <span class="text-to-copy">
        jodit.selection.insertHTML(`<span class="text-to-copy">${selectedHtml}</span>`);
      } else {
        // Если ничего не выделено, вставляем пустой шаблон
        jodit.selection.insertHTML('<span class="text-to-copy">Текст для копирования</span>');
      }
    }
  };

  // --- КАСТОМНАЯ КНОПКА linkbtn ---
  const insertLinkButton = {
    name: 'linkbtn',
    iconURL: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMjRweCIgdmlld0JveD0iMCAtOTYwIDk2MCA5NjAiIHdpZHRoPSIyNHB4IiBmaWxsPSIjMWYxZjFmIj48cGF0aCBkPSJNNjgwLTE2MHYtMTIwSDU2MHYtODBoMTIwdi0xMjBoODB2MTIwaDEyMHY4MEg3NjB2MTIwaC04MFpNNDQwLTI4MEgyODBxLTgzIDAtMTQxLjUtNTguNVQ4MC00ODBxMC04MyA1OC41LTE0MS41VDI4MC02ODBoMTYwdjgwSDI4MHEtNTAgMC04NSAzNXQtMzUgODVxMCA1MCAzNSA4NXQ4NSAzNWgxNjB2ODBaTTMyMC00NDB2LTgwaDMyMHY4MEgzMjBabTU2MC00MGgtODBxMC01MC0zNS04NXQtODUtMzVINTIwdi04MGgxNjBxODMgMCAxNDEuNSA1OC41VDg4MC00ODBaIi8+PC9zdmc+',
    tooltip: 'Разместить кнопку-ссылку',
    exec: function (jodit: IJodit) {
      const sel = jodit.selection;
      const selectedText =
        jodit.editor?.ownerDocument?.getSelection()?.toString() || '';

      const dialog = (jodit as any).dlg({
        buttons: []
      });

      dialog.setHeader('Добавить кнопку-ссылку');

      const content = document.createElement('div');
      content.style.display = 'flex';
      content.style.flexDirection = 'column';
      content.style.gap = '10px';
      content.style.padding = '16px';
      content.style.minWidth = '300px';
      content.style.color = '#636363';

      const textInput = document.createElement('input');
      textInput.placeholder = 'Текст кнопки';
      textInput.value = selectedText || 'Текст кнопки';

      const urlInput = document.createElement('input');
      urlInput.placeholder = 'https://example.com';

      const targetWrapper = document.createElement('label');
      const targetCheckbox = document.createElement('input');
      targetCheckbox.type = 'checkbox';
      targetWrapper.appendChild(targetCheckbox);
      targetWrapper.appendChild(document.createTextNode(' Открывать в новом окне'));

      const styleSelect = document.createElement('select');

      [
        { value: 'btn-primary', label: 'Primary' },
        { value: 'btn-secondary', label: 'Secondary' },
        { value: 'btn-success', label: 'Success' },
        { value: 'btn-warning', label: 'Warning' },
        { value: 'btn-danger', label: 'Danger' },
      ].forEach(s => {
        const option = document.createElement('option');
        option.value = s.value;
        option.textContent = s.label;
        styleSelect.appendChild(option);
      });

      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.justifyContent = 'flex-end';
      actions.style.gap = '10px';

      const okBtn = document.createElement('button');
      okBtn.textContent = 'OK';
      okBtn.className = 'jodit-ui-button jodit-ui-button_primary';

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Отменить';
      cancelBtn.className = 'jodit-ui-button';

      actions.appendChild(cancelBtn);
      actions.appendChild(okBtn);

      content.appendChild(textInput);
      content.appendChild(urlInput);
      content.appendChild(targetWrapper);
      content.appendChild(styleSelect);
      content.appendChild(actions);

      dialog.setContent(content);

      okBtn.onclick = () => {
        const text = textInput.value || 'Кнопка';
        const url = urlInput.value || '#';
        const style = styleSelect.value;
        const target = targetCheckbox.checked
          ? ' target="_blank" rel="noopener noreferrer"'
          : '';

        const html = `
        <a href="${url}" class="btn ${style} jodit-btn"${target}>
          ${text}
        </a>
    `;

        sel.insertHTML(html);
        dialog.close();
      };

      cancelBtn.onclick = () => {
        dialog.close();
      };

      dialog.open();
    }
  };

  const { formatMessage } = useIntl();
  const { get, post } = useFetchClient();

  const editorRef = useRef<IJodit | null>(null);
  const aiCleanAbortRef = useRef<AbortController | null>(null);

  // Media library state (following CKEditor pattern)
  const [mediaLibVisible, setMediaLibVisible] = useState(false);
  const [aiButtons, setAiButtons] = useState<AiButtonConfig[]>([]);
  const [aiModal, setAiModal] = useState<AiModalState>({
    isOpen: false,
    status: 'loading',
    content: '',
  });

  const [initialValue] = useState(value || '');

  const [isLoading, setIsLoading] = useState(false);

  const toggleMediaLib = useCallback(() => {
    setMediaLibVisible(prev => !prev);
  }, []);

  useEffect(() => {
    let isMounted = true;

    get('/jodit-editor/ai-buttons')
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setAiButtons(Array.isArray(response.data?.buttons) ? response.data.buttons : []);
      })
      .catch((error) => {
        console.warn('Jodit: failed to load AI buttons configuration', error);
      });

    return () => {
      isMounted = false;
    };
  }, [get]);

  const closeAiModal = useCallback(() => {
    aiCleanAbortRef.current?.abort();
    aiCleanAbortRef.current = null;
    setAiModal({
      isOpen: false,
      status: 'loading',
      content: '',
    });
  }, []);

  const runAiClean = useCallback(async (button: AiButtonConfig) => {
    const jodit = editorRef.current;
    const content = stripVisibleCellSelectionFromHtml(jodit?.value || value || '');
    const abortController = new AbortController();

    aiCleanAbortRef.current?.abort();
    aiCleanAbortRef.current = abortController;

    setAiModal({
      isOpen: true,
      status: 'loading',
      buttonName: button.name,
      label: button.label,
      content: '',
    });

    try {
      const response = await post('/jodit-editor/ai-clean', {
        button: button.name,
        content,
      }, {
        signal: abortController.signal,
      });
      const cleanedContent = response.data?.content;

      if (!cleanedContent || typeof cleanedContent !== 'string') {
        throw new Error('AI response does not contain content');
      }

      setAiModal({
        isOpen: true,
        status: 'review',
        buttonName: button.name,
        label: button.label,
        content: cleanedContent,
      });
    } catch (error: any) {
      if (abortController.signal.aborted) {
        return;
      }

      setAiModal({
        isOpen: true,
        status: 'error',
        buttonName: button.name,
        label: button.label,
        content: '',
        error: error?.response?.data?.error?.message || error?.message || 'AI clean failed',
      });
    } finally {
      if (aiCleanAbortRef.current === abortController) {
        aiCleanAbortRef.current = null;
      }
    }
  }, [post, value]);

  const acceptAiContent = useCallback(() => {
    const jodit = editorRef.current;

    if (jodit && aiModal.content) {
      jodit.value = aiModal.content;
    }

    onChange({
      target: {
        name,
        value: aiModal.content,
      },
    });
    closeAiModal();
  }, [aiModal.content, closeAiModal, name, onChange]);

  // Utility function to convert File to media object with base64 data or upload to media library
  const fileToMediaObject = async (
    file: File,
    handleFileUpload?: (file: File) => Promise<string | null>,
    webpEnabled: string[] = [],
  ): Promise<{ url: string; alt: string; mime: string; name: string }> => {
    return new Promise(async (resolve) => {
      if (handleFileUpload) {
        // Upload to media library
        try {
          console.log('📎 Jodit: Uploading image to media library...');
          setIsLoading(true);
          let uploadedUrl = await handleFileUpload(file);
          if (uploadedUrl) {
            if (webpEnabled.includes(file.type)) {
              console.log('📎 Jodit: WebP conversion enabled, converting image...', file.type);
              uploadedUrl = uploadedUrl.replace(`.${file.type.replace('image/', '')}`, '.webp');
            }
            resolve({
              url: uploadedUrl,
              alt: file.name,
              mime: file.type,
              name: file.name
            });
            setIsLoading(false);
            return;
          } else {
            console.warn('📎 Jodit: Upload failed, falling back to base64');
          }
        } catch (error) {
          console.error('📎 Jodit: Upload error, falling back to base64:', error);
        }
        setIsLoading(false);
      }
    });
  };

  const handleMediaLibChange = async (files: any[]) => {
    const mediaToInsert = files.length ? files
      .filter(file => file.mime?.startsWith('image/') || file.mime?.startsWith('video/') || file.mime?.startsWith('audio/'))
      .map(file => generateMediaHtml(file))
      .join('') : '';
    const jodit = editorRef.current;
    const nodeToSelect = jodit?.editor.querySelector(cursorPlaceholder);
    if (nodeToSelect) {
      jodit?.selection?.setCursorBefore(nodeToSelect);
      jodit?.selection.removeNode(nodeToSelect);
    }
    jodit?.selection.insertHTML(mediaToInsert, true);
    setMediaLibVisible(false);
  };

  // Parse options from attribute
  const options = attribute?.options || {};

  const height = options.height || 400;
  const buttons: any[] = options.buttons
    ? options.buttons.split(',').map(btn => btn.trim())
    : DEFAULT_BUTTONS.split(',').map(btn => btn.trim());
  // Find "strapiMedia" button and replace it with mediaLibButton
  const mediaLibButtonIndex = buttons.findIndex(btn => btn === STRAPI_MEDIA_BUTTON_NAME);
  if (mediaLibButtonIndex !== -1) {
    buttons[mediaLibButtonIndex] = mediaLibButton;
  }
  const aiButtonControls = aiButtons.reduce((acc, button) => {
    acc[button.name] = {
      name: button.name,
      text: button.label,
      tooltip: button.label,
      exec: () => runAiClean(button),
    };

    if (!buttons.some(item => item === button.name || item?.name === button.name)) {
      buttons.push(button.name);
    }

    return acc;
  }, {} as Record<string, any>);
  const removeButtons = options.removeButtons
    ? options.removeButtons.split(',').map(btn => btn.trim())
    : [];
  const showToolbar = options.toolbar !== false;
  const fonts = options.fonts
    ? options.fonts.split('\n').reduce((acc, font) => {
      acc[`${font.trim()}`] = font.split(',')[0].trim();
      return acc;
    }, {} as Record<string, string>)
    : {};
  const webpEnabled = options.webp !== '' ? options.webp?.split(',') : [];

  // Upload handler for files
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('files', file);

      const response = await post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.length > 0) {
        const uploadedFile = response.data[0];
        console.log('Jodit file uploaded successfully:', uploadedFile);
        return prefixFileUrlWithBackendUrl(uploadedFile.url);
      }
      return null;
    } catch (error) {
      console.error('Jodit file upload error:', error);
      return null;
    }
  }, [post]);

  // Jodit configuration
  const config = useMemo<DeepPartial<Config>>(() => ({
    readonly: disabled || options.readonly || false,
    height: height,
    toolbar: showToolbar,
    adaptive: false,            // Отключает общую адаптивность
    toolbarAdaptive: false,     // Запрещает прятать кнопки в "три точки"
    addNewLine: false,          // Отключает плавающую кнопку вставки строки около таблиц/медиа
    addNewLineOnDBLClick: false,
    tableAllowCellSelection: true,
    width: '100%',
    placeholder: formatMessage({
      id: placeholder || 'jodit-editor.placeholder',
      defaultMessage: intlLabel?.defaultMessage || 'Start typing here...',
    }),
    style: {
      fontFamily: 'Helvetica',
      fontSize: '14px',
      h1: {
        fontSize: '24px',
        fontWeight: 'bold',
      }
    },

    // Toolbar configuration
    buttons,
    removeButtons: removeButtons,

    table: {
      splitBlockOnInsertTable: true,
      selectionCellStyle: 'background-color: rgba(30, 136, 229, 0.22) !important; border: 1px double #1e88e5 !important;',
      useExtraClassesOptions: false,
    },

    controls: {
      font: {
        list: Object.keys(fonts).length > 0 ? fonts : {},
      },
      copytext: copyTextButton, // COPYTEXT: регистрация кнопки
      linkbtn: insertLinkButton, // LINKBTN: регистрация кнопки
      ...aiButtonControls,
    },

    // Event handlers
    events: {
      afterInit: function (jodit: any) {
        console.log('📎 Jodit: Editor initialized, storing instance:', jodit);

        let selectionStartCell: HTMLTableCellElement | null = null;

        const onCellSelectionStart = (event: MouseEvent) => {
          const cell = getTableCell(event.target);
          const table = cell?.closest('table') as HTMLTableElement | null;

          if (!cell || !table || !jodit.editor.contains(table)) {
            selectionStartCell = null;
            removeVisibleCellSelection(jodit.editor);
            return;
          }

          selectionStartCell = cell;
          markVisibleCellRange(table, cell, cell);
        };

        const onCellSelectionMove = (event: MouseEvent) => {
          if (!selectionStartCell) {
            return;
          }

          const cell = getTableCell(event.target);
          const table = selectionStartCell.closest('table') as HTMLTableElement | null;

          if (!cell || !table || cell.closest('table') !== table) {
            return;
          }

          markVisibleCellRange(table, selectionStartCell, cell);
        };

        const onCellSelectionEnd = () => {
          selectionStartCell = null;
        };

        const onEditorMouseDown = (event: MouseEvent) => {
          if (!getTableCell(event.target)) {
            removeVisibleCellSelection(jodit.editor);
          }
        };

        jodit.e
          .on(jodit.editor, 'mousedown.visible-cell-selection', onCellSelectionStart)
          .on(jodit.editor, 'mousemove.visible-cell-selection', onCellSelectionMove)
          .on(jodit.editor, 'mouseup.visible-cell-selection', onCellSelectionEnd)
          .on(jodit.editor, 'mouseleave.visible-cell-selection', onCellSelectionEnd)
          .on(jodit.editor, 'mousedown.visible-cell-selection-clear', onEditorMouseDown)
          .on('beforeCommand.visible-cell-selection', () => removeVisibleCellSelection(jodit.editor));
      },

      beforeOpen: () => {
        console.log('📎 Jodit: Editor opened');
      },

      // Added Ctrl+Shift+V paste behavior
      keydown: (e: KeyboardEvent) => {
        if (e.ctrlKey && e.shiftKey && (e.key === 'V' || e.key === 'v')) {
          e.preventDefault();
          e.stopPropagation();

          navigator.clipboard.readText().then((text) => {
            const jodit = editorRef.current;
            if (!jodit) return;

            const clean = text
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/\n\n/g, '</p><p>')
              .replace(/\n/g, '<br>');

            jodit.selection.insertHTML(`<p>${clean}</p>`);

            const newContent = jodit.value || '';
            onChange({
              target: {
                name,
                value: newContent.split(cursorPlaceholderContent).join('').trim(),
              },
            });
          }).catch(() => {
            console.warn('Jodit: нет доступа к Clipboard API');
          });
        }
      },

      // Handle paste events for images, videos, and audio
      paste: async (e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        const jodit = editorRef.current;
        jodit?.selection.insertHTML(cursorPlaceholderContent);
        if (items) {
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            // Support image, video, and audio files
            if (item.type.startsWith('image/') || item.type.startsWith('video/') || item.type.startsWith('audio/')) {
              e.preventDefault();
              const file = item.getAsFile();
              if (file) {
                const mediaObject = await fileToMediaObject(file, handleFileUpload, webpEnabled);
                const mediaHtml = generateMediaHtml(mediaObject);
                const jodit = editorRef.current;
                const nodeToSelect = jodit?.editor.querySelector(cursorPlaceholder);
                if (nodeToSelect) {
                  jodit?.selection?.setCursorBefore(nodeToSelect);
                  jodit?.selection.removeNode(nodeToSelect);
                }
                jodit?.selection.insertHTML(mediaHtml);
                const newContent = jodit?.value || '';
                onChange({ target: { name, value: newContent.split(cursorPlaceholderContent).join('').trim() } });
              }
              break;
            }
          }
        }
      },

      // Handle drag and drop for images, videos, and audio
      drop: async (e: DragEvent) => {
        const jodit = editorRef.current;
        jodit?.selection.insertHTML(cursorPlaceholderContent);
        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
          e.preventDefault();
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            // Support image, video, and audio files
            if (file.type.startsWith('image/') || file.type.startsWith('video/') || file.type.startsWith('audio/')) {
              const mediaObject = await fileToMediaObject(file, handleFileUpload, webpEnabled);
              const mediaHtml = generateMediaHtml(mediaObject);
              const jodit = editorRef.current;
              const nodeToSelect = jodit?.editor.querySelector(cursorPlaceholder);
              if (nodeToSelect) {
                jodit?.selection?.setCursorBefore(nodeToSelect);
                jodit?.selection.removeNode(nodeToSelect);
              }
              jodit?.selection.insertHTML(mediaHtml);
              const newContent = jodit?.value || '';
              onChange({ target: { name, value: newContent.split(cursorPlaceholderContent).join('').trim() } });
            }
          }
        }
      }
    },

    // Language configuration
    language: 'en',

    // Theme
    theme: 'default',

    // Additional Strapi-specific settings
    beautifyHTML: true,
    allowTabNavigation: true,
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    cleanHTML: {
      disableCleanFilter: 'true',
    },
  }), [
    disabled,
    height,
    showToolbar,
    removeButtons,
    placeholder,
    formatMessage,
    toggleMediaLib,
    handleFileUpload,
    aiButtons,
    runAiClean
  ]);

  // Get the display label
  const displayLabel = label ||
    (fieldSchema?.displayName) ||
    (metadatas?.label) ||
    formatMessage(intlLabel);

  // Get the display description
  const displayDescription = description ||
    (fieldSchema?.description) ||
    (metadatas?.description);

  // Get the display hint
  const displayHint = hint;

  // Фикс редактора в режиме кода !!!
  const isSourceMode = (jodit: IJodit | null) => {
    return (jodit as any)?.getMode?.() === 2;
  };

  return (
    <Field.Root
      name={name}
      id={name}
      required={required}
      error={error}
      hint={displayHint}
      style={{ position: 'relative' }}
    >

      <Field.Label>{displayLabel}</Field.Label>

      <JoditContainer>
        <JoditEditor
          value={initialValue}
          ref={editorRef}
          editorRef={(editor: IJodit) => { editorRef.current = editor; }}
          config={config}
          onBlur={(newContent: string) => {
            console.log('📎 Jodit: Content changed', newContent?.length || 0, 'characters');
            const jodit = editorRef.current;
            removeVisibleCellSelection(jodit?.editor);
            const cleanContent = stripVisibleCellSelectionFromHtml(newContent);
            onChange({ target: { name, value: cleanContent.split(cursorPlaceholderContent).join('').trim() } });
          }}
          onChange={(newContent: string) => {
            console.log('📎 Jodit: Content changed', newContent?.length || 0, 'characters');
            const jodit = editorRef.current;

            // Фикс редактора в режиме кода !!!
            if (isSourceMode(jodit)) {
              onChange({ target: { name, value: newContent } });
              return;
            }

            const cleanContent = stripVisibleCellSelectionFromHtml(newContent);
            onChange({ target: { name, value: cleanContent.split(cursorPlaceholderContent).join('').trim() } });
          }}
        />
      </JoditContainer>

      {
        displayDescription ? (
          <Field.Hint>{displayDescription}</Field.Hint>
        ) : null
      }
      {error ? <Field.Error>{error}</Field.Error> : null}

      {aiModal.isOpen ? (
        <AiModalOverlay>
          <AiModalPanel>
            <AiModalTitle>{aiModal.label || 'AI clean'}</AiModalTitle>

            {aiModal.status === 'loading' ? (
              <>
                <AiModalText>
                  Ожидание ответа AI... Это может занять до нескольких минут.
                </AiModalText>
                <AiModalImage src={cleanerImage} alt="" />
                <AiModalActions>
                  <AiModalButton type="button" onClick={closeAiModal}>
                    Отмена
                  </AiModalButton>
                </AiModalActions>
              </>
            ) : null}

            {aiModal.status === 'error' ? (
              <>
                <AiModalText>{aiModal.error || 'Ошибка при выполнении AI clean'}</AiModalText>
                <AiModalActions>
                  <AiModalButton type="button" onClick={closeAiModal}>
                    Закрыть
                  </AiModalButton>
                </AiModalActions>
              </>
            ) : null}

            {aiModal.status === 'review' ? (
              <>
                <AceHtmlEditor
                  value={aiModal.content}
                  onChange={(content) => setAiModal(prev => ({ ...prev, content }))}
                />
                <AiModalActions>
                  <AiModalButton type="button" onClick={closeAiModal}>
                    Отмена
                  </AiModalButton>
                  <AiModalButton type="button" data-variant="primary" onClick={acceptAiContent}>
                    Принять
                  </AiModalButton>
                </AiModalActions>
              </>
            ) : null}
          </AiModalPanel>
        </AiModalOverlay>
      ) : null}

      {/* Media Library Modal */}
      <MediaLib
        isOpen={mediaLibVisible}
        onChange={handleMediaLibChange}
        onToggle={toggleMediaLib}
      />

      {
        isLoading ?
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(255,255,255,0.5)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.5)',
              }}
            >
              <Loader />
            </div>
          </div>
          : null
      }
    </Field.Root>
  );
};

// CRITICAL: Use React.memo with custom comparison
export default memo(JoditInput, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.name === nextProps.name &&
    prevProps.required === nextProps.required &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.error === nextProps.error
    // DO NOT compare value prop - this prevents re-renders when value changes
  );
});
