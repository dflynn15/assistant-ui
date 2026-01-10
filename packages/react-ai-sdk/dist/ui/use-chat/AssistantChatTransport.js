import { DefaultChatTransport, } from "ai";
import z from "zod";
const toAISDKTools = (tools) => {
    return Object.fromEntries(Object.entries(tools).map(([name, tool]) => [
        name,
        {
            ...(tool.description ? { description: tool.description } : undefined),
            parameters: (tool.parameters instanceof z.ZodType
                ? z.toJSONSchema(tool.parameters)
                : tool.parameters),
        },
    ]));
};
const getEnabledTools = (tools) => {
    return Object.fromEntries(Object.entries(tools).filter(([, tool]) => !tool.disabled && tool.type !== "backend"));
};
export class AssistantChatTransport extends DefaultChatTransport {
    runtime;
    constructor(initOptions) {
        super({
            ...initOptions,
            prepareSendMessagesRequest: async (options) => {
                const context = this.runtime?.thread.getModelContext();
                const id = (await this.runtime?.threads.mainItem.initialize())?.remoteId ??
                    options.id;
                const optionsEx = {
                    ...options,
                    body: {
                        callSettings: context?.callSettings,
                        system: context?.system,
                        tools: toAISDKTools(getEnabledTools(context?.tools ?? {})),
                        ...options?.body,
                    },
                };
                const preparedRequest = await initOptions?.prepareSendMessagesRequest?.(optionsEx);
                return {
                    ...preparedRequest,
                    body: preparedRequest?.body ?? {
                        ...optionsEx.body,
                        id,
                        messages: options.messages,
                        trigger: options.trigger,
                        messageId: options.messageId,
                        metadata: options.requestMetadata,
                    },
                };
            },
        });
    }
    setRuntime(runtime) {
        this.runtime = runtime;
    }
}
//# sourceMappingURL=AssistantChatTransport.js.map