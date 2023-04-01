import { BorgError } from "./errors";
import { BorgObject } from "./BorgObject";
import { BorgArray } from "./BorgArray";
import { BorgString } from "./BorgString";
import { BorgBoolean } from "./BorgBoolean";
import { BorgNumber } from "./BorgNumber";
import { BorgId } from "./BorgId";
import { BorgUnion } from "./BorgUnion";
import type * as _ from "./types";

/////////////////////////////////////////////////////////////////////////////////////////////
///                                                                                       ///
///  BBBBBBBBBBBBBBBBB    MMMMMMM      MMMMMMM     OOOOOOOOOOOO     DDDDDDDDDDDDDDD       ///
///  B////////////////B   M//////M    M//////M   OO////////////OO   D//////////////DD     ///
///  B/////////////////B  M///////M  M///////M  OO//////////////OO  D///////////////DD    ///
///  B//////BBBBBB//////B M////////MM////////M O///////OOO////////O D/////DDDDDD/////DD   ///
///  BB/////B     B/////B M//////////////////M O//////O   O///////O D/////D    DD/////DD  ///
///    B////B     B/////B M/////M//////M/////M O/////O     O//////O D/////D     DD/////D  ///
///    B////B     B/////B M/////MM////MM/////M O/////O     O//////O D/////D      D/////D  ///
///    B////BBBBBB/////B  M/////M M//M M/////M O/////O     O//////O D/////D      D/////D  ///
///    B////////////BB    M/////M  MM  M/////M O/////O     O//////O D/////D      D/////D  ///
///    B////BBBBBB/////B  M/////M      M/////M O/////O     O//////O D/////D      D/////D  ///
///    B////B     B/////B M/////M      M/////M O/////O     O//////O D/////D      D/////D  ///
///    B////B     B/////B M/////M      M/////M O/////O     O//////O D/////D     DD/////D  ///
///    B////B     B/////B M/////M      M/////M O//////O   O///////O D/////D    DD/////DD  ///
///  BB/////BBBBBB//////B M/////M      M/////M O///////OOO////////O D/////DDOOOD/////DD   ///
///  B/////////////////B  M/////M      M/////M OO///////////////OO  D///////////////DD    ///
///  B////////////////B   M/////M      M/////M  OO/////////////OO   D//////////////DD     ///
///  BBBBBBBBBBBBBBBBB    MMMMMMM      MMMMMMM    OOOOOOOOOOOOOO    DDDDDDDDDDDDDDD       ///
///                                                                                       ///
/////////////////////////////////////////////////////////////////////////////////////////////

function makeBorg<TSchema extends BorgObject<_.Flags>>(
  schema: TSchema,
): _.BorgModel<TSchema>;
function makeBorg<
  TSchema extends BorgObject<_.Flags>,
  TServerModel extends object,
>(
  schema: TSchema,
  transformInput: (input: B.Type<TSchema>) => TServerModel,
): _.BorgModel<TSchema, TServerModel>;
function makeBorg<
  TInputSchema extends BorgObject<_.Flags>,
  TServerModel extends object,
  TOutputSchema extends BorgObject<_.Flags>,
>(
  inputSchema: TInputSchema,
  transformInput: (input: B.Type<TInputSchema>) => TServerModel,
  transformOutput: (input: TServerModel) => B.Type<TOutputSchema>,
  outputSchema: TOutputSchema,
): _.BorgModel<TInputSchema, TServerModel, TOutputSchema>;

function makeBorg<
  TInputSchema extends BorgObject<_.Flags>,
  TServerModel extends object,
  TOutputSchema extends BorgObject<_.Flags>,
>(
  schema: TInputSchema,
  transformInput: (input: B.Type<TInputSchema>) => TServerModel = (
    input: B.Type<TInputSchema>,
  ) => input as any,
  transformOutput: (input: TServerModel) => B.Type<TOutputSchema> = (
    input: TServerModel,
  ) => input as any,
  outputSchema: TOutputSchema = schema as any,
): _.BorgModel<TInputSchema, TServerModel, TOutputSchema> {
  /*TODO
  Modify output parsing so that fields not
  present in the output schema pass through untouched.
  When building a client parser, we can use the shape of the input schema,
  and replace the modified fields with those from the output schema.
*/
  return {
    createFromRequest: input => transformOutput(transformInput(input)),
    sanitizeResponse: input => transformOutput(input),
    serializeInput: parsedInput => schema.serialize(parsedInput) as any,
    deserializeInput: serializedInput => schema.parse(serializedInput) as any,
    serializeOutput: parsedOutput =>
      outputSchema.serialize(parsedOutput) as any,
    deserializeOutput: serializedOutput =>
      outputSchema.parse(serializedOutput) as any,
    parseInput: input => schema.parse(input) as any,
    parseOutput: input => outputSchema.parse(input) as any,
  };
}

const B = {
  id: () => new BorgId(),
  string: () => new BorgString(),
  number: () => new BorgNumber(),
  boolean: () => new BorgBoolean(),
  array: <const T extends _.Borg>(itemSchema: T) => new BorgArray(itemSchema),
  object: <const T extends { [key: string]: _.Borg }>(shape: T) =>
    new BorgObject(shape),
  union: <const T extends _.Borg[]>(...members: T) => new BorgUnion(members),
  model: makeBorg,
};

declare module B {
  export type Boolean<TFlags extends _.Flags = _.Flags> = InstanceType<typeof BorgBoolean<TFlags>>;

  export type Id<
    TFlags extends _.Flags = _.Flags,
    TFormat extends "string" | "oid" = "string" | "oid",
  > = InstanceType<typeof BorgId<TFlags, TFormat>>;

  export type Number<
    TFlags extends _.Flags = _.Flags,
    TLength extends _.MinMax = _.MinMax,
  > = InstanceType<typeof BorgNumber<TFlags, TLength>>;

  export type String<
    TFlags extends _.Flags = _.Flags,
    TLength extends _.MinMax = _.MinMax,
    TPattern extends string = string,
  > = InstanceType<typeof BorgString<TFlags, TLength, TPattern>>;

  export type Array<
    TFlags extends _.Flags = _.Flags,
    TLength extends _.MinMax = _.MinMax,
    TItems extends _.Borg = _.Borg,
  > = InstanceType<typeof BorgArray<TFlags, TLength, TItems>>;

  export type Object<
    TFlags extends _.Flags = _.Flags,
    TOtherProps extends "strict" | "strip" | "passthrough" | _.Borg =
      | "strict"
      | "strip"
      | "passthrough"
      | _.Borg,
    TShape extends { [key: string]: _.Borg } = {
      [key: string]: _.Borg;
    },
  > = InstanceType<typeof BorgObject<TFlags, TOtherProps, TShape>>;

  export type Union<
    TFlags extends _.Flags = _.Flags,
    TMembers extends _.Borg[] = _.Borg[],
  > = InstanceType<typeof BorgUnion<TFlags, TMembers>>;

  export type Borg = _.Borg;
  export type Type<T extends _.Borg> = _.Type<T>;
  export type BsonType<T extends _.Borg> = _.BsonType<T>;
  export type Serialized<T extends _.Borg> = _.Serialized<T>;
  export type Deserialized<T extends _.Borg> = _.Deserialized<T>;
  export type AnyBorg =
    | B.Object
    | B.Array
    | B.String
    | B.Number
    | B.Boolean
    | B.Id
    | B.Union
    | B.Borg;
}

export default B;

//////////////////////////////////////////////////////////////////////////////////////////////
///                                                                                       ///
///  TTTTTTTTTTTTTTTTTTTT EEEEEEEEEEEEEEEEEEEE     SSSSSSSSSSSSS    TTTTTTTTTTTTTTTTTTTT  ///
///  T//////////////////T E//////////////////E   SS/////////////SS  T//////////////////T  ///
///  T//////////////////T E//////////////////E SS/////////////////S T//////////////////T  ///
///  T///TTTT////TTTT///T E/////EEEEEEEEE////E S///////SSSSS//////S T///TTTT////TTTT///T  ///
///  T///T  T////T  T///T E/////E        EEEEE S/////SS    SSSSSSS  T///T  T////T  T///T  ///
///  TTTTT  T////T  TTTTT E/////E              S//////SS            TTTTT  T////T  TTTTT  ///
///         T////T        E/////E               SS/////SSS                 T////T         ///
///         T////T        E/////EEEEEEEEE         SS//////SS               T////T         ///
///         T////T        E//////////////E          SS//////SS             T////T         ///
///         T////T        E/////EEEEEEEEE             SS//////SS           T////T         ///
///         T////T        E/////E                       SSS/////SS         T////T         ///
///         T////T        E/////E                         SS//////S        T////T         ///
///         T////T        E/////E        EEEEE  SSSSSSS    SS/////S        T////T         ///
///       TT//////TT      E/////EEEEEEEEE////E S//////SSSSS///////S      TT//////TT       ///
///       T////////T      E//////////////////E S/////////////////SS      T////////T       ///
///       T////////T      E//////////////////E  SS/////////////SS        T////////T       ///
///       TTTTTTTTTT      EEEEEEEEEEEEEEEEEEEE    SSSSSSSSSSSSS          TTTTTTTTTT       ///
///                                                                                       ///
/////////////////////////////////////////////////////////////////////////////////////////////

/* c8 ignore start */
// @ts-ignore - vitest handles this import.meta check
if (import.meta.vitest) {
  // @ts-ignore - vitest handles this top-level await
  const [{ describe, expect, it }, { Double }] = await Promise.all([
    import("vitest"),
    import("bson"),
  ]);

  type TestCase = {
    name: string;
    basecase: any;
    schema: () => _.Borg;
    valid: any[];
    invalid: any[];
    bsonCheck: (value: unknown) => boolean;
  };

  describe("BorgSchemas", () => {
    const testCases = [
      {
        name: "BorgString",
        basecase: "test",
        schema: () => B.string(),
        valid: ["", "abc"],
        invalid: [1, undefined, null, {}],
        bsonCheck: (value: unknown) => typeof value === "string",
      },
      {
        name: "BorgString with min/max",
        basecase: "test",
        schema: () => B.string().minLength(0).maxLength(10),
        valid: ["", "abc", "1234567890"],
        invalid: ["12345678901", -1, 11, undefined, null],
        bsonCheck: (value: unknown) => typeof value === "string",
      },
      {
        name: "BorgString with exact length",
        basecase: "test--test",
        schema: () => B.string().length(10),
        valid: ["1234567890", "abcdefghij"],
        invalid: ["", "12", "12345678901", -1, 11, undefined, null],
        bsonCheck: (value: unknown) => typeof value === "string",
      },
      {
        name: "BorgString with length range",
        basecase: "test",
        schema: () => B.string().length(0, 10),
        valid: ["", "abc", "1234567890"],
        invalid: ["12345678901", -1, 11, undefined, null],
        bsonCheck: (value: unknown) => typeof value === "string",
      },
      {
        name: "BorgString with pattern",
        basecase: "C:\\Users\\abc",
        schema: () => B.string().pattern("C:\\\\Users\\\\.+"),
        valid: ["C:\\Users\\abc", "C:\\Users\\123"],
        invalid: ["C:\\\\Users\\abc\\def", "C:\\Users\\", undefined, null],
        bsonCheck: (value: unknown) => typeof value === "string",
      },
      {
        name: "BorgString with pattern and range",
        basecase: "C:\\Users\\abc",
        schema: () =>
          B.string().minLength(0).maxLength(14).pattern("C:\\\\Users\\\\.+"),
        valid: ["C:\\Users\\abc", "C:\\Users\\123"],
        invalid: [
          "C:\\\\Users\\abc\\def",
          "C:\\Users\\",
          "C:\\Users\\abc\\def",
          undefined,
          null,
        ],
        bsonCheck: (value: unknown) => typeof value === "string",
      },
      {
        name: "BorgNumber",
        basecase: 5,
        schema: () => B.number(),
        valid: [0, 3.14, -42],
        invalid: ["1", undefined, null],
        bsonCheck: (value: unknown) => value instanceof Double,
      },
      {
        name: "BorgNumber with min/max",
        basecase: 5,
        schema: () => B.number().min(0).max(10),
        valid: [0, 3.14, 10],
        invalid: [-1, 11, "1", undefined, null],
        bsonCheck: (value: unknown) => value instanceof Double,
      },
      {
        name: "BorgNumber with range",
        basecase: 5,
        schema: () => B.number().range(0, 10),
        valid: [0, 3.14, 10],
        invalid: [-1, 11, "1", undefined, null],
        bsonCheck: (value: unknown) => value instanceof Double,
      },
      {
        name: "BorgBoolean",
        basecase: true,
        schema: () => B.boolean(),
        valid: [true, false],
        invalid: ["true", 1, undefined, null],
        bsonCheck: (value: unknown) => typeof value === "boolean",
      },
      {
        name: "BorgArray",
        basecase: [1, 2, 3],
        schema: () => B.array(B.number()),
        valid: [[], [1, 2, 3]],
        invalid: ["1", 1, undefined, null],
        bsonCheck: (value: unknown) =>
          Array.isArray(value) && value.every(v => v instanceof Double),
      },
      {
        name: "BorgArray with min/max",
        basecase: [1, 2, 3],
        schema: () => B.array(B.number()).minLength(0).maxLength(10),
        valid: [[], [1, 2, 3]],
        invalid: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], "1", 1, undefined, null],
        bsonCheck: (value: unknown) =>
          Array.isArray(value) && value.every(v => v instanceof Double),
      },
      {
        name: "BorgArray with length",
        basecase: [1, 2, 3],
        schema: () => B.array(B.number()).length(0, 10),
        valid: [[], [1, 2, 3]],
        invalid: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], "1", 1, undefined, null],
        bsonCheck: (value: unknown) =>
          Array.isArray(value) && value.every(v => v instanceof Double),
      },
      {
        name: "BorgObject",
        basecase: { a: 1, b: 2, c: 3 },
        schema: () =>
          B.object({
            a: B.number(),
            b: B.number(),
            c: B.number(),
          }),
        valid: [
          { a: 1, b: 2, c: 3 },
          { a: 1, b: 2, c: 3, d: 4 },
          { a: 1, b: 2, c: 3, d: "", e: null, f: undefined, g: [], h: 0 },
        ],
        invalid: [
          { a: 1, b: 2 },
          { a: 1, b: 2, c: "3" },
          "1",
          1,
          undefined,
          null,
        ],
        bsonCheck: (value: unknown) =>
          typeof value === "object" &&
          value !== null &&
          "a" in value &&
          value.a instanceof Double &&
          "b" in value &&
          value.b instanceof Double &&
          "c" in value &&
          value.c instanceof Double,
      },
      {
        name: "BorgObject with strict extra keys",
        basecase: { a: 1, b: 2, c: 3 },
        schema: () =>
          B.object({
            a: B.number(),
            b: B.number(),
            c: B.number(),
          }).additionalProperties("strict"),
        valid: [{ a: 1, b: 2, c: 3 }],
        invalid: [
          { a: 1, b: 2, c: 3, d: 4 },
          { a: 1, b: 2, c: 3, d: "", e: null, f: undefined, g: [], h: 0 },
          { a: 1, b: 2 },
          { a: 1, b: 2, c: "3" },
          "1",
          1,
          undefined,
          null,
        ],
        bsonCheck: (value: unknown) =>
          typeof value === "object" &&
          value !== null &&
          "a" in value &&
          value.a instanceof Double &&
          "b" in value &&
          value.b instanceof Double &&
          "c" in value &&
          value.c instanceof Double,
      },
      {
        name: "BorgObject with passthrough extra keys",
        basecase: { a: 1, b: 2, c: 3 },
        schema: () =>
          B.object({
            a: B.number(),
            b: B.number(),
            c: B.number(),
          }).additionalProperties("passthrough"),
        valid: [
          { a: 1, b: 2, c: 3, d: 4 },
          { a: 1, b: 2, c: 3, d: "", e: null, f: undefined, g: [], h: 0 },
        ],
        invalid: [
          { a: 1, b: 2 },
          { a: 1, b: 2, c: "3" },
          "1",
          1,
          undefined,
          null,
        ],
        bsonCheck: (value: unknown) =>
          typeof value === "object" &&
          value !== null &&
          "a" in value &&
          value.a instanceof Double &&
          "b" in value &&
          value.b instanceof Double &&
          "c" in value &&
          value.c instanceof Double,
      },
      {
        name: "BorgObject with validated extra keys",
        basecase: { a: 1, b: 2, c: 3 },
        schema: () =>
          B.object({
            a: B.number(),
            b: B.number(),
            c: B.number(),
          }).additionalProperties(B.string().nullable().optional()),
        valid: [
          { a: 1, b: 2, c: 3, d: "4" },
          { a: 1, b: 2, c: 3, d: "", e: null, f: undefined, g: "[]", h: "0" },
        ],
        invalid: [
          { a: 1, b: 2, c: 3, d: 4 },
          { a: 1, b: 2 },
          { a: 1, b: 2, c: "3" },
          "1",
          1,
          undefined,
          null,
        ],
        bsonCheck: (value: unknown) =>
          typeof value === "object" &&
          value !== null &&
          "a" in value &&
          value.a instanceof Double &&
          "b" in value &&
          value.b instanceof Double &&
          "c" in value &&
          value.c instanceof Double,
      },
      {
        name: "BorgObject with optional and nullable properties",
        basecase: { a: 1, b: 2, c: 3 },
        schema: () =>
          B.object({
            a: B.number(),
            b: B.number().nullable(),
            c: B.number().optional(),
          }),
        valid: [
          { a: 1, b: 2, c: 3 },
          { a: 1, b: 2 },
          { a: 1, b: 2, c: undefined },
          { a: 1, b: null, c: 3 },
          { a: 1, b: null },
          { a: 1, b: 2, c: 3, d: 4 },
          { a: 1, b: 2, c: 3, d: "", e: null, f: undefined, g: [], h: 0 },
        ],
        invalid: [
          { a: 1, b: 2, c: "3" },
          { a: 1, b: 2, c: null },
          { a: 1, c: 3 },
          { a: 1, c: undefined },
          "1",
          1,
          undefined,
          null,
        ],
        bsonCheck: (value: unknown) =>
          typeof value === "object" &&
          value !== null &&
          "a" in value &&
          value.a instanceof Double &&
          "b" in value &&
          (value.b === null || value.b instanceof Double) &&
          "c" in value
            ? value.c instanceof Double
            : true,
      },
      {
        name: "BorgUnion",
        basecase: 1,
        schema: () => B.union(B.number(), B.string()),
        valid: [1, "1"],
        invalid: [undefined, null, true, false, [], {}],
        bsonCheck: (value: unknown) =>
          value instanceof Double || typeof value === "string",
      },
      {
        name: "BorgUnion with nullable and optional",
        basecase: 1,
        schema: () => B.union(B.number(), B.string()).nullable().optional(),
        valid: [1, "1", null, undefined],
        invalid: [true, false, [], {}],
        bsonCheck: (value: unknown) =>
          value === null ||
          value instanceof Double ||
          typeof value === "string",
      },
    ] satisfies TestCase[];

    testCases.forEach(
      ({ name, schema, valid, invalid, bsonCheck, basecase }) => {
        describe(name, () => {
          it("should parse valid values and throw for invalid values", () => {
            const borg = schema();
            const message = JSON.stringify(borg.meta, undefined, 2);
            valid.forEach(value => {
              const parsed = borg.parse(value);
              if (borg.meta.kind === "object") {
                //TODO: This `for` loop will need to change for the `exactOptionalProperties` feature, if it is implemented.
                for (const key of borg.meta.keys) {
                  if (value[key as keyof typeof value] !== undefined) {
                    expect(parsed).toHaveProperty(
                      key,
                      value[key as keyof typeof value],
                    );
                  } else {
                    expect(parsed["c" as keyof typeof parsed]).toBeUndefined();
                  }
                }
                const unknownKeys = Object.keys(value).filter(
                  v =>
                    borg.meta.kind === "object" &&
                    !borg.meta.keys.includes(v as keyof typeof value),
                );
                for (const key of unknownKeys) {
                  if (
                    borg.meta.additionalProperties === "strict" ||
                    borg.meta.additionalProperties === "strip"
                  ) {
                    expect(parsed).not.toHaveProperty(key);
                  } else {
                    expect(parsed).toHaveProperty(key);
                    expect(parsed[key as keyof typeof parsed]).toEqual(
                      borg.meta.additionalProperties === "passthrough"
                        ? value[key as keyof typeof value]
                        : borg.meta.additionalProperties.parse(
                            value[key as keyof typeof value],
                          ),
                    );
                  }
                }
              } else {
                expect(
                  parsed,
                  `Expected ${JSON.stringify(parsed)} to be ${JSON.stringify(
                    value,
                  )} using schema: ${message}`,
                ).toEqual(value);
              }
            });

            invalid.forEach(value => {
              expect(
                () => borg.parse(value),
                `Expected ${JSON.stringify(
                  value,
                )} to throw for schema: ${message}`,
              ).toThrow(BorgError);
            });
          });

          it("should copy correctly", () => {
            const borg = schema().optional();
            const borg2 = borg.copy();
            expect(borg2).toEqual(borg);
            expect(borg2).not.toBe(borg);
            expect(borg.meta.optional).toBe(true);
            expect(borg2.meta.optional).toBe(true);
          });

          it("should assert correctly", () => {
            const borg = schema();
            const message = JSON.stringify(borg.meta, undefined, 2);
            valid.forEach(value => {
              const ok = borg.is(value);
              expect(
                ok,
                `Expected ${JSON.stringify(
                  value,
                )} to be pass using schema: ${message}`,
              ).toBe(true);
            });

            invalid.forEach(value => {
              const ok = borg.is(value);
              expect(
                ok,
                `Expected ${JSON.stringify(
                  value,
                )} to fail using schema: ${message}`,
              ).toBe(false);
            });
          });

          it("should parse without throwing", () => {
            const borg = schema();

            valid.forEach(value => {
              const parsed = borg.try(value);
              const message = JSON.stringify(borg.meta, undefined, 2);
              expect(
                parsed.ok,
                `Expected ${JSON.stringify(
                  value,
                )} to be pass using schema: ${message}`,
              ).toBe(true);
              if (parsed.ok) {
                if (borg.meta.kind === "object") {
                  //TODO: This `for` loop will need to change for the `exactOptionalProperties` feature, if it is implemented.
                  for (const key of borg.meta.keys) {
                    if (value[key as keyof typeof value] !== undefined) {
                      expect(parsed.value).toHaveProperty(
                        key,
                        value[key as keyof typeof value],
                      );
                    } else {
                      expect(
                        parsed.value["c" as keyof typeof parsed.value],
                      ).toBeUndefined();
                    }
                  }
                  const unknownKeys = Object.keys(value).filter(
                    v =>
                      borg.meta.kind === "object" &&
                      !borg.meta.keys.includes(v as keyof typeof value),
                  );
                  for (const key of unknownKeys) {
                    if (
                      borg.meta.additionalProperties === "strict" ||
                      borg.meta.additionalProperties === "strip"
                    ) {
                      expect(parsed).not.toHaveProperty(key);
                    } else {
                      expect(parsed).toHaveProperty(key);
                      expect(parsed[key as keyof typeof parsed]).toEqual(
                        borg.meta.additionalProperties === "passthrough"
                          ? value[key as keyof typeof value]
                          : borg.meta.additionalProperties.parse(
                              value[key as keyof typeof value],
                            ),
                      );
                    }
                  }
                } else {
                  expect(
                    parsed.value,
                    `Expected ${JSON.stringify(
                      parsed.value,
                    )} to be ${JSON.stringify(value)} using schema: ${message}`,
                  ).toEqual(value);
                }
              }
            });

            invalid.forEach(value => {
              const parsed = borg.try(value);
              const message = JSON.stringify(borg.meta, undefined, 2);
              expect(
                parsed.ok,
                `Expected ${JSON.stringify(
                  value,
                )} to fail using schema: ${message}`,
              ).toBe(false);
              if (!parsed.ok)
                expect(
                  parsed.error,
                  `Expected ${JSON.stringify(value)} to throw ${
                    parsed.error
                  } for schema: ${message}`,
                ).toBeInstanceOf(BorgError);
            });
          });

          it("should convert to BSON correctly", () => {
            const borg = schema();
            valid.forEach(value => {
              //@ts-expect-error - testing sucks with TS :()
              const bson = borg.toBson(value);
              expect(bsonCheck(bson), `${bsonCheck.toString()}`).toBe(true);
              const reverted = borg.fromBson(bson as never);
              expect(
                reverted,
                `Expected ${JSON.stringify(bson)} to revert to ${JSON.stringify(
                  bson,
                )}`,
              ).toEqual(value);
            });
          });

          it.todo("should print the correct JSON schema", () => {});

          it.todo("should serialize and deserialize", () => {
            const borg = schema();
            valid.forEach(value => {
              const serialized = borg.serialize(value as never);
              //@ts-expect-error - not yet implemented
              expect(serialized.data).toEqual(serializedValue);
              //@ts-expect-error - not yet implemented
              expect(serialized.meta).toEqual(expectedMeta);
              //@ts-expect-error - not yet implemented
              const deserialized = borg.deserialize(serialized);
              expect(deserialized).toEqual(value);
            });
          });

          it("should be optional when marked as such", () => {
            const borg = schema().optional();
            const parsed = borg.parse(undefined);
            expect(
              parsed,
              `Expected undefined to pass using schema: ${JSON.stringify(
                borg.meta,
                undefined,
                2,
              )}`,
            ).toBeUndefined();
          });

          it("should be nullable when marked as such", () => {
            const borg = schema().nullable();
            const parsed = borg.parse(null);
            expect(
              parsed,
              `Expected null to pass using schema: ${JSON.stringify(
                borg.meta,
                undefined,
                2,
              )}`,
            ).toBeNull();
          });

          it("should be optional and nullable when marked as such", () => {
            const borg = schema().optional().nullable();
            const parsed = borg.parse(undefined);
            const parsed2 = borg.parse(null);
            expect(
              parsed,
              `Expected undefined to pass using schema: ${JSON.stringify(
                borg.meta,
                undefined,
                2,
              )}`,
            ).toBeUndefined();
            expect(
              parsed2,
              `Expected null to pass using schema: ${JSON.stringify(
                borg.meta,
                undefined,
                2,
              )}`,
            ).toBeNull();
          });

          it("should be nullish when marked as such", () => {
            const borg = schema().nullish();
            const parsed = borg.parse(undefined);
            const parsed2 = borg.parse(null);
            expect(
              parsed,
              `Expected undefined to pass using schema: ${JSON.stringify(
                borg.meta,
                undefined,
                2,
              )}`,
            ).toBeUndefined();
            expect(
              parsed2,
              `Expected null to pass using schema: ${JSON.stringify(
                borg.meta,
                undefined,
                2,
              )}`,
            ).toBeNull();
          });

          it("should parse as normal when marked private", () => {
            const borg = schema().private();
            valid.forEach(value => {
              const parsed = borg.parse(value);
              expect(
                parsed,
                `Expected ${JSON.stringify(
                  value,
                )} to pass using schema: ${JSON.stringify(
                  borg.meta,
                  undefined,
                  2,
                )}`,
              ).toEqual(value);
            });

            invalid.forEach(value => {
              expect(
                () => borg.parse(value),
                `Expected ${JSON.stringify(
                  value,
                )} to fail using schema: ${JSON.stringify(
                  borg.meta,
                  undefined,
                  2,
                )}`,
              ).toThrow(BorgError);
            });
          });

          it("should not matter in what order the following are chained: `optional`, `private`, `required`, `notNull`, `nullish`, notNullish`, `public`, and `nullable`", () => {
            const borg = schema()
              .optional() // optional, notNull, public
              .private() // optional, notNull, private
              .required() // required, notNull, private
              .notNull() // required, notNull, private
              .nullish() // optional, nullable, private
              .public() // optional, nullable, public
              .notNullish() // required, notNull, public
              .nullable(); // required, nullable, public

            expect(borg.meta).toHaveProperty("optional", false);
            expect(borg.meta).toHaveProperty("nullable", true);
            expect(borg.meta).toHaveProperty("private", false);

            expect(borg.parse(basecase)).toEqual(basecase);
            expect(borg.parse(null)).toBeNull();
            expect(() => borg.parse(undefined)).toThrow(BorgError);

            const borg2 = schema()
              .notNullish() // required, notNull, public
              .nullable() // required, nullable, public
              .public() // required, nullable, public
              .nullish() // optional, nullable, public
              .notNull() // optional, notNull, public
              .required() // required, notNull, public
              .private() // required, notNull, private
              .optional(); // optional, notNull, private

            expect(borg2.meta).toHaveProperty("optional", true);
            expect(borg2.meta).toHaveProperty("nullable", false);
            expect(borg2.meta).toHaveProperty("private", true);

            expect(borg2.parse(basecase)).toEqual(basecase);
            expect(() => borg2.parse(null)).toThrow(BorgError);
            expect(borg2.parse(undefined)).toBeUndefined();
          });
        });
      },
    );
  });
}
/* c8 ignore stop */
