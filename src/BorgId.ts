import { Borg } from "./Borg";
import { BorgError } from "./errors";
import { getBsonSchema } from "./utils";
import { ObjectId } from "bson";
import type * as _ from "./types";

/////////////////////////////////////////////////////////////////////////////////////////////
///                                                                                       ///
///  BBBBBBBBBBBBBBBBB                         IIIIIIIIIIIIIIIIIIII DDDDDDDDDDDDDDD       ///
///  B////////////////B                        I//////////////////I D//////////////DD     ///
///  B/////////////////B                       I//////////////////I D///////////////DD    ///
///  B//////BBBBBB//////B                      IIIIIII//////IIIIIII D/////DDDDDD/////DD   ///
///  BB/////B     B/////B                             I////I        D/////D    DD/////DD  ///
///    B////B     B/////B                             I////I        D/////D     DD/////D  ///
///    B////B     B/////B                             I////I        D/////D      D/////D  ///
///    B////BBBBBB/////B                              I////I        D/////D      D/////D  ///
///    B////////////BB                                I////I        D/////D      D/////D  ///
///    B////BBBBBB/////B                              I////I        D/////D      D/////D  ///
///    B////B     B/////B                             I////I        D/////D      D/////D  ///
///    B////B     B/////B                             I////I        D/////D     DD/////D  ///
///    B////B     B/////B                             I////I        D/////D    DD/////DD  ///
///  BB/////BBBBBB//////B #################### IIIIIII//////IIIIIII D/////DDOOOD/////DD   ///
///  B/////////////////B  #//////////////////# I//////////////////I D///////////////DD    ///
///  B////////////////B   #//////////////////# I//////////////////I D//////////////DD     ///
///  BBBBBBBBBBBBBBBBB    #################### IIIIIIIIIIIIIIIIIIII DDDDDDDDDDDDDDD       ///
///                                                                                       ///
/////////////////////////////////////////////////////////////////////////////////////////////

export class BorgId<
  const TFlags extends _.Flags = ["required", "notNull", "public"],
  const TFormat extends string | _.ObjectId = string
> extends Borg {
  #flags = {
    optional: false,
    nullable: false,
    private: false
  };
  #format = true;

  constructor() {
    super();
  }

  static #clone<const TBorg extends BorgId<any, any>>(borg: TBorg): TBorg {
    const clone = new BorgId();
    clone.#flags = { ...borg.#flags };
    clone.#format = borg.#format;
    return clone as any;
  }

  static isObjectIdLike(input: unknown): input is _.ObjectIdLike {
    if (typeof input !== "object" || input === null) return false;
    return (
      "toHexString" in input &&
      "id" in input &&
      typeof input.toHexString === "function" &&
      (typeof input.id === "string" || input.id instanceof Uint8Array)
    );
  }

  get meta(): _.IdMeta<TFlags, TFormat> {
    return Object.freeze({
      kind: "id",
      format: this.#format ? "string" : "oid",
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
    return BorgId.#clone(this);
  }

  parse(input: unknown): _.Parsed<TFormat, TFlags> {
    if (input === undefined) {
      if (this.#flags.optional) return void 0 as any;
      throw new BorgError(
        `ID_ERROR: Expected valid ObjectId${
          this.#flags.nullable ? " or null" : ""
        }, got undefined`
      );
    }
    if (input === null) {
      if (this.#flags.nullable) return null as any;
      throw new BorgError(
        `ID_ERROR: Expected valid ObjectId${
          this.#flags.optional ? " or undefined" : ""
        }, got null`
      );
    }
    if (typeof input === "string") {
      if (ObjectId.isValid(input))
        return this.#format
          ? (input as any)
          : ObjectId.createFromHexString(input);
    }
    if (typeof input === "number") {
      throw new BorgError(
        `ID_ERROR: Numeric IDs are not supported, got ${input}`
      );
    }
    if (input instanceof Uint8Array) {
      const hex = Buffer.from(input).toString("hex");
      if (ObjectId.isValid(input))
        return this.#format ? (hex as any) : ObjectId.createFromHexString(hex);
    }
    if (input instanceof ObjectId) {
      return this.#format ? input.toHexString() : (input as any);
    }
    if (BorgId.isObjectIdLike(input)) {
      const hex = input.toHexString();
      if (ObjectId.isValid(input))
        return this.#format ? (hex as any) : ObjectId.createFromHexString(hex);
    }
    throw new BorgError(
      `ID_ERROR: Expected valid ObjectId,${
        this.#flags.optional ? " or undefined," : ""
      }${this.#flags.nullable ? " or null," : ""} got ${typeof input}`
    );
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
            `ID_ERROR(try): Unknown error parsing: \n\t${JSON.stringify(e)}`
          )
        } as any;
      }
      /* c8 ignore stop */
    }
  }

  toBson(input: _.Parsed<TFormat, TFlags>): _.Parsed<_.ObjectId, TFlags> {
    if (input instanceof ObjectId || input === undefined || input === null)
      return input as any;
    return ObjectId.createFromHexString(input) as any;
  }

  fromBson(
    input: _.BsonType<BorgId<TFlags, TFormat>> | null | undefined
  ): _.Parsed<TFormat, TFlags> {
    if (input === undefined || input === null) return input as any;
    if (!this.#format) return input as any;
    try {
      return input.toHexString() as any;
    } catch (e) {
      throw new BorgError(
        `ID_ERROR(fromBson): Expected valid ObjectId, got ${typeof input}`
      );
    }
  }

  optional(): BorgId<_.SetOptional<TFlags>, TFormat> {
    const clone = this.copy();
    clone.#flags.optional = true;
    return clone as any;
  }

  nullable(): BorgId<_.SetNullable<TFlags>, TFormat> {
    const clone = this.copy();
    clone.#flags.nullable = true;
    return clone as any;
  }

  nullish(): BorgId<_.SetNullish<TFlags>, TFormat> {
    const clone = this.copy();
    clone.#flags.optional = true;
    clone.#flags.nullable = true;
    return clone as any;
  }

  required(): BorgId<_.SetRequired<TFlags>, TFormat> {
    const clone = this.copy();
    clone.#flags.optional = false;
    return clone as any;
  }

  notNull(): BorgId<_.SetNotNull<TFlags>, TFormat> {
    const clone = this.copy();
    clone.#flags.nullable = false;
    return clone as any;
  }

  notNullish(): BorgId<_.SetNotNullish<TFlags>, TFormat> {
    const clone = this.copy();
    clone.#flags.optional = false;
    clone.#flags.nullable = false;
    return clone as any;
  }

  private(): BorgId<_.SetPrivate<TFlags>, TFormat> {
    const clone = this.copy();
    clone.#flags.private = true;
    return clone as any;
  }

  public(): BorgId<_.SetPublic<TFlags>, TFormat> {
    const clone = this.copy();
    clone.#flags.private = false;
    return clone as any;
  }

  asString(): BorgId<TFlags, string> {
    const clone = this.copy();
    clone.#format = true as any;
    return clone as any;
  }

  asObjectId(): BorgId<TFlags, _.ObjectId> {
    const clone = this.copy();
    clone.#format = false as any;
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
    { ObjectId }
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
      "an ID with default configuration",
      () => b.id(),
      {
        pass: [
          [
            ObjectId.createFromHexString("5f7a5c5c9c9c9c9c9c9c9c9c"),
            "5f7a5c5c9c9c9c9c9c9c9c9c"
          ],
          ["5f7a5c5c9c9c9c9c9c9c9c9c", "5f7a5c5c9c9c9c9c9c9c9c9c"],
          [
            {
              toHexString: () => "5f7a5c5c9c9c9c9c9c9c9c9c",
              id: "5f7a5c5c9c9c9c9c9c9c9c9c"
            },
            "5f7a5c5c9c9c9c9c9c9c9c9c"
          ],
          [
            {
              toHexString: () => "5f7a5c5c9c9c9c9c9c9c9c9c",
              id: new Uint8Array(Buffer.from("5f7a5c5c9c9c9c9c9c9c9c9c"))
            },
            "5f7a5c5c9c9c9c9c9c9c9c9c"
          ],
          [
            ObjectId.createFromHexString("5f7a5c5c9c9c9c9c9c9c9c9c").id,
            "5f7a5c5c9c9c9c9c9c9c9c9c"
          ]
        ],
        fail: [
          [null, BorgError],
          [undefined, BorgError],
          [true, BorgError],
          [false, BorgError],
          [0, BorgError],
          [2394564938763, BorgError],
          ["5f7a5c5c9c9c9c9c9c9c9c9cc", BorgError],
          ["5f7a5c5c9c9c9c9c9c9c9c9", BorgError],
          ["gf7a5c5c9c9c9c9c9c9c9c9c", BorgError],
          ["5f7a5c5c9c9c9c9c9c9c9c9.", BorgError]
        ]
      }
    ],
    [
      "an ID with ObjectID format",
      () => b.id().asObjectId(),
      {
        pass: [
          [
            ObjectId.createFromHexString("5f7a5c5c9c9c9c9c9c9c9c9c"),
            ObjectId.createFromHexString("5f7a5c5c9c9c9c9c9c9c9c9c")
          ],
          [
            "5f7a5c5c9c9c9c9c9c9c9c9c",
            ObjectId.createFromHexString("5f7a5c5c9c9c9c9c9c9c9c9c")
          ],
          [
            {
              toHexString: () => "5f7a5c5c9c9c9c9c9c9c9c9c",
              id: "5f7a5c5c9c9c9c9c9c9c9c9c"
            },
            ObjectId.createFromHexString("5f7a5c5c9c9c9c9c9c9c9c9c")
          ],
          [
            {
              toHexString: () => "5f7a5c5c9c9c9c9c9c9c9c9c",
              id: new Uint8Array(Buffer.from("5f7a5c5c9c9c9c9c9c9c9c9c"))
            },
            ObjectId.createFromHexString("5f7a5c5c9c9c9c9c9c9c9c9c")
          ],
          [
            ObjectId.createFromHexString("5f7a5c5c9c9c9c9c9c9c9c9c").id,
            ObjectId.createFromHexString("5f7a5c5c9c9c9c9c9c9c9c9c")
          ]
        ],
        fail: [
          [null, BorgError],
          [undefined, BorgError],
          [true, BorgError],
          [false, BorgError],
          [0, BorgError],
          ["5f7a5c5c9c9c9c9c9c9c9c9cc", BorgError],
          ["5f7a5c5c9c9c9c9c9c9c9c9", BorgError],
          ["gf7a5c5c9c9c9c9c9c9c9c9c", BorgError],
          ["5f7a5c5c9c9c9c9c9c9c9c9.", BorgError]
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

  describe("constraints can be chained arbitrarily", () => {
    const borg = b.id().asObjectId().asString().asObjectId().asString();

    it("parses as expected", () => {
      expect(borg.parse("5f7a5c5c9c9c9c9c9c9c9c9c")).toEqual(
        "5f7a5c5c9c9c9c9c9c9c9c9c"
      );
      expect(
        borg.parse(ObjectId.createFromHexString("5f7a5c5c9c9c9c9c9c9c9c9c"))
      ).toEqual("5f7a5c5c9c9c9c9c9c9c9c9c");
    });

    it("throws as expected", () => {
      expect(() => borg.parse("5f7a5c5c9c9c9c9c9c9c9c9")).toThrow(BorgError);
      expect(() => borg.parse("gf7a5c5c9c9c9c9c9c9c9c9c")).toThrow(BorgError);
      expect(() => borg.parse("5f7a5c5c9c9c9c9c9c9c9c9.")).toThrow(BorgError);
    });
  });

  describe("converts to and from BSON correctly", () => {
    const borg = b.id().nullish();
    const value = "5f7a5c5c9c9c9c9c9c9c9c9c";
    const borg2 = b.id().asObjectId().nullish();
    const value2 = ObjectId.createFromHexString("5f7a5c5c9c9c9c9c9c9c9c9c");
    const asBson = borg.toBson(value);
    const reverted = borg.fromBson(asBson);
    const asBson2 = borg2.toBson(value2);
    const reverted2 = borg2.fromBson(asBson2);

    it("returns the correct BSON value for 'toBSON()'", () => {
      expect(asBson).toEqual(ObjectId.createFromHexString(value));
      expect(borg.toBson(null)).toBe(null);
      expect(asBson2).toEqual(value2);
      expect(borg2.toBson(null)).toBe(null);
    });

    it("returns the correct value for 'fromBSON()'", () => {
      expect(reverted).toEqual(value);
      expect(borg.fromBson(null)).toBe(null);
      expect(reverted2).toEqual(value2);
      expect(borg2.fromBson(null)).toBe(null);
    });
  });
}
