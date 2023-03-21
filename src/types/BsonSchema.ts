import { Flags, GetFlags, MinMax, Borg, RequiredKeysArray } from ".";

export type IdBsonSchema<TFlags extends Flags> =
  GetFlags<TFlags>["nullable"] extends true
    ? { bsonType: ["objectId", "null"] }
    : { bsonType: "objectId" };

export type ObjectBsonSchema<
  TShape extends { [key: string]: Borg },
  TFlags extends Flags,
> = TFlags extends [Flags[0], infer N extends Flags[1], Flags[2]]
  ? N extends "nullable"
    ? {
        bsonType: readonly ["null", "object"];
        required: RequiredKeysArray<TShape>;
        properties: {
          [key in keyof TShape]: TShape[key]["bsonSchema"];
        };
      }
    : {
        bsonType: "object";
        required: RequiredKeysArray<TShape>;
        properties: {
          [key in keyof TShape]: TShape[key]["bsonSchema"];
        };
      }
  : never;

export type ArrayBsonSchema<
  TItem extends Borg,
  TFlags extends Flags,
  TLen extends MinMax,
> = [true, null, null] extends [GetFlags<TFlags>["nullable"], TLen[0], TLen[1]]
  ? {
      bsonType: ["array", "null"];
      items: TItem["bsonSchema"];
    }
  : [true, number, null] extends [
      GetFlags<TFlags>["nullable"],
      TLen[0],
      TLen[1],
    ]
  ? {
      bsonType: ["array", "null"];
      items: TItem["bsonSchema"];
      minItems: TLen[0];
    }
  : [true, null, number] extends [
      GetFlags<TFlags>["nullable"],
      TLen[0],
      TLen[1],
    ]
  ? {
      bsonType: ["array", "null"];
      items: TItem["bsonSchema"];
      maxItems: TLen[1];
    }
  : [true, number, number] extends [
      GetFlags<TFlags>["nullable"],
      TLen[0],
      TLen[1],
    ]
  ? {
      bsonType: ["array", "null"];
      items: TItem["bsonSchema"];
      minItems: TLen[0];
      maxItems: TLen[1];
    }
  : [false, null, null] extends [GetFlags<TFlags>["nullable"], TLen[0], TLen[1]]
  ? {
      bsonType: "array";
      items: TItem["bsonSchema"];
    }
  : [false, number, null] extends [
      GetFlags<TFlags>["nullable"],
      TLen[0],
      TLen[1],
    ]
  ? {
      bsonType: "array";
      items: TItem["bsonSchema"];
      minItems: TLen[0];
    }
  : [false, null, number] extends [
      GetFlags<TFlags>["nullable"],
      TLen[0],
      TLen[1],
    ]
  ? {
      bsonType: "array";
      items: TItem["bsonSchema"];
      maxItems: TLen[1];
    }
  : {
      bsonType: "array";
      items: TItem["bsonSchema"];
      minItems: TLen[0];
      maxItems: TLen[1];
    };

export type BooleanBsonSchema<TFlags extends Flags> =
  GetFlags<TFlags>["nullable"] extends true
    ? { bsonType: ["bool", "null"] }
    : { bsonType: "bool" };

export type NumberBsonSchema<TFlags extends Flags, TLen extends MinMax> = [
  GetFlags<TFlags>["nullable"],
  TLen[0],
  TLen[1],
] extends [true, null, null]
  ? {
      bsonType: ["number", "null"];
    }
  : [GetFlags<TFlags>["nullable"], TLen[0], TLen[1]] extends [
      true,
      number,
      null,
    ]
  ? {
      bsonType: ["number", "null"];
      minimum: TLen[0];
    }
  : [GetFlags<TFlags>["nullable"], TLen[0], TLen[1]] extends [
      true,
      null,
      number,
    ]
  ? {
      bsonType: ["number", "null"];
      maximum: TLen[1];
    }
  : [GetFlags<TFlags>["nullable"], TLen[0], TLen[1]] extends [
      true,
      number,
      number,
    ]
  ? {
      bsonType: ["number", "null"];
      minimum: TLen[0];
      maximum: TLen[1];
    }
  : [GetFlags<TFlags>["nullable"], TLen[0], TLen[1]] extends [false, null, null]
  ? {
      bsonType: "number";
    }
  : [GetFlags<TFlags>["nullable"], TLen[0], TLen[1]] extends [
      false,
      number,
      null,
    ]
  ? {
      bsonType: "number";
      minimum: TLen[0];
    }
  : [GetFlags<TFlags>["nullable"], TLen[0], TLen[1]] extends [
      false,
      null,
      number,
    ]
  ? {
      bsonType: "number";
      maximum: TLen[1];
    }
  : [GetFlags<TFlags>["nullable"], TLen[0], TLen[1]] extends [
      false,
      number,
      number,
    ]
  ? {
      bsonType: "number";
      minimum: TLen[0];
      maximum: TLen[1];
    }
  : never;

export type StringBsonSchema<
  TFlags extends Flags,
  TLen extends MinMax,
  TPattern extends string,
> = [GetFlags<TFlags>["nullable"], TLen[0], TLen[1], TPattern] extends [
  true,
  null,
  null,
  ".*",
]
  ? {
      bsonType: ["string", "null"];
    }
  : [GetFlags<TFlags>["nullable"], TLen[0], TLen[1], TPattern] extends [
      true,
      number,
      null,
      ".*",
    ]
  ? {
      bsonType: ["string", "null"];
      minLength: TLen[0];
    }
  : [GetFlags<TFlags>["nullable"], TLen[0], TLen[1], TPattern] extends [
      true,
      null,
      number,
      ".*",
    ]
  ? {
      bsonType: ["string", "null"];
      maxLength: TLen[1];
    }
  : [GetFlags<TFlags>["nullable"], TLen[0], TLen[1], TPattern] extends [
      true,
      number,
      number,
      ".*",
    ]
  ? {
      bsonType: ["string", "null"];
      minLength: TLen[0];
      maxLength: TLen[1];
    }
  : [GetFlags<TFlags>["nullable"], TLen[0], TLen[1], TPattern] extends [
      false,
      null,
      null,
      ".*",
    ]
  ? {
      bsonType: "string";
    }
  : [GetFlags<TFlags>["nullable"], TLen[0], TLen[1], TPattern] extends [
      false,
      number,
      null,
      ".*",
    ]
  ? {
      bsonType: "string";
      minLength: TLen[0];
    }
  : [GetFlags<TFlags>["nullable"], TLen[0], TLen[1], TPattern] extends [
      false,
      null,
      number,
      ".*",
    ]
  ? {
      bsonType: "string";
      maxLength: TLen[1];
    }
  : [GetFlags<TFlags>["nullable"], TLen[0], TLen[1], TPattern] extends [
      false,
      number,
      number,
      ".*",
    ]
  ? {
      bsonType: "string";
      minLength: TLen[0];
      maxLength: TLen[1];
    }
  : [GetFlags<TFlags>["nullable"], TLen[0], TLen[1], TPattern] extends [
      true,
      null,
      null,
      infer TRegex,
    ]
  ? {
      bsonType: ["string", "null"];
      pattern: TRegex;
    }
  : [GetFlags<TFlags>["nullable"], TLen[0], TLen[1], TPattern] extends [
      true,
      number,
      null,
      infer TRegex,
    ]
  ? {
      bsonType: ["string", "null"];
      minLength: TLen[0];
      pattern: TRegex;
    }
  : [GetFlags<TFlags>["nullable"], TLen[0], TLen[1], TPattern] extends [
      true,
      null,
      number,
      infer TRegex,
    ]
  ? {
      bsonType: ["string", "null"];
      maxLength: TLen[1];
      pattern: TRegex;
    }
  : [GetFlags<TFlags>["nullable"], TLen[0], TLen[1], TPattern] extends [
      true,
      number,
      number,
      infer TRegex,
    ]
  ? {
      bsonType: ["string", "null"];
      minLength: TLen[0];
      maxLength: TLen[1];
      pattern: TRegex;
    }
  : [GetFlags<TFlags>["nullable"], TLen[0], TLen[1], TPattern] extends [
      false,
      null,
      null,
      infer TRegex,
    ]
  ? {
      bsonType: "string";
      pattern: TRegex;
    }
  : [GetFlags<TFlags>["nullable"], TLen[0], TLen[1], TPattern] extends [
      false,
      number,
      null,
      infer TRegex,
    ]
  ? {
      bsonType: "string";
      minLength: TLen[0];
      pattern: TRegex;
    }
  : [GetFlags<TFlags>["nullable"], TLen[0], TLen[1], TPattern] extends [
      false,
      null,
      number,
      infer TRegex,
    ]
  ? {
      bsonType: "string";
      maxLength: TLen[1];
      pattern: TRegex;
    }
  : [GetFlags<TFlags>["nullable"], TLen[0], TLen[1], TPattern] extends [
      false,
      number,
      number,
      infer TRegex,
    ]
  ? {
      bsonType: "string";
      minLength: TLen[0];
      maxLength: TLen[1];
      pattern: TRegex;
    }
  : never;
