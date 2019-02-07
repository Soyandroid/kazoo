import { Context } from "./context";
import * as Model from "../model";
import * as Decoder from "../proto/decoder";
import { Output } from "../proto/pipeline";
import { StatusGroup, StatusGroupMember } from "../world/status";
import { World } from "../world/world";

type StatusCommand = Decoder.StsOpenCommand | Decoder.StsSetCommand;

export class StatusSession implements StatusGroupMember {
  private readonly _world: World;
  private readonly _output: Output;
  private readonly _sessionId: Model.SessionId;

  constructor(ctx: Context) {
    this._world = ctx.world;
    this._output = ctx.output;
    this._sessionId = ctx.sessionId;
  }

  destroy() {
    this._world.leaveStatusGroups(this);
  }

  dispatch(cmd: StatusCommand) {
    switch (cmd.type) {
      case "STS_OPEN":
        return this._stsOpen(cmd);

      case "STS_SET":
        return this._stsSet(cmd);

      default:
        throw new Error("Unimplemented status group command");
    }
  }

  private _stsOpen(cmd: Decoder.StsOpenCommand) {
    const { statusKey, datum } = cmd;
    const sgroup = this._world.createStatusGroup(statusKey);

    sgroup.participate(this, this._sessionId, datum);

    return this._output.write({
      type: "STS_OPEN",
      status: "OK",
      statusKey,
      data: sgroup.data(),
    });
  }

  private _stsSet(cmd: Decoder.StsSetCommand) {
    const { statusKey, datum } = cmd;
    const sgroup = this._world.createStatusGroup(statusKey);

    sgroup.participate(this, this._sessionId, datum);

    // Not explicitly acked, this will generate a STS_NOTIFY though.
  }

  statusChanged(sgroup: StatusGroup, memberId: Model.SessionId) {
    const datum = sgroup.datum(memberId);

    if (datum === undefined) {
      return; // ???
    }

    this._output.write({
      type: "STS_NOTIFY",
      statusKey: sgroup.key,
      sessionId: this._sessionId,
      datum,
    });
  }
}