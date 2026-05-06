"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const register = ({ strapi }) => {
    // Register the Jodit custom field on the server side
    strapi.customFields.register({
        name: 'jodit',
        plugin: 'jodit-editor',
        type: 'richtext',
        inputSize: {
            default: 12,
            isResizable: true,
        },
    });
    console.log('🎯 Jodit Editor plugin - SERVER REGISTER function called!');
    console.log('🎯 Jodit custom field registered on server side successfully!');
};
exports.default = register;
