import type { BorgError } from "src/errors";
import type { Meta } from "./types/Meta";

/////////////////////////////////////////////////////////////////////////////////////////////
///                                                                                       ///
///  BBBBBBBBBBBBBBBBB        OOOOOOOOOOOO     RRRRRRRRRRRRRRRRR        GGGGGGGGGGG       ///
///  B////////////////B     OO////////////OO   R////////////////R     GG///////////GG     ///
///  B/////////////////B   OO//////////////OO  R/////////////////R   GG/////////////GG    ///
///  B//////BBBBBB//////B O///////OOO////////O R//////RRRRRRR/////R G/////GGGGGGG/////G   ///
///  BB/////B     B/////B O//////O   O///////O RR/////R      R////R G////G       G////G   ///
///    B////B     B/////B O/////O     O//////O   R////R      R////R G////G       GGGGGG   ///
///    B////B     B/////B O/////O     O//////O   R////R      R////R G////G                ///
///    B////BBBBBB/////B  O/////O     O//////O   R////RRRRRRR////R  G////G   GGGGGGGG     ///
///    B////////////BB    O/////O     O//////O   R/////////////RR   G////G  GG///////GG   ///
///    B////BBBBBB/////B  O/////O     O//////O   R////RRRRRRR////R  G////G  G/////////GG  ///
///    B////B     B/////B O/////O     O//////O   R////R      R////R G////G  G////G/////G  ///
///    B////B     B/////B O/////O     O//////O   R////R      R////R G////G   GGGG G////G  ///
///    B////B     B/////B O//////O   O///////O   R////R      R////R G/////G      GG////G  ///
///  BB/////BBBBBB//////B O///////OOO////////O RR/////R      R////R G//////GGGGGG//////G  ///
///  B/////////////////B  OO///////////////OO  R//////R      R////R  GG////////////////G  ///
///  B////////////////B    OO/////////////OO   R//////R      R////R    GG///////GG/////G  ///
///  BBBBBBBBBBBBBBBBB       OOOOOOOOOOOOOO    RRRRRRRR      RRRRRR     GGGGGGGG  GGGGGG  ///
///                                                                                       ///
/////////////////////////////////////////////////////////////////////////////////////////////

/*TODO: type BorgOptions = { exactOptionalProperties?: Boolean | undefined;} */
export abstract class Borg {
  constructor() {
    if (new.target === Borg) {
      throw new TypeError(
        "Borg is an abstract class and cannot be instantiated directly"
      );
    }
  }
  abstract get meta(): Meta;
  abstract get bsonSchema(): any;
  abstract copy(): Borg;
  abstract parse(input: unknown): unknown;
  abstract try(input: unknown): TryResult<unknown, Meta>;
  abstract is(input: unknown): input is Type<this>;
  abstract toBson(input: any): any;
  abstract fromBson(input: any): any;
  abstract private(): Borg;
  abstract public(): Borg;
  abstract optional(): Borg;
  abstract nullable(): Borg;
  abstract nullish(): Borg;
  abstract required(): Borg;
  abstract notNull(): Borg;
  abstract notNullish(): Borg;
  /* c8 ignore next */
}

export type BorgModel<
  TInputSchema extends Borg,
  TServerModel = Type<TInputSchema>,
  TOutputSchema extends Borg = TInputSchema
> = {
  createFromRequest: (input: Type<TInputSchema>) => Type<TOutputSchema>;
  sanitizeResponse: (input: TServerModel) => Type<TOutputSchema>;
  parseInput: (input: unknown) => Type<TInputSchema>;
  parseOutput: (input: unknown) => Type<TOutputSchema>;
};

export type Type<TBorg extends { parse: (arg0: unknown) => any }> = ReturnType<
  TBorg["parse"]
>;
export type BsonType<TBorg extends { toBson: (arg0: any) => any }> = ReturnType<
  TBorg["toBson"]
>;

export type TryResult<TValue, TMeta> =
  | {
      ok: true;
      value: TValue;
      meta: TMeta;
    }
  | {
      ok: false;
      error: BorgError;
    };

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
    //@ts-expect-error - Vite handles this top-level await
  ] = await Promise.all([
    import("vitest"),
    import("."),
    import("./errors"),
    import("bson")
  ]);

  type TestSchema = [Borg, any];

  const testSchemas = [
    [b.string(), "string"],
    [b.number(), 1],
    [b.boolean(), true],
    [b.object({ a: b.string() }), { a: "string" }],
    [b.array(b.string()), ["string"]],
    [b.union(b.string(), b.number()), "string"],
    [b.id(), new ObjectId().toHexString()]
  ] satisfies TestSchema[];

  describe("Borg", () => {
    it("should not be instantiated", () => {
      //@ts-expect-error - Borg is abstract
      expect(() => new Borg()).toThrowError(TypeError);
    });
  });

  describe(".optional(), .required()", () => {
    it.each([...testSchemas])(
      "should throw errors that reflect the optional/nullable state",
      (borg, value) => {
        const borgOptional = borg.optional();
        const borgNullable = borgOptional.nullable();
        expect(() =>
          borgOptional.parse(typeof value === "string" ? {} : value + "")
        ).toThrow(BorgError);
        expect(() =>
          borgNullable.parse(typeof value === "string" ? {} : value + "")
        ).toThrow(BorgError);
      }
    );

    it.each([...testSchemas])(
      "should accept undefined when optional, but not when required",
      (borg, value) => {
        const borgOptional = borg.optional();
        const borgRequired = borgOptional.required();
        expect(() => borg.parse(undefined)).toThrow(BorgError);
        expect(() => borgRequired.parse(undefined)).toThrow(BorgError);
        expect(borgOptional.parse(undefined)).toEqual(undefined);
        expect(borgOptional.parse(value)).toEqual(value);
        expect(borgRequired.parse(value)).toEqual(value);
      }
    );
  });

  describe(".nullable(), .notNull()", () => {
    it.each([...testSchemas])(
      "should accept null when nullable, but not when notNull",
      (borg, value) => {
        const borgNullable = borg.nullable();
        const borgNotNull = borgNullable.notNull();
        expect(() => borg.parse(null)).toThrow(BorgError);
        expect(() => borgNotNull.parse(null)).toThrow(BorgError);
        expect(borgNullable.parse(null)).toEqual(null);
        expect(borgNullable.parse(value)).toEqual(value);
        expect(borgNotNull.parse(value)).toEqual(value);
      }
    );
  });

  describe(".nullish(), .notNullish()", () => {
    it.each([...testSchemas])(
      "should accept null and undefined when nullish, but neither when notNullish",
      (borg, value) => {
        const borgNullish = borg.nullish();
        const borgNotNullish = borgNullish.notNullish();
        expect(() => borg.parse(null)).toThrow(BorgError);
        expect(() => borg.parse(undefined)).toThrow(BorgError);
        expect(() => borgNotNullish.parse(null)).toThrow(BorgError);
        expect(() => borgNotNullish.parse(undefined)).toThrow(BorgError);
        expect(borgNullish.parse(null)).toEqual(null);
        expect(borgNullish.parse(undefined)).toEqual(undefined);
        expect(borgNullish.parse(value)).toEqual(value);
        expect(borgNotNullish.parse(value)).toEqual(value);
      }
    );
  });

  describe("chaining", () => {
    it.each([...testSchemas])(
      "should be possible to chain the above modifiers in any order",
      (borg, value) => {
        const borg2 = borg
          .optional()
          .nullable()
          .notNullish()
          .required()
          .notNull()
          .nullish();
        expect(borg2.parse(null)).toEqual(null);
        expect(borg2.parse(undefined)).toEqual(undefined);
        expect(borg2.parse(value)).toEqual(value);
        const borgRequired = borg
          .nullable()
          .notNullish()
          .required()
          .notNull()
          .nullish()
          .optional()
          .required();
        expect(() => borgRequired.parse(undefined)).toThrow(BorgError);
        expect(borgRequired.parse(null)).toEqual(null);
        expect(borgRequired.parse(value)).toEqual(value);
        const borgNotNull = borg
          .optional()
          .nullable()
          .required()
          .notNull()
          .notNullish()
          .nullish()
          .notNull();
        expect(() => borgNotNull.parse(null)).toThrow(BorgError);
        expect(borgNotNull.parse(undefined)).toEqual(undefined);
        expect(borgNotNull.parse(value)).toEqual(value);
      }
    );
  });
}
/* c8 ignore stop */
