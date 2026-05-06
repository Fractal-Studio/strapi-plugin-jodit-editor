import type { Core } from '@strapi/strapi';

type AiButtonConfig = {
  label?: string;
  apiUrl?: string;
  apiKey?: string;
  apiModel?: string;
  prompt?: string;
  promt?: string;
};

const getAiButtonsConfig = (strapi: Core.Strapi): Record<string, AiButtonConfig> => {
  const config = strapi.config.get('plugin::jodit-editor', {}) || {};

  const pluginConfig = config as {
    config?: {
      aiButtons?: Record<string, AiButtonConfig>;
    };
    aiButtons?: Record<string, AiButtonConfig>;
  };

  return pluginConfig.aiButtons || pluginConfig.config?.aiButtons || {};
};

const normalizeChatCompletionsUrl = (apiUrl: string) => {
  const trimmed = apiUrl.trim().replace(/\/$/, '');
  return trimmed.endsWith('/chat/completions') ? trimmed : `${trimmed}/chat/completions`;
};

const stripMarkdownFence = (content: string) => {
  return content
    .replace(/^```(?:html)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
};

const service = ({ strapi }: { strapi: Core.Strapi }) => ({
  getWelcomeMessage() {
    return 'Welcome to Strapi 🚀';
  },

  getPublicAiButtons() {
    const aiButtons = getAiButtonsConfig(strapi);

    return Object.entries(aiButtons)
      .filter(([, config]) => config?.apiUrl && config?.apiKey && config?.apiModel)
      .map(([name, config]) => ({
        name,
        label: config.label || (name === 'aiClean' ? 'AI clean' : name),
      }));
  },

  async cleanWithAi(buttonName: string, content: string) {
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

    const data: any = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        data?.error?.message ||
        data?.message ||
        `AI API request failed with status ${response.status}`;
      throw new Error(message);
    }

    const cleanedContent = data?.choices?.[0]?.message?.content;

    if (!cleanedContent || typeof cleanedContent !== 'string') {
      throw new Error('AI API response does not contain cleaned content');
    }

    return stripMarkdownFence(cleanedContent);
  },
});

export default service;
