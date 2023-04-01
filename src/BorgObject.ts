import { Borg } from "./Borg";
import { BorgError } from "./errors";
import { isin, getBsonSchema } from "./utils";
import type * as _ from "./types";

/////////////////////////////////////////////////////////////////////////////////////////////
///                                                                                       ///
///  BBBBBBBBBBBBBBBBB        OOOOOOOOOOOO     BBBBBBBBBBBBBBBBB          JJJJJJJJJJJJJJ  ///
///  B////////////////B     OO////////////OO   B////////////////B         J////////////J  ///
///  B/////////////////B   OO//////////////OO  B/////////////////B        J////////////J  ///
///  B//////BBBBBB//////B O///////OOO////////O BB/////BBBBBB//////B       JJJJJJ////JJJJ  ///
///  BB/////B     B/////B O//////O   O///////O   B////B     B/////B            J////J     ///
///    B////B     B/////B O/////O     O//////O   B////B     B/////B            J////J     ///
///    B////B     B/////B O/////O     O//////O   B////B     B/////B            J////J     ///
///    B////BBBBBB/////B  O/////O     O//////O   B////BBBBBB/////B             J////J     ///
///    B////////////BB    O/////O     O//////O   B/////////////BB     JJJJJJ   J////J     ///
///    B////BBBBBB/////B  O/////O     O//////O   B////BBBBBB/////B   J//////J  J////J     ///
///    B////B     B/////B O/////O     O//////O   B////B     B/////B J//////J   J////J     ///
///    B////B     B/////B O/////O     O//////O   B////B     B/////B J/////J    J////J     ///
///    B////B     B/////B O/////O     O//////O   B////B     B/////B J/////J    J////J     ///
///  BB/////BBBBBB//////B O///////OOO////////O BB/////BBBBBB//////B J//////JJJJ/////J     ///
///  B/////////////////B  OO///////////////OO  B/////////////////B   J//////////////J     ///
///  B////////////////B    OO/////////////OO   B////////////////B     J////////////J      ///
///  BBBBBBBBBBBBBBBBB       OOOOOOOOOOOOOO    BBBBBBBBBBBBBBBBB       JJJJJJJJJJJJ       ///
///                                                                                       ///
/////////////////////////////////////////////////////////////////////////////////////////////

export class BorgObject<
  const TFlags extends _.Flags = ["required", "notNull", "public"],
  const TOtherProps extends
    | "passthrough"
    | "strict"
    | "strip"
    | _.Borg = "strip",
  const TShape extends { [key: string]: _.Borg } = {
    [key: string]: _.Borg;
  },
> extends Borg {
  #borgShape: TShape;
  #additionalProperties: "passthrough" | "strict" | "strip" | _.Borg = "strip";
  #flags = {
    optional: false,
    nullable: false,
    private: false,
  };

  constructor(shape: TShape) {
    super();
    this.#borgShape = Object.freeze(
      Object.fromEntries(
        Object.entries(shape).map(([key, value]) => [key, value.copy()]),
      ),
    ) as any;
  }

  static #clone<const TBorg extends BorgObject<any, any, any>>(
    borg: TBorg,
  ): TBorg {
    const newShape = {} as { [key: string]: _.Borg };
    for (const key in borg.#borgShape)
      newShape[key] = borg.#borgShape[key]!.copy();
    const clone = new BorgObject(newShape);
    clone.#flags = { ...borg.#flags };
    clone.#additionalProperties =
      borg.#additionalProperties instanceof Borg
        ? borg.#additionalProperties.copy()
        : borg.#additionalProperties;
    return clone as any;
  }

  get meta(): _.ObjectMeta<TFlags, TOtherProps, TShape> {
    return Object.freeze({
      kind: "object",
      borgShape: this.#borgShape,
      keys: Object.freeze(Object.keys(this.#borgShape)),
      requiredKeys: Object.freeze(
        Object.keys(this.#borgShape).filter(
          k => this.#borgShape[k]!.meta.optional === false,
        ),
      ),
      additionalProperties:
        this.#additionalProperties instanceof Borg
          ? this.#additionalProperties.copy()
          : this.#additionalProperties,
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
    return BorgObject.#clone(this);
  }

  parse(
    input: unknown,
  ): _.Parsed<{ [k in keyof TShape]: _.Type<TShape[k]> }, TFlags> {
    if (input === undefined) {
      if (this.#flags.optional) return void 0 as any;
      throw new BorgError(
        `OBJECT_ERROR: Expected object${
          this.#flags.nullable ? " or null" : ""
        }, got undefined`,
      );
    }
    if (input === null) {
      if (this.#flags.nullable) return null as any;
      throw new BorgError(
        `OBJECT_ERROR: Expected object${
          this.#flags.optional ? " or undefined" : ""
        }, got null`,
      );
    }
    if (typeof input !== "object") {
      throw new BorgError(
        `OBJECT_ERROR: Expected object,${
          this.#flags.optional ? " or undefined," : ""
        }${this.#flags.nullable ? " or null," : ""} got ${typeof input}`,
      );
    }
    if (Array.isArray(input)) {
      throw new BorgError(
        `OBJECT_ERROR: Expected object,${
          this.#flags.optional ? " or undefined," : ""
        }${this.#flags.nullable ? " or null," : ""} got array`,
      );
    }

    const result = {} as any;

    if (this.#additionalProperties === "strict") {
      for (const key in input) {
        if (!isin(this.#borgShape, key)) {
          throw new BorgError(
            `OBJECT_ERROR: Unexpected property "${key}"`,
            undefined,
            [key],
          );
        }
      }
    }

    for (const key in this.#borgShape) {
      const schema = this.#borgShape[key];

      if (schema === undefined) {
        throw new BorgError(
          `OBJECT_ERROR: Invalid schema for key "${key}": got undefined`,
          undefined,
          [key],
        );
      }

      if (!isin(input, key)) {
        //TODO: implement 'exactOptional' by providing a config flag somewhere?
        if (this.#borgShape[key]!.meta.optional === false) {
          throw new BorgError(
            `OBJECT_ERROR: Missing property "${key}"`,
            undefined,
            [key],
          );
        }
        continue;
      }

      try {
        const parsed = this.#borgShape[key]!.parse(input[key]);
        result[key] = parsed;
        continue;
      } catch (e) {
        if (e instanceof BorgError) {
          throw new BorgError(
            `OBJECT_ERROR: Invalid value for property "${key}"`,
            e,
            [key],
          );
        } else {
          throw new BorgError(
            `OBJECT_ERROR: Unknown error parsing "${key}": \n\t${JSON.stringify(
              e,
            )}`,
            undefined,
            [key],
          );
        }
      }
    }

    if (this.#additionalProperties === "passthrough") {
      for (const key in input) {
        if (!isin(this.#borgShape, key)) {
          result[key] = input[key];
        }
      }
    }

    if (this.#additionalProperties instanceof Borg) {
      for (const key in input) {
        if (!isin(this.#borgShape, key)) {
          const parsed = this.#additionalProperties.try(input[key]);
          if (parsed.ok) result[key] = parsed.value;
          else {
            throw new BorgError(
              `OBJECT_ERROR: Invalid value for extra property "${key}"`,
              parsed.error,
              [key],
            );
          }
        }
      }
    }

    return result;
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
            `OBJECT_ERROR(try): Unknown error parsing: \n\t${JSON.stringify(
              e,
            )}`,
          ),
        } as any;
    }
  }

  //TODO: Should we be treating 'undefined' in any special way when converting to BSON?
  toBson<
    const TInput extends Partial<
      _.Parsed<{ [k in keyof TShape]: _.Type<TShape[k]> }, TFlags>
    > = Partial<_.Parsed<{ [k in keyof TShape]: _.Type<TShape[k]> }, TFlags>>,
  >(
    input: TInput,
  ): {
    [k in keyof TShape as keyof TInput]: k extends keyof TInput
      ? TInput[k] extends undefined
        ? never
        : _.BsonType<TShape[k]>
      : never;
  } {
    if (input === null || input === undefined) return input as any;
    const result = {} as any;
    for (const key in this.#borgShape) {
      if (!isin(input, key)) continue;
      const schema = this.#borgShape[key];
      if (schema === undefined) {
        throw new BorgError(
          `SCHEMA_ERROR(toBson): Invalid schema for key "${key}": got undefined`,
          undefined,
          [key],
        );
      }
      result[key] = schema.toBson(input[key]);
    }
    return result;
  }

  fromBson(
    input: _.BsonType<BorgObject<TFlags, TOtherProps, TShape>>,
  ): _.Parsed<{ [k in keyof TShape]: _.Type<TShape[k]> }, TFlags> {
    if (input === null || input === undefined) return input as any;
    const result = {} as any;
    for (const key in this.#borgShape) {
      if (!isin(input, key)) continue;
      const schema = this.#borgShape[key];
      if (schema === undefined) {
        throw new BorgError(
          `SCHEMA_ERROR(fromBson): Invalid schema for key "${key}": got undefined`,
          undefined,
          [key],
        );
      }
      result[key] = schema.fromBson(input[key]);
    }
    return result;
  }

  optional(): BorgObject<_.SetOptional<TFlags>, TOtherProps, TShape> {
    const copy = this.copy();
    copy.#flags.optional = true;
    return copy as any;
  }

  nullable(): BorgObject<_.SetNullable<TFlags>, TOtherProps, TShape> {
    const clone = this.copy();
    clone.#flags.nullable = true;
    return clone as any;
  }

  nullish(): BorgObject<_.SetNullish<TFlags>, TOtherProps, TShape> {
    const clone = this.copy();
    clone.#flags.optional = true;
    clone.#flags.nullable = true;
    return clone as any;
  }

  required(): BorgObject<_.SetRequired<TFlags>, TOtherProps, TShape> {
    const clone = this.copy();
    clone.#flags.optional = false;
    return clone as any;
  }

  notNull(): BorgObject<_.SetNotNull<TFlags>, TOtherProps, TShape> {
    const clone = this.copy();
    clone.#flags.nullable = false;
    return clone as any;
  }

  notNullish(): BorgObject<_.SetNotNullish<TFlags>, TOtherProps, TShape> {
    const clone = this.copy();
    clone.#flags.optional = false;
    clone.#flags.nullable = false;
    return clone as any;
  }

  private(): BorgObject<_.SetPrivate<TFlags>, TOtherProps, TShape> {
    const clone = this.copy();
    clone.#flags.private = true;
    return clone as any;
  }

  public(): BorgObject<_.SetPublic<TFlags>, TOtherProps, TShape> {
    const clone = this.copy();
    clone.#flags.private = false;
    return clone as any;
  }

  additionalProperties<T extends "passthrough" | "strict" | "strip" | _.Borg>(
    additionalProperties: T,
  ): BorgObject<TFlags, T, TShape> {
    const clone = this.copy();
    clone.#additionalProperties = additionalProperties;
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
  