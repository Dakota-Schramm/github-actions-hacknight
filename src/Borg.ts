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
        "Borg is an abstract class and cannot be instantiated directly",
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
  TOutputSchema extends Borg = TInputSchema,
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

/* c8 ignore start */
//@ts-expect-error - Vite handles this import.meta check
if (import.meta.vitest) {
  //@ts-expect-error - Vite handles this top-level await
  const { describe, it, expect } = await import("vitest");
  describe("Borg", () => {
    it("should not be instantiated", () => {
      //@ts-expect-error - Borg is abstract
      expect(() => new Borg()).toThrowError(TypeError);
    });
  });
}
/* c8 ignore stop */
