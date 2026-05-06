export default [
  {
    method: 'GET',
    path: '/ai-buttons',
    handler: 'plugin::jodit-editor.controller.aiButtons',
    config: {
      policies: ['admin::isAuthenticatedAdmin'],
    },
  },
  {
    method: 'POST',
    path: '/ai-clean',
    handler: 'plugin::jodit-editor.controller.cleanWithAi',
    config: {
      policies: ['admin::isAuthenticatedAdmin'],
    },
  },
];
