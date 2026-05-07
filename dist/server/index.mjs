var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
var bootstrap$1 = {};
Object.defineProperty(bootstrap$1, "__esModule", { value: true });
const bootstrap = ({ strapi }) => {
};
var _default$9 = bootstrap$1.default = bootstrap;
var destroy$1 = {};
Object.defineProperty(destroy$1, "__esModule", { value: true });
const destroy = ({ strapi }) => {
};
var _default$8 = destroy$1.default = destroy;
var register$1 = {};
Object.defineProperty(register$1, "__esModule", { value: true });
const register = ({ strapi }) => {
  strapi.customFields.register({
    name: "jodit",
    plugin: "jodit-editor",
    type: "richtext",
    inputSize: {
      default: 12,
      isResizable: true
    }
  });
  console.log("🎯 Jodit Editor plugin - SERVER REGISTER function called!");
  console.log("🎯 Jodit custom field registered on server side successfully!");
};
var _default$7 = register$1.default = register;
var config = {};
Object.defineProperty(config, "__esModule", { value: true });
var _default$6 = config.default = {
  default: {
    aiButtons: {}
  },
  validator() {
  }
};
var contentTypes = {};
Object.defineProperty(contentTypes, "__esModule", { value: true });
var _default$5 = contentTypes.default = {};
var controllers = {};
var controller$1 = {};
Object.defineProperty(controller$1, "__esModule", { value: true });
const controller = ({ strapi }) => ({
  index(ctx) {
    ctx.body = strapi.plugin("jodit-editor").service("service").getWelcomeMessage();
  },
  aiButtons(ctx) {
    ctx.body = {
      buttons: strapi.plugin("jodit-editor").service("service").getPublicAiButtons()
    };
  },
  async cleanWithAi(ctx) {
    const { button, content } = ctx.request.body || {};
    if (!button || typeof button !== "string") {
      return ctx.badRequest("AI button name is required");
    }
    if (typeof content !== "string") {
      return ctx.badRequest("Editor content is required");
    }
    try {
      const cleanedContent = await strapi.plugin("jodit-editor").service("service").cleanWithAi(button, content);
      ctx.body = {
        content: cleanedContent
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI clean failed";
      ctx.throw(400, message);
    }
  }
});
controller$1.default = controller;
var __importDefault$2 = commonjsGlobal && commonjsGlobal.__importDefault || function(mod) {
  return mod && mod.__esModule ? mod : { "default": mod };
};
Object.defineProperty(controllers, "__esModule", { value: true });
const controller_1 = __importDefault$2(controller$1);
var _default$4 = controllers.default = {
  controller: controller_1.default
};
var middlewares = {};
Object.defineProperty(middlewares, "__esModule", { value: true });
var _default$3 = middlewares.default = {};
var policies = {};
Object.defineProperty(policies, "__esModule", { value: true });
var _default$2 = policies.default = {};
var routes$1 = {};
var admin = {};
Object.defineProperty(admin, "__esModule", { value: true });
admin.default = [
  {
    method: "GET",
    path: "/ai-buttons",
    handler: "plugin::jodit-editor.controller.aiButtons",
    config: {
      policies: ["admin::isAuthenticatedAdmin"]
    }
  },
  {
    method: "POST",
    path: "/ai-clean",
    handler: "plugin::jodit-editor.controller.cleanWithAi",
    config: {
      policies: ["admin::isAuthenticatedAdmin"]
    }
  }
];
var contentApi = {};
Object.defineProperty(contentApi, "__esModule", { value: true });
contentApi.default = [
  {
    method: "GET",
    path: "/",
    // name of the controller file & the method.
    handler: "controller.index",
    config: {
      policies: []
    }
  }
];
var __importDefault$1 = commonjsGlobal && commonjsGlobal.__importDefault || function(mod) {
  return mod && mod.__esModule ? mod : { "default": mod };
};
Object.defineProperty(routes$1, "__esModule", { value: true });
const admin_1 = __importDefault$1(admin);
const content_api_1 = __importDefault$1(contentApi);
const routes = {
  admin: {
    type: "admin",
    routes: admin_1.default
  },
  "content-api": {
    type: "content-api",
    routes: content_api_1.default
  }
};
var _default$1 = routes$1.default = routes;
var services = {};
var service$1 = {};
Object.defineProperty(service$1, "__esModule", { value: true });
const LOG_RESPONSE_LIMIT = 8e3;
const getAiButtonsConfig = (strapi) => {
  var _a;
  const config2 = strapi.config.get("plugin::jodit-editor", {}) || {};
  const pluginConfig = config2;
  return pluginConfig.aiButtons || ((_a = pluginConfig.config) === null || _a === void 0 ? void 0 : _a.aiButtons) || {};
};
const normalizeChatCompletionsUrl = (apiUrl) => {
  const trimmed = apiUrl.trim().replace(/\/$/, "");
  return trimmed.endsWith("/chat/completions") ? trimmed : `${trimmed}/chat/completions`;
};
const stripMarkdownFence = (content) => {
  return content.replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/i, "").trim();
};
const safeStringify = (value) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};
const truncateLogValue = (value) => {
  return value.length > LOG_RESPONSE_LIMIT ? `${value.slice(0, LOG_RESPONSE_LIMIT)}... [truncated ${value.length - LOG_RESPONSE_LIMIT} chars]` : value;
};
const service = ({ strapi }) => ({
  getWelcomeMessage() {
    return "Welcome to Strapi 🚀";
  },
  getPublicAiButtons() {
    const aiButtons = getAiButtonsConfig(strapi);
    return Object.entries(aiButtons).filter(([, config2]) => (config2 === null || config2 === void 0 ? void 0 : config2.apiUrl) && (config2 === null || config2 === void 0 ? void 0 : config2.apiKey) && (config2 === null || config2 === void 0 ? void 0 : config2.apiModel)).map(([name, config2]) => ({
      name,
      label: config2.label || (name === "aiClean" ? "AI clean" : name)
    }));
  },
  async cleanWithAi(buttonName, content) {
    var _a, _b, _c, _d;
    const config2 = getAiButtonsConfig(strapi)[buttonName];
    if (!config2) {
      throw new Error(`AI button "${buttonName}" is not configured`);
    }
    const { apiUrl, apiKey, apiModel } = config2;
    const prompt = config2.prompt || config2.promt;
    if (!apiUrl || !apiKey || !apiModel || !prompt) {
      throw new Error(`AI button "${buttonName}" has incomplete configuration`);
    }
    const response = await fetch(normalizeChatCompletionsUrl(apiUrl), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: apiModel,
        messages: [
          {
            role: "system",
            content: prompt
          },
          {
            role: "user",
            content
          }
        ],
        temperature: 0
      })
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const message = ((_a = data === null || data === void 0 ? void 0 : data.error) === null || _a === void 0 ? void 0 : _a.message) || (data === null || data === void 0 ? void 0 : data.message) || `AI API request failed with status ${response.status}`;
      strapi.log.error(`Jodit AI clean: API request failed ${truncateLogValue(safeStringify({
        buttonName,
        apiModel,
        responseStatus: response.status,
        responseKeys: data && typeof data === "object" ? Object.keys(data) : [],
        responseBody: data
      }))}`);
      throw new Error(message);
    }
    const cleanedContent = (_d = (_c = (_b = data === null || data === void 0 ? void 0 : data.choices) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.content;
    if (!cleanedContent || typeof cleanedContent !== "string") {
      strapi.log.error(`Jodit AI clean: response does not contain choices[0].message.content ${truncateLogValue(safeStringify({
        buttonName,
        apiModel,
        responseStatus: response.status,
        responseKeys: data && typeof data === "object" ? Object.keys(data) : [],
        responseBody: data
      }))}`);
      throw new Error("AI API response does not contain cleaned content");
    }
    return stripMarkdownFence(cleanedContent);
  }
});
service$1.default = service;
var __importDefault = commonjsGlobal && commonjsGlobal.__importDefault || function(mod) {
  return mod && mod.__esModule ? mod : { "default": mod };
};
Object.defineProperty(services, "__esModule", { value: true });
const service_1 = __importDefault(service$1);
var _default = services.default = {
  service: service_1.default
};
const index = {
  register: _default$7,
  bootstrap: _default$9,
  destroy: _default$8,
  config: _default$6,
  controllers: _default$4,
  routes: _default$1,
  services: _default,
  contentTypes: _default$5,
  policies: _default$2,
  middlewares: _default$3
};
export {
  index as default
};
//# sourceMappingURL=index.mjs.map
