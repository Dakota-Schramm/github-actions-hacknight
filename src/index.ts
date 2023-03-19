import {
  TypeOptions,
  InferOpts,
  ApplyOpts,
  MinMax,
  MakeNotNull,
  MakeNotNullish,
  MakeNullable,
  MakeNullish,
  MakeOptional,
  MakeRequired,
  MakePrivate,
  MakePublic,
  BuildStringBsonSchemaLiteral,
  BuildObjectBsonSchemaLiteral,
  BuildNumberBsonSchemaLiteral,
  BuildBooleanBsonSchemaLiteral,
  BuildOidBsonSchemaLiteral,
  BuildArrayBsonSchemaLiteral,
  AnyKind,
  InferMeta,
  BorgModel,
  SomeBorg,
  PrettyPrint,
} from "./types";
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
  #path: string[] = [];

  constructor(message: string, cause?: T, path?: string[]) {
    super(`${message}`);
    this.#path = [...(path || []), ...(cause?.path || [])];
    this.message = `${message} at "${this.#path.join(".") || "{ROOT}"}"${
      cause?.message ? `: ${cause.message}` : ""
    }`;
    if (cause) {
      this.stack = `${this.stack} caused by ${cause.stack}`;
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
  const TKind extends AnyKind = AnyKind,
  const TOpts extends TypeOptions = TypeOptions,
  const TShape extends TKind extends "object"
    ? { [key: string]: BorgType }
    : TKind extends "array"
    ? BorgType
    : never = TKind extends "object"
    ? { [key: string]: B.Borg }
    : TKind extends "array"
    ? B.Borg
    : never,
> {
  abstract get meta(): PrettyPrint<InferMeta<TKind, TShape, TOpts>>;
  abstract copy(): BorgType<TKind, TOpts, TShape>;
  abstract parse(input: unknown): any;
  abstract serialize(input: any): any;
  abstract deserialize(input: any): any;
  abstract toBson(input: any): any;
  abstract fromBson(input: any): any;
  abstract bsonSchema(): any;
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
  const TOpts extends TypeOptions = "required, notNull, public",
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

  static #clone<TBorg extends B.Object>(borg: TBorg): TBorg {
    const newShape = {} as { [key: string]: BorgType };
    for (const key in borg.#shape) newShape[key] = borg.#shape[key]!.copy();
    const clone = new BorgObject(newShape);
    clone.#opts = { ...borg.#opts };
    return clone as any;
  }

  copy(): this {
    return BorgObject.#clone(this as any);
  }

  get meta(): PrettyPrint<InferMeta<"object", TShape, TOpts>> {
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

  parse(
    input: unknown,
  ): InferOpts<TOpts>["private"] extends true
    ? typeof privateSymbol
    : ApplyOpts<
        { [key in keyof TShape]: ReturnType<TShape[key]["parse"]> },
        TOpts
      > {
    if (this.#opts.private) {
      return privateSymbol as never;
    }
    if (input === undefined) {
      if (this.#opts.optional) return void 0 as any;
      throw new BorgError(
        `OBJECT_ERROR: Expected object ${
          this.#opts.nullable ? "or null" : ""
        }, got undefined`,
      );
    }
    if (input === null) {
      if (this.#opts.nullable) return null as any;
      throw new BorgError(
        `OBJECT_ERROR: Expected object ${
          this.#opts.optional ? "or undefined" : ""
        }, got null`,
      );
    }
    if (typeof input !== "object") {
      throw new BorgError(
        `OBJECT_ERROR: Expected object ${
          this.#opts.optional ? "or undefined" : ""
        }${this.#opts.nullable ? " or null" : ""}, got ${typeof input}`,
      );
    }
    if (Array.isArray(input)) {
      throw new BorgError(
        `OBJECT_ERROR: Expected object ${
          this.#opts.optional ? "or undefined" : ""
        }${this.#opts.nullable ? " or null" : ""}, got array`,
      );
    }
    const result: { [key: string]: any } = {};

    for (const key in this.#shape) {
      const schema = this.#shape[key];
      if (schema === undefined) continue;
      if (key in input) {
        let parsed: any;
        try {
          parsed = schema.parse(input[key as keyof typeof input]);
        } catch (e) {
          if (e instanceof BorgError) {
            throw new BorgError(
              `OBJECT_ERROR: Error parsing property "${key}"`,
              e,
              [key],
            );
          }
          throw e;
        }
        if (parsed !== privateSymbol) {
          result[key] = parsed;
        }
        continue;
      }

      //TODO: implement 'exactOptional' by providing a config flag somewhere?
      try {
        console.log(JSON.stringify(schema.bsonSchema(), undefined, 2));
        schema.parse(undefined);
      } catch (e) {
        if (e instanceof BorgError) {
          throw new BorgError(`OBJECT_ERROR: Missing property "${key}"`, e, [
            key,
          ]);
        }
        throw e;
      }
    }
    return result as any;
  }

  serialize(input: ReturnType<this["parse"]>): ApplyOpts<
    {
      [key in keyof TShape]: (typeof input)[key extends keyof typeof input
        ? key
        : never] extends typeof privateSymbol
        ? never
        : ReturnType<TShape[key]["serialize"]>;
    },
    TOpts
  > {
    if (this.#opts.private || input === privateSymbol)
      throw new Error("Cannot serialize private data");
    if (input === null || input === undefined) return input as any;

    const result = {} as any;
    for (const key in this.#shape) {
      if (!(key in input)) continue;
      const inputVal = input[key];
      if (inputVal === privateSymbol) continue;
      const schema = this.#shape[key];
      if (schema === undefined) continue;
      const serialized = schema.serialize(inputVal);
      result[key] = serialized;
    }
    return result;
  }

  deserialize(input: ReturnType<this["serialize"]>): ReturnType<this["parse"]> {
    if (input === null) return null as any;
    if (input === undefined) return undefined as any;
    const result = {} as any;
    for (const key in this.#shape) {
      if (!(key in input)) continue;
      const inputVal = input[key];
      if (inputVal === privateSymbol) continue;
      const schema = this.#shape[key];
      if (schema === undefined) continue;
      const deserialized = schema.deserialize(inputVal);
      result[key] = deserialized;
    }
    return result;
  }

  bsonSchema() {
    return {
      bsonType: this.#opts.nullable ? ["object", "null"] : "object",
      required: Object.keys(this.#shape).filter(key => {
        try {
          this.#shape[key]?.parse(undefined);
        } catch (e) {
          return true;
        }
        return false;
      }),
      properties: Object.fromEntries(
        Object.entries(this.#shape).map(([key, value]) => [
          key,
          value.bsonSchema(),
        ]),
      ),
    } as BuildObjectBsonSchemaLiteral<TShape, TOpts>;
  }

  toBson(input: ReturnType<this["parse"]>): ApplyOpts<
    {
      [key in keyof TShape]: (typeof input)[key extends keyof typeof input
        ? key
        : never] extends never
        ? never
        : ReturnType<TShape[key]["toBson"]>;
    },
    TOpts
  > {
    if (input === null) return null as any;
    if (input === undefined) return undefined as any;
    const result = {} as any;
    for (const key in this.#shape) {
      if (!(key in input)) continue;
      const schema = this.#shape[key];
      // @ts-expect-error - this is a hack to get around the fact that TS doesn't know that the key is in the input
      const bson = schema.toBson(input[key]);
      result[key] = bson;
    }
    return result;
  }

  fromBson(input: ReturnType<this["toBson"]>): ReturnType<this["parse"]> {
    if (input === null) return null as any;
    if (input === undefined) return undefined as any;
    const result = {} as any;
    for (const key in this.#shape) {
      if (!(key in input)) continue;
      const schema = this.#shape[key];
      // @ts-expect-error - this is a hack to get around the fact that TS doesn't know that the key is in the input
      const bson = schema.fromBson(input[key]);
      result[key] = bson;
    }
    return result;
  }

  optional(): BorgObject<MakeOptional<TOpts>, TShape> {
    const copy = this.copy();
    copy.#opts.optional = true;
    return copy as any;
  }

  nullable(): BorgObject<MakeNullable<TOpts>, TShape> {
    const clone = this.copy();
    clone.#opts.nullable = true;
    return clone as any;
  }

  nullish(): BorgObject<MakeNullish<TOpts>, TShape> {
    const clone = this.copy();
    clone.#opts.optional = true;
    clone.#opts.nullable = true;
    return clone as any;
  }

  required(): BorgObject<MakeRequired<TOpts>, TShape> {
    const clone = this.copy();
    clone.#opts.optional = false;
    return clone as any;
  }

  notNull(): BorgObject<MakeNotNull<TOpts>, TShape> {
    const clone = this.copy();
    clone.#opts.nullable = false;
    return clone as any;
  }

  notNullish(): BorgObject<MakeNotNullish<TOpts>, TShape> {
    const clone = this.copy();
    clone.#opts.optional = false;
    clone.#opts.nullable = false;
    return clone as any;
  }

  private(): BorgObject<MakePrivate<TOpts>, TShape> {
    const clone = this.copy();
    clone.#opts.private = true;
    return clone as any;
  }

  public(): BorgObject<MakePublic<TOpts>, TShape> {
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
  const TOpts extends TypeOptions = "required, notNull, public",
  const TLength extends MinMax = [null, null],
  const TShape extends BorgType = BorgType,
> extends BorgType<"array", TOpts, TShape> {
  #opts = {
    optional: false,
    nullable: false,
    private: false,
  };
  #shape: TShape;
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

  copy(): this {
    return BorgArray.#clone(this);
  }

  get meta(): PrettyPrint<InferMeta<"array", TShape, TOpts>> {
    return Object.freeze({
      kind: "array",
      maxItems: this.#max,
      minItems: this.#min,
      shape: this.#shape,
      ...this.#opts,
    }) as any;
  }

  parse(
    input: unknown,
  ): InferOpts<TOpts>["private"] extends true
    ? typeof privateSymbol
    : ApplyOpts<Array<ReturnType<TShape["parse"]>>, TOpts> {
    if (input === null) {
      if (this.#opts.nullable) return null as any;
      throw new Error("Expected array, got null");
    }
    if (input === undefined) {
      if (this.#opts.optional) return undefined as any;
      throw new Error("Expected array, got undefined");
    }
    if (!Array.isArray(input)) {
      throw new Error("Expected array, got " + typeof input);
    }
    if (this.#max !== null && input.length > this.#max) {
      throw new Error(
        `Expected array length to be less than or equal to ${this.#max}, got ${
          input.length
        }`,
      );
    }
    if (this.#min !== null && input.length < this.#min) {
      throw new Error(
        `Expected array length to be greater than or equal to ${
          this.#min
        }, got ${input.length}`,
      );
    }
    const result = [] as any;
    for (let i = 0; i < input.length; i++) {
      const item = input[i];
      const parsed = this.#shape.parse(item);
      if (parsed === privateSymbol) continue;
      result[i] = parsed;
    }
    return result as any;
  }

  bsonSchema(): BuildArrayBsonSchemaLiteral<
    TShape,
    TOpts,
    TLength[0],
    TLength[1]
  > {
    return {
      bsonType: this.#opts.nullable ? ["array", "null"] : "array",
      items: this.#shape.bsonSchema(),
      ...(this.#max !== null && { maxItems: this.#max }),
      ...(this.#min !== null && { minItems: this.#min }),
    } as any;
  }

  toBson(
    input: ApplyOpts<ReturnType<this["parse"]>, TOpts>,
  ): ApplyOpts<Array<ReturnType<TShape["toBson"]>>, TOpts> {
    if (input === null) return null as any;
    if (input === undefined) return undefined as any;
    const result = [] as any;
    for (let i = 0; i < (input as any[]).length; i++) {
      const item = (input as any[])[i];
      const bson = this.#shape.toBson(item);
      result[i] = bson;
    }
    return result as any;
  }

  fromBson(
    input: ApplyOpts<ReturnType<this["parse"]>, TOpts>,
  ): ApplyOpts<Array<ReturnType<TShape["fromBson"]>>, TOpts> {
    if (input === null) return null as any;
    if (input === undefined) return undefined as any;
    const result = [] as any;
    for (let i = 0; i < (input as any[]).length; i++) {
      const item = (input as any[])[i];
      const bson = this.#shape.fromBson(item);
      result[i] = bson;
    }
    return result as any;
  }

  serialize(
    input: ApplyOpts<ReturnType<this["parse"]>, TOpts>,
  ): ApplyOpts<Array<ReturnType<TShape["serialize"]>>, TOpts> {
    if (input === null) return null as any;
    if (input === undefined) return undefined as any;
    const result = [] as any;
    for (let i = 0; i < (input as any[]).length; i++) {
      const item = (input as any[])[i];
      const serialized = this.#shape.serialize(item);
      result[i] = serialized;
    }
    return result as any;
  }

  deserialize(
    input: ApplyOpts<ReturnType<this["serialize"]>, TOpts>,
  ): ApplyOpts<Array<ReturnType<TShape["parse"]>>, TOpts> {
    if (input === null) return null as any;
    if (input === undefined) return undefined as any;
    const result = [] as any;
    for (let i = 0; i < (input as any[]).length; i++) {
      const item = (input as any[])[i];
      const deserialized = this.#shape.deserialize(item);
      result[i] = deserialized;
    }
    return result as any;
  }

  optional(): BorgArray<MakeOptional<TOpts>, TLength, TShape> {
    const clone = this.copy();
    clone.#opts.optional = true;
    return clone as any;
  }

  nullable(): BorgArray<MakeNullable<TOpts>, TLength, TShape> {
    const clone = this.copy();
    clone.#opts.nullable = true;
    return clone as any;
  }

  nullish(): BorgArray<MakeNullish<TOpts>, TLength, TShape> {
    const clone = this.copy();
    clone.#opts.nullable = true;
    clone.#opts.optional = true;
    return clone as any;
  }

  required(): BorgArray<MakeRequired<TOpts>, TLength, TShape> {
    const clone = this.copy();
    clone.#opts.optional = false;
    return clone as any;
  }

  notNull(): BorgArray<MakeNotNull<TOpts>, TLength, TShape> {
    const clone = this.copy();
    clone.#opts.nullable = false;
    return clone as any;
  }

  notNullish(): BorgArray<MakeNotNullish<TOpts>, TLength, TShape> {
    const clone = this.copy();
    clone.#opts.nullable = false;
    clone.#opts.optional = false;
    return clone as any;
  }

  private(): BorgArray<MakePrivate<TOpts>, TLength, TShape> {
    const clone = this.copy();
    clone.#opts.private = true;
    return clone as any;
  }

  public(): BorgArray<MakePublic<TOpts>, TLength, TShape> {
    const clone = this.copy();
    clone.#opts.private = false;
    return clone as any;
  }

  max<const N extends number>(
    length: N,
  ): BorgArray<TOpts, [TLength[0], N], TShape> {
    const clone = this.copy();
    clone.#max = length;
    return clone as any;
  }

  min<const N extends number>(
    length: N,
  ): BorgArray<TOpts, [N, TLength[1]], TShape> {
    const clone = this.copy();
    clone.#min = length;
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
  const TOpts extends TypeOptions = "required, notNull, public",
  const TLength extends MinMax = [null, null],
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

  copy(): this {
    return BorgString.#clone(this);
  }

  get meta(): PrettyPrint<
    {
      kind: "string";
      maxLength: TLength[1];
      minLength: TLength[0];
      pattern: ".*" extends TPattern ? undefined : TPattern;
      regex: ".*" extends TPattern ? undefined : RegExp;
    } & InferOpts<TOpts>
  > {
    return Object.freeze({
      ...this.#opts,
      kind: "string",
      maxLength: this.#max,
      minLength: this.#min,
      pattern: this.#regex?.source,
      regex: this.#regex ? new RegExp(this.#regex) : undefined,
    }) as any;
  }

  min<const N extends number>(
    min: N,
  ): BorgString<TOpts, [N, TLength[1]], TPattern> {
    const clone = this.copy();
    clone.#min = min;
    return clone as any;
  }

  max<const N extends number>(
    max: N,
  ): BorgString<TOpts, [TLength[0], N], TPattern> {
    const clone = this.copy();
    clone.#max = max;
    return clone as any;
  }
  /**
   * @IMPORTANT RegExp flags are not supported, except for the "u" flag which is always set.
   * @param pattern a string that will be used as the source for a new RegExp
   */
  pattern<const S extends string>(
    pattern: S,
  ): BorgString<TOpts, TLength, S> {
    const clone = this.copy();
    clone.#regex = new RegExp(pattern, "u");
    return clone as any;
  }

  parse(
    input: unknown,
  ): InferOpts<TOpts>["private"] extends true
    ? typeof privateSymbol
    : ApplyOpts<string, TOpts> {
    if (this.#opts.private) {
      return privateSymbol as any;
    }
    if (input === null) {
      if (this.#opts.nullable) {
        return null as any;
      } else {
        throw new BorgError(
          `STRING_ERROR: Expected string${
            this.#opts.optional ? " or undefined" : ""
          }, got null`,
        );
      }
    }
    if (input === undefined) {
      if (this.#opts.optional) {
        return undefined as any;
      } else {
        throw new BorgError(
          `STRING_ERROR: Expected string${
            this.#opts.nullable ? " or null" : ""
          }, got undefined`,
        );
      }
    }
    if (typeof input !== "string") {
      throw new BorgError(
        `STRING_ERROR: Expected string${
          this.#opts.nullable
            ? " or null"
            : "" + this.#opts.optional
            ? " or undefined"
            : ""
        }, got ${typeof input}`,
      );
    }
    if (this.#min !== null && input.length < this.#min) {
      throw new BorgError(
        `STRING_ERROR: Expected string to be at least ${this.#min} characters`,
      );
    }
    if (this.#max !== null && input.length > this.#max) {
      throw new BorgError(
        `STRING_ERROR: Expected string to be at most ${this.#max} characters`,
      );
    }
    if (this.#regex !== undefined && !this.#regex.test(input)) {
      throw new BorgError(
        `STRING_ERROR: Expected string to match pattern ${this.#regex}`,
      );
    }
    return input as any;
  }

  serialize(input: ApplyOpts<string, TOpts>) {
    if (this.#opts.private) throw new Error("Cannot serialize private value");
    return input;
  }

  deserialize(input: ApplyOpts<string, TOpts>) {
    return input;
  }

  bsonSchema() {
    return {
      bsonType: this.#opts.nullable ? ["string", "null"] : "string",
      ...(this.#min !== null ? { minLength: this.#min } : {}),
      ...(this.#max !== null ? { maxLength: this.#max } : {}),
      ...(this.#regex ? { pattern: this.#regex.source } : {}),
    } as BuildStringBsonSchemaLiteral<TOpts, TLength[0], TLength[1], TPattern>;
  }

  toBson(input: ApplyOpts<string, TOpts>) {
    return input;
  }

  fromBson(input: ApplyOpts<string, TOpts>) {
    return input;
  }

  optional(): BorgString<MakeOptional<TOpts>, TLength, TPattern> {
    const clone = this.copy();
    clone.#opts.optional = true;
    return clone as any;
  }

  nullable(): BorgString<MakeNullable<TOpts>, TLength, TPattern> {
    const clone = this.copy();
    clone.#opts.nullable = true;
    return clone as any;
  }

  nullish(): BorgString<MakeNullish<TOpts>, TLength, TPattern> {
    const clone = this.copy();
    clone.#opts.optional = true;
    clone.#opts.nullable = true;
    return clone as any;
  }

  required(): BorgString<MakeRequired<TOpts>, TLength, TPattern> {
    const clone = this.copy();
    clone.#opts.optional = false;
    return clone as any;
  }

  notNull(): BorgString<MakeNotNull<TOpts>, TLength, TPattern> {
    const clone = this.copy();
    clone.#opts.nullable = false;
    return clone as any;
  }

  notNullish(): BorgString<MakeNotNullish<TOpts>, TLength, TPattern> {
    const clone = this.copy();
    clone.#opts.optional = false;
    clone.#opts.nullable = false;
    return clone as any;
  }

  private(): BorgString<MakePrivate<TOpts>, TLength, TPattern> {
    const clone = this.copy();
    clone.#opts.private = true;
    return clone as any;
  }

  public(): BorgString<MakePublic<TOpts>, TLength, TPattern> {
    const clone = this.copy();
    clone.#opts.private = false;
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
  const TOpts extends TypeOptions = "required, notNull, public",
  const TLength extends MinMax = [null, null],
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

  static #clone<const TBorg extends B.Number<any, any>>(
    borg: TBorg,
  ): TBorg {
    const clone = new BorgNumber();
    clone.#opts = { ...borg.#opts };
    clone.#min = borg.#min;
    clone.#max = borg.#max;
    return clone as any;
  }

  copy(): this {
    return BorgNumber.#clone(this);
  }

  get meta(): PrettyPrint<
    {
      kind: "number";
      max: TLength[1];
      min: TLength[0];
    } & InferOpts<TOpts>
  > {
    return Object.freeze({
      kind: "number",
      max: this.#max,
      min: this.#min,
      ...this.#opts,
    }) as any;
  }

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

  range<const N extends number, const M extends number>(
    min: N,
    max: M,
  ): BorgNumber<TOpts, [N, M]> {
    const clone = this.copy();
    clone.#min = min;
    clone.#max = max;
    return clone as any;
  }

  parse(
    input: unknown,
  ): InferOpts<TOpts>["private"] extends true
    ? typeof privateSymbol
    : ApplyOpts<number, TOpts> {
    if (this.#opts.private) {
      return privateSymbol as never;
    }
    if (input === null) {
      if (this.#opts.nullable) {
        return null as any;
      } else {
        throw new BorgError(
          `NUMBER_ERROR: Expected number${
            this.#opts.optional ? " or undefined" : ""
          }, got null`,
        );
      }
    }
    if (input === undefined) {
      if (this.#opts.optional) {
        return undefined as any;
      } else {
        throw new BorgError(
          `NUMBER_ERROR: Expected number${
            this.#opts.nullable ? " or null" : ""
          }, got undefined`,
        );
      }
    }
    if (typeof input !== "number") {
      throw new BorgError("NUMBER_ERROR: Expected number, got " + typeof input);
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

  bsonSchema(): BuildNumberBsonSchemaLiteral<TOpts, TLength[0], TLength[1]> {
    return {
      bsonType: this.#opts.nullable ? ["double", "null"] : "double",
      ...(this.#min !== null && { minimum: this.#min }),
      ...(this.#max !== null && { maximum: this.#max }),
    } as any;
  }

  toBson(input: ApplyOpts<number, TOpts>): ApplyOpts<Double, TOpts> {
    return typeof input === "number" ? new Double(input) : (input as any);
  }

  fromBson(input: ReturnType<this["toBson"]>): ApplyOpts<number, TOpts> {
    return (input?.valueOf() ?? input) as any;
  }

  serialize(input: ApplyOpts<number, TOpts>) {
    return input;
  }

  deserialize(input: ReturnType<this["serialize"]>) {
    return input;
  }

  optional(): BorgNumber<MakeOptional<TOpts>, TLength> {
    const clone = this.copy();
    clone.#opts.optional = true;
    return clone as any;
  }

  nullable(): BorgNumber<MakeNullable<TOpts>, TLength> {
    const clone = this.copy();
    clone.#opts.nullable = true;
    return clone as any;
  }

  required(): BorgNumber<MakeRequired<TOpts>, TLength> {
    const clone = this.copy();
    clone.#opts.optional = false;
    return clone as any;
  }

  notNull(): BorgNumber<MakeNotNull<TOpts>, TLength> {
    const clone = this.copy();
    clone.#opts.nullable = false;
    return clone as any;
  }

  nullish(): BorgNumber<MakeNullish<TOpts>, TLength> {
    const clone = this.copy();
    clone.#opts.optional = true;
    clone.#opts.nullable = true;
    return clone as any;
  }

  notNullish(): BorgNumber<MakeNotNullish<TOpts>, TLength> {
    const clone = this.copy();
    clone.#opts.optional = false;
    clone.#opts.nullable = false;
    return clone as any;
  }

  private(): BorgNumber<MakePrivate<TOpts>, TLength> {
    const clone = this.copy();
    clone.#opts.private = true;
    return clone as any;
  }

  public(): BorgNumber<MakePublic<TOpts>, TLength> {
    const clone = this.copy();
    clone.#opts.private = false;
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
  const TOpts extends TypeOptions = "required, notNull, public",
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

  copy(): this {
    return BorgBoolean.#clone(this);
  }

  get meta(): PrettyPrint<InferOpts<TOpts> & { kind: "boolean" }> {
    return Object.freeze({
      kind: "boolean",
      ...this.#opts,
    }) as any;
  }

  parse(
    input: unknown,
  ): InferOpts<TOpts>["private"] extends true
    ? typeof privateSymbol
    : ApplyOpts<boolean, TOpts> {
    if (this.#opts.private) {
      return privateSymbol as never;
    }
    if (input === null) {
      if (this.#opts.nullable) {
        return null as any;
      } else {
        throw new BorgError(
          `BOOLEAN_ERROR: Expected boolean${
            this.#opts.optional ? " or undefined" : ""
          }, got null`,
        );
      }
    }
    if (input === undefined) {
      if (this.#opts.optional) {
        return undefined as any;
      } else {
        throw new BorgError(
          `BOOLEAN_ERROR: Expected boolean${
            this.#opts.nullable ? " or null" : ""
          }, got undefined`,
        );
      }
    }
    if (typeof input !== "boolean") {
      throw new BorgError(
        "BOOLEAN_ERROR: Expected boolean, got " + typeof input,
      );
    }
    return input as any;
  }

  bsonSchema(): BuildBooleanBsonSchemaLiteral<TOpts> {
    return {
      bsonType: this.#opts.nullable ? ["bool", "null"] : "bool",
    } as any;
  }

  toBson(input: ApplyOpts<boolean, TOpts>): ApplyOpts<boolean, TOpts> {
    return input;
  }

  fromBson(input: ReturnType<this["toBson"]>): Parameters<this["toBson"]>[0] {
    return input;
  }

  serialize(input: ApplyOpts<boolean, TOpts>) {
    return input;
  }

  deserialize(
    input: ReturnType<this["serialize"]>,
  ): Parameters<this["serialize"]>[0] {
    return input;
  }

  optional(): BorgBoolean<MakeOptional<TOpts>> {
    const clone = this.copy();
    clone.#opts.optional = true;
    return clone as any;
  }

  nullable(): BorgBoolean<MakeNullable<TOpts>> {
    const clone = this.copy();
    clone.#opts.nullable = true;
    return clone as any;
  }

  required(): BorgBoolean<MakeRequired<TOpts>> {
    const clone = this.copy();
    clone.#opts.optional = false;
    return clone as any;
  }

  notNull(): BorgBoolean<MakeNotNull<TOpts>> {
    const clone = this.copy();
    clone.#opts.nullable = false;
    return clone as any;
  }

  nullish(): BorgBoolean<MakeNullish<TOpts>> {
    const clone = this.copy();
    clone.#opts.optional = true;
    clone.#opts.nullable = true;
    return clone as any;
  }

  notNullish(): BorgBoolean<MakeNotNullish<TOpts>> {
    const clone = this.copy();
    clone.#opts.optional = false;
    clone.#opts.nullable = false;
    return clone as any;
  }

  private(): BorgBoolean<MakePrivate<TOpts>> {
    const clone = this.copy();
    clone.#opts.private = true;
    return clone as any;
  }

  public(): BorgBoolean<MakePublic<TOpts>> {
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
  const TOpts extends TypeOptions = "required, notNull, public",
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

  get meta(): PrettyPrint<
    InferOpts<TOpts> & {
      kind: "id";
      format: ObjectId extends TFormat ? "oid" : "string";
    }
  > {
    return Object.freeze({
      kind: "id",
      format: this.#format ? "string" : "oid",
      ...this.#opts,
    }) as any;
  }

  static #clone<const TBorg extends B.Id<any, any>>(borg: TBorg): TBorg {
    const clone = new BorgId();
    clone.#opts = { ...borg.#opts };
    clone.#format = borg.#format as any;
    return clone as any;
  }

  copy(): this {
    return BorgId.#clone(this);
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

  static fromHex = (val: string) => ObjectId.createFromHexString(val);

  parse(
    input: unknown,
  ): InferOpts<TOpts>["private"] extends true
    ? typeof privateSymbol
    : ApplyOpts<TFormat, TOpts> {
    if (this.#opts.private) {
      return privateSymbol as never;
    }
    if (input === null) {
      if (this.#opts.nullable) {
        return null as any;
      } else {
        throw new BorgError(
          `ID_ERROR: Expected valid ObjectId${
            this.#opts.optional ? " or undefined" : ""
          }, got null`,
        );
      }
    }
    if (input === undefined) {
      if (this.#opts.optional) {
        return undefined as any;
      } else {
        throw new BorgError(
          `ID_ERROR: Expected valid ObjectId${
            this.#opts.nullable ? " or null" : ""
          }, got undefined`,
        );
      }
    }

    if (typeof input === "string") {
      if (ObjectId.isValid(input))
        return this.#format ? input : (BorgId.fromHex(input) as any);
    }
    if (typeof input === "number") {
      const hex = input.toString(16);
      if (ObjectId.isValid(input))
        return this.#format ? hex : (BorgId.fromHex(hex) as any);
    }
    if (input instanceof Uint8Array) {
      const hex = Buffer.from(input).toString("hex");
      if (ObjectId.isValid(input))
        return this.#format ? hex : (BorgId.fromHex(hex) as any);
    }
    if (BorgId.isObjectIdLike(input)) {
      const hex = input.toHexString();
      if (ObjectId.isValid(input))
        return this.#format ? hex : (BorgId.fromHex(hex) as any);
    }
    if (input instanceof ObjectId) {
      return this.#format ? input.toHexString() : (input as any);
    }
    throw new BorgError(
      `ID_ERROR: Expected valid ObjectId${
        this.#opts.optional ? " or undefined" : ""
      }${this.#opts.nullable ? " or null" : ""}, got ${typeof input}`,
    );
  }

  bsonSchema(): BuildOidBsonSchemaLiteral<TOpts> {
    return {
      bsonType: this.#opts.nullable ? ["null", "objectId"] : "objectId",
    } as any;
  }

  toBson(input: ApplyOpts<TFormat, TOpts>): ApplyOpts<ObjectId, TOpts> {
    if (input === undefined) return undefined as any;
    if (input === null) return null as any;
    if (typeof input === "string") return BorgId.fromHex(input) as any;
    return input as any;
  }

  fromBson(input: ApplyOpts<ObjectId, TOpts>): ApplyOpts<TFormat, TOpts> {
    if (input === undefined) return undefined as any;
    if (input === null) return null as any;
    if (this.#format) return input.toHexString() as any;
    return input as any;
  }

  serialize(input: ApplyOpts<TFormat, TOpts>): ApplyOpts<string, TOpts> {
    if (input === undefined) return undefined as any;
    if (input === null) return null as any;
    if (typeof input === "string") return input as any;
    return input.toHexString() as any;
  }

  deserialize(input: string): ApplyOpts<TFormat, TOpts> {
    if (input === undefined) return undefined as any;
    if (input === null) return null as any;
    if (this.#format) return input as any;
    return BorgId.fromHex(input) as any;
  }

  optional(): BorgId<MakeOptional<TOpts>, TFormat> {
    const clone = this.copy();
    clone.#opts.optional = true;
    return clone as any;
  }

  nullable(): BorgId<MakeNullable<TOpts>, TFormat> {
    const clone = this.copy();
    clone.#opts.nullable = true;
    return clone as any;
  }

  nullish(): BorgId<MakeNullish<TOpts>, TFormat> {
    const clone = this.copy();
    clone.#opts.optional = true;
    clone.#opts.nullable = true;
    return clone as any;
  }

  required(): BorgId<MakeRequired<TOpts>, TFormat> {
    const clone = this.copy();
    clone.#opts.optional = false;
    return clone as any;
  }

  notNull(): BorgId<MakeNotNull<TOpts>, TFormat> {
    const clone = this.copy();
    clone.#opts.nullable = false;
    return clone as any;
  }

  notNullish(): BorgId<MakeNotNullish<TOpts>, TFormat> {
    const clone = this.copy();
    clone.#opts.optional = false;
    clone.#opts.nullable = false;
    return clone as any;
  }

  private(): BorgId<MakePrivate<TOpts>, TFormat> {
    const clone = this.copy();
    clone.#opts.private = true;
    return clone as any;
  }

  public(): BorgId<MakePublic<TOpts>, TFormat> {
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

function makeBorg<TSchema extends BorgObject<TypeOptions>>(
  schema: TSchema,
): BorgModel<TSchema>;
function makeBorg<
  TSchema extends BorgObject<TypeOptions>,
  TServerModel extends object,
>(
  schema: TSchema,
  transformInput: (input: B.Type<TSchema>) => TServerModel,
): BorgModel<TSchema, TServerModel>;
function makeBorg<
  TInputSchema extends BorgObject<TypeOptions>,
  TServerModel extends object,
  TOutputSchema extends BorgObject<TypeOptions>,
>(
  inputSchema: TInputSchema,
  transformInput: (input: B.Type<TInputSchema>) => TServerModel,
  transformOutput: (input: TServerModel) => B.Type<TOutputSchema>,
  outputSchema: TOutputSchema,
): BorgModel<TInputSchema, TServerModel, TOutputSchema>;

function makeBorg<
  TInputSchema extends BorgObject<TypeOptions>,
  TServerModel extends object,
  TOutputSchema extends BorgObject<TypeOptions>,
>(
  schema: TInputSchema,
  transformInput: (input: B.Type<TInputSchema>) => TServerModel = (
    input: B.Type<TInputSchema>,
  ) => input as any,
  transformOutput: (input: TServerModel) => B.Type<TOutputSchema> = (
    input: TServerModel,
  ) => input as any,
  outputSchema: TOutputSchema = schema as any,
): BorgModel<TInputSchema, TServerModel, TOutputSchema> {
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
  export type Boolean<TOpts extends TypeOptions = TypeOptions> =
    BorgBoolean<TOpts>;

  export type Id<
    TOpts extends TypeOptions = TypeOptions,
    TFormat extends "string" | "oid" = "string" | "oid",
  > = BorgId<TOpts, TFormat>;

  export type Number<
    TOpts extends TypeOptions = TypeOptions,
    TLength extends MinMax = MinMax,
  > = BorgNumber<TOpts, TLength>;

  export type String<
    TOpts extends TypeOptions = TypeOptions,
    TLength extends MinMax = MinMax,
    TPattern extends string = string,
  > = BorgString<TOpts, TLength, TPattern>;

  export type Array<
    TOpts extends TypeOptions = TypeOptions,
    TItems extends B.Borg = B.Borg,
    TLength extends MinMax = MinMax,
  > = BorgArray<TOpts, TLength, TItems>;

  export type Object<
    TOpts extends TypeOptions = TypeOptions,
    TShape extends { [key: string]: Borg } = { [key: string]: Borg },
  > = BorgObject<TOpts, TShape>;

  export type Borg<
    TOptions extends TypeOptions = TypeOptions,
    TKind extends AnyKind = AnyKind,
  > = BorgType<TKind, TOptions>;

  export type AnyBorg = SomeBorg;

  export type Type<TBorg extends AnyBorg> = ReturnType<TBorg["parse"]>;
  export type BsonType<TBorg extends AnyBorg> = ReturnType<TBorg["toBson"]>;
  export type Serialized<TBorg extends AnyBorg> = ReturnType<
    TBorg["serialize"]
  >;
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
//@ts-expect-error - vitest handles import.meta
if (import.meta.vitest) {
  const {
    expect,
    it,
    describe,
    assertType,
    // @ts-expect-error - vitest handles the top level await
  } = await import("vitest");

  const stringTestObject = B.object({
    base: B.string(),
    optional: B.string().optional(),
    nullable: B.string().nullable(),
    nullish: B.string().nullish(),
    optionalNullable: B.string().optional().nullable(),
    optionalRequired: B.string().optional().required(),
    nullableOptional: B.string().nullable().optional(),
    nullableNotNull: B.string().nullable().notNull(),
    nullishNotNullish: B.string().nullish().notNullish(),
    private: B.string().private(),
    privatePublic: B.string().private().public(),
    arbitraryChaining: B.string()
      .nullable()
      .notNull()
      .private()
      .optional()
      .required()
      .public()
      .nullish()
      .notNullish()
      .nullable()
      .private()
      .optional()
      .notNull()
      .public()
      .required()
      .notNullish()
      .nullable(),
  });

  const stringsMock = {
    base: "base",
    nullable: null,
    optionalNullable: undefined,
    optionalRequired: "optionalRequired",
    nullableOptional: null,
    nullableNotNull: "nullableNotNull",
    nullishNotNullish: "nullishNotNullish",
    private: "private",
    privatePublic: "",
    arbitraryChaining: "arbitraryChaining",
  };

  const numberTestObject = B.object({
    base: B.number(),
    optional: B.number().optional(),
    nullable: B.number().nullable(),
    nullish: B.number().nullish(),
    optionalNullable: B.number().optional().nullable(),
    optionalRequired: B.number().optional().required(),
    nullableOptional: B.number().nullable().optional(),
    nullableNotNull: B.number().nullable().notNull(),
    nullishNotNullish: B.number().nullish().notNullish(),
    private: B.number().private(),
    privatePublic: B.number().private().public(),
    arbitraryChaining: B.number()
      .nullable()
      .notNull()
      .private()
      .optional()
      .required()
      .public()
      .nullish()
      .notNullish()
      .nullable()
      .private()
      .optional()
      .notNull()
      .public()
      .required()
      .notNullish()
      .nullable(),
  });

  const numbersMock = {
    base: -2,
    nullable: null,
    optionalNullable: undefined,
    optionalRequired: Number.NaN,
    nullableOptional: null,
    nullableNotNull: 3.14,
    nullishNotNullish: Number.MIN_VALUE,
    private: 1,
    privatePublic: Number.NEGATIVE_INFINITY,
    arbitraryChaining: Number.MAX_SAFE_INTEGER,
  };

  const scalarsTestObject = B.object({
    strings: B.object({
      base: stringTestObject,
      optional: stringTestObject.optional(),
      nullable: stringTestObject.nullable(),
      nullish: stringTestObject.nullish(),
      optionalNullable: stringTestObject.optional().nullable(),
      optionalRequired: stringTestObject.optional().required(),
      nullableOptional: stringTestObject.nullable().optional(),
      nullableNotNull: stringTestObject.nullable().notNull(),
      nullishNotNullish: stringTestObject.nullish().notNullish(),
      private: stringTestObject.private(),
      privatePublic: stringTestObject.private().public(),
      arbitraryChaining: stringTestObject
        .nullable()
        .notNull()
        .private()
        .optional()
        .required()
        .public()
        .nullish()
        .notNullish()
        .nullable()
        .private()
        .optional()
        .notNull()
        .public()
        .required()
        .notNullish()
        .nullable(),
    }),
    numbers: B.object({
      base: numberTestObject,
      optional: numberTestObject.optional(),
      nullable: numberTestObject.nullable(),
      nullish: numberTestObject.nullish(),
      optionalNullable: numberTestObject.optional().nullable(),
      optionalRequired: numberTestObject.optional().required(),
      nullableOptional: numberTestObject.nullable().optional(),
      nullableNotNull: numberTestObject.nullable().notNull(),
      nullishNotNullish: numberTestObject.nullish().notNullish(),
      private: numberTestObject.private(),
      privatePublic: numberTestObject.private().public(),
      arbitraryChaining: numberTestObject
        .nullable()
        .notNull()
        .private()
        .optional()
        .required()
        .public()
        .nullish()
        .notNullish()
        .nullable()
        .private()
        .optional()
        .notNull()
        .public()
        .required()
        .notNullish()
        .nullable(),
    }),
  });

  const scalarsMock = {
    strings: {
      base: stringsMock,
      nullable: null,
      optionalNullable: undefined,
      optionalRequired: stringsMock,
      nullableOptional: null,
      nullableNotNull: stringsMock,
      nullishNotNullish: stringsMock,
      private: stringsMock,
      privatePublic: stringsMock,
      arbitraryChaining: stringsMock,
    },
    numbers: {
      base: numbersMock,
      nullable: null,
      optionalNullable: undefined,
      optionalRequired: numbersMock,
      nullableOptional: null,
      nullableNotNull: numbersMock,
      nullishNotNullish: numbersMock,
      private: numbersMock,
      privatePublic: numbersMock,
      arbitraryChaining: numbersMock,
    },
  };

  const objectTestObject = B.object({
    withProperties: B.object({
      base: scalarsTestObject,
      optional: scalarsTestObject.optional(),
      nullable: scalarsTestObject.nullable(),
      nullish: scalarsTestObject.nullish(),
      optionalNullable: scalarsTestObject.optional().nullable(),
      optionalRequired: scalarsTestObject.optional().required(),
      nullableOptional: scalarsTestObject.nullable().optional(),
      nullableNotNull: scalarsTestObject.nullable().notNull(),
      nullishNotNullish: scalarsTestObject.nullish().notNullish(),
      private: scalarsTestObject.private(),
      privatePublic: scalarsTestObject.private().public(),
      arbitraryChaining: scalarsTestObject
        .nullable()
        .notNull()
        .private()
        .optional()
        .required()
        .public()
        .nullish()
        .notNullish()
        .nullable()
        .private()
        .optional()
        .notNull()
        .public()
        .required()
        .notNullish()
        .nullable(),
    }),
    withoutProperties: B.object({}),
  });

  describe("Types", () => {
    it("should have the correct types", () => {
      assertType<
        BorgObject<
          "required, notNull, public",
          {
            base: BorgString<"required, notNull, public", [null, null], ".*">;
            optional: BorgString<
              "optional, notNull, public",
              [null, null],
              ".*"
            >;
            nullable: BorgString<
              "required, nullable, public",
              [null, null],
              ".*"
            >;
            nullish: BorgString<
              "optional, nullable, public",
              [null, null],
              ".*"
            >;
            optionalNullable: BorgString<
              "optional, nullable, public",
              [null, null],
              ".*"
            >;
            optionalRequired: BorgString<
              "required, notNull, public",
              [null, null],
              ".*"
            >;
            nullableOptional: BorgString<
              "optional, nullable, public",
              [null, null],
              ".*"
            >;
            nullableNotNull: BorgString<
              "required, notNull, public",
              [null, null],
              ".*"
            >;
            nullishNotNullish: BorgString<
              "required, notNull, public",
              [null, null],
              ".*"
            >;
            private: BorgString<
              "required, notNull, private",
              [null, null],
              ".*"
            >;
            privatePublic: BorgString<
              "required, notNull, public",
              [null, null],
              ".*"
            >;
            arbitraryChaining: BorgString<
              "required, nullable, public",
              [null, null],
              ".*"
            >;
          }
        >
      >(stringTestObject);

      assertType<
        BorgObject<
          "required, notNull, public",
          {
            base: BorgNumber<"required, notNull, public", [null, null]>;
            optional: BorgNumber<"optional, notNull, public", [null, null]>;
            nullable: BorgNumber<"required, nullable, public", [null, null]>;
            nullish: BorgNumber<"optional, nullable, public", [null, null]>;
            optionalNullable: BorgNumber<
              "optional, nullable, public",
              [null, null]
            >;
            optionalRequired: BorgNumber<
              "required, notNull, public",
              [null, null]
            >;
            nullableOptional: BorgNumber<
              "optional, nullable, public",
              [null, null]
            >;
            nullableNotNull: BorgNumber<
              "required, notNull, public",
              [null, null]
            >;
            nullishNotNullish: BorgNumber<
              "required, notNull, public",
              [null, null]
            >;
            private: BorgNumber<"required, notNull, private", [null, null]>;
            privatePublic: BorgNumber<
              "required, notNull, public",
              [null, null]
            >;
            arbitraryChaining: BorgNumber<
              "required, nullable, public",
              [null, null]
            >;
          }
        >
      >(numberTestObject);

      assertType<
        BorgObject<
          "required, notNull, public",
          {
            strings: BorgObject<
              "required, notNull, public",
              {
                base: typeof stringTestObject;
                optional: ReturnType<(typeof stringTestObject)["optional"]>;
                nullable: ReturnType<(typeof stringTestObject)["nullable"]>;
                nullish: ReturnType<(typeof stringTestObject)["nullish"]>;
                optionalNullable: ReturnType<
                  (typeof stringTestObject)["nullish"]
                >;
                optionalRequired: typeof stringTestObject;
                nullableOptional: ReturnType<
                  (typeof stringTestObject)["nullish"]
                >;
                nullableNotNull: typeof stringTestObject;
                nullishNotNullish: typeof stringTestObject;
                private: ReturnType<(typeof stringTestObject)["private"]>;
                privatePublic: typeof stringTestObject;
                arbitraryChaining: ReturnType<
                  (typeof stringTestObject)["nullable"]
                >;
              }
            >;
            numbers: BorgObject<
              "required, notNull, public",
              {
                base: typeof numberTestObject;
                optional: ReturnType<(typeof numberTestObject)["optional"]>;
                nullable: ReturnType<(typeof numberTestObject)["nullable"]>;
                nullish: ReturnType<(typeof numberTestObject)["nullish"]>;
                optionalNullable: ReturnType<
                  (typeof numberTestObject)["nullish"]
                >;
                optionalRequired: typeof numberTestObject;
                nullableOptional: ReturnType<
                  (typeof numberTestObject)["nullish"]
                >;
                nullableNotNull: typeof numberTestObject;
                nullishNotNullish: typeof numberTestObject;
                private: ReturnType<(typeof numberTestObject)["private"]>;
                privatePublic: typeof numberTestObject;
                arbitraryChaining: ReturnType<
                  (typeof numberTestObject)["nullable"]
                >;
              }
            >;
          }
        >
      >(scalarsTestObject);

      assertType<
        BorgObject<
          "required, notNull, public",
          {
            withProperties: BorgObject<
              "required, notNull, public",
              {
                base: typeof scalarsTestObject;
                optional: ReturnType<(typeof scalarsTestObject)["optional"]>;
                nullable: ReturnType<(typeof scalarsTestObject)["nullable"]>;
                nullish: ReturnType<(typeof scalarsTestObject)["nullish"]>;
                optionalNullable: ReturnType<
                  (typeof scalarsTestObject)["nullish"]
                >;
                optionalRequired: typeof scalarsTestObject;
                nullableOptional: ReturnType<
                  (typeof scalarsTestObject)["nullish"]
                >;
                nullableNotNull: typeof scalarsTestObject;
                nullishNotNullish: typeof scalarsTestObject;
                private: ReturnType<(typeof scalarsTestObject)["private"]>;
                privatePublic: typeof scalarsTestObject;
                arbitraryChaining: ReturnType<
                  (typeof scalarsTestObject)["nullable"]
                >;
              }
            >;
            withoutProperties: BorgObject<"required, notNull, public", {}>;
          }
        >
      >(objectTestObject);
    });
  });

  describe("Parsing", () => {
    it("should parse valid inputs", () => {
      const parsedStrings = stringTestObject.parse(stringsMock);
      const { private: _, ...expectedStrings } = stringsMock;
      expect(parsedStrings).toEqual(expectedStrings);

      const parsedNumbers = numberTestObject.parse(numbersMock);
      const { private: __, ...expectedNumbers } = numbersMock;
      expect(parsedNumbers).toEqual(expectedNumbers);

      const parsedScalars = scalarsTestObject.parse(scalarsMock);

      expect(parsedScalars).toEqual({
        strings: {
          base: expectedStrings,
          nullable: null,
          optionalNullable: undefined,
          optionalRequired: expectedStrings,
          nullableOptional: null,
          nullableNotNull: expectedStrings,
          nullishNotNullish: expectedStrings,
          privatePublic: expectedStrings,
          arbitraryChaining: expectedStrings,
        },
        numbers: {
          base: expectedNumbers,
          nullable: null,
          optionalNullable: undefined,
          optionalRequired: expectedNumbers,
          nullableOptional: null,
          nullableNotNull: expectedNumbers,
          nullishNotNullish: expectedNumbers,
          privatePublic: expectedNumbers,
          arbitraryChaining: expectedNumbers,
        },
      });
    });
  });
}
/*
TODO: Fix sanitize, parse, etc on BorgObject and BorgModel to delete private stuff
TODO: Modify output parsing so that fields not
  present in the output schema pass through untouched.

  When building a client parser, we can use the shape of the input schema,
  and replace the modified fields with those from the output schema.
*/
