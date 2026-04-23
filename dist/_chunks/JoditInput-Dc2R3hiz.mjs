import { jsxs, jsx } from "react/jsx-runtime";
import { memo, useRef, useState, useCallback, useMemo } from "react";
import styled from "styled-components";
import JoditEditorImport from "jodit-react";
import { useIntl } from "react-intl";
import { Field, Loader } from "@strapi/design-system";
import { useFetchClient, useStrapiApp } from "@strapi/strapi/admin";
import { D as DEFAULT_BUTTONS, S as STRAPI_MEDIA_BUTTON_NAME } from "./index-Brnp3JO7.mjs";
const JoditEditor = JoditEditorImport.default || JoditEditorImport;
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
    background: ${({ theme }) => theme.name === "dark" ? "#4a4a6a" : theme.colors.neutral0};
    color: ${({ theme }) => theme.colors.neutral800};
  }

  /* Визуализация кастомного класса в редакторе */
  .text-to-copy {
    background-color: #e3f2fd;
    border: 1px dashed #2196f3;
    padding: 2px 4px;
    border-radius: 3px;
    color: #0d47a1;
  }

`;
const prefixFileUrlWithBackendUrl = (url) => {
  return url.startsWith("/") ? `${window.location.origin}${url}` : url;
};
const generateMediaHtml = (file) => {
  const { url, alt = "", mime, name = "media" } = file;
  if (mime.startsWith("image/")) {
    return `
<img src="${url}" alt="${alt || name}" />`;
  } else if (mime.startsWith("video/")) {
    return `
<video controls style="max-width: 100%;">
  <source src="${url}" type="${mime}">
  Your browser does not support the video tag.
</video>`;
  } else if (mime.startsWith("audio/")) {
    return `
<audio controls>
  <source src="${url}" type="${mime}">
  Your browser does not support the audio tag.
</audio>`;
  } else {
    return `
<a href="${url}" download="${name}" target="_blank">${alt || name}</a>`;
  }
};
const IMAGE_SCHEMA_FIELDS = [
  "name",
  "alternativeText",
  "url",
  "caption",
  "width",
  "height",
  "formats",
  "hash",
  "ext",
  "mime",
  "size",
  "previewUrl",
  "provider",
  "provider_metadata",
  "createdAt",
  "updatedAt"
];
const pick = (object, keys) => {
  const entries = keys.map((key) => [key, object[key]]);
  return Object.fromEntries(entries);
};
const MediaLib = ({ isOpen = false, onChange = () => {
}, onToggle = () => {
} }) => {
  const components = useStrapiApp("ImageDialog", (state) => state.components);
  if (!components || !isOpen) return null;
  const ImageDialog = components?.["media-library"] ?? null;
  const handleSelectAssets = (files) => {
    const formattedFiles = files.map((f) => {
      const expectedFile = pick(f, IMAGE_SCHEMA_FIELDS);
      const nodeFile = {
        ...expectedFile,
        alternativeText: expectedFile.alternativeText || expectedFile.name,
        url: prefixFileUrlWithBackendUrl(f.url),
        mime: f.mime,
        name: f.name
      };
      return nodeFile;
    });
    console.log("📎 Jodit: Media library assets selected", formattedFiles);
    onChange(formattedFiles);
  };
  if (!isOpen || !ImageDialog) {
    return null;
  }
  const ComponentToRender = ImageDialog?.default || ImageDialog;
  return /* @__PURE__ */ jsx(
    ComponentToRender,
    {
      onClose: onToggle,
      onSelectAssets: handleSelectAssets,
      allowedTypes: [
        "files",
        "images",
        "videos",
        "audios"
      ]
    }
  );
};
const JoditInput = ({
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
  metadatas
}) => {
  const mediaLibButton = {
    name: "strapiMedia",
    iconURL: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiIgd2lkdGg9IjMycHgiIGhlaWdodD0iMzJweCIgZmlsbD0iIzIxMjEzNCI+PHBhdGggZD0iTTI3IDVIOWEyIDIgMCAwIDAtMiAydjJINWEyIDIgMCAwIDAtMiAydjE0YTIgMiAwIDAgMCAyIDJoMThhMiAyIDAgMCAwIDItMnYtMmgyYTIgMiAwIDAgMCAyLTJWN2EyIDIgMCAwIDAtMi0ybS01LjUgNGExLjUgMS41IDAgMSAxIDAgMyAxLjUgMS41IDAgMCAxIDAtM00yMyAyNUg1VjExaDJ2MTBhMiAyIDAgMCAwIDIgMmgxNHptNC00SDl2LTQuNWw0LjUtNC41IDYuMjA4IDYuMjA4YTEgMSAwIDAgMCAxLjQxMyAwTDI0LjMzIDE1IDI3IDE3LjY3MnoiPjwvcGF0aD48L3N2Zz4=",
    tooltip: "Strapi Media Library",
    exec: function(jodit) {
      console.log(`📎 Jodit: Open Strapi media library`);
      jodit.selection.insertHTML(cursorPlaceholderContent);
      const newContent = jodit.value;
      onChange({ target: { name, value: newContent.split(cursorPlaceholderContent).join("").trim() } });
      toggleMediaLib();
    }
  };
  const { formatMessage } = useIntl();
  const { post } = useFetchClient();
  const editorRef = useRef(null);
  const [mediaLibVisible, setMediaLibVisible] = useState(false);
  const [initialValue] = useState(value || "");
  const [isLoading, setIsLoading] = useState(false);
  const toggleMediaLib = useCallback(() => {
    setMediaLibVisible((prev) => !prev);
  }, []);
  const fileToMediaObject = async (file, handleFileUpload2, webpEnabled2 = []) => {
    return new Promise(async (resolve) => {
      if (handleFileUpload2) {
        try {
          console.log("📎 Jodit: Uploading image to media library...");
          setIsLoading(true);
          let uploadedUrl = await handleFileUpload2(file);
          if (uploadedUrl) {
            if (webpEnabled2.includes(file.type)) {
              console.log("📎 Jodit: WebP conversion enabled, converting image...", file.type);
              uploadedUrl = uploadedUrl.replace(`.${file.type.replace("image/", "")}`, ".webp");
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
            console.warn("📎 Jodit: Upload failed, falling back to base64");
          }
        } catch (error2) {
          console.error("📎 Jodit: Upload error, falling back to base64:", error2);
        }
        setIsLoading(false);
      }
    });
  };
  const handleMediaLibChange = async (files) => {
    const mediaToInsert = files.length ? files.filter((file) => file.mime?.startsWith("image/") || file.mime?.startsWith("video/") || file.mime?.startsWith("audio/")).map((file) => generateMediaHtml(file)).join("") : "";
    const jodit = editorRef.current;
    const nodeToSelect = jodit?.editor.querySelector(cursorPlaceholder);
    if (nodeToSelect) {
      jodit?.selection?.setCursorBefore(nodeToSelect);
      jodit?.selection.removeNode(nodeToSelect);
    }
    jodit?.selection.insertHTML(mediaToInsert, true);
    setMediaLibVisible(false);
  };
  const options = attribute?.options || {};
  const height = options.height || 400;
  const buttons = options.buttons ? options.buttons.split(",").map((btn) => btn.trim()) : DEFAULT_BUTTONS.split(",").map((btn) => btn.trim());
  const mediaLibButtonIndex = buttons.findIndex((btn) => btn === STRAPI_MEDIA_BUTTON_NAME);
  if (mediaLibButtonIndex !== -1) {
    buttons[mediaLibButtonIndex] = mediaLibButton;
  }
  const removeButtons = options.removeButtons ? options.removeButtons.split(",").map((btn) => btn.trim()) : [];
  const showToolbar = options.toolbar !== false;
  const fonts = options.fonts ? options.fonts.split("\n").reduce((acc, font) => {
    acc[`${font.trim()}`] = font.split(",")[0].trim();
    return acc;
  }, {}) : {};
  const webpEnabled = options.webp !== "" ? options.webp?.split(",") : [];
  const handleFileUpload = useCallback(async (file) => {
    try {
      const formData = new FormData();
      formData.append("files", file);
      const response = await post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      if (response.data && response.data.length > 0) {
        const uploadedFile = response.data[0];
        console.log("Jodit file uploaded successfully:", uploadedFile);
        return prefixFileUrlWithBackendUrl(uploadedFile.url);
      }
      return null;
    } catch (error2) {
      console.error("Jodit file upload error:", error2);
      return null;
    }
  }, [post]);
  const config = useMemo(() => ({
    readonly: disabled || options.readonly || false,
    height,
    toolbar: showToolbar,
    adaptive: false,
    // Отключает общую адаптивность
    toolbarAdaptive: false,
    // Запрещает прятать кнопки в "три точки"
    width: "100%",
    placeholder: formatMessage({
      id: placeholder || "jodit-editor.placeholder",
      defaultMessage: intlLabel?.defaultMessage || "Start typing here..."
    }),
    style: {
      fontFamily: "Helvetica",
      fontSize: "14px",
      h1: {
        fontSize: "24px",
        fontWeight: "bold"
      }
    },
    // Toolbar configuration
    buttons,
    removeButtons,
    controls: {
      font: {
        list: Object.keys(fonts).length > 0 ? fonts : {}
      }
    },
    // Event handlers
    events: {
      afterInit: function(jodit) {
        console.log("📎 Jodit: Editor initialized, storing instance:", jodit);
      },
      beforeOpen: () => {
        console.log("📎 Jodit: Editor opened");
      },
      // Handle paste events for images, videos, and audio
      paste: async (e) => {
        const items = e.clipboardData?.items;
        const jodit = editorRef.current;
        jodit?.selection.insertHTML(cursorPlaceholderContent);
        if (items) {
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.startsWith("image/") || item.type.startsWith("video/") || item.type.startsWith("audio/")) {
              e.preventDefault();
              const file = item.getAsFile();
              if (file) {
                const mediaObject = await fileToMediaObject(file, handleFileUpload, webpEnabled);
                const mediaHtml = generateMediaHtml(mediaObject);
                const jodit2 = editorRef.current;
                const nodeToSelect = jodit2?.editor.querySelector(cursorPlaceholder);
                if (nodeToSelect) {
                  jodit2?.selection?.setCursorBefore(nodeToSelect);
                  jodit2?.selection.removeNode(nodeToSelect);
                }
                jodit2?.selection.insertHTML(mediaHtml);
                const newContent = jodit2?.value || "";
                onChange({ target: { name, value: newContent.split(cursorPlaceholderContent).join("").trim() } });
              }
              break;
            }
          }
        }
      },
      // Handle drag and drop for images, videos, and audio
      drop: async (e) => {
        const jodit = editorRef.current;
        jodit?.selection.insertHTML(cursorPlaceholderContent);
        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
          e.preventDefault();
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.type.startsWith("image/") || file.type.startsWith("video/") || file.type.startsWith("audio/")) {
              const mediaObject = await fileToMediaObject(file, handleFileUpload, webpEnabled);
              const mediaHtml = generateMediaHtml(mediaObject);
              const jodit2 = editorRef.current;
              const nodeToSelect = jodit2?.editor.querySelector(cursorPlaceholder);
              if (nodeToSelect) {
                jodit2?.selection?.setCursorBefore(nodeToSelect);
                jodit2?.selection.removeNode(nodeToSelect);
              }
              jodit2?.selection.insertHTML(mediaHtml);
              const newContent = jodit2?.value || "";
              onChange({ target: { name, value: newContent.split(cursorPlaceholderContent).join("").trim() } });
            }
          }
        }
      }
    },
    // Language configuration
    language: "en",
    // Theme
    theme: "default",
    // Additional Strapi-specific settings
    beautifyHTML: true,
    allowTabNavigation: true,
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    cleanHTML: {
      disableCleanFilter: "true"
    }
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
  const displayLabel = label || fieldSchema?.displayName || metadatas?.label || formatMessage(intlLabel);
  const displayDescription = description || fieldSchema?.description || metadatas?.description;
  const displayHint = hint;
  return /* @__PURE__ */ jsxs(
    Field.Root,
    {
      name,
      id: name,
      required,
      error,
      hint: displayHint,
      style: { position: "relative" },
      children: [
        /* @__PURE__ */ jsx(Field.Label, { children: displayLabel }),
        /* @__PURE__ */ jsx(JoditContainer, { children: /* @__PURE__ */ jsx(
          JoditEditor,
          {
            value: initialValue,
            ref: editorRef,
            editorRef: (editor) => {
              editorRef.current = editor;
            },
            config,
            onBlur: (newContent) => {
              console.log("📎 Jodit: Content changed", newContent?.length || 0, "characters");
              const jodit = editorRef.current;
              jodit?.selection.save();
              onChange({ target: { name, value: newContent.split(cursorPlaceholderContent).join("").trim() } });
            },
            onChange: (newContent) => {
              console.log("📎 Jodit: Content changed", newContent?.length || 0, "characters");
              const jodit = editorRef.current;
              jodit?.selection.save();
              onChange({ target: { name, value: newContent.split(cursorPlaceholderContent).join("").trim() } });
            }
          }
        ) }),
        displayDescription ? /* @__PURE__ */ jsx(Field.Hint, { children: displayDescription }) : null,
        error ? /* @__PURE__ */ jsx(Field.Error, { children: error }) : null,
        /* @__PURE__ */ jsx(
          MediaLib,
          {
            isOpen: mediaLibVisible,
            onChange: handleMediaLibChange,
            onToggle: toggleMediaLib
          }
        ),
        isLoading ? /* @__PURE__ */ jsx(
          "div",
          {
            style: {
              position: "absolute",
              top: 0,
              right: 0,
              width: "100%",
              height: "100%",
              background: "rgba(255,255,255,0.5)"
            },
            children: /* @__PURE__ */ jsx(
              "div",
              {
                style: {
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(255,255,255,0.5)"
                },
                children: /* @__PURE__ */ jsx(Loader, {})
              }
            )
          }
        ) : null
      ]
    }
  );
};
const JoditInput_default = memo(JoditInput, (prevProps, nextProps) => {
  return prevProps.name === nextProps.name && prevProps.required === nextProps.required && prevProps.disabled === nextProps.disabled && prevProps.error === nextProps.error;
});
export {
  JoditInput_default as default
};
//# sourceMappingURL=JoditInput-Dc2R3hiz.mjs.map
