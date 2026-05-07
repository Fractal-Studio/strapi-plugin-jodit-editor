import type { Core } from '@strapi/strapi';
declare const controller: ({ strapi }: {
    strapi: Core.Strapi;
}) => {
    index(ctx: any): void;
    aiButtons(ctx: any): void;
    cleanWithAi(ctx: any): Promise<any>;
};
export default controller;
