import { ObjectId } from "bson";
import {
  Flags,
  GetFlags,
  MinMax,
  Borg,
  RequiredKeysArray,
  PrettyPrint,
} from ".";
import B from "src";

export type Meta = PrettyPrint<
  {
    optional: boolean;
    nullable: boolean;
    private: boolean;
  } & (
    | {
        kind: "union";
        borgMembers: Borg[];
      }
    | {
        kind: "object";
        keys: (string | undefined)[];
        requiredKeys: (string | undefined)[];
        borgShape: { [key: string]: Borg };
      }
    | {
        borgItems: Borg;
        kind: "array";
        maxItems: number | null;
        minItems: number | null;
      }
    | {
        kind: "string";
        maxLength: number | null;
        minLength: number | null;
        pattern: string | undefined;
        regex: RegExp | undefined;
      }
    | {
        kind: "number";
        max: number | null;
        min: number | null;
      }
    | {
        kind: "boolean";
      }
    | {
        kind: "id";
        format: "string" | "oid";
      }
  )
>;

export type UnionMeta<
  TFlags extends Flags,
  TBorgMembers extends Borg[],
> = PrettyPrint<
  {
    kind: "union";
    borgMembers: TBorgMembers;
  } & GetFlags<TFlags>
>;

export type ObjectMeta<
  TFlags extends Flags,
  TShape extends { [key: string]: Borg },
> = PrettyPrint<{
  kind: "object";
  keys: Array<Extract<keyof TShape, string>>;
  requiredKeys: RequiredKeysArray<TShape>;
  borgShape: TShape;
} & GetFlags<TFlags>>;

export type ArrayMeta<
  TFlags extends Flags,
  TLength extends MinMax,
  TItemBorg extends Borg,
> = PrettyPrint<{
  borgItems: TItemBorg;
  kind: "array";
  maxItems: TLength[1];
  minItems: TLength[0];
} & GetFlags<TFlags>>;

export type StringMeta<
  TFlags extends Flags,
  TLength extends MinMax,
  TPattern extends string,
> = PrettyPrint<{
  kind: "string";
  maxLength: TLength[1];
  minLength: TLength[0];
  pattern: TPattern;
  regex: TPattern extends ".*" ? undefined : RegExp;
} & GetFlags<TFlags>>;

export type NumberMeta<
  TFlags extends Flags,
  TRange extends MinMax,
> = PrettyPrint<{
  kind: "number";
  max: TRange[1];
  min: TRange[0];
} & GetFlags<TFlags>>;

export type IdMeta<
  TFlags extends Flags,
  TFormat extends string | ObjectId,
> = PrettyPrint<{
  kind: "id";
  format: TFormat extends ObjectId ? "oid" : "string";
} & GetFlags<TFlags>>;

export type BooleanMeta<TFlags extends Flags> = PrettyPrint<{
  kind: "boolean";
} & GetFlags<TFlags>>;

export type MetaFromBorg<TBorg extends Borg> = TBorg extends B.Object<
  infer TFlags,
  infer TShape
>
  ? ObjectMeta<TFlags, TShape>
  : TBorg extends B.Array<infer TFlags, infer TLength, infer TItems>
  ? ArrayMeta<TFlags, TLength, TItems>
  : TBorg extends B.String<infer TFlags, infer TLength, infer TPattern>
  ? StringMeta<TFlags, TLength, TPattern>
  : TBorg extends B.Number<infer TFlags, infer TRange>
  ? NumberMeta<TFlags, TRange>
  : TBorg extends B.Id<infer TFlags, infer TFormat>
  ? IdMeta<TFlags, TFormat>
  : TBorg extends B.Boolean<infer TFlags>
  ? BooleanMeta<TFlags>
  : Meta
