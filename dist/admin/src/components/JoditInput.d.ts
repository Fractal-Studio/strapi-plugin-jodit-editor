import React from 'react';
declare module 'styled-components' {
    interface DefaultTheme {
        name: 'light' | 'dark';
    }
}
interface JoditInputProps {
    name: string;
    value: string;
    onChange: (value: any) => void;
    required?: boolean;
    disabled?: boolean;
    error?: string | boolean;
    description?: string;
    intlLabel: {
        id: string;
        defaultMessage: string;
    };
    customFieldUID?: string;
    attribute?: {
        options?: {
            height?: number;
            buttons?: string;
            removeButtons?: string;
            toolbar?: boolean;
            readonly?: boolean;
            fonts?: string;
            webp?: string;
        };
    };
    labelAction?: React.ReactNode;
    label?: string;
    hint?: string;
    placeholder?: string;
    forwardedAs?: string;
    fieldSchema?: {
        displayName?: string;
        description?: string;
        name?: string;
    };
    metadatas?: {
        label?: string;
        description?: string;
        placeholder?: string;
        visible?: boolean;
        editable?: boolean;
    };
}
declare const _default: React.NamedExoticComponent<JoditInputProps>;
export default _default;
