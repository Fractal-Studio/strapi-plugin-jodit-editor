"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getAiButtonsConfig = (strapi) => {
    var _a;
    const config = strapi.config.get('plugin::jodit-editor', {}) || {};
    const pluginConfig = config;
    return pluginConfig.aiButtons || ((_a = pluginConfig.config) === null || _a === void 0 ? void 0 : _a.aiButtons) || {};
};
const normalizeChatCompletionsUrl = (apiUrl) => {
    const trimmed = apiUrl.trim().replace(/\/$/, '');
    return trimmed.endsWith('/chat/completions') ? trimmed : `${trimmed}/chat/completions`;
};
const stripMarkdownFence = (content) => {
    return content
        .replace(/^```(?:html)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
};
const service = ({ strapi }) => ({
    getWelcomeMessage() {
        return 'Welcome to Strapi 🚀';
    },
    getPublicAiButtons() {
        const aiButtons = getAiButtonsConfig(strapi);
        return Object.entries(aiButtons)
            .filter(([, config]) => (config === null || config === void 0 ? void 0 : config.apiUrl) && (config === null || config === void 0 ? void 0 : config.apiKey) && (config === null || config === void 0 ? void 0 : config.apiModel))
            .map(([name, config]) => ({
            name,
            label: config.label || (name === 'aiClean' ? 'AI clean' : name),
        }));
    },
    async cleanWithAi(buttonName, content) {
        var _a, _b, _c, _d;
        const config = getAiButtonsConfig(strapi)[buttonName];
        if (!config) {
            throw new Error(`AI button "${buttonName}" is not configured`);
        }
        const { apiUrl, apiKey, apiModel } = config;
        const prompt = config.prompt || config.promt;
        if (!apiUrl || !apiKey || !apiModel || !prompt) {
            throw new Error(`AI button "${buttonName}" has incomplete configuration`);
        }
        const response = await fetch(normalizeChatCompletionsUrl(apiUrl), {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: apiModel,
                messages: [
                    {
                        role: 'system',
                        content: prompt,
                    },
                    {
                        role: 'user',
                        content,
                    },
                ],
                temperature: 0,
            }),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
            const message = ((_a = data === null || data === void 0 ? void 0 : data.error) === null || _a === void 0 ? void 0 : _a.message) ||
                (data === null || data === void 0 ? void 0 : data.message) ||
                `AI API request failed with status ${response.status}`;
            throw new Error(message);
        }
        const cleanedContent = (_d = (_c = (_b = data === null || data === void 0 ? void 0 : data.choices) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.content;
        if (!cleanedContent || typeof cleanedContent !== 'string') {
            throw new Error('AI API response does not contain cleaned content');
        }
        return stripMarkdownFence(cleanedContent);
    },
});
exports.default = service;
