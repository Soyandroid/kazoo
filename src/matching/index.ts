import { Socket } from "net";

import * as Model from "./model";
import { setup } from "./proto/pipeline";
import { Session } from "./session";
import { World } from "./world/world";

const world = new World();
let nextSessionId = 200;

export default async function matching(socket: Socket) {
  const { logger, input, output } = setup(socket);
  const sessionId = nextSessionId++ as Model.SessionId;
  const session = new Session({ sessionId, world, output, logger });

  logger.log(`Session ${sessionId} opened`);

  try {
    for await (const cmd of input) {
      session.dispatch(cmd);
    }
  } catch (e) {
    logger.log(e);
  }

  session.destroy();

  logger.log(`Session ${sessionId} closed`);
}
