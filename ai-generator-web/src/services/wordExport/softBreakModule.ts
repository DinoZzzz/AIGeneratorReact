export const createSoftBreakModule = () => {
    const softBreakPlaceholder = '___SOFT_BREAK___';

    return {
        name: 'SoftBreakModule',
        set: function(options: { data: Record<string, unknown> }) {
            if (options.data) {
                const transformValue = (value: unknown): unknown => {
                    if (typeof value === 'string') {
                        return value.replace(/\n/g, softBreakPlaceholder);
                    }
                    if (Array.isArray(value)) {
                        return value.map(transformValue);
                    }
                    if (value && typeof value === 'object') {
                        const transformed: Record<string, unknown> = {};
                        for (const key in value as Record<string, unknown>) {
                            transformed[key] = transformValue((value as Record<string, unknown>)[key]);
                        }
                        return transformed;
                    }
                    return value;
                };
                options.data = transformValue(options.data) as Record<string, unknown>;
            }
        },
        postparse: function(parsed: unknown) {
            return parsed;
        },
        postrender: function(parts: string[]) {
            return parts.map(part =>
                part.replace(new RegExp(softBreakPlaceholder, 'g'), '</w:t><w:br/><w:t>')
            );
        }
    };
};
