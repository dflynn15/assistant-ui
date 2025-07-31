import { ThreadListRuntimeCore } from "../core/ThreadListRuntimeCore";
import { BaseSubscribable } from "../remote-thread-list/BaseSubscribable";
import { LocalThreadRuntimeCore } from "./LocalThreadRuntimeCore";
import type { TextMessagePart } from "../../types/MessagePartTypes";

export type LocalThreadFactory = () => LocalThreadRuntimeCore;

const EMPTY_ARRAY = Object.freeze([]);
const DEFAULT_TITLE_MAX_LENGTH = 50;

export class LocalThreadListRuntimeCore
  extends BaseSubscribable
  implements ThreadListRuntimeCore
{
  private _mainThread: LocalThreadRuntimeCore;
  private _title: string | undefined;

  constructor(_threadFactory: LocalThreadFactory) {
    super();

    this._mainThread = _threadFactory();
  }

  public get isLoading() {
    return false;
  }

  public getMainThreadRuntimeCore() {
    return this._mainThread;
  }

  public get newThreadId(): string | undefined {
    return undefined; // Single-thread context has no new threads
  }

  public get threadIds(): readonly string[] {
    return EMPTY_ARRAY; // Only main thread exists, but it's not in the "list"
  }

  public get archivedThreadIds(): readonly string[] {
    return EMPTY_ARRAY; // Local threads are never archived
  }

  public get mainThreadId(): string {
    return "__DEFAULT_ID__";
  }

  public getThreadRuntimeCore(_threadId: string) {
    // In local runtime, there's only one thread (the main thread)
    // Return main thread runtime for any requested threadId
    return this._mainThread;
  }

  public getLoadThreadsPromise(): Promise<void> {
    return Promise.resolve(); // Nothing to load for local runtime
  }

  public getItemById(_threadId: string) {
    // In local runtime, there's only one thread (the main thread)
    // Return main thread data for any requested threadId
    return {
      status: "regular" as const,
      threadId: this.mainThreadId,
      remoteId: this.mainThreadId,
      externalId: undefined,
      title: this._title,
      isMain: true,
    };
  }

  public async switchToThread(_threadId: string): Promise<void> {
    // In local runtime, there's only one thread (the main thread)
    // All switch requests are effectively no-ops since we're always on the main thread
    return;
  }

  public switchToNewThread(): Promise<void> {
    throw new Error("Cannot create new threads in local runtime");
  }

  public rename(_threadId: string, newTitle: string): Promise<void> {
    // In local runtime, there's only one thread (the main thread)
    // All rename requests apply to the main thread
    this._title = newTitle;
    this._notifySubscribers();
    return Promise.resolve();
  }

  public archive(_threadId: string): Promise<void> {
    throw new Error("Cannot archive threads in local runtime");
  }

  public detach(_threadId: string): Promise<void> {
    // No-op for local runtime - nothing to detach
    return Promise.resolve();
  }

  public unarchive(_threadId: string): Promise<void> {
    throw new Error("Cannot unarchive threads in local runtime");
  }

  public delete(_threadId: string): Promise<void> {
    throw new Error("Cannot delete the main thread in local runtime");
  }

  public initialize(
    _threadId: string,
  ): Promise<{ remoteId: string; externalId: string | undefined }> {
    // In local runtime, there's only one thread (the main thread)
    // All initialize requests apply to the main thread
    return Promise.resolve({
      remoteId: this.mainThreadId,
      externalId: undefined,
    });
  }

  private _truncateTitle(
    text: string,
    maxLength: number = DEFAULT_TITLE_MAX_LENGTH,
  ): string {
    if (text.length <= maxLength) {
      return text;
    }

    const ellipsis = "...";
    const truncateLength = maxLength - ellipsis.length;
    const truncated = text.substring(0, truncateLength);
    const words = truncated.split(" ");

    // Handle edge case where first word is longer than truncateLength
    if (words.length === 1) {
      return truncated + ellipsis;
    } else {
      // Remove last potentially incomplete word
      return words.slice(0, -1).join(" ") + ellipsis;
    }
  }

  public generateTitle(_threadId: string): Promise<void> {
    // In local runtime, there's only one thread (the main thread)
    // All generateTitle requests apply to the main thread
    const messages = this._mainThread.messages;

    // Find the first user message with text content
    const firstUserMessage = messages.find((msg) => msg.role === "user");

    let title = "New Conversation";

    if (firstUserMessage && firstUserMessage.content.length > 0) {
      // Extract text parts using type-safe filtering
      const textParts = firstUserMessage.content.filter(
        (part) => part.type === "text",
      ) as TextMessagePart[];

      if (textParts.length > 0) {
        const firstTextPart = textParts[0];
        if (firstTextPart) {
          const text = firstTextPart.text.trim();
          if (text.length > 0) {
            title = this._truncateTitle(text);
          }
        }
      }
    }

    this._title = title;
    this._notifySubscribers();
    return Promise.resolve();
  }
}
