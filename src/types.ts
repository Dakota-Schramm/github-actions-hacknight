import B, { PrivateSymbol } from "./index";

export type RequiredFlag = "required" | "optional";
export type NullFlag = "notNull" | "nullable";
export type PrivateFlag = "public" | "private";
export type TypeOptions = `${RequiredFlag}, ${NullFlag}, ${PrivateFlag}`;
export type MinMax = [number | null, number | null];

export type AnyKind =
  | "string"
  | "number"
  | "boolean"
  | "object"
  | "id"
  | "array";

type _AnyBorg<TOpts extends TypeOptions = TypeOptions> =
  | B.Id<TOpts, "string" | "oid">
  | B.String<TOpts, MinMax, string>
  | B.Number<TOpts, MinMax>
  | B.Boolean<TOpts>
  | B.Array<TOpts, B.Borg, MinMax>
  | B.Object<TOpts, { [key: string]: B.Borg }>;

export type SomeBorg = _AnyBorg;
export type AnyRequiredBorg = _AnyBorg<`required, ${NullFlag}, ${PrivateFlag}`>;
export type AnyOptionalBorg = _AnyBorg<`optional, ${NullFlag}, ${PrivateFlag}`>;
export type AnyNullableBorg =
  _AnyBorg<`${RequiredFlag}, nullable, ${PrivateFlag}`>;
export type AnyNotNullBorg =
  _AnyBorg<`${RequiredFlag}, notNull, ${PrivateFlag}`>;
export type AnyPrivateBorg = _AnyBorg<`${RequiredFlag}, ${NullFlag}, private`>;
export type AnyPublicBorg = _AnyBorg<`${RequiredFlag}, ${NullFlag}, public`>;
export type AnyNullishBorg = _AnyBorg<`optional, nullable, ${PrivateFlag}`>;
export type AnyNotNullishBorg = _AnyBorg<`required, notNull, ${PrivateFlag}`>;

export type InferMeta<
  TKind extends AnyKind,
  TShape extends B.Borg | { [key: string]: B.Borg },
  TOpts extends TypeOptions,
> = Readonly<
  TKind extends "object"
    ? TShape extends infer IShape extends { [key: string]: B.Borg }
      ? {
          kind: "object";
          keys: Array<keyof IShape>;
          requiredKeys: RequiredKeysArray<{
            [k in keyof IShape]: ReturnType<IShape[k]["parse"]>;
          }> extends never[]
            ? string[]
            : RequiredKeysArray<{
                [k in keyof IShape]: ReturnType<IShape[k]["parse"]>;
              }>;
          shape: IShape;
        } & InferOpts<TOpts>
      : never
    : TKind extends "array"
    ? TShape extends infer IBorg extends B.Borg
      ? {
          shape: IBorg;
          kind: "array";
          maxItems: number | null;
          minItems: number | null;
        } & InferOpts<TOpts>
      : never
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
    : never
>;

export type BorgModel<
  TInputSchema extends B.Object<TypeOptions>,
  TServerModel = B.Type<TInputSchema>,
  TOutputSchema extends B.Object<TypeOptions> = TInputSchema,
> = {
  createFromRequest: (input: B.Type<TInputSchema>) => B.Type<TOutputSchema>;
  sanitizeResponse: (input: TServerModel) => B.Type<TOutputSchema>;
  serializeInput: (
    parsedInput: B.Type<TInputSchema>,
  ) => ReturnType<TInputSchema["serialize"]>;
  deserializeInput: (
    serializedInput: ReturnType<TInputSchema["serialize"]>,
  ) => B.Type<TInputSchema>;
  serializeOutput: (
    parsedOutput: B.Type<TOutputSchema>,
  ) => ReturnType<TOutputSchema["serialize"]>;
  deserializeOutput: (
    serializedOutput: ReturnType<TOutputSchema["serialize"]>,
  ) => B.Type<TOutputSchema>;
  parseInput: (input: unknown) => B.Type<TInputSchema>;
  parseOutput: (input: unknown) => B.Type<TOutputSchema>;
};

type OptionUpdate = [RequiredFlag | "", NullFlag | "", PrivateFlag | ""];

export type UpdateOpts<
  TOpts extends TypeOptions,
  TUpdate extends OptionUpdate,
> = [TUpdate, TOpts] extends [
  [
    infer TO2 extends RequiredFlag | "",
    infer TN2 extends NullFlag | "",
    infer TP2 extends PrivateFlag | "",
  ],
  `${infer TO1 extends RequiredFlag}, ${infer TN1 extends NullFlag}, ${infer TP1 extends PrivateFlag}`,
]
  ? `${TO2 extends RequiredFlag ? TO2 : TO1}, ${TN2 extends NullFlag
      ? TN2
      : TN1}, ${TP2 extends PrivateFlag ? TP2 : TP1}`
  : never;

export type MakeRequired<TOpts extends TypeOptions> = UpdateOpts<
  TOpts,
  ["required", "", ""]
>;
export type MakeOptional<TOpts extends TypeOptions> = UpdateOpts<
  TOpts,
  ["optional", "", ""]
>;
export type MakeNullable<TOpts extends TypeOptions> = UpdateOpts<
  TOpts,
  ["", "nullable", ""]
>;
export type MakeNotNull<TOpts extends TypeOptions> = UpdateOpts<
  TOpts,
  ["", "notNull", ""]
>;
export type MakePublic<TOpts extends TypeOptions> = UpdateOpts<
  TOpts,
  ["", "", "public"]
>;
export type MakePrivate<TOpts extends TypeOptions> = UpdateOpts<
  TOpts,
  ["", "", "private"]
>;
export type MakeNullish<TOpts extends TypeOptions> = UpdateOpts<
  TOpts,
  ["optional", "nullable", ""]
>;
export type MakeNotNullish<TOpts extends TypeOptions> = UpdateOpts<
  TOpts,
  ["required", "notNull", ""]
>;

export type BuildObjectBsonSchemaLiteral<
  TShape extends { [key: string]: B.Borg },
  TOpts extends TypeOptions,
> = TOpts extends `${RequiredFlag}, ${infer N extends NullFlag}, ${PrivateFlag}`
  ? N extends "nullable"
    ? {
        bsonType: ["null", "object"];
        required: RequiredKeysArray<{
          [key in keyof TShape]: ReturnType<TShape[key]["parse"]>;
        }>;
        properties: {
          [key in keyof TShape]: ReturnType<TShape[key]["bsonSchema"]>;
        };
      }
    : {
        bsonType: "object";
        required: RequiredKeysArray<{
          [key in keyof TShape]: ReturnType<TShape[key]["parse"]>;
        }>;
        properties: {
          [key in keyof TShape]: ReturnType<TShape[key]["bsonSchema"]>;
        };
      }
  : never;

export type RequiredKeysArray<TObj extends object> = TObj extends {
  [_ in infer K]: any;
}
  ? Array<
      keyof {
        [k in K as undefined extends TObj[k]
          ? never
          : /* FIXME - the next two lines are a hack to force "private" properties to
          be excluded from required keys. This is not correct, as the underlying 'optional'
          attribute should be used instead.*/
          TObj[k] extends PrivateSymbol
          ? never
          : k]: k;
      }
    >
  : never;

/**
FIXME: This is not correct. We want to be able to do this: `type A = ArrayToTuple<(1 | 2 | 3)[]> //--> [1, 2, 3]`

The code below gives us [1 | 2 | 3] instead - a tuple of length 1 where the only element is the union of 1, 2, and 3.

While `[1, 2, 3]` is the preferred representation of the required keys type,
`(1 | 2 | 3)[]` is more correct than `[1 | 2 | 3]`.

-----------------
export type ArrayToTuple<TArr extends any[], TTup extends [...any[]] = []> = [
  ...TTup,
  TArr[0],
] extends infer U ? TArr extends [infer _, ...infer U2]
    ? [...U2, U]
    : U
  : never;
*/

export type ApplyOpts<
  TType,
  TOpts extends TypeOptions = "required, notNull, public",
> = TOpts extends `${infer TOptional}, ${infer TNullable}, ${infer TPublic}`
  ? TPublic extends "private"
    ? never
    : [TOptional, TNullable] extends ["optional", "nullable"]
    ?
        | (TType extends object
            ? AddQuestionMarksToOptionalProperties<TType>
            : TType)
        | null
        | undefined
    : [TOptional, TNullable] extends ["optional", "notNull"]
    ?
        | (TType extends object
            ? AddQuestionMarksToOptionalProperties<TType>
            : TType)
        | undefined
    : [TOptional, TNullable] extends ["required", "nullable"]
    ?
        | (TType extends object
            ? AddQuestionMarksToOptionalProperties<TType>
            : TType)
        | null
    : TType extends object
    ? AddQuestionMarksToOptionalProperties<TType>
    : TType
  : never;

export type RequiredKeysIn<T extends object> = {
  [k in keyof T]: undefined extends T[k] ? never : k;
}[keyof T];

export type AddQuestionMarksToOptionalProperties<
  T extends { [key: string | symbol]: any },
  R extends keyof T = RequiredKeysIn<T>,
> = Pick<Required<T>, R> & Partial<T>;

export type PrettyPrint<T> = T extends infer U
  ? { [K in keyof U]: U[K] }
  : never;

export type InferOpts<
  TOpts extends TypeOptions,
  TFormat extends "enum" | "bool" = "bool",
> = TOpts extends `${infer TOptional}, ${infer TNullable}, ${infer TPrivate}`
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

export type BuildOidBsonSchemaLiteral<TOpts extends TypeOptions> =
  InferOpts<TOpts>["nullable"] extends true
    ? { bsonType: ["objectId", "null"] }
    : { bsonType: "objectId" };

export type BuildArrayBsonSchemaLiteral<
  TItem extends B.Borg,
  TOpts extends TypeOptions,
  TMin extends number | null,
  TMax extends number | null,
> = [true, null, null] extends [InferOpts<TOpts>["nullable"], TMin, TMax]
  ? {
      bsonType: ["array", "null"];
      items: ReturnType<TItem["bsonSchema"]>;
    }
  : [true, number, null] extends [InferOpts<TOpts>["nullable"], TMin, TMax]
  ? {
      bsonType: ["array", "null"];
      items: ReturnType<TItem["bsonSchema"]>;
      minItems: TMin;
    }
  : [true, null, number] extends [InferOpts<TOpts>["nullable"], TMin, TMax]
  ? {
      bsonType: ["array", "null"];
      items: ReturnType<TItem["bsonSchema"]>;
      maxItems: TMax;
    }
  : [true, number, number] extends [InferOpts<TOpts>["nullable"], TMin, TMax]
  ? {
      bsonType: ["array", "null"];
      items: ReturnType<TItem["bsonSchema"]>;
      minItems: TMin;
      maxItems: TMax;
    }
  : [false, null, null] extends [InferOpts<TOpts>["nullable"], TMin, TMax]
  ? {
      bsonType: "array";
      items: ReturnType<TItem["bsonSchema"]>;
    }
  : [false, number, null] extends [InferOpts<TOpts>["nullable"], TMin, TMax]
  ? {
      bsonType: "array";
      items: ReturnType<TItem["bsonSchema"]>;
      minItems: TMin;
    }
  : [false, null, number] extends [InferOpts<TOpts>["nullable"], TMin, TMax]
  ? {
      bsonType: "array";
      items: ReturnType<TItem["bsonSchema"]>;
      maxItems: TMax;
    }
  : {
      bsonType: "array";
      items: ReturnType<TItem["bsonSchema"]>;
      minItems: TMin;
      maxItems: TMax;
    };

export type BuildBooleanBsonSchemaLiteral<TOpts extends TypeOptions> =
  InferOpts<TOpts>["nullable"] extends true
    ? {
        bsonType: ["bool", "null"];
      }
    : {
        bsonType: "bool";
      };

export type BuildNumberBsonSchemaLiteral<
  TOpts extends TypeOptions,
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

export type BuildStringBsonSchemaLiteral<
  TOpts extends TypeOptions,
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
