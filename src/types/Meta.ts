import type * as _ from ".";

export type Meta = _.PrettyPrint<
  {
    optional: boolean;
    nullable: boolean;
    private: boolean;
  } & (
    | {
        kind: "union";
        borgMembers: _.Borg[];
      }
    | {
        kind: "object";
        keys: (string | undefined)[];
        requiredKeys: (string | undefined)[];
        borgShape: { [key: string]: _.Borg };
        additionalProperties: _.AdditionalProperties;
      }
    | {
        borgItems: _.Borg;
        kind: "array";
        maxItems: number | null;
        minItems: number | null;
      }
    | ({
        kind: "string";
        maxLength: number | null;
        minLength: number | null;
      } & (
        | {
            pattern: null;
            regex: null;
          }
        | {
            pattern: string;
            regex: RegExp;
          }
      ))
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
  TFlags extends _.Flags,
  TBorgMembers extends _.Borg
> = Readonly<_.PrettyPrint<
  {
    kind: "union";
    borgMembers: TBorgMembers[];
  } & _.GetFlags<TFlags>
>>;

export type ObjectMeta<
  TFlags extends _.Flags,
  TOtherProps extends _.AdditionalProperties,
  TShape extends { [key: string]: _.Borg }
> = Readonly<_.PrettyPrint<
  {
    kind: "object";
    keys: Array<Extract<keyof TShape, string>>;
    requiredKeys: _.RequiredKeysArray<TShape>;
    borgShape: TShape;
    additionalProperties: TOtherProps;
  } & _.GetFlags<TFlags>
>>;

export type ArrayMeta<
  TFlags extends _.Flags,
  TLength extends _.MinMax,
  TItemBorg extends _.Borg
> = Readonly<_.PrettyPrint<
  {
    borgItems: TItemBorg;
    kind: "array";
    maxItems: TLength[1];
    minItems: TLength[0];
  } & _.GetFlags<TFlags>
>>;

export type StringMeta<
  TFlags extends _.Flags,
  TLength extends _.MinMax,
  TPattern extends string
> = Readonly<_.PrettyPrint<
  {
    kind: "string";
    maxLength: TLength[1];
    minLength: TLength[0];
  } & (TPattern extends ".*"
    ? { pattern: null; regex: null }
    : { pattern: TPattern; regex: RegExp }) &
    _.GetFlags<TFlags>
>>;

export type NumberMeta<
  TFlags extends _.Flags,
  TRange extends _.MinMax
> = Readonly<_.PrettyPrint<
  {
    kind: "number";
    max: TRange[1];
    min: TRange[0];
  } & _.GetFlags<TFlags>
>>;

export type IdMeta<
  TFlags extends _.Flags,
  TFormat extends string | _.ObjectId
> = Readonly<_.PrettyPrint<
  {
    kind: "id";
    format: TFormat extends _.ObjectId ? "oid" : "string";
  } & _.GetFlags<TFlags>
>>;

export type BooleanMeta<TFlags extends _.Flags> = Readonly<_.PrettyPrint<
  {
    kind: "boolean";
  } & _.GetFlags<TFlags>
>>;

/* c8 ignore start */
//@ts-ignore - vitest handles this import.meta check
if (import.meta.vitest) {
  const [{ describe, it, expect }, { default: b }, { Borg }] =
    //@ts-ignore - vitest handles this top-level await
    await Promise.all([
      import("vitest"),
      import("../index"),
      import("../Borg")
    ]);

  describe("Meta", () => {
    type TestCase = {
      name: string;
      schema: () => _.Borg;
      kind: Meta["kind"];
      extraChecks: Array<(borg: { meta: { [key: string]: any } }) => boolean>;
    };

    const testCases = [
      {
        name: "BorgString",
        schema: () => b.string(),
        kind: "string",
        extraChecks: [
          borg => borg.meta["pattern"] === null,
          borg => borg.meta["minLength"] === null,
          borg => borg.meta["maxLength"] === null
        ]
      },
      {
        name: "BorgString with min/max",
        schema: () => b.string().minLength(0).maxLength(10),
        kind: "string",
        extraChecks: [
          borg => borg.meta["pattern"] === null,
          borg => borg.meta["minLength"] === 0,
          borg => borg.meta["maxLength"] === 10
        ]
      },
      {
        name: "BorgString with exact length",
        schema: () => b.string().length(10),
        kind: "string",
        extraChecks: [
          borg => borg.meta["pattern"] === null,
          borg => borg.meta["minLength"] === 10,
          borg => borg.meta["maxLength"] === 10
        ]
      },
      {
        name: "BorgString with length range",
        schema: () => b.string().length(0, 10),
        kind: "string",
        extraChecks: [
          borg => borg.meta["pattern"] === null,
          borg => borg.meta["minLength"] === 0,
          borg => borg.meta["maxLength"] === 10
        ]
      },
      {
        name: "BorgString with pattern",
        schema: () => b.string().pattern("C:\\\\Users\\\\.+"),
        kind: "string",
        extraChecks: [
          borg => borg.meta["pattern"] === "C:\\\\Users\\\\.+",
          borg => borg.meta["minLength"] === null,
          borg => borg.meta["maxLength"] === null
        ]
      },
      {
        name: "BorgString with pattern and range",
        schema: () =>
          b.string().minLength(0).maxLength(14).pattern("C:\\\\Users\\\\.+"),
        kind: "string",
        extraChecks: [
          borg => borg.meta["pattern"] === "C:\\\\Users\\\\.+",
          borg => borg.meta["minLength"] === 0,
          borg => borg.meta["maxLength"] === 14
        ]
      },
      {
        name: "BorgNumber",
        schema: () => b.number(),
        kind: "number",
        extraChecks: [
          borg => borg.meta["min"] === null,
          borg => borg.meta["max"] === null
        ]
      },
      {
        name: "BorgNumber with min/max",
        schema: () => b.number().min(0).max(10),
        kind: "number",
        extraChecks: [
          borg => borg.meta["min"] === 0,
          borg => borg.meta["max"] === 10
        ]
      },
      {
        name: "BorgNumber with range",
        schema: () => b.number().range(0, 10),
        kind: "number",
        extraChecks: [
          borg => borg.meta["min"] === 0,
          borg => borg.meta["max"] === 10
        ]
      },
      {
        name: "BorgBoolean",
        schema: () => b.boolean(),
        kind: "boolean",
        extraChecks: []
      },
      {
        name: "BorgArray",
        schema: () => b.array(b.number()),
        kind: "array",
        extraChecks: [
          borg => borg.meta["minItems"] === null,
          borg => borg.meta["maxItems"] === null,
          borg => borg.meta["borgItems"] instanceof Borg,
          borg => borg.meta["borgItems"] !== borg.meta["borgItems"]
        ]
      },
      {
        name: "BorgArray with min/max",
        schema: () => b.array(b.number()).minItems(0).maxItems(10),
        kind: "array",
        extraChecks: [
          borg => borg.meta["minItems"] === 0,
          borg => borg.meta["maxItems"] === 10,
          borg => borg.meta["borgItems"] instanceof Borg,
          borg => borg.meta["borgItems"] !== borg.meta["borgItems"]
        ]
      },
      {
        name: "BorgArray with length",
        schema: () => b.array(b.number()).length(0, 10),
        kind: "array",
        extraChecks: [
          borg => borg.meta["minItems"] === 0,
          borg => borg.meta["maxItems"] === 10,
          borg => borg.meta["borgItems"] instanceof Borg,
          borg => borg.meta["borgItems"] !== borg.meta["borgItems"]
        ]
      },
      {
        name: "BorgObject",
        schema: () =>
          b.object({
            a: b.number(),
            b: b.number(),
            c: b.number()
          }),
        kind: "object",
        extraChecks: [
          borg => borg.meta["borgShape"] !== null,
          borg => typeof borg.meta["borgShape"] === "object",
          borg => ["a", "b", "c"].every(key => key in borg.meta["borgShape"]),
          borg =>
            ["a", "b", "c"].every(
              key => borg.meta["borgShape"][key] instanceof Borg
            )
        ]
      },
      {
        name: "BorgUnion",
        schema: () => b.union([b.number(), b.string()]),
        kind: "union",
        extraChecks: [
          borg => borg.meta["borgMembers"] !== null,
          borg => Array.isArray(borg.meta["borgMembers"]),
          borg => borg.meta["borgMembers"].length === 2
        ]
      }
    ] satisfies TestCase[];

    for (const { name, schema, extraChecks, kind } of testCases) {
      describe(name, () => {
        const borg = schema();

        it("should return the correct kind", () => {
          expect(borg.meta.kind).toBe(kind);
        });

        it("should have the correct flags", () => {
          expect(borg.meta.optional).toEqual(false);
          expect(borg.meta.nullable).toEqual(false);
          expect(borg.meta.private).toEqual(false);
        });

        for (const check of extraChecks) {
          it("should pass schema-specific checks", () => {
            expect(check(borg), `${check.toString()}`).toBe(true);
          });
        }

        it("should be able to set flags", () => {
          const borg = schema().optional().nullable().private();
          expect(borg.meta.optional).toEqual(true);
          expect(borg.meta.nullable).toEqual(true);
          expect(borg.meta.private).toEqual(true);
        });

        it("should throw when attempting to mutate the meta object", () => {
          for (const key of Object.keys(borg.meta)) {
            expect(() => {
              // @ts-ignore - this is a test
              borg.meta[key] = true;
              // @ts-ignore - this is a test
            }, `key "${key}" with value "${borg.meta[key]}" should not be mutable`).toThrow();
          }
        });
      });
    }

    for (const { name, schema } of testCases.filter(
      ({ kind }) => kind !== "object"
    )) {
      describe(`${name} Meta Nesting`, () => {
        it("Should treat Borgs nested in meta like any other Borg", () => {
          const borg = schema().optional();
          if (borg.meta.kind === "object") {
            const borg2 = b.object(borg.meta.borgShape);
            const borg3 = borg.required();

            expect(borg.parse({ a: 1, b: 2, c: 3 })).toEqual({
              a: 1,
              b: 2,
              c: 3
            });
            expect(borg2.parse({ a: 1, b: 2, c: 3 })).toEqual({
              a: 1,
              b: 2,
              c: 3
            });
            expect(borg3.parse({ a: 1, b: 2, c: 3 })).toEqual({
              a: 1,
              b: 2,
              c: 3
            });
            expect(borg2).not.toBe(borg);
            expect(borg3).not.toBe(borg);
            expect(borg.parse(undefined)).toBeUndefined();
            expect(() => borg2.parse(undefined)).toThrow();
            expect(() => borg3.parse(undefined)).toThrow();
            expect(borg.meta.optional).toEqual(true);
            expect(borg2.meta.optional).toEqual(false);
            expect(borg3.meta.optional).toEqual(false);
          } else if (borg.meta.kind === "array") {
            const borg2 = b.array(borg.meta.borgItems);
            const borg3 = borg.required();

            expect(borg2).not.toBe(borg);
            expect(borg3).not.toBe(borg);
            expect(borg.parse([1, 2, 3])).toEqual([1, 2, 3]);
            expect(borg2.parse([1, 2, 3])).toEqual([1, 2, 3]);
            expect(borg3.parse([1, 2, 3])).toEqual([1, 2, 3]);
            expect(borg.parse(undefined)).toBeUndefined();
            expect(() => borg2.parse(undefined)).toThrow();
            expect(() => borg3.parse(undefined)).toThrow();
            expect(borg.meta.optional).toEqual(true);
            expect(borg2.meta.optional).toEqual(false);
            expect(borg3.meta.optional).toEqual(false);
          }
        });
      });
    }
  });
}
/* c8 ignore stop */
