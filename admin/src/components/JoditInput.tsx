import React, {
  useState,
  useRef,
  useMemo,
  useCallback,
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

const cursorPlaceholder = `current_cursor_placeholder`;
const cursorPlaceholderContent = `<${cursorPlaceholder}></${cursorPlaceholder}>`;

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

  /* Визуализация кастомного класса в редакторе */
  .text-to-copy, .jodit-btn {
    background-color: #e3f2fd;
    border: 1px dashed #2196f3;
    padding: 2px 4px;
    border-radius: 3px;
    color: #0d47a1;
  }

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
  const { post } = useFetchClient();

  const editorRef = useRef<IJodit | null>(null);

  // Media library state (following CKEditor pattern)
  const [mediaLibVisible, setMediaLibVisible] = useState(false);

  const [initialValue] = useState(value || '');

  const [isLoading, setIsLoading] = useState(false);

  const toggleMediaLib = useCallback(() => {
    setMediaLibVisible(prev => !prev);
  }, []);

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

    controls: {
      font: {
        list: Object.keys(fonts).length > 0 ? fonts : {},
      },
      copytext: copyTextButton, // COPYTEXT: регистрация кнопки
      linkbtn: insertLinkButton, // LINKBTN: регистрация кнопки
    },

    // Event handlers
    events: {
      afterInit: function (jodit: any) {
        console.log('📎 Jodit: Editor initialized, storing instance:', jodit);
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
    handleFileUpload
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
            jodit?.selection.save();
            onChange({ target: { name, value: newContent.split(cursorPlaceholderContent).join('').trim() } });
          }}
          onChange={(newContent: string) => {
            console.log('📎 Jodit: Content changed', newContent?.length || 0, 'characters');
            const jodit = editorRef.current;

            // Фикс редактора в режиме кода !!!
            if (isSourceMode(jodit)) {
              onChange({ target: { name, value: newContent } });
              return;
            }

            jodit?.selection.save();
            onChange({ target: { name, value: newContent.split(cursorPlaceholderContent).join('').trim() } });
          }}
        />
      </JoditContainer>

      {
        displayDescription ? (
          <Field.Hint>{displayDescription}</Field.Hint>
        ) : null
      }
      {error ? <Field.Error>{error}</Field.Error> : null}

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
