import { SessionId } from "./session";
import { Brand } from "./util";

export type SyncKey = Brand<string, "SyncKey">;
export type TimeoutSec = Brand<number, "TimeoutSec">;

export class Sync {
  public readonly count: number;

  private readonly _promise: Promise<Sync>;
  private readonly _sessionIds: Set<SessionId>;

  private _resolve: (self: Sync) => void;

  constructor(count: number, timeoutSec: TimeoutSec) {
    this.count = count;
    this._promise = new Promise(resolve => (this._resolve = resolve));
    this._sessionIds = new Set();

    global.setTimeout(() => this._resolve(this), timeoutSec * 1000);
  }

  join(sessionId: SessionId) {
    this._sessionIds.add(sessionId);

    if (this._sessionIds.size >= this.count) {
      this._resolve(this);
    }
  }

  // This will be invoked if a session is aborted prior to resolution
  leave(sessionId: SessionId) {
    this._sessionIds.delete(sessionId);
  }

  get promise(): Promise<Sync> {
    return this._promise;
  }

  get sessionIds(): SessionId[] {
    const items: SessionId[] = [];

    for (const sessionId of this._sessionIds) {
      items.push(sessionId);
    }

    return items;
  }
}
