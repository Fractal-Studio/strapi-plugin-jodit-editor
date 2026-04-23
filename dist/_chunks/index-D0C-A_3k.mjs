import { useRef, useEffect } from "react";
import { jsx } from "react/jsx-runtime";
import { Pencil } from "@strapi/icons";
import { Flex } from "@strapi/design-system";
import styled from "styled-components";
import "jodit/es2015/jodit.css";
const __variableDynamicImportRuntimeHelper = (glob, path, segs) => {
  const v = glob[path];
  if (v) {
    return typeof v === "function" ? v() : Promise.resolve(v);
  }
  return new Promise((_, reject) => {
    (typeof queueMicrotask === "function" ? queueMicrotask : setTimeout)(
      reject.bind(
        null,
        new Error(
          "Unknown variable dynamic import: " + path + (path.split("/").length !== segs ? ". Note that variables only represent file names one level deep." : "")
        )
      )
    );
  });
};
const PLUGIN_ID = "jodit-editor";
const Initializer = ({ setPlugin }) => {
  const ref = useRef(setPlugin);
  useEffect(() => {
    ref.current(PLUGIN_ID);
  }, []);
  return null;
};
const IconBox = styled(Flex)`
  padding: 6px;
  background-color: #f0f0ff; /* primary100 */
  border: 1px solid #d9d8ff; /* primary200 */
  svg > path {
    fill: #4945ff; /* primary600 */
  }
`;
const PluginIcon = () => /* @__PURE__ */ jsx(IconBox, { justifyContent: "center", alignItems: "center", hasRadius: true, children: /* @__PURE__ */ jsx(Pencil, {}) });
const STRAPI_MEDIA_BUTTON_NAME = "strapiMedia";
const DEFAULT_BUTTONS = `source, bold, italic, underline, strikethrough, superscript, subscript, eraser, font, fontsize, brush, paragraph, classSpan, |, ul, ol, indent, outdent, left, center, right, justify, |, link, unlink, ${STRAPI_MEDIA_BUTTON_NAME}, image, file, video, table, hr, symbols, lineHeight, |, copy, cut, paste, copyformat, selectall, undo, redo, fullsize, print, preview, find, spellcheck, about, copytext, link`;
const index = {
  register(app) {
    console.log("🎯 Jodit Editor plugin - ADMIN REGISTER function called!");
    const style = document.createElement("style");
    style.type = "text/css";
    style.innerHTML = `
      .jodit .jodit-popup {
        transform: none !important;
      }
    `;
    document.head.appendChild(style);
    app.customFields.register({
      name: "jodit",
      pluginId: PLUGIN_ID,
      type: "richtext",
      icon: PluginIcon,
      intlLabel: {
        id: `${PLUGIN_ID}.jodit.label`,
        defaultMessage: "Jodit Editor"
      },
      intlDescription: {
        id: `${PLUGIN_ID}.jodit.description`,
        defaultMessage: "Rich text editor powered by Jodit with advanced formatting options"
      },
      components: {
        Input: async () => import("./JoditInput-BO8D4Ltc.mjs").then((module) => ({ default: module.default }))
      },
      options: {
        advanced: [
          {
            sectionTitle: {
              id: `${PLUGIN_ID}.jodit.options.advanced.settings`,
              defaultMessage: "Editor Settings"
            },
            items: [
              {
                name: "options.height",
                type: "number",
                intlLabel: {
                  id: `${PLUGIN_ID}.jodit.options.height.label`,
                  defaultMessage: "Editor Height (px)"
                },
                description: {
                  id: `${PLUGIN_ID}.jodit.options.height.description`,
                  defaultMessage: "Set the height of the editor in pixels"
                },
                defaultValue: 400
              },
              {
                name: "options.readonly",
                type: "checkbox",
                intlLabel: {
                  id: `${PLUGIN_ID}.jodit.options.readonly.label`,
                  defaultMessage: "Read Only"
                },
                description: {
                  id: `${PLUGIN_ID}.jodit.options.readonly.description`,
                  defaultMessage: "Make the editor read-only"
                },
                defaultValue: false
              },
              {
                name: "options.buttons",
                type: "textarea",
                intlLabel: {
                  id: `${PLUGIN_ID}.jodit.options.buttons.label`,
                  defaultMessage: "Toolbar Buttons (comma-separated)"
                },
                description: {
                  id: `${PLUGIN_ID}.jodit.options.buttons.description`,
                  defaultMessage: `Specify which buttons to include in the toolbar. Default: ${DEFAULT_BUTTONS} (${STRAPI_MEDIA_BUTTON_NAME} for Strapi's media library)`
                },
                defaultValue: DEFAULT_BUTTONS
              },
              {
                name: "options.removeButtons",
                type: "textarea",
                intlLabel: {
                  id: `${PLUGIN_ID}.jodit.options.removeButtons.label`,
                  defaultMessage: "Remove Buttons (comma-separated)"
                },
                description: {
                  id: `${PLUGIN_ID}.jodit.options.removeButtons.description`,
                  defaultMessage: "Specify which buttons to remove from the toolbar. Example: bold,italic,underline"
                }
              },
              {
                name: "options.toolbar",
                type: "checkbox",
                intlLabel: {
                  id: `${PLUGIN_ID}.jodit.options.toolbar.label`,
                  defaultMessage: "Show Toolbar"
                },
                description: {
                  id: `${PLUGIN_ID}.jodit.options.toolbar.description`,
                  defaultMessage: "Whether to show the editor toolbar"
                },
                defaultValue: true
              },
              {
                name: "options.fonts",
                type: "textarea",
                intlLabel: {
                  id: `${PLUGIN_ID}.jodit.options.fonts.label`,
                  defaultMessage: "Custom Fonts (one line per value)"
                },
                description: {
                  id: `${PLUGIN_ID}.jodit.options.fonts.description`,
                  defaultMessage: "Set the available fonts for the editor. Example: Arial, Helvetica, sans-serif"
                },
                defaultValue: ""
              },
              {
                name: "options.webp",
                type: "textarea",
                intlLabel: {
                  id: `${PLUGIN_ID}.jodit.options.webp.label`,
                  defaultMessage: "WebP Conversion Settings"
                },
                description: {
                  id: `${PLUGIN_ID}.jodit.options.webp.description`,
                  defaultMessage: "Set Mime Types separated by commas for WebP conversion. Example: image/jpeg,image/jpg,image/png,image/bmp"
                },
                defaultValue: ""
              }
            ]
          }
        ]
      }
    });
    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: PLUGIN_ID
    });
    console.log("🎯 Jodit Editor custom field registered successfully!");
  },
  async registerTrads({ locales }) {
    return Promise.all(
      locales.map(async (locale) => {
        try {
          const { default: data } = await __variableDynamicImportRuntimeHelper(/* @__PURE__ */ Object.assign({ "./translations/en.json": () => import("./en-eJbSYHI0.mjs") }), `./translations/${locale}.json`, 3);
          return { data, locale };
        } catch {
          return { data: {}, locale };
        }
      })
    );
  }
};
export {
  DEFAULT_BUTTONS as D,
  STRAPI_MEDIA_BUTTON_NAME as S,
  index as i
};
//# sourceMappingURL=index-D0C-A_3k.mjs.map
