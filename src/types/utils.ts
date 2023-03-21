import { Borg, Type } from "./Borg";

export type RequirdKeysIn<TObj extends object> = TObj extends {
  [_ in infer K]: any;
}
  ? keyof { [k in K as undefined extends TObj[k] ? never : k]: k }
  : never;

export type RequiredKeysArray<TShape extends { [key: string]: Borg }> =
  TShape extends infer T extends { [key: string]: Borg }
    ? Array<
        RequirdKeysIn<{
          [k in keyof T]: Type<T[k]>;
        }>
      >
    : never;

export type PrettyPrint<T> = T extends infer U extends object
  ? { [K in keyof U]: U[K] }
  : T;

type RequiredFlag = "required" | "optional";
type NullFlag = "notNull" | "nullable";
type PrivateFlag = "public" | "private";

export type Flags = [RequiredFlag, NullFlag, PrivateFlag];
export type MinMax = [number | null, number | null];

export type Parsed<TType, TOpts extends Flags> = [TOpts[0], TOpts[1]] extends [
  infer TOptional extends Flags[0],
  infer TNullable extends Flags[1],
]
  ?
      | TType
      | (TNullable extends "nullable" ? null : never)
      | (TOptional extends "optional" ? undefined : never)
  : never;

export type Sanitized<TType, TOpts extends Flags> = TOpts extends [
  infer TOptional extends Flags[0],
  infer TNullable extends Flags[1],
  infer TPublic extends Flags[2],
]
  ? TPublic extends "private"
    ? never
    : Parsed<TType, [TOptional, TNullable, "public"]>
  : never;

export type MakeRequired<TOpts extends Flags> = UpdateOpts<
  TOpts,
  ["required", "", ""]
>;
export type MakeOptional<TOpts extends Flags> = UpdateOpts<
  TOpts,
  ["optional", "", ""]
>;
export type MakeNullable<TOpts extends Flags> = UpdateOpts<
  TOpts,
  ["", "nullable", ""]
>;
export type MakeNotNull<TOpts extends Flags> = UpdateOpts<
  TOpts,
  ["", "notNull", ""]
>;
export type MakePublic<TOpts extends Flags> = UpdateOpts<
  TOpts,
  ["", "", "public"]
>;
export type MakePrivate<TOpts extends Flags> = UpdateOpts<
  TOpts,
  ["", "", "private"]
>;
export type MakeNullish<TOpts extends Flags> = UpdateOpts<
  TOpts,
  ["optional", "nullable", ""]
>;
export type MakeNotNullish<TOpts extends Flags> = UpdateOpts<
  TOpts,
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

type OptionUpdate = [Flags[0] | "", Flags[1] | "", Flags[2] | ""];
type UpdateOpts<TOpts extends Flags, TUpdate extends OptionUpdate> = [
  TUpdate,
  TOpts,
] extends [
  [
    infer TOn extends Flags[0] | "",
    infer TNn extends Flags[1] | "",
    infer TPn extends Flags[2] | "",
  ],
  [
    infer TOf extends Flags[0],
    infer TNf extends Flags[1],
    infer TPf extends Flags[2],
  ],
]
  ? [
      TOn extends Flags[0] ? TOn : TOf,
      TNn extends Flags[1] ? TNn : TNf,
      TPn extends Flags[2] ? TPn : TPf,
    ]
  : never;
