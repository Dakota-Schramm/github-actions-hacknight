import type { Borg, Type } from "../Borg";

/* 
type StripSchemasDeep<T> = T extends Extract<Meta, { kind: "object" }>
  ? {
      [K in keyof T["borgShape"]]: StripSchemasDeep<T["borgShape"][K]["meta"]>;
    }
  : T extends Extract<Meta, { kind: "array" }>
  ? StripSchemasDeep<T["borgItems"]["meta"]>[]
  : T extends Extract<Meta, { kind: "union" }>
  ? Array<StripSchemasDeep<T["borgMembers"][number]["meta"]>>[number]
  : T extends Borg
  ? T["meta"]
  : T;
 */
type RequirdKeys<TObj extends object> = TObj extends {
  [_ in infer K]: any;
}
  ? keyof { [k in K as undefined extends TObj[k] ? never : k]: k }
  : never;

export type RequiredKeysArray<TShape extends { [key: string]: Borg }> =
  TShape extends infer T extends { [key: string]: Borg }
    ? Array<
        RequirdKeys<{
          [k in keyof T]: Type<T[k]>;
        }>
      >
    : never;

export type PrettyPrint<T> = T extends infer U extends object
  ? { [K in keyof U]: U[K] }
  : T extends object
  ? never
  : T;

type RequiredFlag = "required" | "optional";
type NullFlag = "notNull" | "nullable";
type PrivateFlag = "public" | "private";

export type Flags = [RequiredFlag, NullFlag, PrivateFlag];
export type MinMax = [number | null, number | null];

export type Parsed<TType, TFlags extends Flags> = [
  TFlags[0],
  TFlags[1],
] extends [infer TOptional extends Flags[0], infer TNullable extends Flags[1]]
  ?
      | TType
      | (TNullable extends "nullable" ? null : never)
      | (TOptional extends "optional" ? undefined : never)
  : never;

export type Sanitized<TType, TFlags extends Flags> = TFlags extends [
  infer TOptional extends Flags[0],
  infer TNullable extends Flags[1],
  infer TPublic extends Flags[2],
]
  ? TPublic extends "private"
    ? never
    : Parsed<TType, [TOptional, TNullable, "public"]>
  : never;

export type SetRequired<TFlags extends Flags> = SetFLags<
  TFlags,
  ["required", "", ""]
>;
export type SetOptional<TFlags extends Flags> = SetFLags<
  TFlags,
  ["optional", "", ""]
>;
export type SetNullable<TFlags extends Flags> = SetFLags<
  TFlags,
  ["", "nullable", ""]
>;
export type SetNotNull<TFlags extends Flags> = SetFLags<
  TFlags,
  ["", "notNull", ""]
>;
export type SetPublic<TFlags extends Flags> = SetFLags<
  TFlags,
  ["", "", "public"]
>;
export type SetPrivate<TFlags extends Flags> = SetFLags<
  TFlags,
  ["", "", "private"]
>;
export type SetNullish<TFlags extends Flags> = SetFLags<
  TFlags,
  ["optional", "nullable", ""]
>;
export type SetNotNullish<TFlags extends Flags> = SetFLags<
  TFlags,
  ["required", "notNull", ""]
>;

export type GetFlags<
  TFlags extends Flags,
  TFormat extends "enum" | "bool" = "bool",
> = TFlags extends [infer TOptional, infer TNullable, infer TPrivate]
  ? {
      optional: TOptional extends "optional"
        ? TFormat extends "enum"
          ? "optional"
          : true
        : TFormat extends "enum"
        ? "required"
        : false;
      nullable: TNullable extends "nullable"
        ? TFormat extends "enum"
          ? "nullable"
          : true
        : TFormat extends "enum"
        ? "notNull"
        : false;
      private: TPrivate extends "private"
        ? TFormat extends "enum"
          ? "private"
          : true
        : TFormat extends "enum"
        ? "public"
        : false;
    }
  : never;

type FlagOps = [Flags[0] | "", Flags[1] | "", Flags[2] | ""];
type SetFLags<TFlags extends Flags, TOps extends FlagOps> = [
  TOps,
  TFlags,
] extends [
  [
    infer Op_0 extends Flags[0] | "",
    infer Op_1 extends Flags[1] | "",
    infer Op_2 extends Flags[2] | "",
  ],
  [
    infer TFlag_0 extends Flags[0],
    infer TFlag_1 extends Flags[1],
    infer TFlag_2 extends Flags[2],
  ],
]
  ? [
      Op_0 extends Flags[0] ? Op_0 : TFlag_0,
      Op_1 extends Flags[1] ? Op_1 : TFlag_1,
      Op_2 extends Flags[2] ? Op_2 : TFlag_2,
    ]
  : never;

/* c8 ignore start */

//@ts-expect-error - Vite handles this import.meta check
if (import.meta.vitest) {
  //@ts-expect-error - Vite handles this top-level await
  const { describe, it, expect } = await import("vitest");
  describe("Type Utilities", () => {
    it.todo("should produce the expected types");
  });
}

/* c8 ignore stop */
