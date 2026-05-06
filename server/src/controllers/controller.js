"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const controller = ({ strapi }) => ({
    index(ctx) {
        ctx.body = strapi
            .plugin('jodit-editor')
            // the name of the service file & the method.
            .service('service')
            .getWelcomeMessage();
    },
    aiButtons(ctx) {
        ctx.body = {
            buttons: strapi.plugin('jodit-editor').service('service').getPublicAiButtons(),
        };
    },
    async cleanWithAi(ctx) {
        const { button, content } = ctx.request.body || {};
        if (!button || typeof button !== 'string') {
            return ctx.badRequest('AI button name is required');
        }
        if (typeof content !== 'string') {
            return ctx.badRequest('Editor content is required');
        }
        try {
            const cleanedContent = await strapi
                .plugin('jodit-editor')
                .service('service')
                .cleanWithAi(button, content);
            ctx.body = {
                content: cleanedContent,
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'AI clean failed';
            ctx.throw(400, message);
        }
    },
});
exports.default = controller;
