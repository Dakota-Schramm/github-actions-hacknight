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
        } else {
          throw new BorgError(
            `ARRAY_ERROR: Unknown error parsing index "${i}": \n\t${JSON.stringify(
              e
            )}`,
            undefined,
            [i]
          );
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
    } catch (e) {
      if (e instanceof BorgError) return { ok: false, error: e } as any;
      else
        return {
          ok: false,
          error: new BorgError(
            `ARRAY_ERROR(try): Unknown error parsing: \n\t${JSON.stringify(e)}`
          )
        } as any;
    }
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
    input: _.BsonType<BorgArray<TFlags, TLength, TItemSchema>> | null | undefined
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

  minLength<const Min extends number | null>(
    length: Min
  ): BorgArray<TFlags, [Min, TLength[1]], TItemSchema> {
    const clone = this.copy();
    clone.#min = length;
    return clone as any;
  }

  maxLength<const Max extends number | null>(
    length: Max
  ): BorgArray<TFlags, [TLength[0], Max], TItemSchema> {
    const clone = this.copy();
    clone.#max = length;
    return clone as any;
  }
  //TODO: Throw if min > max
  /*TODO:
Can we/should we type the parsed result with the literal length? e.g...

const A = _.Array(_.String().length(1)).length(3).parse(['a', 'b', 'c'])
type A2 = typeof A //--> Array<string & { length: 1 }> & { length: 3 }
--OR--
type A2 = typeof A //--> [string & { length: 1 }, string & { length: 1 }, string & { length: 1 }]
*/

  length<const N extends number | null>(
    length: N
  ): BorgArray<TFlags, [N, N], TItemSchema>;
  length<const Min extends number | null, const Max extends number | null>(
    minLength: Min,
    maxLength: Max
  ): BorgArray<TFlags, [Min, Max], TItemSchema>;
  length(min: number | null, max?: number | null) {
    const clone = this.copy();
    clone.#min = min;
    clone.#max = max === undefined ? min : max;
    return clone as any;
  }
  /* c8 ignore next */
}

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
