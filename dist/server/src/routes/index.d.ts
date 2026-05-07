declare const routes: {
    admin: {
        type: string;
        routes: {
            method: string;
            path: string;
            handler: string;
            config: {
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
            config: {
                policies: any[];
            };
        }[];
    };
};
export default routes;
