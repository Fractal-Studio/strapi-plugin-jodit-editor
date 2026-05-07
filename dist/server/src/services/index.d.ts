declare const _default: {
    service: ({ strapi }: {
        strapi: import("@strapi/types/dist/core").Strapi;
    }) => {
        getWelcomeMessage(): string;
        getPublicAiButtons(): {
            name: string;
            label: string;
        }[];
        cleanWithAi(buttonName: string, content: string): Promise<string>;
    };
};
export default _default;
