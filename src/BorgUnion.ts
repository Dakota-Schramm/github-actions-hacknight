import { Borg } from "./Borg";
import { BorgError } from "./errors";
import { getBsonSchema } from "./utils";
import type * as _ from "./types";

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
  const TMembers extends _.Borg[] = _.Borg[]
> extends Borg {
  #borgMembers: TMembers;
  #flags = {
    optional: false,
    nullable: false,
    private: false
  };

  constructor(members: TMembers) {
    super();
    this.#borgMembers = Object.freeze(members.map(m => m.copy())) as any;
  }

  static #clone<const TBorg extends BorgUnion<any, any[]>>(borg: TBorg) {
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

  parse(input: unknown): _.Parsed<_.Type<TMembers[number]>[][number], TFlags> {
    if (input === undefined) {
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
    const errors = [] as { ok: false; error: BorgError }[];
    for (const schema of this.#borgMembers) {
      const result = schema.try(input);
      if (result.ok) return result.value as any;
      errors.push(result);
    }
    throw new BorgError(
      `UNION_ERROR: Expected valid type${
        this.#flags.optional ? " or undefined" : ""
      }${
        this.#flags.nullable ? " or null" : ""
      }, got ${input}.\n\nErrors: ${errors
        .map(({ error }) =>
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
            `UNION_ERROR(try): Unknown error parsing: \n\t${JSON.stringify(e)}`
          )
        } as any;
    }
  }

  toBson(input: any): _.Parsed<any, TFlags> {
    if (input === undefined || input === null) return input as any;
    for (const type of this.#borgMembers)
      if (type.is(input)) return type.toBson(input) as any;
    throw new BorgError(`TO_BSON_ERROR: Invalid input`);
  }

  fromBson(input: any): _.Parsed<any, TFlags> | null | undefined {
    if (input === undefined || input === null) return input as any;
    for (const type of this.#borgMembers)
      if (type.is(input)) return type.fromBson(input) as any;
    throw new BorgError(`FROM_BSON_ERROR: Invalid input`);
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
