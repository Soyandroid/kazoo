import { Group, GroupId, GroupKey, GroupMember, GroupSpec } from "./group";
import { Topic, TopicKey, Subscriber } from "./pubsub";
import { StatusGroup, StatusGroupMember, StatusKey } from "./status";
import { Sync, SyncKey, TimeoutSec } from "./sync";
import { SessionId } from "./session";

export class World {
  private _nextGroupId = 100;
  private _groups: Group[] = [];
  private readonly _sgroups = new Map<StatusKey, StatusGroup>();
  private readonly _topics = new Map<TopicKey, Topic>();
  private readonly _syncs = new Map<SyncKey, Sync>();

  createGroup(key: GroupKey, spec: GroupSpec): Group {
    const id = this._nextGroupId++ as GroupId;
    const group = new Group(key, id, spec);

    this._groups.push(group);

    return group;
  }

  searchGroups(key: GroupKey): Group[] {
    return this._groups.filter(group => group.key === key);
  }

  existingGroup(id: GroupId): Group | undefined {
    return this._groups.find(group => group.id === id);
  }

  leaveGroups(member: GroupMember) {
    this._groups.forEach(group => group.leave(member));

    const condemned = this._groups.filter(group => group.isEmpty());

    this._groups = this._groups.filter(group => !group.isEmpty());

    condemned.forEach(group =>
      console.log(`Matching: Group ${group.key} ${group.id} GCed`)
    );
  }

  destroyGroup(id: GroupId) {
    const condemned = this._groups.filter(item => item.id === id);

    this._groups = this._groups.filter(item => item.id !== id);

    condemned.forEach(item => {
      console.log(
        `Matching: Group ${item.key} ${item.id} explicitly destroyed!`
      );

      item.destroy();
    });
  }

  createStatusGroup(key: StatusKey): StatusGroup {
    const existing = this._sgroups.get(key);
    const sgroup = existing || new StatusGroup(key);

    this._sgroups.set(key, sgroup);

    return sgroup;
  }

  leaveStatusGroups(member: StatusGroupMember) {
    const condemned: StatusKey[] = [];

    this._sgroups.forEach((sgroup, statusKey) => {
      sgroup.leave(member);

      if (sgroup.isEmpty()) {
        condemned.push(statusKey);
      }
    });

    condemned.forEach(statusKey => this._sgroups.delete(statusKey));
    condemned.forEach(statusKey =>
      console.log(`Matching: Status group ${statusKey} GCed`)
    );
  }

  destroyStatusGroup(id: StatusKey) {
    const condemned = this._sgroups.get(id);

    this._sgroups.delete(id);

    if (condemned !== undefined) {
      console.log(
        `Matching: Status group ${condemned.key} explicitly destroyed!`
      );

      condemned.destroy();
    }
  }

  existingTopic(id: TopicKey): Topic | undefined {
    return this._topics.get(id);
  }

  topic(key: TopicKey): Topic {
    const existing = this._topics.get(key);
    const topic = existing || new Topic(key);

    this._topics.set(key, topic);

    return topic;
  }

  leaveTopics(sub: Subscriber) {
    const condemned: TopicKey[] = [];

    this._topics.forEach((topic, topicKey) => {
      topic.unsubscribe(sub);

      if (topic.isEmpty()) {
        condemned.push(topicKey);
      }
    });

    condemned.forEach(topicKey => this._topics.delete(topicKey));
    condemned.forEach(topicKey =>
      console.log(`Matching: Topic ${topicKey} GCed`)
    );
  }

  sync(
    key: SyncKey,
    count: number,
    timeoutSec: TimeoutSec,
    sessionId: SessionId
  ): Promise<Sync> {
    const existing = this._syncs.get(key);
    let sync: Sync;

    if (existing !== undefined) {
      sync = existing;
    } else {
      sync = new Sync(count, timeoutSec);
      this._syncs.set(key, sync);

      // Automatically unregister this sync group when it resolves
      sync.promise.then(() => this._syncs.delete(key));
    }

    sync.join(sessionId);

    return sync.promise;
  }

  desync(sessionId: SessionId) {
    this._syncs.forEach(sync => sync.leave(sessionId));
  }
}
