import { Borg } from "./Borg";
import { BorgString } from "./BorgString";
import { BorgNumber } from "./BorgNumber";
import { BorgBoolean } from "./BorgBoolean";
import { BorgArray } from "./BorgArray";
import { BorgObject } from "./BorgObject";
import { BorgId } from "./BorgId";
import { BorgError } from "./errors";
import { getBsonSchema } from "./utils";
import type * as _ from "./types";

export type AnyBorg =
  | BorgString
  | BorgNumber
  | BorgBoolean
  | BorgArray
  | BorgObject
  | BorgId;

/////////////////////////////////////////////////////////////////////////////////////////////
///                                                                                       ///
///  BBBBBBBBBBBBBBBBB                             OOOOOOOOOOOO     RRRRRRRRRRRRRRRRR     ///
///  B////////////////B                          OO////////////OO   R////////////////R    ///
///  B/////////////////B                        OO//////////////OO  R/////////////////R   ///
///  B//////BBBBBB//////B                      O///////OOO////////O R//////RRRRRRR/////R  ///
///  BB/////B     B/////B                      O//////O   O///////O RR/////R      R////R  ///
///    B////B     B/////B                      O/////O     O//////O   R////R      R////R  ///
///    B////B     B/////B                      O/////O     O//////O   R////R      R////R  ///
///    B////BBBBBB/////B    ################   O/////O     O//////O   R////RRRRRRR////R   ///
///    B////////////BB      #//////////////#   O/////O     O//////O   R/////////////RR    ///
///    B////BBBBBB/////B    #//////////////#   O/////O     O//////O   R////RRRRRRR////R   ///
///    B////B     B/////B   ################   O/////O     O//////O   R////R      R////R  ///
///    B////B     B/////B                      O/////O     O//////O   R////R      R////R  ///
///    B////B     B/////B                      O/////O     O//////O   R////R      R////R  ///
///  BB/////BBBBBB//////B                      O///////OOO////////O RR/////R      R////R  ///
///  B/////////////////B                       OO///////////////OO  R//////R      R////R  ///
///  B////////////////B                         OO/////////////OO   R//////R      R////R  ///
///  BBBBBBBBBBBBBBBBB                            OOOOOOOOOOOOOO    RRRRRRRR      RRRRRR  ///
///                                                                                       ///
/////////////////////////////////////////////////////////////////////////////////////////////

export class BorgUnion<
  const TFlags extends _.Flags = ["required", "notNull", "public"],
  TMembers extends _.Borg = _.Borg
> extends Borg {
  #borgMembers: TMembers[];
  #flags = {
    optional: false,
    nullable: false,
    private: false
  };

  constructor(members: TMembers[]) {
    super();
    this.#borgMembers = Object.freeze(members.map(m => m.copy())) as any;
  }

  static #clone<const TBorg extends BorgUnion<any, any>>(borg: TBorg) {
    const newMembers = borg.#borgMembers.map(m => m.copy()) as any;
    const clone = new BorgUnion(newMembers);
    clone.#flags = { ...borg.#flags };
    return clone as any;
  }

  get meta(): _.UnionMeta<TFlags, TMembers> {
    return Object.freeze({
      kind: "union",
      borgMembers: this.#borgMembers.map(m => m.copy()),
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
    return BorgUnion.#clone(this);
  }

  parse(input: unknown): _.Parsed<_.Type<TMembers>[][number], TFlags> {
    if (input === undefined) {
      if (this.#borgMembers.some(m => m.meta.optional)) return void 0 as any;
      if (this.#flags.optional) return void 0 as any;
      throw new BorgError(
        `UNION_ERROR: Expected valid type${
          this.#flags.nullable ? " or null" : ""
        }, got undefined`
      );
    }
    if (input === null) {
      if (this.#flags.nullable) return null as any;
      throw new BorgError(
        `UNION_ERROR: Expected valid type${
          this.#flags.optional ? " or undefined" : ""
        }, got null`
      );
    }
    if (typeof input === "symbol") {
      throw new BorgError(
        `UNION_ERROR: Expected valid type${
          this.#flags.optional ? " or undefined" : ""
        }${
          this.#flags.nullable ? " or null" : ""
        }, got symbol: ${input.toString()}`
      );
    }
    const errors = [] as BorgError[];
    for (const schema of this.#borgMembers) {
      const result = schema.try(input);
      if (result.ok) return result.value as any;
      errors.push(result.error);
    }
    /* c8 ignore start */
    throw new BorgError(
      `UNION_ERROR: Expected valid type${
        this.#flags.optional ? " or undefined" : ""
      }${
        this.#flags.nullable ? " or null" : ""
      }, got ${input}.\n\nErrors: ${errors
        .map(error =>
          typeof error === "string"
            ? error
            : typeof error === "object" &&
              error &&
              "message" in error &&
              typeof error.message === "string"
            ? error.message
            : "UNKNOWN ERROR"
        )
        .join("\n")}`
    );
    /* c8 ignore stop */
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
            `UNION_ERROR(try): Unknown error parsing: \n\t${JSON.stringify(e)}`
          )
        } as any;
      }
    }
  }
  /* c8 ignore stop */

  toBson(input: any): _.Parsed<any, TFlags> {
    /* c8 ignore next 3 */
    if (input === undefined || input === null) {
      return input as any;
    }
    for (const type of this.#borgMembers) {
      if (type.is(input)) {
        return type.toBson(input) as any;
      }
      /* c8 ignore next */
    }
    /* c8 ignore next */
    throw new BorgError(`TO_BSON_ERROR: Invalid input`);
  }

  fromBson(input: any): _.Parsed<any, TFlags> | null | undefined {
    /* c8 ignore next */
    if (input === undefined || input === null) return input as any;

    for (const type of this.#borgMembers) {
      try {
        try {
          const result = type.fromBson(input);
          const validated = type.try(result);
          if (validated.ok) return result as any;
          else throw validated.error;
          /* c8 ignore start */
        } catch (e) {
          if (!(e instanceof BorgError)) throw e;
        }
      } catch (e) {
        if (e instanceof BorgError) throw e;
        else {
          throw new BorgError(
            `UNION_ERROR(fromBson): Unknown error parsing ${JSON.stringify(
              input
            )}: \n\t${JSON.stringify(
              e &&
                typeof e === "object" &&
                "message" in e &&
                typeof e.message === "string"
                ? e.message
                : e
            )}`
          );
        }
      }
    }
    throw new Error("UNION_ERROR(fromBson): Invalid input");
    /* c8 ignore stop */
  }

  optional(): BorgUnion<_.SetOptional<TFlags>, TMembers> {
    const clone = this.copy();
    clone.#flags.optional = true;
    return clone as any;
  }

  nullable(): BorgUnion<_.SetNullable<TFlags>, TMembers> {
    const clone = this.copy();
    clone.#flags.nullable = true;
    return clone as any;
  }

  nullish(): BorgUnion<_.SetNullish<TFlags>, TMembers> {
    const clone = this.copy();
    clone.#flags.optional = true;
    clone.#flags.nullable = true;
    return clone as any;
  }

  required(): BorgUnion<_.SetRequired<TFlags>, TMembers> {
    const clone = this.copy();
    clone.#flags.optional = false;
    return clone as any;
  }

  notNull(): BorgUnion<_.SetNotNull<TFlags>, TMembers> {
    const clone = this.copy();
    clone.#flags.nullable = false;
    return clone as any;
  }

  notNullish(): BorgUnion<_.SetNotNullish<TFlags>, TMembers> {
    const clone = this.copy();
    clone.#flags.optional = false;
    clone.#flags.nullable = false;
    return clone as any;
  }

  private(): BorgUnion<_.SetPrivate<TFlags>, TMembers> {
    const clone = this.copy();
    clone.#flags.private = true;
    return clone as any;
  }

  public(): BorgUnion<_.SetPublic<TFlags>, TMembers> {
    const clone = this.copy();
    clone.#flags.private = false;
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
  const [
    { describe, it, expect },
    { default: b },
    { BorgError },
    { ObjectId, Double }
  ] =
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
      "a simple union",
      () => b.union([b.string(), b.number()]),
      {
        pass: [
          ["hello", "hello"],
          [123, 123]
        ],
        fail: [
          [true, BorgError],
          [false, BorgError],
          [{}, BorgError],
          [[], BorgError],
          [() => {}, BorgError],
          [Symbol(), BorgError],
          [BigInt(123), BorgError]
        ]
      }
    ],
    [
      "a union with a nested union",
      () => b.union([b.string(), b.union([b.number(), b.boolean()])]),
      {
        pass: [
          ["hello", "hello"],
          [123, 123],
          [true, true],
          [false, false]
        ],
        fail: [
          [{}, BorgError],
          [[], BorgError],
          [() => {}, BorgError],
          [Symbol(), BorgError],
          [BigInt(123), BorgError]
        ]
      }
    ],
    [
      "a union with an optional member",
      () => b.union([b.string(), b.number().optional()]),
      {
        pass: [
          ["hello", "hello"],
          [123, 123],
          [undefined, undefined]
        ],
        fail: [
          [true, BorgError],
          [false, BorgError],
          [{}, BorgError],
          [[], BorgError],
          [() => {}, BorgError],
          [Symbol(), BorgError],
          [BigInt(123), BorgError]
        ]
      }
    ],
    [
      "a union in combination with an array",
      () => b.array(b.union([b.string(), b.number()])),
      {
        pass: [
          [
            ["hello", 123],
            ["hello", 123]
          ]
        ],
        fail: [[["hello", true], BorgError]]
      }
    ],
    [
      "a union in combination with an object",
      () => b.object({ a: b.union([b.string(), b.number()]) }),
      {
        pass: [
          [{ a: "hello" }, { a: "hello" }],
          [{ a: 123 }, { a: 123 }]
        ],
        fail: [[{ a: true }, BorgError]]
      }
    ],
    [
      "a union in combination with an object with optional members",
      () => b.object({ a: b.union([b.string(), b.number()]).optional() }),
      {
        pass: [
          [{ a: "hello" }, { a: "hello" }],
          [{ a: 123 }, { a: 123 }],
          [{}, {}]
        ],
        fail: [[{ a: true }, BorgError]]
      }
    ],
    [
      "a union of objects with properties in common",
      () =>
        b.union([
          b.object({ a: b.string(), b: b.number() }),
          b.object({ a: b.number(), c: b.number() })
        ]),
      {
        pass: [
          [
            { a: "hello", b: 123 },
            { a: "hello", b: 123 }
          ],
          [
            { a: 123, c: 456 },
            { a: 123, c: 456 }
          ]
        ],
        fail: [
          [{ a: "hello", c: 123 }, BorgError],
          [{ a: 123, b: 456 }, BorgError]
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

  describe("converts to and from BSON correctly", () => {
    const borg = b.union([
      b.string(),
      b.number(),
      b.boolean(),
      b.id(),
      b.object({ a: b.string(), b: b.number(), c: b.id() })
    ]);
    const value1 = { a: "hello", b: 123, c: "5f5b5b5b5b5b5b5b5b5b5b5b" };
    const value2 = "hello";
    const value3 = 123;
    const value4 = true;
    const value5 = false;
    const value6 = ObjectId.createFromHexString("5f5b5b5b5b5b5b5b5b5b5b5b");

    const asBson1 = borg.toBson(value1);
    const asBson2 = borg.toBson(value2);
    const asBson3 = borg.toBson(value3);
    const asBson4 = borg.toBson(value4);
    const asBson5 = borg.toBson(value5);
    const asBson6 = borg.toBson(value6);

    const reverted1 = borg.fromBson(asBson1);
    const reverted2 = borg.fromBson(asBson2);
    const reverted3 = borg.fromBson(asBson3);
    const reverted4 = borg.fromBson(asBson4);
    const reverted5 = borg.fromBson(asBson5);
    const reverted6 = borg.fromBson(asBson6);

    it("returns the correct BSON value for 'toBSON()'", () => {
      expect(asBson1).toEqual({
        a: "hello",
        b: new Double(123),
        c: ObjectId.createFromHexString("5f5b5b5b5b5b5b5b5b5b5b5b")
      });
      expect(asBson2).toEqual("hello");
      expect(asBson3).toEqual(new Double(123));
      expect(asBson4).toEqual(true);
      expect(asBson5).toEqual(false);
      expect(asBson6).toEqual(
        ObjectId.createFromHexString("5f5b5b5b5b5b5b5b5b5b5b5b")
      );
    });

    it("returns the correct value for 'fromBSON()'", () => {
      expect(reverted1).toEqual({
        a: "hello",
        b: 123,
        c: "5f5b5b5b5b5b5b5b5b5b5b5b"
      });
      expect(reverted2).toEqual(value2);
      expect(reverted3).toEqual(value3);
      expect(reverted4).toEqual(value4);
      expect(reverted5).toEqual(value5);
      expect(reverted6).toEqual(value6.toHexString());
    });
  });
}
