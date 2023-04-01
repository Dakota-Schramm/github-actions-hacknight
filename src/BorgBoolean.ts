import { Borg } from "./Borg";
import { BorgError } from "./errors";
import { stripSchemasDeep, getBsonSchema } from "./utils";
import type * as _ from "./types";

/////////////////////////////////////////////////////////////////////////////////////////////
///                                                                                       ///
///  BBBBBBBBBBBBBBBBB        OOOOOOOOOOOO         OOOOOOOOOOOO     LLLLLLLLLL            ///
///  B////////////////B     OO////////////OO     OO////////////OO   L////////L            ///
///  B/////////////////B   OO//////////////OO   OO//////////////OO  L////////L            ///
///  B//////BBBBBB//////B O///////OOO////////O O///////OOO////////O L////////L            ///
///  BB/////B     B/////B O//////O   O///////O O//////O   O///////O L////////L            ///
///    B////B     B/////B O/////O     O//////O O/////O     O//////O L//////L              ///
///    B////B     B/////B O/////O     O//////O O/////O     O//////O L//////L              ///
///    B////BBBBBB/////B  O/////O     O//////O O/////O     O//////O L//////L              ///
///    B////////////BB    O/////O     O//////O O/////O     O//////O L//////L              ///
///    B////BBBBBB/////B  O/////O     O//////O O/////O     O//////O L//////L              ///
///    B////B     B/////B O/////O     O//////O O/////O     O//////O L//////L              ///
///    B////B     B/////B O/////O     O//////O O/////O     O//////O L//////L              ///
///    B////B     B/////B O/////O     O//////O O/////O     O//////O L//////L              ///
///  BB/////BBBBBB//////B O///////OOO////////O O///////OOO////////O L//////LLLLLLLLLLLLL  ///
///  B/////////////////B  OO///////////////OO  OO///////////////OO  L//////////////////L  ///
///  B////////////////B    OO/////////////OO    OO/////////////OO   L//////////////////L  ///
///  BBBBBBBBBBBBBBBBB       OOOOOOOOOOOOOO       OOOOOOOOOOOOOO    LLLLLLLLLLLLLLLLLLLL  ///
///                                                                                       ///
/////////////////////////////////////////////////////////////////////////////////////////////

export class BorgBoolean<
  const TFlags extends _.Flags = ["required", "notNull", "public"],
> extends Borg {
  #flags = {
    optional: false,
    nullable: false,
    private: false,
  };

  constructor() {
    super();
  }

  static #clone<const TBorg extends BorgBoolean<any>>(borg: TBorg): TBorg {
    const clone = new BorgBoolean();
    clone.#flags = { ...borg.#flags };
    return clone as any;
  }

  get meta(): _.BooleanMeta<TFlags> {
    return Object.freeze({
      kind: "boolean",
      ...this.#flags,
    }) as any;
  }

  get bsonSchema() {
    return getBsonSchema(this.meta);
  }

  is(input: unknown): input is ReturnType<this["parse"]> {
    return this.try(input).ok;
  }

  copy(): this {
    return BorgBoolean.#clone(this);
  }

  parse(input: unknown): _.Parsed<boolean, TFlags> {
    if (input === undefined) {
      if (this.#flags.optional) return void 0 as any;
      throw new BorgError(
        `BOOLEAN_ERROR: Expected boolean${
          this.#flags.nullable ? " or null" : ""
        }, got undefined`,
      );
    }
    if (input === null) {
      if (this.#flags.nullable) return null as any;
      throw new BorgError(
        `BOOLEAN_ERROR: Expected boolean${
          this.#flags.optional ? " or undefined" : ""
        }, got null`,
      );
    }
    if (typeof input !== "boolean") {
      throw new BorgError(
        `BOOLEAN_ERROR: Expected boolean,${
          this.#flags.optional ? " or undefined," : ""
        }${this.#flags.nullable ? " or null," : ""} got ${typeof input}`,
      );
    }
    return input as any;
  }

  try(
    input: unknown,
  ): _.TryResult<_.Type<this>, this["meta"], _.Serialized<this>> {
    try {
      const value = this.parse(input) as any;
      return {
        value,
        ok: true,
        meta: this.meta,
        serialize: () => this.serialize.call(this, value),
      } as any;
    } catch (e) {
      if (e instanceof BorgError) return { ok: false, error: e } as any;
      else
        return {
          ok: false,
          error: new BorgError(
            `BOOLEAN_ERROR(try): Unknown error parsing: \n\t${JSON.stringify(
              e,
            )}`,
          ),
        } as any;
    }
  }

  serialize(input: _.Type<this>): {
    data: _.Sanitized<BorgBoolean<TFlags>, TFlags>;
    meta: _.BooleanMeta<TFlags>;
  } {
    if (this.#flags.private) {
      throw new BorgError(
        `BOOLEAN_ERROR: Cannot serialize private boolean field`,
      );
    }
    return { data: input as any, meta: stripSchemasDeep(this.meta) };
  }

  deserialize(input: _.Serialized<this>): _.Sanitized<_.Type<this>, TFlags> {
    return input.data as any;
  }

  toBson(input: _.Parsed<boolean, TFlags>): _.Parsed<boolean, TFlags> {
    return input as any;
  }

  fromBson(input: _.BsonType<BorgBoolean<TFlags>>): _.Parsed<boolean, TFlags> {
    return input;
  }

  optional(): BorgBoolean<_.SetOptional<TFlags>> {
    const clone = this.copy();
    clone.#flags.optional = true;
    return clone as any;
  }

  nullable(): BorgBoolean<_.SetNullable<TFlags>> {
    const clone = this.copy();
    clone.#flags.nullable = true;
    return clone as any;
  }

  nullish(): BorgBoolean<_.SetNullish<TFlags>> {
    const clone = this.copy();
    clone.#flags.optional = true;
    clone.#flags.nullable = true;
    return clone as any;
  }

  required(): BorgBoolean<_.SetRequired<TFlags>> {
    const clone = this.copy();
    clone.#flags.optional = false;
    return clone as any;
  }

  notNull(): BorgBoolean<_.SetNotNull<TFlags>> {
    const clone = this.copy();
    clone.#flags.nullable = false;
    return clone as any;
  }

  notNullish(): BorgBoolean<_.SetNotNullish<TFlags>> {
    const clone = this.copy();
    clone.#flags.optional = false;
    clone.#flags.nullable = false;
    return clone as any;
  }

  private(): BorgBoolean<_.SetPrivate<TFlags>> {
    const clone = this.copy();
    clone.#flags.private = true;
    return clone as any;
  }

  public(): BorgBoolean<_.SetPublic<TFlags>> {
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
  