import type { Core } from '@strapi/strapi';
declare const service: ({ strapi }: {
    strapi: Core.Strapi;
}) => {
    getWelcomeMessage(): string;
    getPublicAiButtons(): {
        name: string;
        label: string;
    }[];
    cleanWithAi(buttonName: string, content: string): Promise<string>;
};
export default service;
