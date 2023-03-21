import { ObjectId } from "bson";
import {
  Flags,
  GetFlags,
  MinMax,
  Borg,
  RequiredKeysArray,
  PrettyPrint,
} from ".";

export type Meta = PrettyPrint<
  {
    optional: boolean;
    nullable: boolean;
    private: boolean;
  } & (
    | {
        kind: "object";
        keys: (string | undefined)[];
        requiredKeys: (string | undefined)[];
        shape: { [key: string]: Borg };
      }
    | {
        itemsBorg: Borg;
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

export type ObjectMeta<
  TOpts extends Flags,
  TShape extends { [key: string]: Borg },
> = {
  kind: "object";
  keys: Array<Extract<keyof TShape, string>>;
  requiredKeys: RequiredKeysArray<TShape>;
  shape: TShape;
} & GetFlags<TOpts>;

export type ArrayMeta<
  TItemBorg extends Borg,
  TOpts extends Flags,
  TLength extends MinMax,
> = {
  itemsBorg: TItemBorg;
  kind: "array";
  maxItems: TLength[1];
  minItems: TLength[0];
} & GetFlags<TOpts>;

export type StringMeta<
  TOpts extends Flags,
  TLength extends MinMax,
  TPattern extends string,
> = {
  kind: "string";
  maxLength: TLength[1];
  minLength: TLength[0];
  pattern: TPattern;
  regex: TPattern extends ".*" ? undefined : RegExp;
} & GetFlags<TOpts>;

export type NumberMeta<TOpts extends Flags, TRange extends MinMax> = {
  kind: "number";
  max: TRange[1];
  min: TRange[0];
} & GetFlags<TOpts>;

export type IdMeta<TOpts extends Flags, TFormat extends string | ObjectId> = {
  kind: "id";
  format: TFormat extends ObjectId ? "oid" : "string";
} & GetFlags<TOpts>;

export type BooleanMeta<TOpts extends Flags> = {
  kind: "boolean";
} & GetFlags<TOpts>;
