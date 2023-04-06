import { Borg } from "./Borg";
import { BorgError } from "./errors";
import { isin, getBsonSchema } from "./utils";
import type * as _ from "./types";

/////////////////////////////////////////////////////////////////////////////////////////////
///                                                                                       ///
///  BBBBBBBBBBBBBBBBB        OOOOOOOOOOOO     BBBBBBBBBBBBBBBBB          JJJJJJJJJJJJJJ  ///
///  B////////////////B     OO////////////OO   B////////////////B         J////////////J  ///
///  B/////////////////B   OO//////////////OO  B/////////////////B        J////////////J  ///
///  B//////BBBBBB//////B O///////OOO////////O BB/////BBBBBB//////B       JJJJJJ////JJJJ  ///
///  BB/////B     B/////B O//////O   O///////O   B////B     B/////B            J////J     ///
///    B////B     B/////B O/////O     O//////O   B////B     B/////B            J////J     ///
///    B////B     B/////B O/////O     O//////O   B////B     B/////B            J////J     ///
///    B////BBBBBB/////B  O/////O     O//////O   B////BBBBBB/////B             J////J     ///
///    B////////////BB    O/////O     O//////O   B/////////////BB     JJJJJJ   J////J     ///
///    B////BBBBBB/////B  O/////O     O//////O   B////BBBBBB/////B   J//////J  J////J     ///
///    B////B     B/////B O/////O     O//////O   B////B     B/////B J//////J   J////J     ///
///    B////B     B/////B O/////O     O//////O   B////B     B/////B J/////J    J////J     ///
///    B////B     B/////B O/////O     O//////O   B////B     B/////B J/////J    J////J     ///
///  BB/////BBBBBB//////B O///////OOO////////O BB/////BBBBBB//////B J//////JJJJ/////J     ///
///  B/////////////////B  OO///////////////OO  B/////////////////B   J//////////////J     ///
///  B////////////////B    OO/////////////OO   B////////////////B     J////////////J      ///
///  BBBBBBBBBBBBBBBBB       OOOOOOOOOOOOOO    BBBBBBBBBBBBBBBBB       JJJJJJJJJJJJ       ///
///                                                                                       ///
/////////////////////////////////////////////////////////////////////////////////////////////

export class BorgObject<
  const TFlags extends _.Flags = ["required", "notNull", "public"],
  const TOtherProps extends _.AdditionalProperties = "strip",
  const TShape extends { [key: string]: _.Borg } = {
    [key: string]: _.Borg;
  }
> extends Borg {
  #borgShape: TShape;
  #additionalProperties: _.AdditionalProperties = "strip";
  #flags = {
    optional: false,
    nullable: false,
    private: false
  };

  constructor(shape: TShape) {
    super();
    this.#borgShape = Object.freeze(
      Object.fromEntries(
        Object.entries(shape).map(([key, value]) => [key, value.copy()])
      )
    ) as any;
  }

  static #clone<const TBorg extends BorgObject<any, any, any>>(
    borg: TBorg
  ): TBorg {
    const newShape = {} as { [key: string]: _.Borg };
    for (const key in borg.#borgShape)
      newShape[key] = borg.#borgShape[key]!.copy();
    const clone = new BorgObject(newShape);
    clone.#flags = { ...borg.#flags };
    clone.#additionalProperties =
      borg.#additionalProperties instanceof Borg
        ? borg.#additionalProperties.copy()
        : borg.#additionalProperties;
    return clone as any;
  }

  get meta(): _.ObjectMeta<TFlags, TOtherProps, TShape> {
    return Object.freeze({
      kind: "object",
      borgShape: this.#borgShape,
      keys: Object.freeze(Object.keys(this.#borgShape)),
      requiredKeys: Object.freeze(
        Object.keys(this.#borgShape).filter(
          k => this.#borgShape[k]!.meta.optional === false
        )
      ),
      additionalProperties:
        this.#additionalProperties instanceof Borg
          ? this.#additionalProperties.copy()
          : this.#additionalProperties,
      ...this.#flags
    }) as any;
  }

  get bsonSchema() {
    return getBsonSchema(this.meta);
  }

  is(input: unknown): input is ReturnType<this["parse"]> {
    return this.try(input).ok;
  }

  copy(): this {
    return BorgObject.#clone(this);
  }

  parse(
    input: unknown
  ): _.Parsed<{ [k in keyof TShape]: _.Type<TShape[k]> }, TFlags> {
    if (input === undefined) {
      if (this.#flags.optional) return void 0 as any;
      throw new BorgError(
        `OBJECT_ERROR: Expected object${
          this.#flags.nullable ? " or null" : ""
        }, got undefined`
      );
    }
    if (input === null) {
      if (this.#flags.nullable) return null as any;
      throw new BorgError(
        `OBJECT_ERROR: Expected object${
          this.#flags.optional ? " or undefined" : ""
        }, got null`
      );
    }
    if (typeof input !== "object" || Array.isArray(input)) {
      throw new BorgError(
        `OBJECT_ERROR: Expected object,${
          this.#flags.optional ? " or undefined," : ""
        }${this.#flags.nullable ? " or null," : ""} got ${
          Array.isArray(input) ? "array" : typeof input
        }`
      );
    }

    const result = {} as any;

    if (this.#additionalProperties === "strict") {
      for (const key in input) {
        if (!isin(this.#borgShape, key)) {
          throw new BorgError(
            `OBJECT_ERROR: Unexpected property "${key}"`,
            undefined,
            [key]
          );
        }
      }
    }

    for (const key in this.#borgShape) {
      if (!isin(input, key)) {
        //TODO: implement 'exactOptional' by providing a config flag somewhere?
        if (this.#borgShape[key]!.meta.optional === false) {
          throw new BorgError(
            `OBJECT_ERROR: Missing property "${key}"`,
            undefined,
            [key]
          );
        }
        continue;
      }

      try {
        const parsed = this.#borgShape[key]!.parse(input[key]);
        result[key] = parsed;
        continue;
      } catch (e) {
        if (e instanceof BorgError) {
          throw new BorgError(
            `OBJECT_ERROR: Invalid value for property "${key}"`,
            e,
            [key]
          );
          /* c8 ignore start */
        } else {
          throw new BorgError(
            `OBJECT_ERROR: Unknown error parsing "${key}": \n\t${JSON.stringify(
              e
            )}`,
            undefined,
            [key]
          );
        }
        /* c8 ignore stop */
      }
    }

    if (this.#additionalProperties === "passthrough") {
      for (const key in input) {
        if (!isin(this.#borgShape, key)) {
          result[key] = input[key];
        }
      }
    }

    if (this.#additionalProperties instanceof Borg) {
      for (const key in input) {
        if (!isin(this.#borgShape, key)) {
          const parsed = this.#additionalProperties.try(input[key]);
          if (parsed.ok) result[key] = parsed.value;
          else {
            throw new BorgError(
              `OBJECT_ERROR: Invalid value for extra property "${key}"`,
              parsed.error,
              [key]
            );
          }
        }
      }
    }

    return result;
  }

  try(input: unknown): _.TryResult<_.Type<this>, this["meta"]> {
    try {
      const value = this.parse(input) as any;
      return {
        value,
        ok: true,
        meta: this.meta
      } as any;
      /* c8 ignore start */
    } catch (e) {
      if (e instanceof BorgError) return { ok: false, error: e } as any;
      else {
        return {
          ok: false,
          error: new BorgError(
            `OBJECT_ERROR(try): Unknown error parsing: \n\t${JSON.stringify(e)}`
          )
        } as any;
      }
      /* c8 ignore stop */
    }
  }

  //TODO: Should we be treating 'undefined' in any special way when converting to BSON?
  toBson<
    const TInput extends Partial<
      _.Parsed<{ [k in keyof TShape]: _.Type<TShape[k]> }, TFlags>
    > = Partial<_.Parsed<{ [k in keyof TShape]: _.Type<TShape[k]> }, TFlags>>
  >(
    input: TInput
  ): {
    [k in keyof TShape as keyof TInput]: k extends keyof TInput
      ? TInput[k] extends undefined
        ? never
        : _.BsonType<TShape[k]>
      : never;
  } {
    if (input === null || input === undefined) return input as any;
    const result = {} as any;
    for (const key in this.#borgShape) {
      if (!isin(input, key)) continue;
      result[key] = this.#borgShape[key]!.toBson(input[key]);
    }
    return result;
  }

  fromBson(
    input:
      | _.BsonType<BorgObject<TFlags, TOtherProps, TShape>>
      | null
      | undefined
  ): _.Parsed<{ [k in keyof TShape]: _.Type<TShape[k]> }, TFlags> {
    if (input === null || input === undefined) return input as any;
    const result = {} as any;
    for (const key in this.#borgShape) {
      if (!isin(input, key)) continue;
      result[key] = this.#borgShape[key]!.fromBson(input[key]);
    }
    return result;
  }

  optional(): BorgObject<_.SetOptional<TFlags>, TOtherProps, TShape> {
    const copy = this.copy();
    copy.#flags.optional = true;
    return copy as any;
  }

  nullable(): BorgObject<_.SetNullable<TFlags>, TOtherProps, TShape> {
    const clone = this.copy();
    clone.#flags.nullable = true;
    return clone as any;
  }

  nullish(): BorgObject<_.SetNullish<TFlags>, TOtherProps, TShape> {
    const clone = this.copy();
    clone.#flags.optional = true;
    clone.#flags.nullable = true;
    return clone as any;
  }

  required(): BorgObject<_.SetRequired<TFlags>, TOtherProps, TShape> {
    const clone = this.copy();
    clone.#flags.optional = false;
    return clone as any;
  }

  notNull(): BorgObject<_.SetNotNull<TFlags>, TOtherProps, TShape> {
    const clone = this.copy();
    clone.#flags.nullable = false;
    return clone as any;
  }

  notNullish(): BorgObject<_.SetNotNullish<TFlags>, TOtherProps, TShape> {
    const clone = this.copy();
    clone.#flags.optional = false;
    clone.#flags.nullable = false;
    return clone as any;
  }

  private(): BorgObject<_.SetPrivate<TFlags>, TOtherProps, TShape> {
    const clone = this.copy();
    clone.#flags.private = true;
    return clone as any;
  }

  public(): BorgObject<_.SetPublic<TFlags>, TOtherProps, TShape> {
    const clone = this.copy();
    clone.#flags.private = false;
    return clone as any;
  }

  additionalProperties<T extends _.AdditionalProperties>(
    additionalProperties: T
  ): BorgObject<TFlags, T, TShape> {
    const clone = this.copy();
    clone.#additionalProperties = additionalProperties;
    return clone as any;
  }

  /* c8 ignore next */
}

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
//@ts-expect-error - Vite handles this import.meta check
if (import.meta.vitest) {
  const [{ describe, it, expect }, { default: b }, { Double }] =
    //@ts-expect-error - Vite handles this top-level await
    await Promise.all([
      import("vitest"),
      import("../src/index"),
      import("bson")
    ]);

  type TestCase = [
    string,
    () => _.Borg,
    {
      strict: {
        pass: [any, any][];
        fail: [any, any][];
      };
      passthrough: {
        pass: [any, any][];
        fail: [any, any][];
      };
      strip: {
        pass: [any, any][];
        fail: [any, any][];
      };
      withValidator: {
        borg: _.Borg;
        pass: [any, any][];
        fail: [any, any][];
      };
    }
  ];

  const testCases = [
    [
      "a simple object",
      () =>
        b.object({
          a: b.string(),
          b: b.number(),
          c: b.boolean()
        }),
      {
        strict: {
          pass: [
            [
              { a: "a", b: 1, c: true },
              { a: "a", b: 1, c: true }
            ],
            [
              { a: "", b: 1, c: false },
              { a: "", b: 1, c: false }
            ],
            [
              { a: "a", b: 0, c: true },
              { a: "a", b: 0, c: true }
            ]
          ],
          fail: [
            [{ a: "a", b: 1 }, BorgError],
            [{ a: "a", b: "1", c: true }, BorgError],
            [{ a: 2, b: 1, c: true }, BorgError],
            [{ a: "a", b: 1, c: true, d: false }, BorgError],
            [{ a: "a", b: 1, c: true, d: undefined }, BorgError],
            [["a"], BorgError]
          ]
        },
        passthrough: {
          pass: [
            [
              { a: "a", b: 1, c: true },
              { a: "a", b: 1, c: true }
            ],
            [
              { a: "", b: 1, c: false },
              { a: "", b: 1, c: false }
            ],
            [
              { a: "a", b: 0, c: true },
              { a: "a", b: 0, c: true }
            ],
            [
              { a: "a", b: 1, c: true, d: false },
              { a: "a", b: 1, c: true, d: false }
            ],
            [
              { a: "a", b: 1, c: true, d: undefined, e: "" },
              { a: "a", b: 1, c: true, d: undefined, e: "" }
            ]
          ],
          fail: [
            [{ a: "a", b: 1 }, BorgError],
            [{ a: "a", b: "1", c: true }, BorgError],
            [{ a: 2, b: 1, c: true }, BorgError]
          ]
        },
        strip: {
          pass: [
            [
              { a: "a", b: 1, c: true },
              { a: "a", b: 1, c: true }
            ],
            [
              { a: "", b: 1, c: false },
              { a: "", b: 1, c: false }
            ],
            [
              { a: "a", b: 0, c: true },
              { a: "a", b: 0, c: true }
            ],
            [
              { a: "a", b: 1, c: true, d: false },
              { a: "a", b: 1, c: true }
            ],
            [
              { a: "a", b: 1, c: true, d: undefined, e: "" },
              { a: "a", b: 1, c: true }
            ]
          ],
          fail: [
            [{ a: "a", b: 1 }, BorgError],
            [{ a: "a", b: "1", c: true }, BorgError],
            [{ a: 2, b: 1, c: true }, BorgError]
          ]
        },
        withValidator: {
          borg: b.string().nullable(),
          pass: [
            [
              { a: "a", b: 1, c: true },
              { a: "a", b: 1, c: true }
            ],
            [
              { a: "", b: 1, c: false },
              { a: "", b: 1, c: false }
            ],
            [
              { a: "a", b: 0, c: true },
              { a: "a", b: 0, c: true }
            ],
            [
              { a: "a", b: 1, c: true, d: null },
              { a: "a", b: 1, c: true, d: null }
            ],
            [
              { a: "a", b: 1, c: true, d: "", e: "extra" },
              { a: "a", b: 1, c: true, d: "", e: "extra" }
            ]
          ],
          fail: [
            [{ a: "a", b: 1 }, BorgError],
            [{ a: "a", b: "1", c: true }, BorgError],
            [{ a: 2, b: 1, c: true }, BorgError],
            [{ a: "a", b: 1, c: true, d: false }, BorgError],
            /* Note that, when validating additional properties with a Borg that is not `optional()`,
                       validation will fail if a key exists with a value of `undefined`. */
            [{ a: "a", b: 1, c: true, d: undefined }, BorgError]
          ]
        }
      }
    ],
    [
      "an object with nested objects",
      () =>
        b.object({
          a: b.array(b.string()),
          b: b.object({
            c: b.number(),
            d: b.boolean()
          }),
          e: b.union(b.boolean(), b.number()),
          f: b.string().optional()
        }),
      {
        strict: {
          pass: [
            [
              { a: ["a"], b: { c: 1, d: true }, e: true },
              { a: ["a"], b: { c: 1, d: true }, e: true }
            ],
            [
              { a: ["a"], b: { c: 1, d: true }, e: 1 },
              { a: ["a"], b: { c: 1, d: true }, e: 1 }
            ],
            [
              { a: ["a"], b: { c: 1, d: true }, e: true, f: "a" },
              { a: ["a"], b: { c: 1, d: true }, e: true, f: "a" }
            ],
            // Note that a property key set to undefined is treated the same as the key not being present - it is stripped.
            // TODO: This behavior may change if 'exactOptionalProperties' is implemented.
            [
              { a: ["a"], b: { c: 1, d: true }, e: 1, f: undefined },
              { a: ["a"], b: { c: 1, d: true }, e: 1 }
            ]
          ],
          fail: [
            [{ a: ["a"], b: { c: 1, d: true } }, BorgError],
            [{ a: ["a"], b: { c: 1, d: true }, e: "a" }, BorgError],
            [{ a: ["a"], b: { c: 1, d: true }, e: true, f: null }, BorgError],
            [
              { a: ["a"], b: { c: 1, d: true }, e: true, f: undefined, g: "" },
              BorgError
            ]
          ]
        },
        passthrough: {
          pass: [
            [
              { a: ["a"], b: { c: 1, d: true }, e: true },
              { a: ["a"], b: { c: 1, d: true }, e: true }
            ],
            [
              { a: ["a"], b: { c: 1, d: true }, e: 1 },
              { a: ["a"], b: { c: 1, d: true }, e: 1 }
            ],
            [
              { a: ["a"], b: { c: 1, d: true }, e: true, f: "a" },
              { a: ["a"], b: { c: 1, d: true }, e: true, f: "a" }
            ],
            [
              { a: ["a"], b: { c: 1, d: true }, e: true, f: undefined, g: "" },
              { a: ["a"], b: { c: 1, d: true }, e: true, f: undefined, g: "" }
            ]
          ],
          fail: [
            [{ a: ["a"], b: { c: 1, d: true } }, BorgError],
            [{ a: ["a"], b: { c: 1, d: true }, e: "a" }, BorgError],
            [{ a: ["a"], b: { c: 1, d: true }, e: true, f: null }, BorgError]
          ]
        },
        strip: {
          pass: [
            [
              { a: ["a"], b: { c: 1, d: true }, e: true },
              { a: ["a"], b: { c: 1, d: true }, e: true }
            ],
            [
              { a: ["a"], b: { c: 1, d: true }, e: 1 },
              { a: ["a"], b: { c: 1, d: true }, e: 1 }
            ],
            [
              { a: ["a"], b: { c: 1, d: true }, e: true, f: "", g: "e" },
              { a: ["a"], b: { c: 1, d: true }, e: true, f: "" }
            ],
            [
              { a: ["a"], b: { c: 1, d: true }, e: true, f: undefined, g: "" },
              { a: ["a"], b: { c: 1, d: true }, e: true }
            ]
          ],
          fail: [
            [{ a: ["a"], b: { c: 1, d: true } }, BorgError],
            [{ a: ["a"], b: { c: 1, d: true }, e: "a" }, BorgError],
            [{ a: ["a"], b: { c: 1, d: true }, e: true, f: null }, BorgError]
          ]
        },
        withValidator: {
          borg: b
            .object({
              h: b.array(b.string())
            })
            .additionalProperties(b.string()),
          pass: [
            [
              { a: ["a"], b: { c: 1, d: true }, e: true },
              { a: ["a"], b: { c: 1, d: true }, e: true }
            ],
            [
              { a: ["a"], b: { c: 1, d: true }, e: 1 },
              { a: ["a"], b: { c: 1, d: true }, e: 1 }
            ],
            [
              { a: ["a"], b: { c: 1, d: true }, e: true, f: "a" },
              { a: ["a"], b: { c: 1, d: true }, e: true, f: "a" }
            ],
            [
              {
                a: ["a"],
                b: { c: 1, d: true },
                e: true,
                f: "f",
                g: { h: ["h"] }
              },
              {
                a: ["a"],
                b: { c: 1, d: true },
                e: true,
                f: "f",
                g: { h: ["h"] }
              }
            ],
            [
              {
                a: ["a"],
                b: { c: 1, d: true },
                e: true,
                f: "f",
                g: { h: ["h"], i: "i" }
              },
              {
                a: ["a"],
                b: { c: 1, d: true },
                e: true,
                f: "f",
                g: { h: ["h"], i: "i" }
              }
            ]
          ],
          fail: [
            [{ a: ["a"], b: { c: 1, d: true } }, BorgError],
            [{ a: ["a"], b: { c: 1, d: true }, e: "a" }, BorgError],
            [{ a: ["a"], b: { c: 1, d: true }, e: true, f: null }, BorgError],
            [
              { a: ["a"], b: { c: 1, d: true }, e: true, f: "a", g: "a" },
              BorgError
            ],
            [
              {
                a: ["a"],
                b: { c: 1, d: true },
                e: true,
                f: "f",
                g: { h: ["h"], i: 1 }
              },
              BorgError
            ]
          ]
        }
      }
    ]
  ] satisfies TestCase[];

  describe.each(testCases)(
    "Works with %s",
    (_name, schema, { passthrough, strict, strip, withValidator }) => {
      it("parses the same whether marked private or public", () => {
        const borgPrivate = schema().private();
        const borgPublic = borgPrivate.public();

        for (const [input, expected] of strip.pass) {
          expect(borgPublic.parse(input)).toEqual(expected);
          expect(borgPrivate.parse(input)).toEqual(expected);
        }

        for (const [input, expected] of strip.fail) {
          expect(() => borgPublic.parse(input)).toThrow(expected);
          expect(() => borgPrivate.parse(input)).toThrow(expected);
        }
      });

      it("parses correctly in strict mode", () => {
        const borg = schema().additionalProperties("strict");

        for (const [input, expected] of strict.pass) {
          expect(
            borg.parse(input),
            `${JSON.stringify(input)} should parse to ${JSON.stringify(
              expected
            )} in strict mode`
          ).toEqual(expected);
        }

        for (const [input, expected] of strict.fail) {
          expect(
            () => borg.parse(input),
            `${JSON.stringify(input)} should throw ${JSON.stringify(
              expected
            )} in strict mode`
          ).toThrow(expected);
        }
      });

      it("parses correctly in passthrough mode", () => {
        const borg = schema().additionalProperties("passthrough");

        for (const [input, expected] of passthrough.pass) {
          expect(
            borg.parse(input),
            `${JSON.stringify(input)} should parse to ${JSON.stringify(
              expected
            )} in passthrough mode`
          ).toEqual(expected);
        }

        for (const [input, expected] of passthrough.fail) {
          expect(
            () => borg.parse(input),
            `${JSON.stringify(input)} should throw ${JSON.stringify(
              expected
            )} in passthrough mode`
          ).toThrow(expected);
        }
      });

      it("parses correctly in strip mode", () => {
        const borg = schema().additionalProperties("strip");
        for (const [input, expected] of strip.pass) {
          expect(
            borg.parse(input),
            `${JSON.stringify(input)} should parse to ${JSON.stringify(
              expected
            )} in strip mode`
          ).toEqual(expected);
        }

        for (const [input, expected] of strip.fail) {
          expect(
            () => borg.parse(input),
            `${JSON.stringify(input)} should throw ${JSON.stringify(
              expected
            )} in strip mode`
          ).toThrow(expected);
        }
      });

      it("parses correctly in 'validate additional properties' mode", () => {
        const borg = schema().additionalProperties(withValidator.borg);
        for (const [input, expected] of withValidator.pass) {
          expect(
            borg.parse(input),
            `${JSON.stringify(input)} should parse to ${JSON.stringify(
              expected
            )} in withValidator mode`
          ).toEqual(expected);
        }

        for (const [input, expected] of withValidator.fail) {
          expect(
            () => borg.parse(input),
            `${JSON.stringify(input)} should throw ${JSON.stringify(
              expected
            )} in withValidator mode`
          ).toThrow(expected);
        }
      });

      it("safe-parses correctly", () => {
        const borg = schema();

        for (const [input, expected] of strip.pass) {
          const result = borg.try(input);
          expect(
            result.ok,
            `${JSON.stringify(input)} should give try().ok === true`
          ).toBe(true);
          if (result.ok) {
            expect(
              result.value,
              `${JSON.stringify(input)} should parse with "try" as with "parse"`
            ).toEqual(expected);
          }
        }

        for (const [input, expected] of strip.fail) {
          const result = borg.try(input);
          expect(
            result.ok,
            `${JSON.stringify(input)} should give try().ok === false`
          ).toBe(false);
          if (!result.ok) {
            expect(
              result.error,
              `${JSON.stringify(
                input
              )} should give result.error instanceof BorgError === true`
            ).toBeInstanceOf(expected);
          }
        }
      });
    }
  );

  describe("Convenience methods work", () => {
    const borg = b
      .object({
        a: b.string(),
        b: b.number(),
        d: b.boolean().nullish(),
        e: b.id().optional()
      })
      .nullable();

    const strict = borg.additionalProperties("strict");
    const passthrough = borg.additionalProperties("passthrough");
    const withValidator = borg.additionalProperties(b.boolean());

    it("returns the correct boolean for 'is()' in 'strip' mode", () => {
      expect(borg.is({ a: "a", b: 1 })).toBe(true);
      expect(borg.is({ a: "a", b: "b" })).toBe(false);
      expect(borg.is({ a: 1, b: 1 })).toBe(false);
      expect(borg.is({ a: "a", b: 1, c: "c" })).toBe(true);
    });

    it("returns the correct boolean for 'is()' in 'strict' mode", () => {
      expect(strict.is({ a: "a", b: 1 })).toBe(true);
      expect(strict.is({ a: "a", b: "b" })).toBe(false);
      expect(strict.is({ a: 1, b: 1 })).toBe(false);
      expect(strict.is({ a: "a", b: 1, c: "c" })).toBe(false);
    });

    it("returns the correct boolean for 'is()' in 'passthrough' mode", () => {
      expect(passthrough.is({ a: "a", b: 1 })).toBe(true);
      expect(passthrough.is({ a: "a", b: "b" })).toBe(false);
      expect(passthrough.is({ a: 1, b: 1 })).toBe(false);
      expect(passthrough.is({ a: "a", b: 1, c: "c" })).toBe(true);
    });

    it("returns the correct boolean for 'is()' in 'withValidator' mode", () => {
      expect(withValidator.is({ a: "a", b: 1 })).toBe(true);
      expect(withValidator.is({ a: "a", b: "b" })).toBe(false);
      expect(withValidator.is({ a: 1, b: 1 })).toBe(false);
      expect(withValidator.is({ a: "a", b: 1, c: "c" })).toBe(false);
      expect(withValidator.is({ a: "a", b: 1, c: true })).toBe(true);
    });

    const value = { a: "a", b: 1, d: null };
    const asBson = borg.toBson(value);
    const reverted = borg.fromBson(asBson);

    it("returns the correct BSON value for 'toBSON()'", () => {
      expect(asBson).toEqual({ a: "a", b: new Double(1), d: null });
      expect(borg.toBson(null)).toBe(null);
    });

    it("returns the correct value for 'fromBSON()'", () => {
      expect(reverted).toEqual(value);
      expect(borg.fromBson(null)).toBe(null);
    });

    describe.each([...testCases])(
      "correctly parses %s",
      (_name, borg, { strict, strip, passthrough, withValidator }) => {
        it("parses the same whether marked private or public", () => {
          const borgPrivate = borg().private();
          const borgPublic = borgPrivate.public();

          for (const [input] of strip.pass) {
            expect(borgPublic.parse(input), "strip failed").toEqual(
              borgPrivate.parse(input)
            );
          }
          for (const [input] of strip.fail) {
            expect(() => borgPublic.parse(input), "strip failed").toThrow(
              (() => {
                try {
                  return borgPrivate.parse(input);
                } catch (e) {
                  return e;
                }
              })() as any
            );
          }

          const borgPrivateStrict = borg()
            .private()
            .additionalProperties("strict");
          const borgPublicStrict = borgPrivateStrict.public();

          for (const [input] of strict.pass) {
            expect(borgPublicStrict.parse(input), "strict failed").toEqual(
              borgPrivateStrict.parse(input)
            );
          }
          for (const [input] of strict.fail) {
            expect(() => borgPublicStrict.parse(input)).toThrow(
              (() => {
                try {
                  return borgPrivateStrict.parse(input);
                } catch (e) {
                  return e;
                }
              })() as any
            );
          }

          const borgPublicPass = borg()
            .public()
            .additionalProperties("passthrough");
          const borgPrivatePass = borgPublicPass.private();

          for (const [input] of passthrough.pass) {
            expect(borgPublicPass.parse(input)).toEqual(
              borgPrivatePass.parse(input)
            );
          }

          for (const [input] of passthrough.fail) {
            expect(() => borgPublicPass.parse(input)).toThrow(
              (() => {
                try {
                  return borgPrivatePass.parse(input);
                } catch (e) {
                  return e;
                }
              })() as any
            );
          }

          const borgPublicCheck = borgPublic.additionalProperties(
            withValidator.borg
          );
          const borgPrivateCheck = borgPublicCheck.private();

          for (const [input] of withValidator.pass) {
            expect(borgPublicCheck.parse(input)).toEqual(
              borgPrivateCheck.parse(input)
            );
          }
          for (const [input] of withValidator.fail) {
            expect(() => borgPublicCheck.parse(input)).toThrow(
              (() => {
                try {
                  return borgPrivateCheck.parse(input);
                } catch (e) {
                  return e;
                }
              })() as any
            );
          }
        });
      }
    );
  });
}
/* c8 ignore stop */
