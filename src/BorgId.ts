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
  const TFormat extends string | _.ObjectId = string,
> extends Borg {
  #flags = {
    optional: false,
    nullable: false,
    private: false,
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
    return BorgId.#clone(this);
  }

  parse(input: unknown): _.Parsed<TFormat, TFlags> {
    if (input === undefined) {
      if (this.#flags.optional) return void 0 as any;
      throw new BorgError(
        `ID_ERROR: Expected valid ObjectId${
          this.#flags.nullable ? " or null" : ""
        }, got undefined`,
      );
    }
    if (input === null) {
      if (this.#flags.nullable) return null as any;
      throw new BorgError(
        `ID_ERROR: Expected valid ObjectId${
          this.#flags.optional ? " or undefined" : ""
        }, got null`,
      );
    }
    if (typeof input === "string") {
      if (ObjectId.isValid(input))
        return this.#format
          ? (input as any)
          : ObjectId.createFromHexString(input);
    }
    if (typeof input === "number") {
      const hex = input.toString(16);
      if (ObjectId.isValid(input))
        return this.#format ? (hex as any) : ObjectId.createFromHexString(hex);
    }
    if (input instanceof Uint8Array) {
      const hex = Buffer.from(input).toString("hex");
      if (ObjectId.isValid(input))
        return this.#format ? (hex as any) : ObjectId.createFromHexString(hex);
    }
    if (BorgId.isObjectIdLike(input)) {
      const hex = input.toHexString();
      if (ObjectId.isValid(input))
        return this.#format ? (hex as any) : ObjectId.createFromHexString(hex);
    }
    if (input instanceof ObjectId) {
      return this.#format ? input.toHexString() : (input as any);
    }
    throw new BorgError(
      `ID_ERROR: Expected valid ObjectId,${
        this.#flags.optional ? " or undefined," : ""
      }${this.#flags.nullable ? " or null," : ""} got ${typeof input}`,
    );
  }

  try(
    input: unknown,
  ): _.TryResult<_.Type<this>, this["meta"]> {
    try {
      const value = this.parse(input) as any;
      return {
        value,
        ok: true,
        meta: this.meta,
      } as any;
    } catch (e) {
      if (e instanceof BorgError) return { ok: false, error: e } as any;
      else
        return {
          ok: false,
          error: new BorgError(
            `ID_ERROR(try): Unknown error parsing: \n\t${JSON.stringify(e)}`,
          ),
        } as any;
    }
  }

  toBson(input: _.Parsed<TFormat, TFlags>): _.Parsed<_.ObjectId, TFlags> {
    if (input === undefined || input === null) return input as any;
    if (input instanceof ObjectId) return input as any;
    return ObjectId.createFromHexString(input) as any;
  }

  fromBson(
    input: _.BsonType<BorgId<TFlags, TFormat>>,
  ): _.Parsed<TFormat, TFlags> {
    if (input === undefined || input === null) return input as any;
    if (!this.#format) return input as any;
    return input.toHexString() as any;
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
