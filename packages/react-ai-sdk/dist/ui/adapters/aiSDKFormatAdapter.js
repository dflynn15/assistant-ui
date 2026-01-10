export const aiSDKV6FormatAdapter = {
    format: "ai-sdk/v6",
    encode({ message: { id, parts, ...message }, }) {
        // Filter out FileContentParts until they are supported
        return {
            ...message,
            parts: parts.filter((part) => part.type !== "file"),
        };
    },
    decode(stored) {
        return {
            parentId: stored.parent_id,
            message: {
                id: stored.id,
                ...stored.content,
            },
        };
    },
    getId(message) {
        return message.id;
    },
};
//# sourceMappingURL=aiSDKFormatAdapter.js.map