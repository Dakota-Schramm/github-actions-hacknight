import type B from "./index";

export type RequiredFlag = "required" | "optional";
export type NullFlag = "notNull" | "nullable";
export type PrivateFlag = "public" | "private";
export type TypeOptions = `${RequiredFlag}, ${NullFlag}, ${PrivateFlag}`;

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
  ? ArrayToTuple<
      Array<keyof { [k in K as undefined extends TObj[k] ? never : k]: k }>
    >
  : never;

export type ArrayToTuple<TArr extends any[], TTup extends any[] = []> = [
  ...TTup,
  TArr[0],
] extends infer U extends any[]
  ? TArr extends [any, ...infer U2]
    ? [...U2, U]
    : U
  : never;

export type InferParsedType<TBorg extends B.Borg> = ReturnType<TBorg["parse"]>;
export type ApplyOpts<
  TType,
  TOpts extends TypeOptions = "required, notNull, public",
> = TOpts extends `${infer TOptional}, ${infer TNullable}, ${infer TPublic}`
  ? TPublic extends "private"
    ? never
    : [TOptional, TNullable] extends ["optional", "nullable"]
    ? (TType extends object ? AddQuestionMarksToOptionalProperties<TType> : TType) | null | undefined
    : [TOptional, TNullable] extends ["optional", "notNull"]
    ? (TType extends object ? AddQuestionMarksToOptionalProperties<TType> : TType) | undefined
    : [TOptional, TNullable] extends ["required", "nullable"]
    ? (TType extends object ? AddQuestionMarksToOptionalProperties<TType> : TType) | null
    : (TType extends object ? AddQuestionMarksToOptionalProperties<TType> : TType)
  : never;

export type RequiredKeysIn<T extends object> = {
    [k in keyof T]: undefined extends T[k] ? never : k;
  }[keyof T];

export type AddQuestionMarksToOptionalProperties<
    T extends object,
    R extends keyof T = RequiredKeysIn<T>
  > = PrettyPrint<Pick<Required<T>, R> & Partial<T>>;

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

export type BuildOidBsonSchemaLiteral<
  TOpts extends TypeOptions,
> = InferOpts<TOpts>["nullable"] extends true ? { bsonType: ["objectId", "null"] } : { bsonType: "objectId" };

export type BuildArrayBsonSchemaLiteral<
  TItem extends B.Borg,
  TOpts extends TypeOptions,
  TMin extends number | null,
  TMax extends number | null,
> = [InferOpts<TOpts>["nullable"], TMin, TMax] extends [true, null, null]
    ? {
        bsonType: ["array", "null"];
        items: ReturnType<TItem["bsonSchema"]>;
      }
    : [InferOpts<TOpts>["nullable"], TMin, TMax] extends [true, number, null]
    ? {
        bsonType: ["array", "null"];
        items: ReturnType<TItem["bsonSchema"]>;
        minItems: TMin;
      }
    : [InferOpts<TOpts>["nullable"], TMin, TMax] extends [true, null, number]
    ? {
        bsonType: ["array", "null"];
        items: ReturnType<TItem["bsonSchema"]>;
        maxItems: TMax;
      }
    : [InferOpts<TOpts>["nullable"], TMin, TMax] extends [true, number, number]
    ? {
        bsonType: ["array", "null"];
        items: ReturnType<TItem["bsonSchema"]>;
        minItems: TMin;
        maxItems: TMax;
      }
    : [InferOpts<TOpts>["nullable"], TMin, TMax] extends [false, null, null]
    ? {
        bsonType: "array";
        items: ReturnType<TItem["bsonSchema"]>;
      }
    : [InferOpts<TOpts>["nullable"], TMin, TMax] extends [false, number, null]
    ? {
        bsonType: "array";
        items: ReturnType<TItem["bsonSchema"]>;
        minItems: TMin;
      }
    : [InferOpts<TOpts>["nullable"], TMin, TMax] extends [false, null, number]
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

export type BuildBooleanBsonSchemaLiteral<
  TOpts extends TypeOptions,
> = InferOpts<TOpts>["nullable"] extends true
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
