declare const _default: {
    register: ({ strapi }: {
        strapi: import("@strapi/types/dist/core").Strapi;
    }) => void;
    bootstrap: ({ strapi }: {
        strapi: import("@strapi/types/dist/core").Strapi;
    }) => void;
    destroy: ({ strapi }: {
        strapi: import("@strapi/types/dist/core").Strapi;
    }) => void;
    config: {
        default: {
            aiButtons: {};
        };
        validator(): void;
    };
    controllers: {
        controller: ({ strapi }: {
            strapi: import("@strapi/types/dist/core").Strapi;
        }) => {
            index(ctx: any): void;
            aiButtons(ctx: any): void;
            cleanWithAi(ctx: any): Promise<any>;
        };
    };
    routes: {
        admin: {
            type: string;
            routes: {
                method: string;
                path: string;
                handler: string;
                config: {
                    /**
                     * Plugin server methods
                     */
                    policies: string[];
                };
            }[];
        };
        'content-api': {
            type: string;
            routes: {
                method: string;
                path: string;
                handler: string;
                /**
                 * Plugin server methods
                 */
                config: {
                    policies: any[];
                };
            }[];
        };
    };
    services: {
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
    contentTypes: {};
    policies: {};
    middlewares: {};
};
export default _default;
