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
});
exports.default = controller;
