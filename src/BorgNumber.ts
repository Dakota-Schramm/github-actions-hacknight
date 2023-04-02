import { Borg } from "./Borg";
import { BorgError } from "./errors";
import { getBsonSchema } from "./utils";
import { Double } from "bson";
import type * as _ from "./types";

/////////////////////////////////////////////////////////////////////////////////////////////
///                                                                                       ///
///  BBBBBBBBBBBBBBBBB    NNNNNNN      NNNNNNN UUUUUUU      UUUUUUU MMMMMMM      MMMMMMM  ///
///  B////////////////B   N//////N     N/////N U/////U      U/////U M//////M    M//////M  ///
///  B/////////////////B  N///////N    N/////N U/////U      U/////U M///////M  M///////M  ///
///  B//////BBBBBB//////B N////////N   N/////N U/////U      U/////U M////////MM////////M  ///
///  BB/////B     B/////B N/////////N  N/////N U/////U      U/////U M//////////////////M  ///
///    B////B     B/////B N//////////N N/////N U/////U      U/////U M/////M//////M/////M  ///
///    B////B     B/////B N///////////NN/////N U/////U      U/////U M/////MM////MM/////M  ///
///    B////BBBBBB/////B  N////////////N/////N U/////U      U/////U M/////M M//M M/////M  ///
///    B////////////BB    N/////N////////////N U/////U      U/////U M/////M  MM  M/////M  ///
///    B////BBBBBB/////B  N/////NN///////////N U/////U      U/////U M/////M      M/////M  ///
///    B////B     B/////B N/////N N//////////N U/////U      U/////U M/////M      M/////M  ///
///    B////B     B/////B N/////N  N/////////N U/////U      U/////U M/////M      M/////M  ///
///    B////B     B/////B N/////N   N////////N U//////U    U//////U M/////M      M/////M  ///
///  BB/////BBBBBB//////B N/////N    N///////N  U//////UUUU//////U  M/////M      M/////M  ///
///  B/////////////////B  N/////N     N//////N   U//////////////U   M/////M      M/////M  ///
///  B////////////////B   N/////N      N/////N    UU//////////UU    M/////M      M/////M  ///
///  BBBBBBBBBBBBBBBBB    NNNNNNN       NNNNNN      UUUUUUUUUU      MMMMMMM      MMMMMMM  ///
///                                                                                       ///
/////////////////////////////////////////////////////////////////////////////////////////////

export class BorgNumber<
  const TFlags extends _.Flags = ["required", "notNull", "public"],
  const TRange extends _.MinMax = [null, null]
> extends Borg {
  #flags = {
    optional: false,
    nullable: false,
    private: false
  };
  #min: TRange[0] = null;
  #max: TRange[1] = null;

  constructor() {
    super();
  }

  static #clone<const TBorg extends BorgNumber<any, any>>(borg: TBorg): TBorg {
    const clone = new BorgNumber();
    clone.#flags = { ...borg.#flags };
    clone.#min = borg.#min;
    clone.#max = borg.#max;
    return clone as any;
  }

  get meta(): _.NumberMeta<TFlags, TRange> {
    return Object.freeze({
      kind: "number",
      max: this.#max,
      min: this.#min,
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
    return BorgNumber.#clone(this);
  }

  parse(input: unknown): _.Parsed<number, TFlags> {
    if (input === undefined) {
      if (this.#flags.optional) return void 0 as any;
      throw new BorgError(
        `NUMBER_ERROR: Expected number${
          this.#flags.nullable ? " or null" : ""
        }, got undefined`
      );
    }
    if (input === null) {
      if (this.#flags.nullable) return null as any;
      throw new BorgError(
        `NUMBER_ERROR: Expected number${
          this.#flags.optional ? " or undefined" : ""
        }, got null`
      );
    }
    if (typeof input !== "number") {
      throw new BorgError(
        `NUMBER_ERROR: Expected number,${
          this.#flags.optional ? " or undefined," : ""
        }${this.#flags.nullable ? " or null," : ""} got ${typeof input}`
      );
    }
    if (this.#min !== null && input < this.#min) {
      throw new BorgError(
        `NUMBER_ERROR: Expected number to be greater than or equal to ${
          this.#min
        }`
      );
    }
    if (this.#max !== null && input > this.#max) {
      throw new BorgError(
        `NUMBER_ERROR: Expected number to be less than or equal to ${this.#max}`
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
      else {
        return {
          ok: false,
          error: new BorgError(
            `NUMBER_ERROR(try): Unknown error parsing: \n\t${JSON.stringify(e)}`
          )
        } as any;
      }
    }
    /* c8 ignore stop */
  }

  toBson(input: _.Parsed<number, TFlags>): _.Parsed<_.Double, TFlags> {
    return typeof input === "number" ? new Double(input) : (input as any);
  }

  fromBson(
    input: _.BsonType<BorgNumber<TFlags, TRange>> | null | undefined
  ): _.Parsed<number, TFlags> {
    return (input && "valueOf" in input ? input.valueOf() : input) as any;
  }

  optional(): BorgNumber<_.SetOptional<TFlags>, TRange> {
    const clone = this.copy();
    clone.#flags.optional = true;
    return clone as any;
  }

  nullable(): BorgNumber<_.SetNullable<TFlags>, TRange> {
    const clone = this.copy();
    clone.#flags.nullable = true;
    return clone as any;
  }

  nullish(): BorgNumber<_.SetNullish<TFlags>, TRange> {
    const clone = this.copy();
    clone.#flags.optional = true;
    clone.#flags.nullable = true;
    return clone as any;
  }

  required(): BorgNumber<_.SetRequired<TFlags>, TRange> {
    const clone = this.copy();
    clone.#flags.optional = false;
    return clone as any;
  }

  notNull(): BorgNumber<_.SetNotNull<TFlags>, TRange> {
    const clone = this.copy();
    clone.#flags.nullable = false;
    return clone as any;
  }

  notNullish(): BorgNumber<_.SetNotNullish<TFlags>, TRange> {
    const clone = this.copy();
    clone.#flags.optional = false;
    clone.#flags.nullable = false;
    return clone as any;
  }

  private(): BorgNumber<_.SetPrivate<TFlags>, TRange> {
    const clone = this.copy();
    clone.#flags.private = true;
    return clone as any;
  }

  public(): BorgNumber<_.SetPublic<TFlags>, TRange> {
    const clone = this.copy();
    clone.#flags.private = false;
    return clone as any;
  }
  /*TODO:
  If max is set, and min is then set to a value greater than max,
  remove max. If min is set, and max is then set to a value less than
  min, remove min.
  */
  min<const Min extends number | null>(
    min: Min
  ): BorgNumber<TFlags, [Min, TRange[1]]> {
    const clone = this.copy();
    clone.#min = min;
    return clone as any;
  }

  max<const Max extends number | null>(
    max: Max
  ): BorgNumber<TFlags, [TRange[0], Max]> {
    const clone = this.copy();
    clone.#max = max;
    return clone as any;
  }
  /**
   * Inclusive range
   */
  range<const Min extends number | null, const Max extends number | null>(
    min: Min,
    max: Max
  ): BorgNumber<TFlags, [Min, Max]> {
    const clone = this.copy();
    clone.#min = min;
    clone.#max = max;
    return clone as any;
  }
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
      "a basic number",
      () => b.number(),
      {
        pass: [
          [0, 0],
          [1, 1],
          [1.1, 1.1],
          [1.1e10, 1.1e10],
          [1.1e-10, 1.1e-10],
          [NaN, NaN],
          [Infinity, Infinity],
          [-Infinity, -Infinity],
          [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
          [Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER]
        ],
        fail: [
          [null, BorgError],
          [undefined, BorgError],
          ["", BorgError],
          ["'string'", BorgError],
          [1n, BorgError],
          [true, BorgError]
        ]
      }
    ],
    [
      "a number with a min value",
      () => b.number().min(2.01),
      {
        pass: [
          [2.01, 2.01],
          [2.99, 2.99],
          [4, 4],
          [Infinity, Infinity],
          [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER]
        ],
        fail: [
          [2, BorgError],
          [1.99, BorgError],
          [0, BorgError],
          [NaN, BorgError],
          [-Infinity, BorgError],
          [Number.MIN_SAFE_INTEGER, BorgError]
        ]
      }
    ],
    [
      "a number with a negative min value",
      () => b.number().min(-3),
      {
        pass: [
          [-3, -3],
          [-2, -2],
          [3.14, 3.14],
          [Infinity, Infinity],
          [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER]
        ],
        fail: [
          [-3.01, BorgError],
          [-4, BorgError],
          [NaN, BorgError],
          [-Infinity, BorgError],
          [Number.MIN_SAFE_INTEGER, BorgError]
        ]
      }
    ],
    [
      "a number with a max value",
      () => b.number().max(3),
      {
        pass: [
          [3, 3],
          [2, 2],
          [2.99, 2.99],
          [-Infinity, -Infinity],
          [Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER]
        ],
        fail: [
          [3.01, BorgError],
          [4, BorgError],
          [NaN, BorgError],
          [Infinity, BorgError],
          [Number.MAX_SAFE_INTEGER, BorgError]
        ]
      }
    ],
    [
      "a number with a negative max value",
      () => b.number().max(-3),
      {
        pass: [
          [-3, -3],
          [-4, -4],
          [-3.14, -3.14],
          [NaN, NaN],
          [-Infinity, -Infinity],
          [Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER]
        ],
        fail: [
          [-2.99, BorgError],
          [-2, BorgError],
          [Infinity, BorgError],
          [Number.MAX_SAFE_INTEGER, BorgError]
        ]
      }
    ],
    [
      "a number with a length range",
      () => b.number().range(3, 5),
      {
        pass: [
          [3, 3],
          [4, 4],
          [5, 5]
        ],
        fail: [
          [2, BorgError],
          [6, BorgError],
          [NaN, BorgError],
          [Infinity, BorgError],
          [-Infinity, BorgError],
          [Number.MAX_SAFE_INTEGER, BorgError],
          [Number.MIN_SAFE_INTEGER, BorgError]
        ]
      }
    ],
    [
      "a number with a min and max value",
      () => b.number().min(3).max(5),
      {
        pass: [
          [3, 3],
          [4, 4],
          [5, 5]
        ],
        fail: [
          [2, BorgError],
          [6, BorgError],
          [NaN, BorgError],
          [Infinity, BorgError],
          [-Infinity, BorgError],
          [Number.MAX_SAFE_INTEGER, BorgError],
          [Number.MIN_SAFE_INTEGER, BorgError]
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

        for (const [input, expected] of pass) {
          expect(borgPublic.parse(input)).toEqual(expected);
          expect(borgPrivate.parse(input)).toEqual(expected);
        }

        for (const [input, expected] of fail) {
          expect(() => borgPublic.parse(input)).toThrow(expected);
          expect(() => borgPrivate.parse(input)).toThrow(expected);
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
  describe("try() works as expected", () => {
    it.each([...testCases])(
      "parses %s correctly",
      (_name, borg, { pass, fail }) => {
        it.each([...pass])("parses '%s' as '%s'", (value, expected) => {
          const result = borg().try(value);
          expect(result.ok).toEqual(true);
          if (result.ok) expect(result.value).toEqual(expected);
        });

        it.each([...fail])(
          "parses '%s' without throwing",
          (value, expected) => {
            const result = borg().try(value);
            expect(result.ok).toEqual(false);
            if (!result.ok) expect(result.error).toBeInstanceOf(expected);
          }
        );
      }
    );
  });
  describe("is() works as expected", () => {
    it.each([...testCases])(
      "'is()' returns the correct value for %s",
      (_name, borg, { pass, fail }) => {
        it.each([...pass.map(p => p[0])])("returns true for '%s'", value => {
          expect(borg().is(value)).toEqual(true);
        });

        it.each([...fail.map(f => f[0])])("returns false for '%s'", value => {
          expect(borg().is(value)).toEqual(false);
        });
      }
    );
  });

  describe("constraints can be chained arbitrarily", () => {
    const borg = b.number().min(2).max(4).range(10, 15).max(null).min(9);

    it("parses as expected", () => {
      expect(borg.parse(100)).toEqual(100);
      expect(borg.parse(9)).toEqual(9);
      expect(borg.parse(13)).toEqual(13);
      expect(borg.parse(12.5)).toEqual(12.5);
    });

    it("throws as expected", () => {
      expect(() => borg.parse(8)).toThrow(BorgError);
    });
  });

  describe("converts to and from BSON correctly", () => {
    const borg = b.number().min(3).max(5).nullable();
    const value = 4;
    const asBson = borg.toBson(value);
    const reverted = borg.fromBson(asBson);

    it("returns the correct BSON value for 'toBSON()'", () => {
      expect(asBson).toEqual(new Double(value));
      expect(borg.toBson(null)).toBe(null);
    });

    it("returns the correct value for 'fromBSON()'", () => {
      expect(reverted).toEqual(value);
      expect(borg.fromBson(null)).toBe(null);
    });
  });
}
