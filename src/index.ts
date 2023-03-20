import * as _ from "./types";
import { Double, ObjectId, ObjectIdLike } from "bson";

/**
 * To-Do list for features to implement:
 * @see https://www.mongodb.com/docs/manual/reference/operator/query/jsonSchema/#std-label-jsonSchema-keywords
 * //TODO: Implement:
 * - Maps & Sets
 * - Enums
 * - Documents
 * - Dates
 * - "Passthrough" & "Strip" & "Strict" modes
 * - Coercion
 */
const privateSymbol = Symbol("private");
export type PrivateSymbol = typeof privateSymbol;
function isin<T extends object>(obj: T, key: PropertyKey): key is keyof T {
  return key in obj;
}

/////////////////////////////////////////////////////////////////////////////////////////////
///                                                                                       ///
///  BBBBBBBBBBBBBBBBB    EEEEEEEEEEEEEEEEEEEE RRRRRRRRRRRRRRRRR    RRRRRRRRRRRRRRRRR     ///
///  B////////////////B   E//////////////////E R////////////////R   R////////////////R    ///
///  B/////////////////B  E//////////////////E R/////////////////R  R/////////////////R   ///
///  B//////BBBBBB//////B E/////EEEEEEEEE////E R//////RRRRRRR/////R R//////RRRRRRR/////R  ///
///  BB/////B     B/////B E/////E        EEEEE RR/////R      R////R RR/////R      R////R  ///
///    B////B     B/////B E/////E                R////R      R////R   R////R      R////R  ///
///    B////B     B/////B E/////E                R////R      R////R   R////R      R////R  ///
///    B////BBBBBB/////B  E/////EEEEEEEEEE       R////RRRRRRR////R    R////RRRRRRR////R   ///
///    B////////////BB    E//////////////E       R/////////////RR     R/////////////RR    ///
///    B////BBBBBB/////B  E/////EEEEEEEEEE       R////RRRRRRR////R    R////RRRRRRR////R   ///
///    B////B     B/////B E/////E                R////R      R////R   R////R      R////R  ///
///    B////B     B/////B E/////E                R////R      R////R   R////R      R////R  ///
///    B////B     B/////B E/////E        EEEEE   R////R      R////R   R////R      R////R  ///
///  BB/////BBBBBB//////B E/////EEEEEEEEE////E RR/////R      R////R RR/////R      R////R  ///
///  B/////////////////B  E//////////////////E R//////R      R////R R//////R      R////R  ///
///  B////////////////B   E//////////////////E R//////R      R////R R//////R      R////R  ///
///  BBBBBBBBBBBBBBBBB    EEEEEEEEEEEEEEEEEEEE RRRRRRRR      RRRRRR RRRRRRRR      RRRRRR  ///
///                                                                                       ///
/////////////////////////////////////////////////////////////////////////////////////////////

class BorgError<
  const T extends BorgError | undefined = undefined,
> extends Error {
  #path: (string | number)[] = [];

  constructor(message: string, cause?: T, path?: (string | number)[]) {
    super(`${message}`);
    this.#path = [...(path || []), ...(cause?.path || [])];
    this.message = `${message} at "${this.#path.join(".") || "{ROOT}"}"${
      cause?.message ? `: ${cause.message}` : ""
    }`;
    if (cause) {
      this.stack = `${this.stack}\n\n### [CAUSED BY]:###\n\n${cause.stack}`;
    }
  }

  get path() {
    return this.#path;
  }
  /* c8 ignore next */
}

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
abstract class BorgType<
  const TKind extends _.AnyKind = _.AnyKind,
  const TOpts extends _.Flags = _.Flags,
  const TShape extends
    | (TKind extends "object" ? { [key: string]: B.Borg } : never)
    | (TKind extends "array" ? B.Borg : never)
    | never =
    | (TKind extends "object" ? { [key: string]: B.Borg } : never)
    | (TKind extends "array" ? B.Borg : never)
    | never,
> {
  abstract get meta(): Readonly<
    _.PrettyPrint<_.InferMeta<TKind, TShape, TOpts>>
  >;
  abstract get bsonSchema(): any;
  abstract copy(): BorgType<TKind, TOpts, TShape>;
  abstract parse(input: unknown): any;
  abstract serialize(input: any): any;
  abstract deserialize(input: any): any;
  abstract toBson(input: any): any;
  abstract fromBson(input: any): any;
  abstract private(): any;
  abstract public(): any;
  abstract optional(): any;
  abstract nullable(): any;
  abstract nullish(): any;
  abstract required(): any;
  abstract notNull(): any;
  abstract notNullish(): any;
  /* c8 ignore next */
}

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
  const TOpts extends _.Flags = ["required", "notNull", "public"],
  const TShape extends { [key: string]: BorgType } = {
    [key: string]: BorgType;
  },
> extends BorgType<"object", TOpts, TShape> {
  #shape: TShape;
  #opts = {
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

  static #clone<const TBorg extends B.Object<any, any>>(borg: TBorg): TBorg {
    const newShape = {} as { [key: string]: BorgType };
    for (const key in borg.#shape) newShape[key] = borg.#shape[key]!.copy();
    const clone = new BorgObject(newShape);
    clone.#opts = { ...borg.#opts };
    return clone as any;
  }

  get meta(): Readonly<_.PrettyPrint<_.InferMeta<"object", TShape, TOpts>>> {
    return Object.freeze({
      kind: "object",
      shape: this.#shape,
      keys: Object.freeze(Object.keys(this.#shape)),
      requiredKeys: Object.freeze(
        Object.keys(this.#shape).filter(
          k => this.#shape[k]!.meta.optional === false,
        ),
      ),
      ...this.#opts,
    }) as any;
  }

  get bsonSchema() {
    return Object.freeze({
      bsonType: this.#opts.nullable
        ? Object.freeze(["object", "null"])
        : "object",
      required: Object.freeze([...this.meta.requiredKeys]),
      properties: Object.freeze(
        Object.fromEntries(
          Object.entries(this.#shape).map(([key, value]) => [
            key,
            value.bsonSchema(),
          ]),
        ),
      ),
    }) as _.BsonSchema<"object", [TOpts, TShape]>;
  }

  copy(): this {
    return BorgObject.#clone(this);
  }

  parse(
    input: unknown,
  ): _.Parsed<{ [k in keyof TShape]: B.Type<TShape[k]> }, TOpts> {
    if (input === undefined) {
      if (this.#opts.optional) return void 0 as any;
      throw new BorgError(
        `OBJECT_ERROR: Expected object${
          this.#opts.nullable ? " or null" : ""
        }, got undefined`,
      );
    }
    if (input === null) {
      if (this.#opts.nullable) return null as any;
      throw new BorgError(
        `OBJECT_ERROR: Expected object${
          this.#opts.optional ? " or undefined" : ""
        }, got null`,
      );
    }
    if (typeof input !== "object") {
      throw new BorgError(
        `OBJECT_ERROR: Expected object,${
          this.#opts.optional ? " or undefined," : ""
        }${this.#opts.nullable ? " or null," : ""} got ${typeof input}`,
      );
    }
    if (Array.isArray(input)) {
      throw new BorgError(
        `OBJECT_ERROR: Expected object,${
          this.#opts.optional ? " or undefined," : ""
        }${this.#opts.nullable ? " or null," : ""} got array`,
      );
    }
    const result = {} as any;
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
    return result;
  }

  serialize(
    input: B.Type<this>,
  ): _.Sanitized<{ [k in keyof TShape]: B.Serialized<TShape[k]> }, TOpts> {
    if (this.#opts.private) {
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

  deserialize(
    input: B.Serialized<this>,
  ): _.Sanitized<{ [k in keyof TShape]: B.Deserialized<TShape[k]> }, TOpts> {
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
  toBson<const TInput extends Partial<B.Type<this>> = B.Type<this>>(
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

  fromBson(input: B.BsonType<this>): B.Type<this> {
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

  optional(): BorgObject<_.MakeOptional<TOpts>, TShape> {
    const copy = this.copy();
    copy.#opts.optional = true;
    return copy as any;
  }

  nullable(): BorgObject<_.MakeNullable<TOpts>, TShape> {
    const clone = this.copy();
    clone.#opts.nullable = true;
    return clone as any;
  }

  nullish(): BorgObject<_.MakeNullish<TOpts>, TShape> {
    const clone = this.copy();
    clone.#opts.optional = true;
    clone.#opts.nullable = true;
    return clone as any;
  }

  required(): BorgObject<_.MakeRequired<TOpts>, TShape> {
    const clone = this.copy();
    clone.#opts.optional = false;
    return clone as any;
  }

  notNull(): BorgObject<_.MakeNotNull<TOpts>, TShape> {
    const clone = this.copy();
    clone.#opts.nullable = false;
    return clone as any;
  }

  notNullish(): BorgObject<_.MakeNotNullish<TOpts>, TShape> {
    const clone = this.copy();
    clone.#opts.optional = false;
    clone.#opts.nullable = false;
    return clone as any;
  }

  private(): BorgObject<_.MakePrivate<TOpts>, TShape> {
    const clone = this.copy();
    clone.#opts.private = true;
    return clone as any;
  }

  public(): BorgObject<_.MakePublic<TOpts>, TShape> {
    const clone = this.copy();
    clone.#opts.private = false;
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
  const TOpts extends _.Flags = ["required", "notNull", "public"],
  const TLength extends _.MinMax = [null, null],
  const TShape extends BorgType = BorgType,
> extends BorgType<"array", TOpts, TShape> {
  #shape: TShape;
  #opts = {
    optional: false,
    nullable: false,
    private: false,
  };
  #max: TLength[1] = null;
  #min: TLength[0] = null;

  constructor(shape: TShape) {
    super();
    this.#shape = shape.copy() as any;
  }

  static #clone<const TBorg extends B.Array<any, BorgType, any>>(
    borg: TBorg,
  ): TBorg {
    const clone = new BorgArray(borg.#shape.copy());
    clone.#opts = { ...borg.#opts };
    clone.#max = borg.#max;
    clone.#min = borg.#min;
    return clone as any;
  }

  get meta(): Readonly<_.PrettyPrint<_.InferMeta<"array", TShape, TOpts>>> {
    return Object.freeze({
      kind: "array",
      maxItems: this.#max,
      minItems: this.#min,
      shape: this.#shape,
      ...this.#opts,
    }) as any;
  }

  get bsonSchema() {
    return Object.freeze({
      bsonType: this.#opts.nullable
        ? Object.freeze(["array", "null"])
        : "array",
      items: this.#shape.bsonSchema(),
      ...(this.#max !== null && { maxItems: this.#max }),
      ...(this.#min !== null && { minItems: this.#min }),
    }) as _.BsonSchema<"array", [TOpts, TShape, TLength]>;
  }

  copy(): this {
    return BorgArray.#clone(this);
  }

  parse(input: unknown): _.Parsed<Array<B.Type<TShape>>, TOpts> {
    if (input === undefined) {
      if (this.#opts.optional) return void 0 as any;
      throw new BorgError(
        `ARRAY_ERROR: Expected array${
          this.#opts.nullable ? " or null" : ""
        }, got undefined`,
      );
    }
    if (input === null) {
      if (this.#opts.nullable) return null as any;
      throw new BorgError(
        `ARRAY_ERROR: Expected array${
          this.#opts.optional ? " or undefined" : ""
        }, got null`,
      );
    }
    if (!Array.isArray(input)) {
      throw new BorgError(
        `ARRAY_ERROR: Expected array,${
          this.#opts.optional ? " or undefined," : ""
        }${this.#opts.nullable ? " or null," : ""} got ${typeof input}`,
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
        const parsed = this.#shape.parse(input[i]);
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

  serialize(
    input: B.Type<this>,
  ): _.Sanitized<Array<B.Serialized<TShape>>, TOpts> {
    if (this.#opts.private) {
      throw new BorgError(
        "ARRAY_ERROR(serialize): Cannot serialize private schema",
      );
    }
    if (input === null || input === undefined) return input as any;
    const result = new Array(input.length) as any;
    for (let i = 0; i < input.length; i++) {
      result[i] = this.#shape.serialize(input[i]);
    }
    return result;
  }

  deserialize(
    input: B.Serialized<this>,
  ): _.Sanitized<Array<B.Deserialized<TShape>>, TOpts> {
    if (input === null || input === undefined) return input as any;
    const result = new Array(input.length) as any;
    for (let i = 0; i < input.length; i++) {
      result[i] = this.#shape.deserialize(input[i]);
    }
    return result;
  }

  toBson(input: B.Type<this>): Array<B.BsonType<TShape>> {
    if (input === null || input === undefined) return input as any;
    const result = new Array(input.length) as any;
    for (let i = 0; i < input.length; i++) {
      result[i] = this.#shape.toBson(input[i]);
    }
    return result;
  }

  fromBson(input: B.BsonType<this>): B.Type<this> {
    if (input === null || input === undefined) return input as any;
    const result = new Array(input.length) as any;
    for (let i = 0; i < input.length; i++) {
      result[i] = this.#shape.fromBson(input[i]);
    }
    return result;
  }

  optional(): BorgArray<_.MakeOptional<TOpts>, TLength, TShape> {
    const clone = this.copy();
    clone.#opts.optional = true;
    return clone as any;
  }

  nullable(): BorgArray<_.MakeNullable<TOpts>, TLength, TShape> {
    const clone = this.copy();
    clone.#opts.nullable = true;
    return clone as any;
  }

  nullish(): BorgArray<_.MakeNullish<TOpts>, TLength, TShape> {
    const clone = this.copy();
    clone.#opts.nullable = true;
    clone.#opts.optional = true;
    return clone as any;
  }

  required(): BorgArray<_.MakeRequired<TOpts>, TLength, TShape> {
    const clone = this.copy();
    clone.#opts.optional = false;
    return clone as any;
  }

  notNull(): BorgArray<_.MakeNotNull<TOpts>, TLength, TShape> {
    const clone = this.copy();
    clone.#opts.nullable = false;
    return clone as any;
  }

  notNullish(): BorgArray<_.MakeNotNullish<TOpts>, TLength, TShape> {
    const clone = this.copy();
    clone.#opts.nullable = false;
    clone.#opts.optional = false;
    return clone as any;
  }

  private(): BorgArray<_.MakePrivate<TOpts>, TLength, TShape> {
    const clone = this.copy();
    clone.#opts.private = true;
    return clone as any;
  }

  public(): BorgArray<_.MakePublic<TOpts>, TLength, TShape> {
    const clone = this.copy();
    clone.#opts.private = false;
    return clone as any;
  }

  minLength<const N extends number>(
    length: N,
  ): BorgArray<TOpts, [N, TLength[1]], TShape> {
    const clone = this.copy();
    clone.#min = length;
    return clone as any;
  }

  maxLength<const N extends number>(
    length: N,
  ): BorgArray<TOpts, [TLength[0], N], TShape> {
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
  length<const N extends number>(length: N): BorgArray<TOpts, [N, N], TShape>;
  length<const Min extends number, const Max extends number = Min>(
    minLength: Min,
    maxLength?: Max,
  ): BorgArray<TOpts, [Min, Max], TShape> {
    const clone = this.copy();
    clone.#min = minLength;
    clone.#max = maxLength ?? minLength;
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
  const TOpts extends _.Flags = ["required", "notNull", "public"],
  const TLength extends _.MinMax = [null, null],
  const TPattern extends string = ".*",
> extends BorgType<"string", TOpts> {
  #opts = {
    optional: false,
    nullable: false,
    private: false,
  };
  #min: TLength[0] = null;
  #max: TLength[1] = null;
  #regex: RegExp | undefined = undefined;

  constructor() {
    super();
  }

  static #clone<const TBorg extends B.String<any, any, any>>(
    borg: TBorg,
  ): TBorg {
    const clone = new BorgString();
    clone.#opts = { ...borg.#opts };
    clone.#min = borg.#min;
    clone.#max = borg.#max;
    clone.#regex = borg.#regex ? new RegExp(borg.#regex) : undefined;
    return clone as any;
  }

  get meta(): Readonly<
    _.PrettyPrint<
      {
        kind: "string";
        maxLength: TLength[1];
        minLength: TLength[0];
        pattern: ".*" extends TPattern ? undefined : TPattern;
        regex: ".*" extends TPattern ? undefined : RegExp;
      } & _.InferOpts<TOpts>
    >
  > {
    return Object.freeze({
      ...this.#opts,
      kind: "string",
      maxLength: this.#max,
      minLength: this.#min,
      pattern: this.#regex?.source,
      regex: this.#regex ? Object.freeze(new RegExp(this.#regex)) : undefined,
    }) as any;
  }

  get bsonSchema() {
    return Object.freeze({
      bsonType: this.#opts.nullable
        ? Object.freeze(["string", "null"])
        : "string",
      ...(this.#min !== null ? { minLength: this.#min } : {}),
      ...(this.#max !== null ? { maxLength: this.#max } : {}),
      ...(this.#regex ? { pattern: this.#regex.source } : {}),
    }) as _.BsonSchema<"string", [TOpts, TLength, TPattern]>;
  }

  copy(): this {
    return BorgString.#clone(this);
  }

  parse(input: unknown): _.Parsed<string, TOpts> {
    if (input === undefined) {
      if (this.#opts.optional) return void 0 as any;
      throw new BorgError(
        `STRING_ERROR: Expected string${
          this.#opts.nullable ? " or null" : ""
        }, got undefined`,
      );
    }
    if (input === null) {
      if (this.#opts.nullable) return null as any;
      throw new BorgError(
        `STRING_ERROR: Expected string${
          this.#opts.optional ? " or undefined" : ""
        }, got null`,
      );
    }
    if (typeof input !== "string") {
      throw new BorgError(
        `STRING_ERROR: Expected string,${
          this.#opts.optional ? " or undefined," : ""
        }${this.#opts.nullable ? " or null," : ""} got ${typeof input}`,
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
    if (this.#regex !== undefined && !this.#regex.test(input)) {
      throw new BorgError(
        `STRING_ERROR: Expected string to match pattern ${
          this.#regex.source
        }, got ${input}`,
      );
    }
    return input as any;
  }

  serialize(input: B.Type<this>): _.Sanitized<B.Type<this>, TOpts> {
    if (this.#opts.private) {
      throw new BorgError(
        `STRING_ERROR: Cannot serialize private string field ${input}`,
      );
    }
    return input as any;
  }

  deserialize(input: B.Serialized<this>): _.Sanitized<B.Type<this>, TOpts> {
    return input as any;
  }

  toBson(input: B.Type<this>) {
    return input;
  }

  fromBson(input: B.BsonType<this>) {
    return input;
  }

  optional(): BorgString<_.MakeOptional<TOpts>, TLength, TPattern> {
    const clone = this.copy();
    clone.#opts.optional = true;
    return clone as any;
  }

  nullable(): BorgString<_.MakeNullable<TOpts>, TLength, TPattern> {
    const clone = this.copy();
    clone.#opts.nullable = true;
    return clone as any;
  }

  nullish(): BorgString<_.MakeNullish<TOpts>, TLength, TPattern> {
    const clone = this.copy();
    clone.#opts.optional = true;
    clone.#opts.nullable = true;
    return clone as any;
  }

  required(): BorgString<_.MakeRequired<TOpts>, TLength, TPattern> {
    const clone = this.copy();
    clone.#opts.optional = false;
    return clone as any;
  }

  notNull(): BorgString<_.MakeNotNull<TOpts>, TLength, TPattern> {
    const clone = this.copy();
    clone.#opts.nullable = false;
    return clone as any;
  }

  notNullish(): BorgString<_.MakeNotNullish<TOpts>, TLength, TPattern> {
    const clone = this.copy();
    clone.#opts.optional = false;
    clone.#opts.nullable = false;
    return clone as any;
  }

  private(): BorgString<_.MakePrivate<TOpts>, TLength, TPattern> {
    const clone = this.copy();
    clone.#opts.private = true;
    return clone as any;
  }

  public(): BorgString<_.MakePublic<TOpts>, TLength, TPattern> {
    const clone = this.copy();
    clone.#opts.private = false;
    return clone as any;
  }

  minLength<const N extends number>(
    length: N,
  ): BorgString<TOpts, [N, TLength[1]], TPattern> {
    const clone = this.copy();
    clone.#min = length;
    return clone as any;
  }

  maxLength<const N extends number>(
    length: N,
  ): BorgString<TOpts, [TLength[0], N], TPattern> {
    const clone = this.copy();
    clone.#max = length;
    return clone as any;
  }

  length<const N extends number>(length: N): BorgString<TOpts, [N, N]>;
  length<const Min extends number, const Max extends number = Min>(
    minLength: Min,
    maxLength?: Max,
  ): BorgString<TOpts, [Min, Max]> {
    const clone = this.copy();
    clone.#min = minLength;
    clone.#max = maxLength ?? minLength;
    return clone as any;
  }

  /**
   * @IMPORTANT RegExp flags are not supported, except for the "u" flag which is always set.
   * @param pattern a string that will be used as the source for a new RegExp
   */
  pattern<const S extends string>(pattern: S): BorgString<TOpts, TLength, S> {
    const clone = this.copy();
    clone.#regex = new RegExp(pattern, "u");
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
  const TOpts extends _.Flags = ["required", "notNull", "public"],
  const TLength extends _.MinMax = [null, null],
> extends BorgType<"number", TOpts> {
  #opts = {
    optional: false,
    nullable: false,
    private: false,
  };
  #min: TLength[0] = null;
  #max: TLength[1] = null;

  constructor() {
    super();
  }

  static #clone<const TBorg extends B.Number<any, any>>(borg: TBorg): TBorg {
    const clone = new BorgNumber();
    clone.#opts = { ...borg.#opts };
    clone.#min = borg.#min;
    clone.#max = borg.#max;
    return clone as any;
  }

  get meta(): Readonly<
    _.PrettyPrint<
      {
        kind: "number";
        max: TLength[1];
        min: TLength[0];
      } & _.InferOpts<TOpts>
    >
  > {
    return Object.freeze({
      kind: "number",
      max: this.#max,
      min: this.#min,
      ...this.#opts,
    }) as any;
  }

  get bsonSchema() {
    return Object.freeze({
      bsonType: this.#opts.nullable
        ? Object.freeze(["double", "null"])
        : "double",
      ...(this.#min !== null && { minimum: this.#min }),
      ...(this.#max !== null && { maximum: this.#max }),
    }) as _.BsonSchema<"number", [TOpts, TLength]>;
  }

  copy(): this {
    return BorgNumber.#clone(this);
  }

  parse(input: unknown): _.Parsed<number, TOpts> {
    if (input === undefined) {
      if (this.#opts.optional) return void 0 as any;
      throw new BorgError(
        `NUMBER_ERROR: Expected number${
          this.#opts.nullable ? " or null" : ""
        }, got undefined`,
      );
    }
    if (input === null) {
      if (this.#opts.nullable) return null as any;
      throw new BorgError(
        `NUMBER_ERROR: Expected number${
          this.#opts.optional ? " or undefined" : ""
        }, got null`,
      );
    }
    if (typeof input !== "number") {
      throw new BorgError(
        `NUMBER_ERROR: Expected number,${
          this.#opts.optional ? " or undefined," : ""
        }${this.#opts.nullable ? " or null," : ""} got ${typeof input}`,
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

  serialize(input: B.Type<this>): _.Sanitized<B.Type<this>, TOpts> {
    if (this.#opts.private) {
      throw new BorgError(
        `NUMBER_ERROR: Cannot serialize private number field ${input}`,
      );
    }
    return input as any;
  }

  deserialize(input: B.Serialized<this>): _.Sanitized<B.Type<this>, TOpts> {
    return input as any;
  }

  toBson(input: B.Type<this>): _.Parsed<Double, TOpts> {
    return typeof input === "number" ? new Double(input) : (input as any);
  }

  fromBson(input: B.BsonType<this>): B.Type<this> {
    return (input && "valueOf" in input ? input.valueOf() : input) as any;
  }

  optional(): BorgNumber<_.MakeOptional<TOpts>, TLength> {
    const clone = this.copy();
    clone.#opts.optional = true;
    return clone as any;
  }

  nullable(): BorgNumber<_.MakeNullable<TOpts>, TLength> {
    const clone = this.copy();
    clone.#opts.nullable = true;
    return clone as any;
  }

  nullish(): BorgNumber<_.MakeNullish<TOpts>, TLength> {
    const clone = this.copy();
    clone.#opts.optional = true;
    clone.#opts.nullable = true;
    return clone as any;
  }

  required(): BorgNumber<_.MakeRequired<TOpts>, TLength> {
    const clone = this.copy();
    clone.#opts.optional = false;
    return clone as any;
  }

  notNull(): BorgNumber<_.MakeNotNull<TOpts>, TLength> {
    const clone = this.copy();
    clone.#opts.nullable = false;
    return clone as any;
  }

  notNullish(): BorgNumber<_.MakeNotNullish<TOpts>, TLength> {
    const clone = this.copy();
    clone.#opts.optional = false;
    clone.#opts.nullable = false;
    return clone as any;
  }

  private(): BorgNumber<_.MakePrivate<TOpts>, TLength> {
    const clone = this.copy();
    clone.#opts.private = true;
    return clone as any;
  }

  public(): BorgNumber<_.MakePublic<TOpts>, TLength> {
    const clone = this.copy();
    clone.#opts.private = false;
    return clone as any;
  }
  /*TODO:
  If max is set, and min is then set to a value greater than max,
  remove max. If min is set, and max is then set to a value less than
  min, remove min.
  */
  min<const N extends number>(min: N): BorgNumber<TOpts, [N, TLength[1]]> {
    const clone = this.copy();
    clone.#min = min;
    return clone as any;
  }

  max<const N extends number>(max: N): BorgNumber<TOpts, [TLength[0], N]> {
    const clone = this.copy();
    clone.#max = max;
    return clone as any;
  }
  /**
   * Inclusive range
   */
  range<const N extends number, const M extends number>(
    min: N,
    max: M,
  ): BorgNumber<TOpts, [N, M]> {
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
  const TOpts extends _.Flags = ["required", "notNull", "public"],
> extends BorgType<"boolean", TOpts> {
  #opts = {
    optional: false,
    nullable: false,
    private: false,
  };

  constructor() {
    super();
  }

  static #clone<const TBorg extends B.Boolean<any>>(borg: TBorg): TBorg {
    const clone = new BorgBoolean();
    clone.#opts = { ...borg.#opts };
    return clone as any;
  }

  get meta(): Readonly<
    _.PrettyPrint<_.InferOpts<TOpts> & { kind: "boolean" }>
  > {
    return Object.freeze({
      kind: "boolean",
      ...this.#opts,
    }) as any;
  }

  get bsonSchema() {
    return Object.freeze({
      bsonType: this.#opts.nullable ? Object.freeze(["bool", "null"]) : "bool",
    }) as _.BsonSchema<"boolean", [TOpts]>;
  }

  copy(): this {
    return BorgBoolean.#clone(this);
  }

  parse(input: unknown): _.Parsed<boolean, TOpts> {
    if (input === undefined) {
      if (this.#opts.optional) return void 0 as any;
      throw new BorgError(
        `BOOLEAN_ERROR: Expected boolean${
          this.#opts.nullable ? " or null" : ""
        }, got undefined`,
      );
    }
    if (input === null) {
      if (this.#opts.nullable) return null as any;
      throw new BorgError(
        `BOOLEAN_ERROR: Expected boolean${
          this.#opts.optional ? " or undefined" : ""
        }, got null`,
      );
    }
    if (typeof input !== "boolean") {
      throw new BorgError(
        `BOOLEAN_ERROR: Expected boolean,${
          this.#opts.optional ? " or undefined," : ""
        }${this.#opts.nullable ? " or null," : ""} got ${typeof input}`,
      );
    }
    return input as any;
  }

  serialize(input: B.Type<this>): _.Sanitized<B.Type<this>, TOpts> {
    if (this.#opts.private) {
      throw new BorgError(
        `BOOLEAN_ERROR: Cannot serialize private boolean field`,
      );
    }
    return input as any;
  }

  deserialize(input: B.Serialized<this>): _.Sanitized<B.Type<this>, TOpts> {
    return input as any;
  }

  toBson(input: B.Type<this>): _.Parsed<boolean, TOpts> {
    return input as any;
  }

  fromBson(input: B.BsonType<this>): B.Type<this> {
    return input;
  }

  optional(): BorgBoolean<_.MakeOptional<TOpts>> {
    const clone = this.copy();
    clone.#opts.optional = true;
    return clone as any;
  }

  nullable(): BorgBoolean<_.MakeNullable<TOpts>> {
    const clone = this.copy();
    clone.#opts.nullable = true;
    return clone as any;
  }

  nullish(): BorgBoolean<_.MakeNullish<TOpts>> {
    const clone = this.copy();
    clone.#opts.optional = true;
    clone.#opts.nullable = true;
    return clone as any;
  }

  required(): BorgBoolean<_.MakeRequired<TOpts>> {
    const clone = this.copy();
    clone.#opts.optional = false;
    return clone as any;
  }

  notNull(): BorgBoolean<_.MakeNotNull<TOpts>> {
    const clone = this.copy();
    clone.#opts.nullable = false;
    return clone as any;
  }

  notNullish(): BorgBoolean<_.MakeNotNullish<TOpts>> {
    const clone = this.copy();
    clone.#opts.optional = false;
    clone.#opts.nullable = false;
    return clone as any;
  }

  private(): BorgBoolean<_.MakePrivate<TOpts>> {
    const clone = this.copy();
    clone.#opts.private = true;
    return clone as any;
  }

  public(): BorgBoolean<_.MakePublic<TOpts>> {
    const clone = this.copy();
    clone.#opts.private = false;
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
  const TOpts extends _.Flags = ["required", "notNull", "public"],
  const TFormat extends string | ObjectId = string,
> extends BorgType<"id", TOpts> {
  #opts = {
    optional: false,
    nullable: false,
    private: false,
  };
  #format = true;

  constructor() {
    super();
  }

  static #clone<const TBorg extends B.Id<any, any>>(borg: TBorg): TBorg {
    const clone = new BorgId();
    clone.#opts = { ...borg.#opts };
    clone.#format = borg.#format;
    return clone as any;
  }

  static isObjectIdLike(input: unknown): input is ObjectIdLike {
    if (typeof input !== "object" || input === null) return false;
    return (
      "toHexString" in input &&
      "id" in input &&
      typeof input.toHexString === "function" &&
      (typeof input.id === "string" || input.id instanceof Uint8Array)
    );
  }

  get meta(): Readonly<
    _.PrettyPrint<
      _.InferOpts<TOpts> & {
        kind: "id";
        format: ObjectId extends TFormat ? "oid" : "string";
      }
    >
  > {
    return Object.freeze({
      kind: "id",
      format: this.#format ? "string" : "oid",
      ...this.#opts,
    }) as any;
  }

  get bsonSchema() {
    return Object.freeze({
      bsonType: this.#opts.nullable
        ? Object.freeze(["null", "objectId"])
        : "objectId",
    }) as _.BsonSchema<"id", [TOpts]>;
  }

  copy(): this {
    return BorgId.#clone(this);
  }

  parse(input: unknown): _.Parsed<TFormat, TOpts> {
    if (input === undefined) {
      if (this.#opts.optional) return void 0 as any;
      throw new BorgError(
        `ID_ERROR: Expected valid ObjectId${
          this.#opts.nullable ? " or null" : ""
        }, got undefined`,
      );
    }
    if (input === null) {
      if (this.#opts.nullable) return null as any;
      throw new BorgError(
        `ID_ERROR: Expected valid ObjectId${
          this.#opts.optional ? " or undefined" : ""
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
        this.#opts.optional ? " or undefined," : ""
      }${this.#opts.nullable ? " or null," : ""} got ${typeof input}`,
    );
  }

  serialize(input: B.Type<this>): _.Sanitized<string, TOpts> {
    if (this.#opts.private) {
      throw new BorgError(`ID_ERROR: Cannot serialize private ID field`);
    }
    if (input === undefined || input === null) return input as any;
    if (typeof input === "string") return input as any;
    return input.toHexString() as any;
  }

  deserialize(input: B.Serialized<this>): _.Sanitized<B.Type<this>, TOpts> {
    if (input === undefined || input === null) return input as any;
    if (this.#format) return input as any;
    return ObjectId.createFromHexString(input) as any;
  }

  toBson(input: B.Type<this>): _.Parsed<ObjectId, TOpts> {
    if (input === undefined || input === null) return input as any;
    if (input instanceof ObjectId) return input as any;
    return ObjectId.createFromHexString(input) as any;
  }

  fromBson(input: B.BsonType<this>): B.Type<this> {
    if (input === undefined || input === null) return input as any;
    if (!this.#format) return input as any;
    return input.toHexString() as any;
  }

  optional(): BorgId<_.MakeOptional<TOpts>, TFormat> {
    const clone = this.copy();
    clone.#opts.optional = true;
    return clone as any;
  }

  nullable(): BorgId<_.MakeNullable<TOpts>, TFormat> {
    const clone = this.copy();
    clone.#opts.nullable = true;
    return clone as any;
  }

  nullish(): BorgId<_.MakeNullish<TOpts>, TFormat> {
    const clone = this.copy();
    clone.#opts.optional = true;
    clone.#opts.nullable = true;
    return clone as any;
  }

  required(): BorgId<_.MakeRequired<TOpts>, TFormat> {
    const clone = this.copy();
    clone.#opts.optional = false;
    return clone as any;
  }

  notNull(): BorgId<_.MakeNotNull<TOpts>, TFormat> {
    const clone = this.copy();
    clone.#opts.nullable = false;
    return clone as any;
  }

  notNullish(): BorgId<_.MakeNotNullish<TOpts>, TFormat> {
    const clone = this.copy();
    clone.#opts.optional = false;
    clone.#opts.nullable = false;
    return clone as any;
  }

  private(): BorgId<_.MakePrivate<TOpts>, TFormat> {
    const clone = this.copy();
    clone.#opts.private = true;
    return clone as any;
  }

  public(): BorgId<_.MakePublic<TOpts>, TFormat> {
    const clone = this.copy();
    clone.#opts.private = false;
    return clone as any;
  }

  asString(): BorgId<TOpts, string> {
    const clone = this.copy();
    clone.#format = true as any;
    return clone as any;
  }

  asObjectId(): BorgId<TOpts, ObjectId> {
    const clone = this.copy();
    clone.#format = false as any;
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
  array: <T extends BorgType>(item: T) => new BorgArray(item),
  object: <T extends { [key: string]: BorgType }>(shape: T) =>
    new BorgObject(shape),
  model: makeBorg,
};

declare module B {
  export type Boolean<TOpts extends _.Flags = _.Flags> = BorgBoolean<TOpts>;

  export type Id<
    TOpts extends _.Flags = _.Flags,
    TFormat extends "string" | "oid" = "string" | "oid",
  > = BorgId<TOpts, TFormat>;

  export type Number<
    TOpts extends _.Flags = _.Flags,
    TLength extends _.MinMax = _.MinMax,
  > = BorgNumber<TOpts, TLength>;

  export type String<
    TOpts extends _.Flags = _.Flags,
    TLength extends _.MinMax = _.MinMax,
    TPattern extends string = string,
  > = BorgString<TOpts, TLength, TPattern>;

  export type Array<
    TOpts extends _.Flags = _.Flags,
    TItems extends B.Borg = B.Borg,
    TLength extends _.MinMax = _.MinMax,
  > = BorgArray<TOpts, TLength, TItems>;

  export type Object<
    TOpts extends _.Flags = _.Flags,
    TShape extends { [key: string]: Borg } = { [key: string]: Borg },
  > = BorgObject<TOpts, TShape>;

  export type Borg<
    TOptions extends _.Flags = _.Flags,
    TKind extends _.AnyKind = _.AnyKind,
  > = BorgType<TKind, TOptions>;

  export type AnyBorg = _.AnyBorg;
  export type Type<T extends Borg> = _.Type<T>;
  export type BsonType<T extends Borg> = _.BsonType<T>;
  export type Serialized<T extends Borg> = _.Serialized<T>;
  export type Deserialized<T extends Borg> = _.Deserialized<T>;
}

export default B;

//@ts-expect-error - vitest handles import.meta
if (import.meta.vitest) {
  // @ts-expect-error - vitest handles the top level await
  const { it } = await import("vitest");
  it("should do nothing", () => {});
}