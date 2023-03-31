import { Borg } from "./Borg";
import { BorgError } from "./errors";
import { getBsonSchema } from "./types/BsonSchema";
import { ObjectId, Double } from "bson";
import type * as _ from "./types";

const isin = <T extends object>(obj: T, key: PropertyKey): key is keyof T =>
  key in obj;

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

class BorgObject<
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
  #shape: TShape;
  #additionalProperties: "passthrough" | "strict" | "strip" | _.Borg = "strip";
  #flags = {
    optional: false,
    nullable: false,
    private: false,
  };

  constructor(shape: TShape) {
    super();
    this.#shape = Object.freeze(
      Object.fromEntries(
        Object.entries(shape).map(([key, value]) => [key, value.copy()]),
      ),
    ) as any;
  }

  static #clone<const TBorg extends BorgObject<any, any, any>>(
    borg: TBorg,
  ): TBorg {
    const newShape = {} as { [key: string]: _.Borg };
    for (const key in borg.#shape) newShape[key] = borg.#shape[key]!.copy();
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
      borgShape: this.#shape,
      keys: Object.freeze(Object.keys(this.#shape)),
      requiredKeys: Object.freeze(
        Object.keys(this.#shape).filter(
          k => this.#shape[k]!.meta.optional === false,
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
  ): _.Parsed<{ [k in keyof TShape]: B.Type<TShape[k]> }, TFlags> {
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
        if (!isin(this.#shape, key)) {
          throw new BorgError(
            `OBJECT_ERROR: Unexpected property "${key}"`,
            undefined,
            [key],
          );
        }
      }
    }

    for (const key in this.#shape) {
      const schema = this.#shape[key];

      if (schema === undefined) {
        throw new BorgError(
          `OBJECT_ERROR: Invalid schema for key "${key}": got undefined`,
          undefined,
          [key],
        );
      }

      if (!isin(input, key)) {
        //TODO: implement 'exactOptional' by providing a config flag somewhere?
        if (this.#shape[key]!.meta.optional === false) {
          throw new BorgError(
            `OBJECT_ERROR: Missing property "${key}"`,
            undefined,
            [key],
          );
        }
        continue;
      }

      try {
        const parsed = this.#shape[key]!.parse(input[key]);
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
        if (!isin(this.#shape, key)) {
          result[key] = input[key];
        }
      }
    }

    if (this.#additionalProperties instanceof Borg) {
      for (const key in input) {
        if (!isin(this.#shape, key)) {
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
            `OBJECT_ERROR(try): Unknown error parsing: \n\t${JSON.stringify(
              e,
            )}`,
          ),
        } as any;
    }
  }

  serialize(
    input: B.Type<this>,
  ): _.Sanitized<{ [k in keyof TShape]: B.Serialized<TShape[k]> }, TFlags> {
    if (this.#flags.private) {
      throw new BorgError(
        "OBJECT_ERROR(serialize): Cannot serialize private schema",
      );
    }
    if (input === null || input === undefined) return input as any;
    const result = {} as any;
    for (const key in this.#shape) {
      if (!isin(input, key)) continue;
      const schema = this.#shape[key];
      if (schema === undefined)
        throw new BorgError(
          `SCHEMA_ERROR(serialize): Invalid schema for key "${key}": got undefined`,
          undefined,
          [key],
        );
      if (schema.meta.private) continue;
      result[key] = schema.serialize(input[key]);
    }
    return result;
  }
  //TODO: Fix deserialization & deserialization implementations

  deserialize(
    input: B.Serialized<this>,
  ): _.Sanitized<{ [k in keyof TShape]: B.Deserialized<TShape[k]> }, TFlags> {
    if (input === null || input === undefined) return input as any;
    const result = {} as any;
    for (const key in this.#shape) {
      if (!isin(input, key)) continue;
      const schema = this.#shape[key];
      if (schema === undefined) {
        throw new BorgError(
          `SCHEMA_ERROR(deserialize): Invalid schema for key "${key}": got undefined`,
          undefined,
          [key],
        );
      }
      result[key] = schema.deserialize(input[key]);
    }
    return result;
  }
  //TODO: Should we be treating 'undefined' in any special way when converting to BSON?
  toBson<
    const TInput extends Partial<
      _.Parsed<{ [k in keyof TShape]: B.Type<TShape[k]> }, TFlags>
    > = Partial<_.Parsed<{ [k in keyof TShape]: B.Type<TShape[k]> }, TFlags>>,
  >(
    input: TInput,
  ): {
    [k in keyof TShape as keyof TInput]: k extends keyof TInput
      ? TInput[k] extends undefined
        ? never
        : B.BsonType<TShape[k]>
      : never;
  } {
    if (input === null || input === undefined) return input as any;
    const result = {} as any;
    for (const key in this.#shape) {
      if (!isin(input, key)) continue;
      const schema = this.#shape[key];
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
    input: B.BsonType<BorgObject<TFlags, TOtherProps, TShape>>,
  ): _.Parsed<{ [k in keyof TShape]: B.Type<TShape[k]> }, TFlags> {
    if (input === null || input === undefined) return input as any;
    const result = {} as any;
    for (const key in this.#shape) {
      if (!isin(input, key)) continue;
      const schema = this.#shape[key];
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

class BorgArray<
  const TFlags extends _.Flags = ["required", "notNull", "public"],
  const TLength extends _.MinMax = [null, null],
  const TItemSchema extends _.Borg = _.Borg,
> extends Borg {
  #itemSchema: TItemSchema;
  #flags = {
    optional: false,
    nullable: false,
    private: false,
  };
  #max: TLength[1] = null;
  #min: TLength[0] = null;

  constructor(itemSchema: TItemSchema) {
    super();
    this.#itemSchema = itemSchema.copy() as any;
  }

  static #clone<const TBorg extends BorgArray<any, any, any>>(
    borg: TBorg,
  ): TBorg {
    const clone = new BorgArray(borg.#itemSchema);
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
      itemSchema: this.#itemSchema.copy(),
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
    return BorgArray.#clone(this);
  }

  parse(input: unknown): _.Parsed<Array<B.Type<TItemSchema>>, TFlags> {
    if (input === undefined) {
      if (this.#flags.optional) return void 0 as any;
      throw new BorgError(
        `ARRAY_ERROR: Expected array${
          this.#flags.nullable ? " or null" : ""
        }, got undefined`,
      );
    }
    if (input === null) {
      if (this.#flags.nullable) return null as any;
      throw new BorgError(
        `ARRAY_ERROR: Expected array${
          this.#flags.optional ? " or undefined" : ""
        }, got null`,
      );
    }
    if (!Array.isArray(input)) {
      throw new BorgError(
        `ARRAY_ERROR: Expected array,${
          this.#flags.optional ? " or undefined," : ""
        }${this.#flags.nullable ? " or null," : ""} got ${typeof input}`,
      );
    }
    if (this.#min !== null && input.length < this.#min) {
      throw new BorgError(
        `ARRAY_ERROR: Expected array length to be greater than or equal to ${
          this.#min
        }, got ${input.length}`,
      );
    }
    if (this.#max !== null && input.length > this.#max) {
      throw new BorgError(
        `ARRAY_ERROR: Expected array length to be less than or equal to ${
          this.#max
        }, got ${input.length}`,
      );
    }
    const result = new Array(input.length) as any;
    for (let i = 0; i < input.length; i++) {
      try {
        const parsed = this.#itemSchema.parse(input[i]);
        result[i] = parsed;
        continue;
      } catch (e) {
        if (e instanceof BorgError) {
          throw new BorgError(`ARRAY_ERROR: ${e.message} at index ${i}`, e, [
            i,
          ]);
        } else {
          throw new BorgError(
            `ARRAY_ERROR: Unknown error parsing index "${i}": \n\t${JSON.stringify(
              e,
            )}`,
            undefined,
            [i],
          );
        }
      }
    }
    return result;
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
            `ARRAY_ERROR(try): Unknown error parsing: \n\t${JSON.stringify(e)}`,
          ),
        } as any;
    }
  }

  serialize(
    input: B.Type<this>,
  ): _.Sanitized<Array<B.Serialized<TItemSchema>>, TFlags> {
    if (this.#flags.private) {
      throw new BorgError(
        "ARRAY_ERROR(serialize): Cannot serialize private schema",
      );
    }
    if (input === null || input === undefined) return input as any;
    const result = new Array(input.length) as any;
    for (let i = 0; i < input.length; i++) {
      result[i] = this.#itemSchema.serialize(input[i]);
    }
    return result;
  }

  deserialize(
    input: B.Serialized<this>,
  ): _.Sanitized<Array<B.Deserialized<TItemSchema>>, TFlags> {
    if (input === null || input === undefined) return input as any;
    const result = new Array(input.length) as any;
    for (let i = 0; i < input.length; i++) {
      result[i] = this.#itemSchema.deserialize(input[i]);
    }
    return result;
  }

  toBson(
    input: _.Parsed<Array<B.Type<TItemSchema>>, TFlags>,
  ): Array<B.BsonType<TItemSchema>> {
    if (input === null || input === undefined) return input as any;
    const result = new Array(input.length) as any;
    for (let i = 0; i < input.length; i++) {
      result[i] = this.#itemSchema.toBson(input[i]);
    }
    return result;
  }

  fromBson(
    input: B.BsonType<BorgArray<TFlags, TLength, TItemSchema>>,
  ): _.Parsed<Array<B.Type<TItemSchema>>, TFlags> {
    if (input === null || input === undefined) return input as any;
    const result = new Array(input.length) as any;
    for (let i = 0; i < input.length; i++) {
      result[i] = this.#itemSchema.fromBson(input[i]);
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
    length: Min,
  ): BorgArray<TFlags, [Min, TLength[1]], TItemSchema> {
    const clone = this.copy();
    clone.#min = length;
    return clone as any;
  }

  maxLength<const Max extends number | null>(
    length: Max,
  ): BorgArray<TFlags, [TLength[0], Max], TItemSchema> {
    const clone = this.copy();
    clone.#max = length;
    return clone as any;
  }
  //TODO: Throw if min > max
  /*TODO:
Can we/should we type the parsed result with the literal length? e.g...

const A = B.Array(B.String().length(1)).length(3).parse(['a', 'b', 'c'])
type A2 = typeof A //--> Array<string & { length: 1 }> & { length: 3 }
--OR--
type A2 = typeof A //--> [string & { length: 1 }, string & { length: 1 }, string & { length: 1 }]
*/

  length<const N extends number | null>(
    length: N,
  ): BorgArray<TFlags, [N, N], TItemSchema>;
  length<const Min extends number | null, const Max extends number | null>(
    minLength: Min,
    maxLength: Max,
  ): BorgArray<TFlags, [Min, Max], TItemSchema>;
  length(min: number | null, max?: number | null) {
    const clone = this.copy();
    clone.#min = min;
    clone.#max = max === undefined ? min : max;
    return clone as any;
  }
  /* c8 ignore next */
}

/////////////////////////////////////////////////////////////////////////////////////////////
///                                                                                       ///
///  BBBBBBBBBBBBBBBBB        SSSSSSSSSSSSS    TTTTTTTTTTTTTTTTTTTT RRRRRRRRRRRRRRRRR     ///
///  B////////////////B     SS/////////////SS  T//////////////////T R////////////////R    ///
///  B/////////////////B  SS/////////////////S T//////////////////T R/////////////////R   ///
///  B//////BBBBBB//////B S///////SSSSS//////S T///TTTT////TTTT///T R//////RRRRRRR/////R  ///
///  BB/////B     B/////B S/////SS    SSSSSSS  T///T  T////T  T///T RR/////R      R////R  ///
///    B////B     B/////B S//////SS            TTTTT  T////T  TTTTT   R////R      R////R  ///
///    B////B     B/////B  SS/////SSS                 T////T          R////R      R////R  ///
///    B////BBBBBB/////B     SS//////SS               T////T          R////RRRRRRR////R   ///
///    B////////////BB         SS//////SS             T////T          R/////////////RR    ///
///    B////BBBBBB/////B         SS//////SS           T////T          R////RRRRRRR////R   ///
///    B////B     B/////B          SSS/////SS         T////T          R////R      R////R  ///
///    B////B     B/////B            SS//////S        T////T          R////R      R////R  ///
///    B////B     B/////B  SSSSSSS    SS/////S        T////T          R////R      R////R  ///
///  BB/////BBBBBB//////B S//////SSSSS///////S      TT//////TT      RR/////R      R////R  ///
///  B/////////////////B  S/////////////////SS      T////////T      R//////R      R////R  ///
///  B////////////////B    SS/////////////SS        T////////T      R//////R      R////R  ///
///  BBBBBBBBBBBBBBBBB       SSSSSSSSSSSSS          TTTTTTTTTT      RRRRRRRR      RRRRRR  ///
///                                                                                       ///
/////////////////////////////////////////////////////////////////////////////////////////////

class BorgString<
  const TFlags extends _.Flags = ["required", "notNull", "public"],
  const TLength extends _.MinMax = [null, null],
  const TPattern extends string = ".*",
> extends Borg {
  #flags = {
    optional: false,
    nullable: false,
    private: false,
  };
  #min: TLength[0] = null;
  #max: TLength[1] = null;
  #pattern: TPattern | null = null;

  constructor() {
    super();
  }

  static #clone<const TBorg extends BorgString<any, any, any>>(
    borg: TBorg,
  ): TBorg {
    const clone = new BorgString();
    clone.#flags = { ...borg.#flags };
    clone.#min = borg.#min;
    clone.#max = borg.#max;
    clone.#pattern = borg.#pattern;
    return clone as any;
  }

  get meta(): _.StringMeta<TFlags, TLength, TPattern> {
    return Object.freeze({
      ...this.#flags,
      kind: "string",
      maxLength: this.#max,
      minLength: this.#min,
      pattern: this.#pattern,
      regex: this.#pattern
        ? Object.freeze(new RegExp(this.#pattern))
        : undefined,
    }) as any;
  }

  get bsonSchema() {
    return getBsonSchema(this.meta);
  }

  is(input: unknown): input is ReturnType<this["parse"]> {
    return this.try(input).ok;
  }

  copy(): this {
    return BorgString.#clone(this);
  }

  parse(input: unknown): _.Parsed<string, TFlags> {
    if (input === undefined) {
      if (this.#flags.optional) return void 0 as any;
      throw new BorgError(
        `STRING_ERROR: Expected string${
          this.#flags.nullable ? " or null" : ""
        }, got undefined`,
      );
    }
    if (input === null) {
      if (this.#flags.nullable) return null as any;
      throw new BorgError(
        `STRING_ERROR: Expected string${
          this.#flags.optional ? " or undefined" : ""
        }, got null`,
      );
    }
    if (typeof input !== "string") {
      throw new BorgError(
        `STRING_ERROR: Expected string,${
          this.#flags.optional ? " or undefined," : ""
        }${this.#flags.nullable ? " or null," : ""} got ${typeof input}`,
      );
    }
    if (this.#min !== null && input.length < this.#min) {
      throw new BorgError(
        `STRING_ERROR: Expected string length to be greater than or equal to ${
          this.#min
        }, got ${input.length}`,
      );
    }
    if (this.#max !== null && input.length > this.#max) {
      throw new BorgError(
        `STRING_ERROR: Expected string length to be less than or equal to ${
          this.#max
        }, got ${input.length}`,
      );
    }
    if (this.#pattern !== null && !new RegExp(this.#pattern, "u").test(input)) {
      throw new BorgError(
        `STRING_ERROR: Expected string to match pattern ${
          this.#pattern
        }, got ${input}`,
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
            `STRING_ERROR(try): Unknown error parsing: \n\t${JSON.stringify(
              e,
            )}`,
          ),
        } as any;
    }
  }

  serialize(input: B.Type<this>): _.Sanitized<B.Type<this>, TFlags> {
    if (this.#flags.private) {
      throw new BorgError(
        `STRING_ERROR: Cannot serialize private string field ${input}`,
      );
    }
    return input as any;
  }

  deserialize(input: B.Serialized<this>): _.Sanitized<B.Type<this>, TFlags> {
    return input as any;
  }

  toBson(input: _.Parsed<string, TFlags>) {
    return input;
  }

  fromBson(input: B.BsonType<BorgString<TFlags, TLength, TPattern>>) {
    return input;
  }

  optional(): BorgString<_.SetOptional<TFlags>, TLength, TPattern> {
    const clone = this.copy();
    clone.#flags.optional = true;
    return clone as any;
  }

  nullable(): BorgString<_.SetNullable<TFlags>, TLength, TPattern> {
    const clone = this.copy();
    clone.#flags.nullable = true;
    return clone as any;
  }

  nullish(): BorgString<_.SetNullish<TFlags>, TLength, TPattern> {
    const clone = this.copy();
    clone.#flags.optional = true;
    clone.#flags.nullable = true;
    return clone as any;
  }

  required(): BorgString<_.SetRequired<TFlags>, TLength, TPattern> {
    const clone = this.copy();
    clone.#flags.optional = false;
    return clone as any;
  }

  notNull(): BorgString<_.SetNotNull<TFlags>, TLength, TPattern> {
    const clone = this.copy();
    clone.#flags.nullable = false;
    return clone as any;
  }

  notNullish(): BorgString<_.SetNotNullish<TFlags>, TLength, TPattern> {
    const clone = this.copy();
    clone.#flags.optional = false;
    clone.#flags.nullable = false;
    return clone as any;
  }

  private(): BorgString<_.SetPrivate<TFlags>, TLength, TPattern> {
    const clone = this.copy();
    clone.#flags.private = true;
    return clone as any;
  }

  public(): BorgString<_.SetPublic<TFlags>, TLength, TPattern> {
    const clone = this.copy();
    clone.#flags.private = false;
    return clone as any;
  }

  minLength<const Min extends number | null>(
    length: Min,
  ): BorgString<TFlags, [Min, TLength[1]], TPattern> {
    const clone = this.copy();
    clone.#min = length;
    return clone as any;
  }

  maxLength<const Max extends number | null>(
    length: Max,
  ): BorgString<TFlags, [TLength[0], Max], TPattern> {
    const clone = this.copy();
    clone.#max = length;
    return clone as any;
  }

  length<const N extends number | null>(
    length: N,
  ): BorgString<TFlags, [N, N], TPattern>;
  length<const Min extends number | null, const Max extends number | null>(
    minLength: Min,
    maxLength: Max,
  ): BorgString<TFlags, [Min, Max], TPattern>;
  length(min: number | null, max?: number | null) {
    const clone = this.copy();
    clone.#min = min;
    clone.#max = max === undefined ? min : max;
    return clone as any;
  }

  /**
   * @IMPORTANT RegExp flags are not supported, except for the "u" flag which is always set.
   * @param pattern a string that will be used as the source for a new RegExp
   */
  pattern<const S extends string | null>(
    pattern: S,
  ): BorgString<TFlags, TLength, S extends null ? ".*" : S> {
    const clone = this.copy();
    clone.#pattern = pattern as any;
    return clone as any;
  }

  /* c8 ignore next */
}

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

class BorgNumber<
  const TFlags extends _.Flags = ["required", "notNull", "public"],
  const TRange extends _.MinMax = [null, null],
> extends Borg {
  #flags = {
    optional: false,
    nullable: false,
    private: false,
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
    return BorgNumber.#clone(this);
  }

  parse(input: unknown): _.Parsed<number, TFlags> {
    if (input === undefined) {
      if (this.#flags.optional) return void 0 as any;
      throw new BorgError(
        `NUMBER_ERROR: Expected number${
          this.#flags.nullable ? " or null" : ""
        }, got undefined`,
      );
    }
    if (input === null) {
      if (this.#flags.nullable) return null as any;
      throw new BorgError(
        `NUMBER_ERROR: Expected number${
          this.#flags.optional ? " or undefined" : ""
        }, got null`,
      );
    }
    if (typeof input !== "number") {
      throw new BorgError(
        `NUMBER_ERROR: Expected number,${
          this.#flags.optional ? " or undefined," : ""
        }${this.#flags.nullable ? " or null," : ""} got ${typeof input}`,
      );
    }
    if (this.#min !== null && input < this.#min) {
      throw new BorgError(
        `NUMBER_ERROR: Expected number to be greater than or equal to ${
          this.#min
        }`,
      );
    }
    if (this.#max !== null && input > this.#max) {
      throw new BorgError(
        `NUMBER_ERROR: Expected number to be less than or equal to ${
          this.#max
        }`,
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
            `NUMBER_ERROR(try): Unknown error parsing: \n\t${JSON.stringify(
              e,
            )}`,
          ),
        } as any;
    }
  }

  serialize(input: B.Type<this>): _.Sanitized<B.Type<this>, TFlags> {
    if (this.#flags.private) {
      throw new BorgError(
        `NUMBER_ERROR: Cannot serialize private number field ${input}`,
      );
    }
    return input as any;
  }

  deserialize(input: B.Serialized<this>): _.Sanitized<B.Type<this>, TFlags> {
    return input as any;
  }

  toBson(input: _.Parsed<number, TFlags>): _.Parsed<_.Double, TFlags> {
    return typeof input === "number" ? new Double(input) : (input as any);
  }

  fromBson(
    input: B.BsonType<BorgNumber<TFlags, TRange>>,
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
    min: Min,
  ): BorgNumber<TFlags, [Min, TRange[1]]> {
    const clone = this.copy();
    clone.#min = min;
    return clone as any;
  }

  max<const Max extends number | null>(
    max: Max,
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
    max: Max,
  ): BorgNumber<TFlags, [Min, Max]> {
    const clone = this.copy();
    clone.#min = min;
    clone.#max = max;
    return clone as any;
  }
}

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

class BorgBoolean<
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

  serialize(input: B.Type<this>): _.Sanitized<B.Type<this>, TFlags> {
    if (this.#flags.private) {
      throw new BorgError(
        `BOOLEAN_ERROR: Cannot serialize private boolean field`,
      );
    }
    return input as any;
  }

  deserialize(input: B.Serialized<this>): _.Sanitized<B.Type<this>, TFlags> {
    return input as any;
  }

  toBson(input: _.Parsed<boolean, TFlags>): _.Parsed<boolean, TFlags> {
    return input as any;
  }

  fromBson(input: B.BsonType<BorgBoolean<TFlags>>): _.Parsed<boolean, TFlags> {
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

class BorgId<
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
            `ID_ERROR(try): Unknown error parsing: \n\t${JSON.stringify(e)}`,
          ),
        } as any;
    }
  }

  serialize(input: B.Type<this>): _.Sanitized<string, TFlags> {
    if (this.#flags.private) {
      throw new BorgError(`ID_ERROR: Cannot serialize private ID field`);
    }
    if (input === undefined || input === null) return input as any;
    if (typeof input === "string") return input as any;
    return input.toHexString() as any;
  }

  deserialize(input: B.Serialized<this>): _.Sanitized<B.Type<this>, TFlags> {
    if (input === undefined || input === null) return input as any;
    if (this.#format) return input as any;
    return ObjectId.createFromHexString(input) as any;
  }

  toBson(input: _.Parsed<TFormat, TFlags>): _.Parsed<_.ObjectId, TFlags> {
    if (input === undefined || input === null) return input as any;
    if (input instanceof ObjectId) return input as any;
    return ObjectId.createFromHexString(input) as any;
  }

  fromBson(
    input: B.BsonType<BorgId<TFlags, TFormat>>,
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
  const TMembers extends _.Borg[] = _.Borg[],
> extends Borg {
  #borgMembers: TMembers;
  #flags = {
    optional: false,
    nullable: false,
    private: false,
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
    return BorgUnion.#clone(this);
  }

  parse(input: unknown): _.Parsed<B.Type<TMembers[number]>[][number], TFlags> {
    if (input === undefined) {
      if (this.#flags.optional) return void 0 as any;
      throw new BorgError(
        `UNION_ERROR: Expected valid type${
          this.#flags.nullable ? " or null" : ""
        }, got undefined`,
      );
    }
    if (input === null) {
      if (this.#flags.nullable) return null as any;
      throw new BorgError(
        `UNION_ERROR: Expected valid type${
          this.#flags.optional ? " or undefined" : ""
        }, got null`,
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
            : "UNKNOWN ERROR",
        )
        .join("\n")}`,
    );
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
            `UNION_ERROR(try): Unknown error parsing: \n\t${JSON.stringify(e)}`,
          ),
        } as any;
    }
  }

  //TODO: Serialization should result in { __borgMeta: /* META */, data: /* DATA */ }
  serialize(input: B.Type<this>): _.Sanitized<B.Type<this>, TFlags> {
    if (input === undefined || input === null) return input as any;
    for (const type of this.#borgMembers)
      if (type.is(input)) return type.serialize(input) as any;
    throw new BorgError(`SERIALIZATION_ERROR: Invalid input`);
  }

  deserialize(input: B.Serialized<this>): _.Sanitized<_.Type<this>, TFlags> {
    if (input === undefined || input === null) return input as any;
    for (const type of this.#borgMembers)
      if (type.is(input)) return type.deserialize(input) as any;
    throw new BorgError(`DESERIALIZATION_ERROR: Invalid input`);
  }

  toBson(input: any): _.Parsed<any, TFlags> {
    if (input === undefined || input === null) return input as any;
    for (const type of this.#borgMembers)
      if (type.is(input)) return type.toBson(input) as any;
    throw new BorgError(`TO_BSON_ERROR: Invalid input`);
  }

  fromBson(input: any): _.Parsed<any, TFlags> {
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

/////////////////////////////////////////////////////////////////////////////////////////////
///                                                                                       ///
///  BBBBBBBBBBBBBBBBB    MMMMMMM      MMMMMMM     OOOOOOOOOOOO     DDDDDDDDDDDDDDD       ///
///  B////////////////B   M//////M    M//////M   OO////////////OO   D//////////////DD     ///
///  B/////////////////B  M///////M  M///////M  OO//////////////OO  D///////////////DD    ///
///  B//////BBBBBB//////B M////////MM////////M O///////OOO////////O D/////DDDDDD/////DD   ///
///  BB/////B     B/////B M//////////////////M O//////O   O///////O D/////D    DD/////DD  ///
///    B////B     B/////B M/////M//////M/////M O/////O     O//////O D/////D     DD/////D  ///
///    B////B     B/////B M/////MM////MM/////M O/////O     O//////O D/////D      D/////D  ///
///    B////BBBBBB/////B  M/////M M//M M/////M O/////O     O//////O D/////D      D/////D  ///
///    B////////////BB    M/////M  MM  M/////M O/////O     O//////O D/////D      D/////D  ///
///    B////BBBBBB/////B  M/////M      M/////M O/////O     O//////O D/////D      D/////D  ///
///    B////B     B/////B M/////M      M/////M O/////O     O//////O D/////D      D/////D  ///
///    B////B     B/////B M/////M      M/////M O/////O     O//////O D/////D     DD/////D  ///
///    B////B     B/////B M/////M      M/////M O//////O   O///////O D/////D    DD/////DD  ///
///  BB/////BBBBBB//////B M/////M      M/////M O///////OOO////////O D/////DDOOOD/////DD   ///
///  B/////////////////B  M/////M      M/////M OO///////////////OO  D///////////////DD    ///
///  B////////////////B   M/////M      M/////M  OO/////////////OO   D//////////////DD     ///
///  BBBBBBBBBBBBBBBBB    MMMMMMM      MMMMMMM    OOOOOOOOOOOOOO    DDDDDDDDDDDDDDD       ///
///                                                                                       ///
/////////////////////////////////////////////////////////////////////////////////////////////

function makeBorg<TSchema extends BorgObject<_.Flags>>(
  schema: TSchema,
): _.BorgModel<TSchema>;
function makeBorg<
  TSchema extends BorgObject<_.Flags>,
  TServerModel extends object,
>(
  schema: TSchema,
  transformInput: (input: B.Type<TSchema>) => TServerModel,
): _.BorgModel<TSchema, TServerModel>;
function makeBorg<
  TInputSchema extends BorgObject<_.Flags>,
  TServerModel extends object,
  TOutputSchema extends BorgObject<_.Flags>,
>(
  inputSchema: TInputSchema,
  transformInput: (input: B.Type<TInputSchema>) => TServerModel,
  transformOutput: (input: TServerModel) => B.Type<TOutputSchema>,
  outputSchema: TOutputSchema,
): _.BorgModel<TInputSchema, TServerModel, TOutputSchema>;

function makeBorg<
  TInputSchema extends BorgObject<_.Flags>,
  TServerModel extends object,
  TOutputSchema extends BorgObject<_.Flags>,
>(
  schema: TInputSchema,
  transformInput: (input: B.Type<TInputSchema>) => TServerModel = (
    input: B.Type<TInputSchema>,
  ) => input as any,
  transformOutput: (input: TServerModel) => B.Type<TOutputSchema> = (
    input: TServerModel,
  ) => input as any,
  outputSchema: TOutputSchema = schema as any,
): _.BorgModel<TInputSchema, TServerModel, TOutputSchema> {
  /*TODO
  Modify output parsing so that fields not
  present in the output schema pass through untouched.
  When building a client parser, we can use the shape of the input schema,
  and replace the modified fields with those from the output schema.
*/
  return {
    createFromRequest: input => transformOutput(transformInput(input)),
    sanitizeResponse: input => transformOutput(input),
    serializeInput: parsedInput => schema.serialize(parsedInput) as any,
    deserializeInput: serializedInput => schema.parse(serializedInput) as any,
    serializeOutput: parsedOutput =>
      outputSchema.serialize(parsedOutput) as any,
    deserializeOutput: serializedOutput =>
      outputSchema.parse(serializedOutput) as any,
    parseInput: input => schema.parse(input) as any,
    parseOutput: input => outputSchema.parse(input) as any,
  };
}

const B = {
  id: () => new BorgId(),
  string: () => new BorgString(),
  number: () => new BorgNumber(),
  boolean: () => new BorgBoolean(),
  array: <const T extends _.Borg>(itemSchema: T) => new BorgArray(itemSchema),
  object: <const T extends { [key: string]: _.Borg }>(shape: T) =>
    new BorgObject(shape),
  union: <const T extends _.Borg[]>(...members: T) => new BorgUnion(members),
  model: makeBorg,
};

declare module B {
  export type Boolean<TFlags extends _.Flags = _.Flags> = BorgBoolean<TFlags>;

  export type Id<
    TFlags extends _.Flags = _.Flags,
    TFormat extends "string" | "oid" = "string" | "oid",
  > = InstanceType<typeof BorgId<TFlags, TFormat>>;

  export type Number<
    TFlags extends _.Flags = _.Flags,
    TLength extends _.MinMax = _.MinMax,
  > = InstanceType<typeof BorgNumber<TFlags, TLength>>;

  export type String<
    TFlags extends _.Flags = _.Flags,
    TLength extends _.MinMax = _.MinMax,
    TPattern extends string = string,
  > = InstanceType<typeof BorgString<TFlags, TLength, TPattern>>;

  export type Array<
    TFlags extends _.Flags = _.Flags,
    TLength extends _.MinMax = _.MinMax,
    TItems extends _.Borg = _.Borg,
  > = InstanceType<typeof BorgArray<TFlags, TLength, TItems>>;

  export type Object<
    TFlags extends _.Flags = _.Flags,
    TOtherProps extends "strict" | "strip" | "passthrough" | _.Borg =
      | "strict"
      | "strip"
      | "passthrough"
      | _.Borg,
    TShape extends { [key: string]: _.Borg } = {
      [key: string]: _.Borg;
    },
  > = InstanceType<typeof BorgObject<TFlags, TOtherProps, TShape>>;

  export type Union<
    TFlags extends _.Flags = _.Flags,
    TMembers extends _.Borg[] = _.Borg[],
  > = BorgUnion<TFlags, TMembers>;

  export type Borg = _.Borg;
  export type Type<T extends _.Borg> = _.Type<T>;
  export type BsonType<T extends _.Borg> = _.BsonType<T>;
  export type Serialized<T extends _.Borg> = _.Serialized<T>;
  export type Deserialized<T extends _.Borg> = _.Deserialized<T>;
  export type AnyBorg =
    | B.Object
    | B.Array
    | B.String
    | B.Number
    | B.Boolean
    | B.Id
    | B.Union
    | B.Borg;
}

export default B;

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
// @ts-ignore - vitest handles this import.meta check
if (import.meta.vitest) {
  // @ts-ignore - vitest handles this top-level await
  const [{ describe, expect, it }, { Double }] = await Promise.all([
    import("vitest"),
    import("bson"),
  ]);

  type TestCase = {
    name: string;
    basecase: any;
    schema: () => _.Borg;
    valid: any[];
    invalid: any[];
    bsonCheck: (value: unknown) => boolean;
  };

  describe("BorgSchemas", () => {
    const testCases = [
      {
        name: "BorgString",
        basecase: "test",
        schema: () => B.string(),
        valid: ["", "abc"],
        invalid: [1, undefined, null, {}],
        bsonCheck: (value: unknown) => typeof value === "string",
      },
      {
        name: "BorgString with min/max",
        basecase: "test",
        schema: () => B.string().minLength(0).maxLength(10),
        valid: ["", "abc", "1234567890"],
        invalid: ["12345678901", -1, 11, undefined, null],
        bsonCheck: (value: unknown) => typeof value === "string",
      },
      {
        name: "BorgString with exact length",
        basecase: "test--test",
        schema: () => B.string().length(10),
        valid: ["1234567890", "abcdefghij"],
        invalid: ["", "12", "12345678901", -1, 11, undefined, null],
        bsonCheck: (value: unknown) => typeof value === "string",
      },
      {
        name: "BorgString with length range",
        basecase: "test",
        schema: () => B.string().length(0, 10),
        valid: ["", "abc", "1234567890"],
        invalid: ["12345678901", -1, 11, undefined, null],
        bsonCheck: (value: unknown) => typeof value === "string",
      },
      {
        name: "BorgString with pattern",
        basecase: "C:\\Users\\abc",
        schema: () => B.string().pattern("C:\\\\Users\\\\.+"),
        valid: ["C:\\Users\\abc", "C:\\Users\\123"],
        invalid: ["C:\\\\Users\\abc\\def", "C:\\Users\\", undefined, null],
        bsonCheck: (value: unknown) => typeof value === "string",
      },
      {
        name: "BorgString with pattern and range",
        basecase: "C:\\Users\\abc",
        schema: () =>
          B.string().minLength(0).maxLength(14).pattern("C:\\\\Users\\\\.+"),
        valid: ["C:\\Users\\abc", "C:\\Users\\123"],
        invalid: [
          "C:\\\\Users\\abc\\def",
          "C:\\Users\\",
          "C:\\Users\\abc\\def",
          undefined,
          null,
        ],
        bsonCheck: (value: unknown) => typeof value === "string",
      },
      {
        name: "BorgNumber",
        basecase: 5,
        schema: () => B.number(),
        valid: [0, 3.14, -42],
        invalid: ["1", undefined, null],
        bsonCheck: (value: unknown) => value instanceof Double,
      },
      {
        name: "BorgNumber with min/max",
        basecase: 5,
        schema: () => B.number().min(0).max(10),
        valid: [0, 3.14, 10],
        invalid: [-1, 11, "1", undefined, null],
        bsonCheck: (value: unknown) => value instanceof Double,
      },
      {
        name: "BorgNumber with range",
        basecase: 5,
        schema: () => B.number().range(0, 10),
        valid: [0, 3.14, 10],
        invalid: [-1, 11, "1", undefined, null],
        bsonCheck: (value: unknown) => value instanceof Double,
      },
      {
        name: "BorgBoolean",
        basecase: true,
        schema: () => B.boolean(),
        valid: [true, false],
        invalid: ["true", 1, undefined, null],
        bsonCheck: (value: unknown) => typeof value === "boolean",
      },
      {
        name: "BorgArray",
        basecase: [1, 2, 3],
        schema: () => B.array(B.number()),
        valid: [[], [1, 2, 3]],
        invalid: ["1", 1, undefined, null],
        bsonCheck: (value: unknown) =>
          Array.isArray(value) && value.every(v => v instanceof Double),
      },
      {
        name: "BorgArray with min/max",
        basecase: [1, 2, 3],
        schema: () => B.array(B.number()).minLength(0).maxLength(10),
        valid: [[], [1, 2, 3]],
        invalid: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], "1", 1, undefined, null],
        bsonCheck: (value: unknown) =>
          Array.isArray(value) && value.every(v => v instanceof Double),
      },
      {
        name: "BorgArray with length",
        basecase: [1, 2, 3],
        schema: () => B.array(B.number()).length(0, 10),
        valid: [[], [1, 2, 3]],
        invalid: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], "1", 1, undefined, null],
        bsonCheck: (value: unknown) =>
          Array.isArray(value) && value.every(v => v instanceof Double),
      },
      {
        name: "BorgObject",
        basecase: { a: 1, b: 2, c: 3 },
        schema: () =>
          B.object({
            a: B.number(),
            b: B.number(),
            c: B.number(),
          }),
        valid: [
          { a: 1, b: 2, c: 3 },
          { a: 1, b: 2, c: 3, d: 4 },
          { a: 1, b: 2, c: 3, d: "", e: null, f: undefined, g: [], h: 0 },
        ],
        invalid: [
          { a: 1, b: 2 },
          { a: 1, b: 2, c: "3" },
          "1",
          1,
          undefined,
          null,
        ],
        bsonCheck: (value: unknown) =>
          typeof value === "object" &&
          value !== null &&
          "a" in value &&
          value.a instanceof Double &&
          "b" in value &&
          value.b instanceof Double &&
          "c" in value &&
          value.c instanceof Double,
      },
      {
        name: "BorgObject with strict extra keys",
        basecase: { a: 1, b: 2, c: 3 },
        schema: () =>
          B.object({
            a: B.number(),
            b: B.number(),
            c: B.number(),
          }).additionalProperties("strict"),
        valid: [{ a: 1, b: 2, c: 3 }],
        invalid: [
          { a: 1, b: 2, c: 3, d: 4 },
          { a: 1, b: 2, c: 3, d: "", e: null, f: undefined, g: [], h: 0 },
          { a: 1, b: 2 },
          { a: 1, b: 2, c: "3" },
          "1",
          1,
          undefined,
          null,
        ],
        bsonCheck: (value: unknown) =>
          typeof value === "object" &&
          value !== null &&
          "a" in value &&
          value.a instanceof Double &&
          "b" in value &&
          value.b instanceof Double &&
          "c" in value &&
          value.c instanceof Double,
      },
      {
        name: "BorgObject with passthrough extra keys",
        basecase: { a: 1, b: 2, c: 3 },
        schema: () =>
          B.object({
            a: B.number(),
            b: B.number(),
            c: B.number(),
          }).additionalProperties("passthrough"),
        valid: [
          { a: 1, b: 2, c: 3, d: 4 },
          { a: 1, b: 2, c: 3, d: "", e: null, f: undefined, g: [], h: 0 },
        ],
        invalid: [
          { a: 1, b: 2 },
          { a: 1, b: 2, c: "3" },
          "1",
          1,
          undefined,
          null,
        ],
        bsonCheck: (value: unknown) =>
          typeof value === "object" &&
          value !== null &&
          "a" in value &&
          value.a instanceof Double &&
          "b" in value &&
          value.b instanceof Double &&
          "c" in value &&
          value.c instanceof Double,
      },
      {
        name: "BorgObject with validated extra keys",
        basecase: { a: 1, b: 2, c: 3 },
        schema: () =>
          B.object({
            a: B.number(),
            b: B.number(),
            c: B.number(),
          }).additionalProperties(B.string().nullable().optional()),
        valid: [
          { a: 1, b: 2, c: 3, d: "4" },
          { a: 1, b: 2, c: 3, d: "", e: null, f: undefined, g: "[]", h: "0" },
        ],
        invalid: [
          { a: 1, b: 2, c: 3, d: 4 },
          { a: 1, b: 2 },
          { a: 1, b: 2, c: "3" },
          "1",
          1,
          undefined,
          null,
        ],
        bsonCheck: (value: unknown) =>
          typeof value === "object" &&
          value !== null &&
          "a" in value &&
          value.a instanceof Double &&
          "b" in value &&
          value.b instanceof Double &&
          "c" in value &&
          value.c instanceof Double,
      },
      {
        name: "BorgObject with optional and nullable properties",
        basecase: { a: 1, b: 2, c: 3 },
        schema: () =>
          B.object({
            a: B.number(),
            b: B.number().nullable(),
            c: B.number().optional(),
          }),
        valid: [
          { a: 1, b: 2, c: 3 },
          { a: 1, b: 2 },
          { a: 1, b: 2, c: undefined },
          { a: 1, b: null, c: 3 },
          { a: 1, b: null },
          { a: 1, b: 2, c: 3, d: 4 },
          { a: 1, b: 2, c: 3, d: "", e: null, f: undefined, g: [], h: 0 },
        ],
        invalid: [
          { a: 1, b: 2, c: "3" },
          { a: 1, b: 2, c: null },
          { a: 1, c: 3 },
          { a: 1, c: undefined },
          "1",
          1,
          undefined,
          null,
        ],
        bsonCheck: (value: unknown) =>
          typeof value === "object" &&
          value !== null &&
          "a" in value &&
          value.a instanceof Double &&
          "b" in value &&
          (value.b === null || value.b instanceof Double) &&
          "c" in value
            ? value.c instanceof Double
            : true,
      },
    ] satisfies TestCase[];

    testCases.forEach(
      ({ name, schema, valid, invalid, bsonCheck, basecase }) => {
        describe(name, () => {
          it("should parse valid values and throw for invalid values", () => {
            const borg = schema();
            const message = JSON.stringify(borg.meta, undefined, 2);
            valid.forEach(value => {
              const parsed = borg.parse(value);
              if (borg.meta.kind === "object") {
                //TODO: This `for` loop will need to change for the `exactOptionalProperties` feature, if it is implemented.
                for (const key of borg.meta.keys) {
                  if (value[key as keyof typeof value] !== undefined) {
                    expect(parsed).toHaveProperty(
                      key,
                      value[key as keyof typeof value],
                    );
                  } else {
                    expect(parsed["c" as keyof typeof parsed]).toBeUndefined();
                  }
                }
                const unknownKeys = Object.keys(value).filter(
                  v =>
                    borg.meta.kind === "object" &&
                    !borg.meta.keys.includes(v as keyof typeof value),
                );
                for (const key of unknownKeys) {
                  if (
                    borg.meta.additionalProperties === "strict" ||
                    borg.meta.additionalProperties === "strip"
                  ) {
                    expect(parsed).not.toHaveProperty(key);
                  } else {
                    expect(parsed).toHaveProperty(key);
                    expect(parsed[key as keyof typeof parsed]).toEqual(
                      borg.meta.additionalProperties === "passthrough"
                        ? value[key as keyof typeof value]
                        : borg.meta.additionalProperties.parse(
                            value[key as keyof typeof value],
                          ),
                    );
                  }
                }
              } else {
                expect(
                  parsed,
                  `Expected ${JSON.stringify(parsed)} to be ${JSON.stringify(
                    value,
                  )} using schema: ${message}`,
                ).toEqual(value);
              }
            });

            invalid.forEach(value => {
              expect(
                () => borg.parse(value),
                `Expected ${JSON.stringify(
                  value,
                )} to throw for schema: ${message}`,
              ).toThrow(BorgError);
            });
          });

          it("should copy correctly", () => {
            const borg = schema().optional();
            const borg2 = borg.copy();
            expect(borg2).toEqual(borg);
            expect(borg2).not.toBe(borg);
            expect(borg.meta.optional).toBe(true);
            expect(borg2.meta.optional).toBe(true);
          });

          it("should assert correctly", () => {
            const borg = schema();
            const message = JSON.stringify(borg.meta, undefined, 2);
            valid.forEach(value => {
              const ok = borg.is(value);
              expect(
                ok,
                `Expected ${JSON.stringify(
                  value,
                )} to be pass using schema: ${message}`,
              ).toBe(true);
            });

            invalid.forEach(value => {
              const ok = borg.is(value);
              expect(
                ok,
                `Expected ${JSON.stringify(
                  value,
                )} to fail using schema: ${message}`,
              ).toBe(false);
            });
          });

          it("should parse without throwing", () => {
            const borg = schema();

            valid.forEach(value => {
              const parsed = borg.try(value);
              const message = JSON.stringify(borg.meta, undefined, 2);
              expect(
                parsed.ok,
                `Expected ${JSON.stringify(
                  value,
                )} to be pass using schema: ${message}`,
              ).toBe(true);
              if (parsed.ok) {
                if (borg.meta.kind === "object") {
                  //TODO: This `for` loop will need to change for the `exactOptionalProperties` feature, if it is implemented.
                  for (const key of borg.meta.keys) {
                    if (value[key as keyof typeof value] !== undefined) {
                      expect(parsed.value).toHaveProperty(
                        key,
                        value[key as keyof typeof value],
                      );
                    } else {
                      expect(
                        parsed.value["c" as keyof typeof parsed.value],
                      ).toBeUndefined();
                    }
                  }
                  const unknownKeys = Object.keys(value).filter(
                    v =>
                      borg.meta.kind === "object" &&
                      !borg.meta.keys.includes(v as keyof typeof value),
                  );
                  for (const key of unknownKeys) {
                    if (
                      borg.meta.additionalProperties === "strict" ||
                      borg.meta.additionalProperties === "strip"
                    ) {
                      expect(parsed).not.toHaveProperty(key);
                    } else {
                      expect(parsed).toHaveProperty(key);
                      expect(parsed[key as keyof typeof parsed]).toEqual(
                        borg.meta.additionalProperties === "passthrough"
                          ? value[key as keyof typeof value]
                          : borg.meta.additionalProperties.parse(
                              value[key as keyof typeof value],
                            ),
                      );
                    }
                  }
                } else {
                  expect(
                    parsed.value,
                    `Expected ${JSON.stringify(
                      parsed.value,
                    )} to be ${JSON.stringify(value)} using schema: ${message}`,
                  ).toEqual(value);
                }
              }
            });

            invalid.forEach(value => {
              const parsed = borg.try(value);
              const message = JSON.stringify(borg.meta, undefined, 2);
              expect(
                parsed.ok,
                `Expected ${JSON.stringify(
                  value,
                )} to fail using schema: ${message}`,
              ).toBe(false);
              if (!parsed.ok)
                expect(
                  parsed.error,
                  `Expected ${JSON.stringify(value)} to throw ${
                    parsed.error
                  } for schema: ${message}`,
                ).toBeInstanceOf(BorgError);
            });
          });

          it("should convert to BSON correctly", () => {
            const borg = schema();
            valid.forEach(value => {
              //@ts-expect-error - testing sucks with TS :()
              const bson = borg.toBson(value);
              expect(bsonCheck(bson), `${bsonCheck.toString()}`).toBe(true);
              const reverted = borg.fromBson(bson as never);
              expect(
                reverted,
                `Expected ${JSON.stringify(bson)} to revert to ${JSON.stringify(
                  bson,
                )}`,
              ).toEqual(value);
            });
          });

          it.todo("should print the correct JSON schema", () => {});

          it.todo("should serialize and deserialize", () => {
            const borg = schema();
            valid.forEach(value => {
              const serialized = borg.serialize(value as never);
              //@ts-expect-error - not yet implemented
              expect(serialized.data).toEqual(serializedValue);
              //@ts-expect-error - not yet implemented
              expect(serialized.meta).toEqual(expectedMeta);
              //@ts-expect-error - not yet implemented
              const deserialized = borg.deserialize(serialized);
              expect(deserialized).toEqual(value);
            });
          });

          it("should be optional when marked as such", () => {
            const borg = schema().optional();
            const parsed = borg.parse(undefined);
            expect(
              parsed,
              `Expected undefined to pass using schema: ${JSON.stringify(
                borg.meta,
                undefined,
                2,
              )}`,
            ).toBeUndefined();
          });

          it("should be nullable when marked as such", () => {
            const borg = schema().nullable();
            const parsed = borg.parse(null);
            expect(
              parsed,
              `Expected null to pass using schema: ${JSON.stringify(
                borg.meta,
                undefined,
                2,
              )}`,
            ).toBeNull();
          });

          it("should be optional and nullable when marked as such", () => {
            const borg = schema().optional().nullable();
            const parsed = borg.parse(undefined);
            const parsed2 = borg.parse(null);
            expect(
              parsed,
              `Expected undefined to pass using schema: ${JSON.stringify(
                borg.meta,
                undefined,
                2,
              )}`,
            ).toBeUndefined();
            expect(
              parsed2,
              `Expected null to pass using schema: ${JSON.stringify(
                borg.meta,
                undefined,
                2,
              )}`,
            ).toBeNull();
          });

          it("should be nullish when marked as such", () => {
            const borg = schema().nullish();
            const parsed = borg.parse(undefined);
            const parsed2 = borg.parse(null);
            expect(
              parsed,
              `Expected undefined to pass using schema: ${JSON.stringify(
                borg.meta,
                undefined,
                2,
              )}`,
            ).toBeUndefined();
            expect(
              parsed2,
              `Expected null to pass using schema: ${JSON.stringify(
                borg.meta,
                undefined,
                2,
              )}`,
            ).toBeNull();
          });

          it("should parse as normal when marked private", () => {
            const borg = schema().private();
            valid.forEach(value => {
              const parsed = borg.parse(value);
              expect(
                parsed,
                `Expected ${JSON.stringify(
                  value,
                )} to pass using schema: ${JSON.stringify(
                  borg.meta,
                  undefined,
                  2,
                )}`,
              ).toEqual(value);
            });

            invalid.forEach(value => {
              expect(
                () => borg.parse(value),
                `Expected ${JSON.stringify(
                  value,
                )} to fail using schema: ${JSON.stringify(
                  borg.meta,
                  undefined,
                  2,
                )}`,
              ).toThrow(BorgError);
            });
          });

          it("should not matter in what order the following are chained: `optional`, `private`, `required`, `notNull`, `nullish`, notNullish`, `public`, and `nullable`", () => {
            const borg = schema()
              .optional() // optional, notNull, public
              .private() // optional, notNull, private
              .required() // required, notNull, private
              .notNull() // required, notNull, private
              .nullish() // optional, nullable, private
              .public() // optional, nullable, public
              .notNullish() // required, notNull, public
              .nullable(); // required, nullable, public

            expect(borg.meta).toHaveProperty("optional", false);
            expect(borg.meta).toHaveProperty("nullable", true);
            expect(borg.meta).toHaveProperty("private", false);

            expect(borg.parse(basecase)).toEqual(basecase);
            expect(borg.parse(null)).toBeNull();
            expect(() => borg.parse(undefined)).toThrow(BorgError);

            const borg2 = schema()
              .notNullish() // required, notNull, public
              .nullable() // required, nullable, public
              .public() // required, nullable, public
              .nullish() // optional, nullable, public
              .notNull() // optional, notNull, public
              .required() // required, notNull, public
              .private() // required, notNull, private
              .optional(); // optional, notNull, private

            expect(borg2.meta).toHaveProperty("optional", true);
            expect(borg2.meta).toHaveProperty("nullable", false);
            expect(borg2.meta).toHaveProperty("private", true);

            expect(borg2.parse(basecase)).toEqual(basecase);
            expect(() => borg2.parse(null)).toThrow(BorgError);
            expect(borg2.parse(undefined)).toBeUndefined();
          });
        });
      },
    );
  });
}
/* c8 ignore stop */
