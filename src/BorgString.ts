import { Borg } from "./Borg";
import { BorgError } from "./errors";
import { getBsonSchema } from "./utils";
import type * as _ from "./types";

/////////////////////////////////////////////////////////////////////////////////////////////
///                                                                                       ///
///  BBBBBBBBBBBBBBBBB        SSSSSSSSSSSSS    TTTTTTTTTTTTTTTTTTTT RRRRRRRRRRRRRRRRR     ///
///  B////////////////B     SS/////////////SS  T//////////////////T R////////////////R    ///
///  B/////////////////B  SS/////////////////S T//////////////////T R/////////////////R   ///
///  B//////BBBBBB//////B S///////SSSSS//////S T///TTTT////TTTT///T R//////RRRRRRR/////R  ///
///  BB/////B     B/////B S/////SS    SSSSSSS  T///T  T////T  T///T RR/////R      R////R  ///
///    B////B     B/////B S//////SS            TTTTT  T////T  TTTTT   R////R      R////R  ///
///    B////B     B/////B  SS/////SSS                 T////T          R////R      R////R  ///
///    B////BBBBBB/////B     SS//////SS               T////T          R////RRRRRRR////R   ///
///    B////////////BB         SS//////SS             T////T          R/////////////RR    ///
///    B////BBBBBB/////B         SS//////SS           T////T          R////RRRRRRR////R   ///
///    B////B     B/////B          SSS/////SS         T////T          R////R      R////R  ///
///    B////B     B/////B            SS//////S        T////T          R////R      R////R  ///
///    B////B     B/////B  SSSSSSS    SS/////S        T////T          R////R      R////R  ///
///  BB/////BBBBBB//////B S//////SSSSS///////S      TT//////TT      RR/////R      R////R  ///
///  B/////////////////B  S/////////////////SS      T////////T      R//////R      R////R  ///
///  B////////////////B    SS/////////////SS        T////////T      R//////R      R////R  ///
///  BBBBBBBBBBBBBBBBB       SSSSSSSSSSSSS          TTTTTTTTTT      RRRRRRRR      RRRRRR  ///
///                                                                                       ///
/////////////////////////////////////////////////////////////////////////////////////////////

export class BorgString<
  const TFlags extends _.Flags = ["required", "notNull", "public"],
  const TLength extends _.MinMax = [null, null],
  const TPattern extends string = ".*"
> extends Borg {
  #flags = {
    optional: false,
    nullable: false,
    private: false
  };
  #min: TLength[0] = null;
  #max: TLength[1] = null;
  #pattern: TPattern | null = null;

  constructor() {
    super();
  }

  static #clone<const TBorg extends BorgString<any, any, any>>(
    borg: TBorg
  ): TBorg {
    const clone = new BorgString();
    clone.#flags = { ...borg.#flags };
    clone.#min = borg.#min;
    clone.#max = borg.#max;
    clone.#pattern = borg.#pattern;
    return clone as any;
  }

  get meta(): _.StringMeta<TFlags, TLength, TPattern> {
    return Object.freeze({
      ...this.#flags,
      kind: "string",
      maxLength: this.#max,
      minLength: this.#min,
      pattern: this.#pattern,
      regex: this.#pattern
        ? Object.freeze(new RegExp(this.#pattern))
        : undefined
    }) as any;
  }

  get bsonSchema() {
    return getBsonSchema(this.meta);
  }

  is(input: unknown): input is ReturnType<this["parse"]> {
    return this.try(input).ok;
  }

  copy(): this {
    return BorgString.#clone(this);
  }

  parse(input: unknown): _.Parsed<string, TFlags> {
    if (input === undefined) {
      if (this.#flags.optional) return void 0 as any;
      throw new BorgError(
        `STRING_ERROR: Expected string${
          this.#flags.nullable ? " or null" : ""
        }, got undefined`
      );
    }
    if (input === null) {
      if (this.#flags.nullable) return null as any;
      throw new BorgError(
        `STRING_ERROR: Expected string${
          this.#flags.optional ? " or undefined" : ""
        }, got null`
      );
    }
    if (typeof input !== "string") {
      throw new BorgError(
        `STRING_ERROR: Expected string,${
          this.#flags.optional ? " or undefined," : ""
        }${this.#flags.nullable ? " or null," : ""} got ${typeof input}`
      );
    }
    if (this.#min !== null && input.length < this.#min) {
      throw new BorgError(
        `STRING_ERROR: Expected string length to be greater than or equal to ${
          this.#min
        }, got ${input.length}`
      );
    }
    if (this.#max !== null && input.length > this.#max) {
      throw new BorgError(
        `STRING_ERROR: Expected string length to be less than or equal to ${
          this.#max
        }, got ${input.length}`
      );
    }
    if (this.#pattern !== null && !new RegExp(this.#pattern, "u").test(input)) {
      throw new BorgError(
        `STRING_ERROR: Expected string to match pattern ${
          this.#pattern
        }, got ${input}`
      );
    }
    return input as any;
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
      else
        return {
          ok: false,
          error: new BorgError(
            `STRING_ERROR(try): Unknown error parsing: \n\t${JSON.stringify(e)}`
          )
        } as any;
    }
    /* c8 ignore stop */
  }

  toBson(input: _.Parsed<string, TFlags>) {
    return input;
  }

  fromBson(
    input: _.BsonType<BorgString<TFlags, TLength, TPattern>> | null | undefined
  ) {
    return input;
  }

  optional(): BorgString<_.SetOptional<TFlags>, TLength, TPattern> {
    const clone = this.copy();
    clone.#flags.optional = true;
    return clone as any;
  }

  nullable(): BorgString<_.SetNullable<TFlags>, TLength, TPattern> {
    const clone = this.copy();
    clone.#flags.nullable = true;
    return clone as any;
  }

  nullish(): BorgString<_.SetNullish<TFlags>, TLength, TPattern> {
    const clone = this.copy();
    clone.#flags.optional = true;
    clone.#flags.nullable = true;
    return clone as any;
  }

  required(): BorgString<_.SetRequired<TFlags>, TLength, TPattern> {
    const clone = this.copy();
    clone.#flags.optional = false;
    return clone as any;
  }

  notNull(): BorgString<_.SetNotNull<TFlags>, TLength, TPattern> {
    const clone = this.copy();
    clone.#flags.nullable = false;
    return clone as any;
  }

  notNullish(): BorgString<_.SetNotNullish<TFlags>, TLength, TPattern> {
    const clone = this.copy();
    clone.#flags.optional = false;
    clone.#flags.nullable = false;
    return clone as any;
  }

  private(): BorgString<_.SetPrivate<TFlags>, TLength, TPattern> {
    const clone = this.copy();
    clone.#flags.private = true;
    return clone as any;
  }

  public(): BorgString<_.SetPublic<TFlags>, TLength, TPattern> {
    const clone = this.copy();
    clone.#flags.private = false;
    return clone as any;
  }

  minLength<const Min extends number | null>(
    length: Min
  ): [_.GreaterThan<Min, TLength[1]>, Min extends null ? true : false] extends [
    true,
    false
  ]
    ? never
    : _.IsNegativeNum<Min> extends false
    ? BorgString<TFlags, [Min, TLength[1]], TPattern>
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

  maxLength<const Max extends number | null>(
    length: Max
  ): [
    _.GreaterThan<TLength[0], Max>,
    TLength[0] extends null ? true : false
  ] extends [true, false]
    ? never
    : _.IsNegativeNum<Max> extends false
    ? BorgString<TFlags, [TLength[0], Max], TPattern>
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
    ? BorgString<TFlags, [N, N], TPattern>
    : never;
  length<const Min extends number | null, const Max extends number | null>(
    minLength: Min,
    maxLength: Max
  ): null extends Min | Max
    ? BorgString<TFlags, [Min, Max], TPattern>
    : _.GreaterThan<Min, Max> extends true
    ? never
    : [_.IsNegativeNum<Min>, _.IsNegativeNum<Max>] extends [false, false]
    ? BorgString<TFlags, [Min, Max], TPattern>
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

  /**
   * @IMPORTANT RegExp flags are not supported, except for the "u" flag which is always set.
   * @param pattern a string that will be used as the source for a new RegExp
   */
  pattern<const S extends string | null>(
    pattern: S
  ): BorgString<TFlags, TLength, S extends null ? ".*" : S> {
    const clone = this.copy();
    clone.#pattern = pattern as any;
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
  const [{ describe, it, expect }, { default: b }, { BorgError }] =
    //@ts-expect-error - Vite handles this top-level await
    await Promise.all([
      import("vitest"),
      import("../src/index"),
      import("../src/errors")
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
      "a basic string",
      () => b.string(),
      {
        pass: [
          ["hello", "hello"],
          ["", ""]
        ],
        fail: [
          [1, BorgError],
          [true, BorgError],
          [null, BorgError],
          [undefined, BorgError]
        ]
      }
    ],
    [
      "a string with pattern",
      () => b.string().pattern("C:\\\\Users\\\\.+\\.txt$"),
      {
        pass: [
          ["C:\\Users\\test.txt", "C:\\Users\\test.txt"],
          ["C:\\Users\\123.txt", "C:\\Users\\123.txt"]
        ],
        fail: [
          ["C:\\Users\\test0txt", BorgError],
          ["C:\\Users\\test.txt0", BorgError],
          ["C:\\Users\\.txt0", BorgError],
          ["C:\\Userstest.txt", BorgError],
          ["C:\\\\Users\\test.txt", BorgError]
        ]
      }
    ],
    [
      "a string with a min length",
      () => b.string().minLength(3),
      {
        pass: [
          ["abc", "abc"],
          ["abcd", "abcd"]
        ],
        fail: [
          ["ab", BorgError],
          ["", BorgError]
        ]
      }
    ],
    [
      "a string with a max length",
      () => b.string().maxLength(3),
      {
        pass: [
          ["abc", "abc"],
          ["ab", "ab"]
        ],
        fail: [
          ["abcd", BorgError],
          ["abcde", BorgError]
        ]
      }
    ],
    [
      "a string with a length range",
      () => b.string().length(3, 5),
      {
        pass: [
          ["abc", "abc"],
          ["abcd", "abcd"],
          ["abcde", "abcde"]
        ],
        fail: [
          ["ab", BorgError],
          ["", BorgError],
          ["abcdef", BorgError]
        ]
      }
    ],
    [
      "a string with a min and max length",
      () => b.string().minLength(3).maxLength(5),
      {
        pass: [
          ["abc", "abc"],
          ["abcd", "abcd"],
          ["abcde", "abcde"]
        ],
        fail: [
          ["ab", BorgError],
          ["", BorgError],
          ["abcdef", BorgError]
        ]
      }
    ],
    [
      "a string with a fixed length",
      () => b.string().length(3),
      {
        pass: [["abc", "abc"]],
        fail: [
          ["ab", BorgError],
          ["", BorgError],
          ["abcd", BorgError]
        ]
      }
    ]
  ] satisfies TestCase[];

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

      it.each([...pass])("parses %j as %j", (value, expected) => {
        expect(borg().parse(value)).toEqual(expected);
      });

      it.each([...fail])("throws on %j", (value, expected) => {
        expect(() => borg().parse(value)).toThrow(expected);
      });
    }
  );

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

  describe("constraints can be chained arbitrarily", () => {
    const borg = b
      .string()
      .minLength(2)
      .maxLength(4)
      .pattern("C:\\\\Users\\\\.+\\.txt$")
      .pattern(null)
      .length(10)
      .length(null)
      .length(3, 5);

    it("parses as expected", () => {
      expect(borg.parse("12345")).toEqual("12345");
      expect(borg.parse("123")).toEqual("123");
    });

    it("throws as expected", () => {
      expect(() => borg.parse("123456")).toThrow(BorgError);
      expect(() => borg.parse("1234567890")).toThrow(BorgError);
      expect(() => borg.parse("12")).toThrow(BorgError);
    });
  });

  describe("converts to and from BSON correctly", () => {
    const borg = b.string().minLength(3).maxLength(5).nullable();
    const value = "test";
    const asBson = borg.toBson(value);
    const reverted = borg.fromBson(asBson);

    it("returns the correct BSON value for 'toBSON()'", () => {
      expect(asBson).toEqual(value);
      expect(borg.toBson(null)).toBe(null);
    });

    it("returns the correct value for 'fromBSON()'", () => {
      expect(reverted).toEqual(value);
      expect(borg.fromBson(null)).toBe(null);
    });
  });

  describe("length methods throw RangeError for values which are out-of-order, negative, or non-finite", () => {
    const borg = b.string();

    it("throws for negative min", () => {
      expect(() => borg.minLength(-1)).toThrow(RangeError);
    });

    it("throws for negative max", () => {
      expect(() => borg.maxLength(-1)).toThrow(RangeError);
    });

    it("throws for negative length range", () => {
      expect(() => borg.length(null, -1)).toThrow(RangeError);
    });

    it("throws for min > max using length", () => {
      expect(() => borg.length(2, 1)).toThrow(RangeError);
    });

    it("throws for min > max using min/max length", () => {
      expect(() => borg.minLength(2).maxLength(1)).toThrow(RangeError);
    });

    it("throws for min > max using maxLength after length", () => {
      expect(() => borg.length(2, 4).maxLength(1)).toThrow(RangeError);
    });

    it("throws for min > max using minLength after length", () => {
      expect(() => borg.length(2, 4).minLength(5)).toThrow(RangeError);
    });

    it("throws for non-finite min", () => {
      expect(() => borg.minLength(Infinity)).toThrow(RangeError);
    });

    it("throws for non-finite max", () => {
      expect(() => borg.maxLength(Infinity)).toThrow(RangeError);
    });

    it("throws for non-finite range", () => {
      expect(() => borg.length(10, Infinity)).toThrow(RangeError);
    });
  });

  describe("length methods throw TypeError for non-integer values and NaN", () => {
    const borg = b.string();

    it("throws for non-integer min", () => {
      expect(() => borg.minLength(1.1)).toThrow(TypeError);
    });

    it("throws for non-integer max", () => {
      expect(() => borg.maxLength(1.1)).toThrow(TypeError);
    });

    it("throws for non-integer fixed length", () => {
      expect(() => borg.length(1.1)).toThrow(TypeError);
    });

    it("throws for non-integer length range", () => {
      expect(() => borg.length(1.1, 2.2)).toThrow(TypeError);
    });

    it("does not throw for decimal with no fractional part", () => {
      expect(() => borg.minLength(1.0)).not.toThrow(TypeError);
      expect(() => borg.maxLength(1.0)).not.toThrow(TypeError);
      expect(() => borg.length(1.0, 2.0)).not.toThrow(TypeError);
    });

    it("throws for NaN min", () => {
      expect(() => borg.minLength(NaN)).toThrow(TypeError);
    });

    it("throws for NaN max", () => {
      expect(() => borg.maxLength(NaN)).toThrow(TypeError);
    });

    it("throws for NaN range", () => {
      expect(() => borg.length(20, NaN)).toThrow(TypeError);
    });
  });
}
/* c8 ignore stop */
