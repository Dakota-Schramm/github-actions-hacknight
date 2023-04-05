import { Borg } from "./Borg";
import { BorgError } from "./errors";
import { getBsonSchema } from "./utils";
import type * as _ from "./types";

/////////////////////////////////////////////////////////////////////////////////////////////
///                                                                                       ///
///  BBBBBBBBBBBBBBBBB          AAAAAAAA       RRRRRRRRRRRRRRRRR    RRRRRRRRRRRRRRRRR     ///
///  B////////////////B        A////////A      R////////////////R   R////////////////R    ///
///  B/////////////////B      A//////////A     R/////////////////R  R/////////////////R   ///
///  B//////BBBBBB//////B    A/////AA/////A    R//////RRRRRRR/////R R//////RRRRRRR/////R  ///
///  BB/////B     B/////B   A/////A  A/////A   RR/////R      R////R RR/////R      R////R  ///
///    B////B     B/////B  A/////A    A/////A    R////R      R////R   R////R      R////R  ///
///    B////B     B/////B A/////A      A/////A   R////R      R////R   R////R      R////R  ///
///    B////BBBBBB/////B  A/////A      A/////A   R////RRRRRRR////R    R////RRRRRRR////R   ///
///    B////////////BB    A/////AAAAAAAA/////A   R/////////////RR     R/////////////RR    ///
///    B////BBBBBB/////B  A//////////////////A   R////RRRRRRR////R    R////RRRRRRR////R   ///
///    B////B     B/////B A/////AAAAAAAA/////A   R////R      R////R   R////R      R////R  ///
///    B////B     B/////B A/////A      A/////A   R////R      R////R   R////R      R////R  ///
///    B////B     B/////B A/////A      A/////A   R////R      R////R   R////R      R////R  ///
///  BB/////BBBBBB//////B A/////A      A/////A RR/////R      R////R RR/////R      R////R  ///
///  B/////////////////B  A/////A      A/////A R//////R      R////R R//////R      R////R  ///
///  B////////////////B   A/////A      A/////A R//////R      R////R R//////R      R////R  ///
///  BBBBBBBBBBBBBBBBB    AAAAAAA      AAAAAAA RRRRRRRR      RRRRRR RRRRRRRR      RRRRRR  ///
///                                                                                       ///
/////////////////////////////////////////////////////////////////////////////////////////////

export class BorgArray<
  const TFlags extends _.Flags = ["required", "notNull", "public"],
  const TLength extends _.MinMax = [null, null],
  const TItemSchema extends _.Borg = _.Borg
> extends Borg {
  #borgItems: TItemSchema;
  #flags = {
    optional: false,
    nullable: false,
    private: false
  };
  #max: TLength[1] = null;
  #min: TLength[0] = null;

  constructor(itemSchema: TItemSchema) {
    super();
    this.#borgItems = itemSchema as any;
  }

  static #clone<const TBorg extends BorgArray<any, any, any>>(
    borg: TBorg
  ): TBorg {
    const clone = new BorgArray(borg.#borgItems);
    clone.#flags = { ...borg.#flags };
    clone.#max = borg.#max;
    clone.#min = borg.#min;
    return clone as any;
  }

  get meta(): _.ArrayMeta<TFlags, TLength, TItemSchema> {
    return Object.freeze({
      kind: "array",
      maxItems: this.#max,
      minItems: this.#min,
      borgItems: this.#borgItems.copy(),
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
    return BorgArray.#clone(this);
  }

  parse(input: unknown): _.Parsed<Array<_.Type<TItemSchema>>, TFlags> {
    if (input === undefined) {
      if (this.#flags.optional) return void 0 as any;
      throw new BorgError(
        `ARRAY_ERROR: Expected array${
          this.#flags.nullable ? " or null" : ""
        }, got undefined`
      );
    }
    if (input === null) {
      if (this.#flags.nullable) return null as any;
      throw new BorgError(
        `ARRAY_ERROR: Expected array${
          this.#flags.optional ? " or undefined" : ""
        }, got null`
      );
    }
    if (!Array.isArray(input)) {
      throw new BorgError(
        `ARRAY_ERROR: Expected array,${
          this.#flags.optional ? " or undefined," : ""
        }${this.#flags.nullable ? " or null," : ""} got ${typeof input}`
      );
    }
    if (this.#min !== null && input.length < this.#min) {
      throw new BorgError(
        `ARRAY_ERROR: Expected array length to be greater than or equal to ${
          this.#min
        }, got ${input.length}`
      );
    }
    if (this.#max !== null && input.length > this.#max) {
      throw new BorgError(
        `ARRAY_ERROR: Expected array length to be less than or equal to ${
          this.#max
        }, got ${input.length}`
      );
    }
    const result = new Array(input.length) as any;
    for (let i = 0; i < input.length; i++) {
      try {
        const parsed = this.#borgItems.parse(input[i]);
        result[i] = parsed;
        continue;
      } catch (e) {
        if (e instanceof BorgError) {
          throw new BorgError(`ARRAY_ERROR: ${e.message} at index ${i}`, e, [
            i
          ]);
          /* c8 ignore start */
        } else {
          throw new BorgError(
            `ARRAY_ERROR: Unknown error parsing index "${i}": \n\t${JSON.stringify(
              e
            )}`,
            undefined,
            [i]
          );
        }
        /* c8 ignore stop */
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
            `ARRAY_ERROR(try): Unknown error parsing: \n\t${JSON.stringify(e)}`
          )
        } as any;
      }
    }
    /* c8 ignore stop */
  }

  toBson(
    input: _.Parsed<Array<_.Type<TItemSchema>>, TFlags>
  ): Array<_.BsonType<TItemSchema>> {
    if (input === null || input === undefined) return input as any;
    const result = new Array(input.length) as any;
    for (let i = 0; i < input.length; i++) {
      result[i] = this.#borgItems.toBson(input[i]);
    }
    return result;
  }

  fromBson(
    input:
      | _.BsonType<BorgArray<TFlags, TLength, TItemSchema>>
      | null
      | undefined
  ): _.Parsed<Array<_.Type<TItemSchema>>, TFlags> {
    if (input === null || input === undefined) return input as any;
    const result = new Array(input.length) as any;
    for (let i = 0; i < input.length; i++) {
      result[i] = this.#borgItems.fromBson(input[i]);
    }
    return result;
  }

  optional(): BorgArray<_.SetOptional<TFlags>, TLength, TItemSchema> {
    const clone = this.copy();
    clone.#flags.optional = true;
    return clone as any;
  }

  nullable(): BorgArray<_.SetNullable<TFlags>, TLength, TItemSchema> {
    const clone = this.copy();
    clone.#flags.nullable = true;
    return clone as any;
  }

  nullish(): BorgArray<_.SetNullish<TFlags>, TLength, TItemSchema> {
    const clone = this.copy();
    clone.#flags.nullable = true;
    clone.#flags.optional = true;
    return clone as any;
  }

  required(): BorgArray<_.SetRequired<TFlags>, TLength, TItemSchema> {
    const clone = this.copy();
    clone.#flags.optional = false;
    return clone as any;
  }

  notNull(): BorgArray<_.SetNotNull<TFlags>, TLength, TItemSchema> {
    const clone = this.copy();
    clone.#flags.nullable = false;
    return clone as any;
  }

  notNullish(): BorgArray<_.SetNotNullish<TFlags>, TLength, TItemSchema> {
    const clone = this.copy();
    clone.#flags.nullable = false;
    clone.#flags.optional = false;
    return clone as any;
  }

  private(): BorgArray<_.SetPrivate<TFlags>, TLength, TItemSchema> {
    const clone = this.copy();
    clone.#flags.private = true;
    return clone as any;
  }

  public(): BorgArray<_.SetPublic<TFlags>, TLength, TItemSchema> {
    const clone = this.copy();
    clone.#flags.private = false;
    return clone as any;
  }

  minItems<const Min extends number | null>(
    length: Min
  ): [_.GreaterThan<Min, TLength[1]>, Min extends null ? true : false] extends [
    true,
    false
  ]
    ? never
    : _.IsNegativeNum<Min> extends false
    ? BorgArray<TFlags, [Min, TLength[1]], TItemSchema>
    : never {
    if (length && length < 0)
      throw new RangeError("Min length cannot be negative");
    if (length && length > Number.MAX_SAFE_INTEGER)
      throw new RangeError(
        `Min length cannot be greater than ${Number.MAX_SAFE_INTEGER}`
      );
    if (length !== null && !Number.isInteger(length))
      throw new TypeError("Min length must be an integer or null");
    const clone = this.copy();
    clone.#min = length;
    if (clone.#min !== null && clone.#max !== null && clone.#min > clone.#max) {
      throw new RangeError("Min length cannot be greater than max length");
    }
    return clone as any;
  }

  maxItems<const Max extends number | null>(
    length: Max
  ): [
    _.GreaterThan<TLength[0], Max>,
    TLength[0] extends null ? true : false
  ] extends [true, false]
    ? never
    : _.IsNegativeNum<Max> extends false
    ? BorgArray<TFlags, [TLength[0], Max], TItemSchema>
    : never {
    if (length && length < 0)
      throw new RangeError("Max length cannot be negative");
    if (length && length > Number.MAX_SAFE_INTEGER)
      throw new RangeError(
        `Max length cannot be greater than ${Number.MAX_SAFE_INTEGER}`
      );
    if (length !== null && !Number.isInteger(length))
      throw new TypeError("Max length must be an integer or null");
    const clone = this.copy();
    clone.#max = length;
    if (clone.#min !== null && clone.#max !== null && clone.#min > clone.#max) {
      throw new RangeError("Max length cannot be greater than max length");
    }
    return clone as any;
  }

  length<const N extends number | null>(
    length: N
  ): _.IsNegativeNum<N> extends false
    ? BorgArray<TFlags, [N, N], TItemSchema>
    : never;
  length<const Min extends number | null, const Max extends number | null>(
    minLength: Min,
    maxLength: Max
  ): null extends Min | Max
    ? BorgArray<TFlags, [Min, Max], TItemSchema>
    : _.GreaterThan<Min, Max> extends true
    ? never
    : [_.IsNegativeNum<Min>, _.IsNegativeNum<Max>] extends [false, false]
    ? BorgArray<TFlags, [Min, Max], TItemSchema>
    : never;
  length(min: number | null, max?: number | null) {
    if ((min && min < 0) || (max && max < 0))
      throw new RangeError("Length cannot be negative");
    if (
      (min && min > Number.MAX_SAFE_INTEGER) ||
      (max && max > Number.MAX_SAFE_INTEGER)
    )
      throw new RangeError(
        `Length cannot be greater than ${Number.MAX_SAFE_INTEGER}`
      );
    if (min !== null && !Number.isInteger(min))
      throw new TypeError(
        `${max === undefined ? "L" : "Min l"}ength must be an integer or null`
      );
    if (max !== undefined && max !== null && !Number.isInteger(max))
      throw new TypeError("Max length must be an integer or null");
    const clone = this.copy();
    clone.#min = min;
    clone.#max = max === undefined ? min : max;
    if (clone.#min !== null && clone.#max !== null && clone.#min > clone.#max) {
      throw new RangeError("Min length cannot be greater than max length");
    }
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
  const [{ describe, it, expect }, { default: b }, { BorgError }, { Double }] =
    //@ts-expect-error - Vite handles this top-level await
    await Promise.all([
      import("vitest"),
      import("../src/index"),
      import("../src/errors"),
      import("bson")
    ]);

  type TestCase = [
    string,
    () => _.Borg,
    {
      pass: [any, any][];
      fail: [any, any][];
    }
  ];

  const testCases = [
    [
      "a basic array",
      () => b.array(b.string()),
      {
        pass: [
          [[], []],
          [["a"], ["a"]],
          [
            ["a", "b"],
            ["a", "b"]
          ],
          [
            ["a", "b", "c"],
            ["a", "b", "c"]
          ]
        ],
        fail: [
          [null, BorgError],
          [undefined, BorgError],
          [true, BorgError],
          [1, BorgError],
          [{}, BorgError],
          [["a", 1], BorgError],
          [[undefined, undefined], BorgError],
          [[null], BorgError]
        ]
      }
    ],
    [
      "an array with a min length",
      () => b.array(b.number()).minItems(2),
      {
        pass: [
          [
            [1, 2],
            [1, 2]
          ],
          [
            [1, 2, 3],
            [1, 2, 3]
          ],
          [
            [1, 2, 3, 4],
            [1, 2, 3, 4]
          ]
        ],
        fail: [
          [[], BorgError],
          [[1], BorgError],
          [[[1, 2]], BorgError],
          [{ length: 3 }, BorgError]
        ]
      }
    ],
    [
      "an array with a max length",
      () => b.array(b.number()).maxItems(5),
      {
        pass: [
          [[], []],
          [
            [1, 2, 3],
            [1, 2, 3]
          ],
          [
            [1, 2, 3, 4, 5],
            [1, 2, 3, 4, 5]
          ]
        ],
        fail: [
          [{ length: 3 }, BorgError],
          [[1, 2, 3, 4, 5, 6], BorgError],
          [[[1, 2, 3, 4, 5, 6]], BorgError]
        ]
      }
    ],
    [
      "an array with a length range",
      () => b.array(b.number()).length(2, 4),
      {
        pass: [
          [
            [1, 2],
            [1, 2]
          ],
          [
            [1, 2, 3],
            [1, 2, 3]
          ],
          [
            [1, 2, 3, 4],
            [1, 2, 3, 4]
          ]
        ],
        fail: [
          [[], BorgError],
          [[1], BorgError],
          [[[1, 2]], BorgError],
          [{ length: 3 }, BorgError],
          [[1, 2, 3, 4, 5], BorgError]
        ]
      }
    ],
    [
      "an array with a min and max length",
      () => b.array(b.number()).minItems(2).maxItems(4),
      {
        pass: [
          [
            [1, 2],
            [1, 2]
          ],
          [
            [1, 2, 3],
            [1, 2, 3]
          ],
          [
            [1, 2, 3, 4],
            [1, 2, 3, 4]
          ]
        ],
        fail: [
          [[], BorgError],
          [[1], BorgError],
          [[[1, 2]], BorgError],
          [{ length: 3 }, BorgError],
          [[1, 2, 3, 4, 5], BorgError]
        ]
      }
    ],
    [
      "an array with a fixed length",
      () => b.array(b.number()).length(3),
      {
        pass: [
          [
            [1.1, 2.2, 3.3],
            [1.1, 2.2, 3.3]
          ]
        ],
        fail: [
          [[], BorgError],
          [[[1, 2]], BorgError],
          [{ length: 3 }, BorgError],
          [[1, 2, 3, 4, 5], BorgError]
        ]
      }
    ]
  ] satisfies TestCase[];

  describe("try() works as expected", () => {
    it.each([...testCases])(
      "parses %s correctly",
      (_name, schema, { pass, fail }) => {
        const borg = schema();

        for (const [input, expected] of pass) {
          const result = borg.try(input);
          expect(result.ok, `Expected "${input}" to pass`).toEqual(true);
          if (result.ok) expect(result.value).toEqual(expected);
        }

        for (const [input, expected] of fail) {
          const result = borg.try(input);
          expect(
            result.ok,
            `Expected "${String(input)}" to fail without throwing`
          ).toEqual(false);
          if (!result.ok) expect(result.error).toBeInstanceOf(expected);
        }
      }
    );
  });
  describe("is() works as expected", () => {
    it.each([...testCases])(
      "'is()' returns the correct value for %s",
      (_name, borg, { pass, fail }) => {
        for (const [input] of pass) expect(borg().is(input)).toEqual(true);
        for (const [input] of fail) expect(borg().is(input)).toEqual(false);
      }
    );
  });

  describe.each([...testCases])(
    "correctly parses %s",
    (_name, borg, { pass, fail }) => {
      it("parses the same whether marked private or public", () => {
        const borgPrivate = borg().private();
        const borgPublic = borgPrivate.public();

        for (const [input] of pass) {
          expect(borgPublic.parse(input)).toEqual(borgPrivate.parse(input));
        }

        for (const [input] of fail) {
          let error1: BorgError | unknown = null;
          let error2: BorgError | unknown = null;
          try {
            borgPrivate.parse(input);
          } catch (e) {
            error1 = e;
          }
          try {
            borgPublic.parse(input);
          } catch (e) {
            error2 = e;
          }
          expect(error1).toEqual(error2);
        }
      });

      it.each([...pass])("parses '%s' as '%s'", (value, expected) => {
        expect(borg().parse(value)).toEqual(expected);
      });

      it.each([...fail])("throws on '%s'", (value, expected) => {
        expect(() => borg().parse(value)).toThrow(expected);
      });
    }
  );

  describe("constraints can be chained arbitrarily", () => {
    const borg = b
      .array(b.number())
      .minItems(2)
      .maxItems(4)
      .length(10, 15)
      .maxItems(null)
      .minItems(9);

    it("parses as expected", () => {
      expect(borg.parse(new Array(100).fill(1))).toEqual(
        new Array(100).fill(1)
      );
      expect(borg.parse([1, 2, 3, 4, 5, 6, 7, 8, 9])).toEqual([
        1, 2, 3, 4, 5, 6, 7, 8, 9
      ]);
    });

    it("throws as expected", () => {
      expect(() => borg.parse([1, 2, 3, 4, 5, 6, 7, 8])).toThrow(BorgError);
    });
  });

  describe("converts to and from BSON correctly", () => {
    const borg = b.array(b.number()).minItems(3).maxItems(5).nullable();
    const value = [4];
    const asBson = borg.toBson(value);
    const reverted = borg.fromBson(asBson);

    it("returns the correct BSON value for 'toBSON()'", () => {
      expect(asBson).toEqual([new Double(4)]);
      expect(borg.toBson(null)).toBe(null);
    });

    it("returns the correct value for 'fromBSON()'", () => {
      expect(reverted).toEqual(value);
      expect(borg.fromBson(null)).toBe(null);
    });
  });

  describe("length methods throw TypeError for non-integer values and NaN", () => {
    const borg = b.array(b.number());

    it("throws for NaN min", () => {
      expect(() => borg.minItems(NaN)).toThrow(TypeError);
    });

    it("throws for NaN max", () => {
      expect(() => borg.maxItems(NaN)).toThrow(TypeError);
    });

    it("throws for NaN range", () => {
      expect(() => borg.length(20, NaN)).toThrow(TypeError);
    });

    it("throws for non-integer min", () => {
      expect(() => borg.minItems(1.1)).toThrow(TypeError);
    });

    it("throws for non-integer max", () => {
      expect(() => borg.maxItems(1.1)).toThrow(TypeError);
    });

    it("throws for non-integer max in length range", () => {
      expect(() => borg.length(1, 2.2)).toThrow(TypeError);
    });

    it("throws for non-integer fixed length", () => {
      expect(() => borg.length(1.1)).toThrow(TypeError);
    });

    it("throws for non-integer min in length range", () => {
      expect(() => borg.length(1.1, 2)).toThrow(TypeError);
    });

    it("does not throw for decimal with no fractional part", () => {
      expect(() => borg.minItems(1.0)).not.toThrow(TypeError);
      expect(() => borg.maxItems(1.0)).not.toThrow(TypeError);
      expect(() => borg.length(1.0, 2.0)).not.toThrow(TypeError);
    });
  });

  describe("length methods throw RangeError for values which are out-of-order, negative, or non-finite", () => {
    const borg = b.array(b.number());

    it("throws for non-finite min", () => {
      expect(() => borg.minItems(Infinity)).toThrow(RangeError);
    });

    it("throws for non-finite max", () => {
      expect(() => borg.maxItems(Infinity)).toThrow(RangeError);
    });

    it("throws for non-finite length range", () => {
      expect(() => borg.length(10, Infinity)).toThrow(RangeError);
    });

    it("throws for min > max using length", () => {
      expect(() => borg.length(2, 1)).toThrow(RangeError);
    });

    it("throws for min > max using min/max length", () => {
      expect(() => borg.minItems(2).maxItems(1)).toThrow(RangeError);
    });

    it("throws for min > max using maxItems after length", () => {
      expect(() => borg.length(2, 4).maxItems(1)).toThrow(RangeError);
    });

    it("throws for min > max using minItems after length", () => {
      expect(() => borg.length(2, 4).minItems(5)).toThrow(RangeError);
    });

    it("throws for negative min", () => {
      expect(() => borg.minItems(-1)).toThrow(RangeError);
    });

    it("throws for negative max", () => {
      expect(() => borg.maxItems(-1)).toThrow(RangeError);
    });

    it("throws for negative range", () => {
      expect(() => borg.length(null, -1)).toThrow(RangeError);
    });
  });
}
