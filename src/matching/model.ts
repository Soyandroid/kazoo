type Brand<T, B> = T & { __brand: B };

export type FactionCode = Brand<0 | 1, "FactionCode">;
export type GroupId = Brand<string, "GroupId">;
export type JoinType = "auto_join" | "create_always" | "create_nothing";
export type MemberId = Brand<number, "MemberId">;
export type TopicId = Brand<string, "TopicId">;

export interface GroupCreateJson {
  max: number[];
  attr: any;
  // filter: any;
}

export interface GroupJson {
  max: number[];
  attr: any;
  member: MemberId[][];
}

export interface GroupStatus {
  [key: string]: Buffer;
}