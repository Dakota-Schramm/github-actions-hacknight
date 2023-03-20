import B from "./index";

type RequiredFlag = "required" | "optional";
type NullFlag = "notNull" | "nullable";
type PrivateFlag = "public" | "private";

type _Any<TOpts extends Flags = Flags> =
  | B.Id<TOpts, "string" | "oid">
  | B.String<TOpts, MinMax, string>
  | B.Number<TOpts, MinMax>
  | B.Boolean<TOpts>
  | B.Array<TOpts, B.Borg, MinMax>
  | B.Object<TOpts, { [key: string]: B.Borg }>;

export type PrettyPrint<T> = T extends infer U
  ? { [K in keyof U]: U[K] }
  : never;

export type Flags = [RequiredFlag, NullFlag, PrivateFlag];
export type MinMax = [number | null, number | null];
export type AnyKind =
  | "string"
  | "number"
  | "boolean"
  | "object"
  | "id"
  | "array";

export type Type<TBorg extends { parse: (arg0: unknown) => any }> = ReturnType<
  TBorg["parse"]
>;
export type BsonType<TBorg extends { toBson: (arg0: any) => any }> = ReturnType<
  TBorg["toBson"]
>;
export type Serialized<TBorg extends { serialize: (arg0: any) => any }> =
  ReturnType<TBorg["serialize"]>;
export type Deserialized<TBorg extends { deserialize: (arg0: any) => any }> =
  ReturnType<TBorg["deserialize"]>;

export type AnyBorg<
  T extends
    | "required"
    | "optional"
    | "nullable"
    | "notNull"
    | "nullish"
    | "notNullish"
    | "private"
    | "public" = never,
> = _Any<
  T extends "required"
    ? ["required", NullFlag, PrivateFlag]
    : T extends "optional"
    ? ["optional", NullFlag, PrivateFlag]
    : T extends "nullable"
    ? [RequiredFlag, "nullable", PrivateFlag]
    : T extends "notNull"
    ? [RequiredFlag, "notNull", PrivateFlag]
    : T extends "nullish"
    ? ["optional", "nullable", PrivateFlag]
    : T extends "notNullish"
    ? ["required", "notNull", PrivateFlag]
    : T extends "private"
    ? [RequiredFlag, NullFlag, "private"]
    : T extends "public"
    ? [RequiredFlag, NullFlag, "public"]
    : Flags
>;

export type BorgModel<
  TInputSchema extends B.Object<Flags>,
  TServerModel = B.Type<TInputSchema>,
  TOutputSchema extends B.Object<Flags> = TInputSchema,
> = {
  createFromRequest: (input: B.Type<TInputSchema>) => B.Type<TOutputSchema>;
  sanitizeResponse: (input: TServerModel) => B.Type<TOutputSchema>;
  serializeInput: (
    parsedInput: B.Type<TInputSchema>,
  ) => B.Serialized<TInputSchema>;
  deserializeInput: (
    serializedInput: B.Serialized<TInputSchema>,
  ) => B.Type<TInputSchema>;
  serializeOutput: (
    parsedOutput: B.Type<TOutputSchema>,
  ) => B.Serialized<TOutputSchema>;
  deserializeOutput: (
    serializedOutput: B.Serialized<TOutputSchema>,
  ) => B.Type<TOutputSchema>;
  parseInput: (input: unknown) => B.Type<TInputSchema>;
  parseOutput: (input: unknown) => B.Type<TOutputSchema>;
};

export type InferOpts<
  TOpts extends Flags,
  TFormat extends "enum" | "bool" = "bool",
> = TOpts extends [infer TOptional, infer TNullable, infer TPrivate]
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

/*
TODO: Can this be more terse? Also, the type inference is a bit wonky.
In some generic contexts, it results in a union of two identical types for certain properties.
This isn't incorrect, but it's not ideal.
*/
export type InferMeta<
  TKind extends AnyKind = AnyKind,
  TShape extends
    | (TKind extends "array" ? B.Borg : never)
    | (TKind extends "object" ? { [key: string]: B.Borg } : never) =
    | (TKind extends "array" ? B.Borg : never)
    | (TKind extends "object" ? { [key: string]: B.Borg } : never),
  TOpts extends Flags = Flags,
> = TKind extends "object"
  ? TShape extends { [key: string]: B.Borg }
    ? {
        kind: "object";
        keys: Array<keyof TShape>;
        requiredKeys: RequiredKeysArray<{
          [k in keyof TShape]: B.Type<TShape[k]>;
        }> extends never[]
          ? string[]
          : RequiredKeysArray<{
              [k in keyof TShape]: B.Type<TShape[k]>;
            }>;
        shape: TShape extends { [key: string]: B.Borg } ? TShape : never;
      } & InferOpts<TOpts>
    : never
  : TKind extends "array"
  ? {
      shape: TShape extends B.Borg ? TShape : never;
      kind: "array";
      maxItems: number | null;
      minItems: number | null;
    } & InferOpts<TOpts>
  : TKind extends "string"
  ? {
      kind: "string";
      maxLength: number | null;
      minLength: number | null;
      pattern: string | undefined;
      regex: RegExp | undefined;
    } & InferOpts<TOpts>
  : TKind extends "number"
  ? {
      kind: "number";
      max: number | null;
      min: number | null;
    } & InferOpts<TOpts>
  : TKind extends "id"
  ? { kind: "id"; format: "string" | "oid" } & InferOpts<TOpts>
  : TKind extends "boolean"
  ? { kind: "boolean" } & InferOpts<TOpts>
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

export type Parsed<TType, TOpts extends Flags> = [TOpts[0], TOpts[1]] extends [
  infer TOptional extends RequiredFlag,
  infer TNullable extends NullFlag,
]
  ?
      | TType
      | (TNullable extends "nullable" ? null : never)
      | (TOptional extends "optional" ? undefined : never)
  : never;

export type Sanitized<TType, TOpts extends Flags> = TOpts extends [
  infer TOptional extends RequiredFlag,
  infer TNullable extends NullFlag,
  infer TPublic extends PrivateFlag,
]
  ? TPublic extends "private"
    ? never
    : Parsed<TType, [TOptional, TNullable, "public"]>
  : never;

export type BsonSchema<
  T extends "string" | "number" | "boolean" | "object" | "array" | "id",
  C extends any[],
> = T extends "string"
  ? C extends [
      infer TOpts extends Flags,
      [infer TMin extends MinMax[0], infer TMax extends MinMax[1]],
      infer TPattern extends string,
    ]
    ? BuildStringBsonSchemaLiteral<TOpts, TMin, TMax, TPattern>
    : never
  : T extends "number"
  ? C extends [
      infer TOpts extends Flags,
      [infer TMin extends MinMax[0], infer TMax extends MinMax[1]],
    ]
    ? BuildNumberBsonSchemaLiteral<TOpts, TMin, TMax>
    : never
  : T extends "boolean"
  ? C extends [infer TOpts extends Flags]
    ? BuildBooleanBsonSchemaLiteral<TOpts>
    : never
  : T extends "object"
  ? C extends [
      infer TOpts extends Flags,
      infer TShape extends { [key: string]: B.Borg },
    ]
    ? BuildObjectBsonSchemaLiteral<TShape, TOpts>
    : never
  : T extends "array"
  ? C extends [
      infer TOpts extends Flags,
      infer TShape extends B.Borg,
      [infer TMin extends MinMax[0], infer TMax extends MinMax[1]],
    ]
    ? BuildArrayBsonSchemaLiteral<TShape, TOpts, TMin, TMax>
    : never
  : T extends "id"
  ? C extends [infer TOpts extends Flags]
    ? BuildOidBsonSchemaLiteral<TOpts>
    : never
  : never;

/**
FIXME: This is not correct. We want to be able to do this: `type A = ArrayToTuple<(1 | 2 | 3)[]> //--> [1, 2, 3]`

The code below gives us [1 | 2 | 3] instead - a tuple of length 1 where the only element is the union of 1, 2, and 3.

While `[1, 2, 3]` is the preferred representation of the required keys type,
`(1 | 2 | 3)[]` is more correct than `[1 | 2 | 3]`.

-----------------
type ArrayToTuple<TArr extends any[], TTup extends [...any[]] = []> = [
  ...TTup,
  TArr[0],
] extends infer U ? TArr extends [infer _, ...infer U2]
    ? [...U2, U]
    : U
  : never;
*/

/*TODO: Useful for exact-optional?

export type AddQuestionMarksToOptionalProperties<
  T extends { [key: string | symbol]: any },
  R extends keyof T = RequiredKeysIn<T>,
> = Pick<Required<T>, R> & Partial<T>;
*/

type RequirdKeysIn<TObj extends object> = TObj extends { [_ in infer K]: any }
  ? keyof { [k in K as undefined extends TObj[k] ? never : k]: k }
  : never;

type RequiredKeysArray<TObj extends object> = PrettyPrint<
  Array<RequirdKeysIn<TObj>>
>;

type OptionUpdate = [RequiredFlag | "", NullFlag | "", PrivateFlag | ""];
type UpdateOpts<TOpts extends Flags, TUpdate extends OptionUpdate> = [
  TUpdate,
  TOpts,
] extends [
  [
    infer TOn extends RequiredFlag | "",
    infer TNn extends NullFlag | "",
    infer TPn extends PrivateFlag | "",
  ],
  [
    infer TOf extends RequiredFlag,
    infer TNf extends NullFlag,
    infer TPf extends PrivateFlag,
  ],
]
  ? [
      TOn extends RequiredFlag ? TOn : TOf,
      TNn extends NullFlag ? TNn : TNf,
      TPn extends PrivateFlag ? TPn : TPf,
    ]
  : never;

type BuildOidBsonSchemaLiteral<TOpts extends Flags> =
  InferOpts<TOpts>["nullable"] extends true
    ? { bsonType: ["objectId", "null"] }
    : { bsonType: "objectId" };

type BuildObjectBsonSchemaLiteral<
  TShape extends { [key: string]: B.Borg },
  TOpts extends Flags,
> = TOpts extends [RequiredFlag, infer N extends NullFlag, PrivateFlag]
  ? N extends "nullable"
    ? {
        bsonType: ["null", "object"];
        required: RequiredKeysArray<{
          [key in keyof TShape]: B.Type<TShape[key]>;
        }>;
        properties: {
          [key in keyof TShape]: TShape[key]["bsonSchema"];
        };
      }
    : {
        bsonType: "object";
        required: RequiredKeysArray<{
          [key in keyof TShape]: B.Type<TShape[key]>;
        }>;
        properties: {
          [key in keyof TShape]: TShape[key]["bsonSchema"];
        };
      }
  : never;

type BuildArrayBsonSchemaLiteral<
  TItem extends B.Borg,
  TOpts extends Flags,
  TMin extends number | null,
  TMax extends number | null,
> = [true, null, null] extends [InferOpts<TOpts>["nullable"], TMin, TMax]
  ? {
      bsonType: ["array", "null"];
      items: TItem["bsonSchema"];
    }
  : [true, number, null] extends [InferOpts<TOpts>["nullable"], TMin, TMax]
  ? {
      bsonType: ["array", "null"];
      items: TItem["bsonSchema"];
      minItems: TMin;
    }
  : [true, null, number] extends [InferOpts<TOpts>["nullable"], TMin, TMax]
  ? {
      bsonType: ["array", "null"];
      items: TItem["bsonSchema"];
      maxItems: TMax;
    }
  : [true, number, number] extends [InferOpts<TOpts>["nullable"], TMin, TMax]
  ? {
      bsonType: ["array", "null"];
      items: TItem["bsonSchema"];
      minItems: TMin;
      maxItems: TMax;
    }
  : [false, null, null] extends [InferOpts<TOpts>["nullable"], TMin, TMax]
  ? {
      bsonType: "array";
      items: TItem["bsonSchema"];
    }
  : [false, number, null] extends [InferOpts<TOpts>["nullable"], TMin, TMax]
  ? {
      bsonType: "array";
      items: TItem["bsonSchema"];
      minItems: TMin;
    }
  : [false, null, number] extends [InferOpts<TOpts>["nullable"], TMin, TMax]
  ? {
      bsonType: "array";
      items: TItem["bsonSchema"];
      maxItems: TMax;
    }
  : {
      bsonType: "array";
      items: TItem["bsonSchema"];
      minItems: TMin;
      maxItems: TMax;
    };

type BuildBooleanBsonSchemaLiteral<TOpts extends Flags> =
  InferOpts<TOpts>["nullable"] extends true
    ? { bsonType: ["bool", "null"] }
    : { bsonType: "bool" };

type BuildNumberBsonSchemaLiteral<
  TOpts extends Flags,
  TMin extends number | null,
  TMax extends number | null,
> = [InferOpts<TOpts>["nullable"], TMin, TMax] extends [true, null, null]
  ? {
      bsonType: ["number", "null"];
    }
  : [InferOpts<TOpts>["nullable"], TMin, TMax] extends [true, number, null]
  ? {
      bsonType: ["number", "null"];
      minimum: TMin;
    }
  : [InferOpts<TOpts>["nullable"], TMin, TMax] extends [true, null, number]
  ? {
      bsonType: ["number", "null"];
      maximum: TMax;
    }
  : [InferOpts<TOpts>["nullable"], TMin, TMax] extends [true, number, number]
  ? {
      bsonType: ["number", "null"];
      minimum: TMin;
      maximum: TMax;
    }
  : [InferOpts<TOpts>["nullable"], TMin, TMax] extends [false, null, null]
  ? {
      bsonType: "number";
    }
  : [InferOpts<TOpts>["nullable"], TMin, TMax] extends [false, number, null]
  ? {
      bsonType: "number";
      minimum: TMin;
    }
  : [InferOpts<TOpts>["nullable"], TMin, TMax] extends [false, null, number]
  ? {
      bsonType: "number";
      maximum: TMax;
    }
  : [InferOpts<TOpts>["nullable"], TMin, TMax] extends [false, number, number]
  ? {
      bsonType: "number";
      minimum: TMin;
      maximum: TMax;
    }
  : never;

type BuildStringBsonSchemaLiteral<
  TOpts extends Flags,
  TMin extends number | null,
  TMax extends number | null,
  TPattern extends string,
> = [InferOpts<TOpts>["nullable"], TMin, TMax, TPattern] extends [
  true,
  null,
  null,
  ".*",
]
  ? {
      bsonType: ["string", "null"];
    }
  : [InferOpts<TOpts>["nullable"], TMin, TMax, TPattern] extends [
      true,
      number,
      null,
      ".*",
    ]
  ? {
      bsonType: ["string", "null"];
      minLength: TMin;
    }
  : [InferOpts<TOpts>["nullable"], TMin, TMax, TPattern] extends [
      true,
      null,
      number,
      ".*",
    ]
  ? {
      bsonType: ["string", "null"];
      maxLength: TMax;
    }
  : [InferOpts<TOpts>["nullable"], TMin, TMax, TPattern] extends [
      true,
      number,
      number,
      ".*",
    ]
  ? {
      bsonType: ["string", "null"];
      minLength: TMin;
      maxLength: TMax;
    }
  : [InferOpts<TOpts>["nullable"], TMin, TMax, TPattern] extends [
      false,
      null,
      null,
      ".*",
    ]
  ? {
      bsonType: "string";
    }
  : [InferOpts<TOpts>["nullable"], TMin, TMax, TPattern] extends [
      false,
      number,
      null,
      ".*",
    ]
  ? {
      bsonType: "string";
      minLength: TMin;
    }
  : [InferOpts<TOpts>["nullable"], TMin, TMax, TPattern] extends [
      false,
      null,
      number,
      ".*",
    ]
  ? {
      bsonType: "string";
      maxLength: TMax;
    }
  : [InferOpts<TOpts>["nullable"], TMin, TMax, TPattern] extends [
      false,
      number,
      number,
      ".*",
    ]
  ? {
      bsonType: "string";
      minLength: TMin;
      maxLength: TMax;
    }
  : [InferOpts<TOpts>["nullable"], TMin, TMax, TPattern] extends [
      true,
      null,
      null,
      infer TRegex,
    ]
  ? {
      bsonType: ["string", "null"];
      pattern: TRegex;
    }
  : [InferOpts<TOpts>["nullable"], TMin, TMax, TPattern] extends [
      true,
      number,
      null,
      infer TRegex,
    ]
  ? {
      bsonType: ["string", "null"];
      minLength: TMin;
      pattern: TRegex;
    }
  : [InferOpts<TOpts>["nullable"], TMin, TMax, TPattern] extends [
      true,
      null,
      number,
      infer TRegex,
    ]
  ? {
      bsonType: ["string", "null"];
      maxLength: TMax;
      pattern: TRegex;
    }
  : [InferOpts<TOpts>["nullable"], TMin, TMax, TPattern] extends [
      true,
      number,
      number,
      infer TRegex,
    ]
  ? {
      bsonType: ["string", "null"];
      minLength: TMin;
      maxLength: TMax;
      pattern: TRegex;
    }
  : [InferOpts<TOpts>["nullable"], TMin, TMax, TPattern] extends [
      false,
      null,
      null,
      infer TRegex,
    ]
  ? {
      bsonType: "string";
      pattern: TRegex;
    }
  : [InferOpts<TOpts>["nullable"], TMin, TMax, TPattern] extends [
      false,
      number,
      null,
      infer TRegex,
    ]
  ? {
      bsonType: "string";
      minLength: TMin;
      pattern: TRegex;
    }
  : [InferOpts<TOpts>["nullable"], TMin, TMax, TPattern] extends [
      false,
      null,
      number,
      infer TRegex,
    ]
  ? {
      bsonType: "string";
      maxLength: TMax;
      pattern: TRegex;
    }
  : [InferOpts<TOpts>["nullable"], TMin, TMax, TPattern] extends [
      false,
      number,
      number,
      infer TRegex,
    ]
  ? {
      bsonType: "string";
      minLength: TMin;
      maxLength: TMax;
      pattern: TRegex;
    }
  : never;

//@ts-expect-error - vitest handles import.meta
if (import.meta.vitest) {
  // @ts-expect-error - vitest handles the top level await
  const { it } = await import("vitest");
  it("should do nothing", () => {});
}
