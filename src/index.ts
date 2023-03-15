[
  "/Users/alec/.nvm/versions/node/v16.14.2/bin/node",
  "/Users/alec/dev/borg/.vscode/format.cjs",
];
import {
  TypeOptions,
  InferOpts,
  ApplyOpts,
  InferParsedType,
  BuildStringBsonSchemaLiteral,
  BuildObjectBsonSchemaLiteral,
  BuildNumberBsonSchemaLiteral,
  BuildBooleanBsonSchemaLiteral,
  BuildOidBsonSchemaLiteral,
  BuildArrayBsonSchemaLiteral,
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

class BorgError<T extends BorgError | undefined = undefined> extends Error {
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
abstract class BorgSchema {
  /* TODO:
  static #options: BorgOptions = {};
  static get options() { return this.#options }
  static config(opts: BorgOptions) {
    Borg.#options = Object.freeze(opts)
  }
*/
  abstract parse(input: unknown): any;
  abstract serialize(input: any): any;
  abstract deserialize(input: any): any;
  abstract toBson(input: any): any;
  abstract fromBson(input: any): any;
  abstract bsonSchema(): any;
  abstract private(): BorgSchema;
  abstract public(): BorgSchema;
  abstract optional(): BorgSchema;
  abstract nullable(): BorgSchema;
  abstract nullish(): BorgSchema;
  abstract required(): BorgSchema;
  abstract notNull(): BorgSchema;
  abstract notNullish(): BorgSchema;
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

class BorgObjectSchema<
  const TOpts extends TypeOptions = "required, notNull, public",
  const TShape extends { [key: string]: BorgSchema } = {
    [key: string]: BorgSchema;
  },
> extends BorgSchema {
  #shape: TShape;
  #opts: InferOpts<TOpts> = {
    optional: false,
    nullable: false,
    private: false,
  } as any;

  constructor(shape: TShape) {
    super();
    this.#shape = shape;
  }

  static clone<const TBorg extends BorgObjectSchema<any, any>>(
    borg: TBorg,
  ): TBorg {
    const clone = new BorgObjectSchema(borg.#shape);
    clone.#opts = { ...borg.#opts };
    return clone as any;
  }

  parse(
    input: unknown,
  ): ApplyOpts<
    { [key in keyof TShape]: ReturnType<TShape[key]["parse"]> },
    TOpts
  > {
    if (this.#opts.private) {
      return privateSymbol as any;
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
    if (this.#opts.private) throw new Error("Cannot serialize private data");
    if (input === null || input === undefined) return input as any;

    const result = {} as any;
    for (const key in this.#shape) {
      if (!(key in input)) continue;
      // @ts-expect-error - this is a hack to get around the fact that TS doesn't know that the key is in the input
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
      // @ts-expect-error - this is a hack to get around the fact that TS doesn't know that the key is in the input
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

  optional(): BorgObjectSchema<
    `optional, ${InferOpts<TOpts, "enum">["nullable"]}, ${InferOpts<
      TOpts,
      "enum"
    >["private"]}`,
    TShape
  > {
    const clone = BorgObjectSchema.clone(this);
    clone.#opts.optional = true;
    return clone as any;
  }

  nullable(): BorgObjectSchema<
    `${InferOpts<TOpts, "enum">["optional"]}, nullable, ${InferOpts<
      TOpts,
      "enum"
    >["private"]}`,
    TShape
  > {
    const clone = BorgObjectSchema.clone(this);
    clone.#opts.nullable = true;
    return clone as any;
  }

  nullish(): BorgObjectSchema<
    `optional, nullable, ${InferOpts<TOpts, "enum">["private"]}`,
    TShape
  > {
    const clone = BorgObjectSchema.clone(this);
    clone.#opts.optional = true;
    clone.#opts.nullable = true;
    return clone as any;
  }

  required(): BorgObjectSchema<
    `required, ${InferOpts<TOpts, "enum">["nullable"]}, ${InferOpts<
      TOpts,
      "enum"
    >["private"]}`,
    TShape
  > {
    const clone = BorgObjectSchema.clone(this);
    clone.#opts.optional = false;
    return clone as any;
  }

  notNull(): BorgObjectSchema<
    `${InferOpts<TOpts, "enum">["optional"]}, notNull, ${InferOpts<
      TOpts,
      "enum"
    >["private"]}`,
    TShape
  > {
    const clone = BorgObjectSchema.clone(this);
    clone.#opts.nullable = false;
    return clone as any;
  }

  notNullish(): BorgObjectSchema<
    `required, notNull, ${InferOpts<TOpts, "enum">["private"]}`,
    TShape
  > {
    const clone = BorgObjectSchema.clone(this);
    clone.#opts.optional = false;
    clone.#opts.nullable = false;
    return clone as any;
  }

  private(): BorgObjectSchema<
    `${InferOpts<TOpts, "enum">["optional"]}, ${InferOpts<
      TOpts,
      "enum"
    >["nullable"]}, private`,
    TShape
  > {
    const clone = BorgObjectSchema.clone(this);
    clone.#opts.private = true;
    return clone as any;
  }

  public(): BorgObjectSchema<
    `${InferOpts<TOpts, "enum">["optional"]}, ${InferOpts<
      TOpts,
      "enum"
    >["nullable"]}, public`,
    TShape
  > {
    const clone = BorgObjectSchema.clone(this);
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

class BorgArraySchema<
  const TOpts extends TypeOptions = "required, notNull, public",
  const TLength extends [number | null, number | null] = [null, null],
  const TShape extends BorgSchema = BorgSchema,
> extends BorgSchema {
  #opts: InferOpts<TOpts> = {
    optional: false,
    nullable: false,
    private: false,
  } as any;
  #shape: TShape;
  #max: TLength[1] = null;
  #min: TLength[0] = null;

  constructor(shape: TShape) {
    super();
    this.#shape = shape;
  }

  static clone<const T extends BorgArraySchema<any, any, any>>(
    schema: T,
  ): T {
    const clone = new BorgArraySchema(schema.#shape);
    clone.#opts = { ...schema.#opts };
    clone.#max = schema.#max;
    clone.#min = schema.#min;
    return clone as any;
  }

  parse(input: unknown): ApplyOpts<Array<ReturnType<TShape["parse"]>>, TOpts> {
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

  optional(): BorgArraySchema<
    `optional, ${InferOpts<TOpts, "enum">["nullable"]}, ${InferOpts<
      TOpts,
      "enum"
    >["private"]}`,
    TLength,
    TShape
  > {
    const clone = BorgArraySchema.clone(this);
    clone.#opts.optional = true;
    return clone as any;
  }

  nullable(): BorgArraySchema<
    `${InferOpts<TOpts, "enum">["optional"]}, nullable, ${InferOpts<
      TOpts,
      "enum"
    >["private"]}`,
    TLength,
    TShape
  > {
    const clone = BorgArraySchema.clone(this);
    clone.#opts.nullable = true;
    return clone as any;
  }

  nullish(): BorgArraySchema<
    `optional, nullable, ${InferOpts<TOpts, "enum">["private"]}`,
    TLength,
    TShape
  > {
    const clone = BorgArraySchema.clone(this);
    clone.#opts.nullable = true;
    clone.#opts.optional = true;
    return clone as any;
  }

  required(): BorgArraySchema<
    `required, ${InferOpts<TOpts, "enum">["nullable"]}, ${InferOpts<
      TOpts,
      "enum"
    >["private"]}`,
    TLength,
    TShape
  > {
    const clone = BorgArraySchema.clone(this);
    clone.#opts.optional = false;
    return clone as any;
  }

  notNull(): BorgArraySchema<
    `${InferOpts<TOpts, "enum">["optional"]}, notNull, ${InferOpts<
      TOpts,
      "enum"
    >["private"]}`,
    TLength,
    TShape
  > {
    const clone = BorgArraySchema.clone(this);
    clone.#opts.nullable = false;
    return clone as any;
  }

  notNullish(): BorgArraySchema<
    `required, notNull, ${InferOpts<TOpts, "enum">["private"]}`,
    TLength,
    TShape
  > {
    const clone = BorgArraySchema.clone(this);
    clone.#opts.nullable = false;
    clone.#opts.optional = false;
    return clone as any;
  }

  private(): BorgArraySchema<
    `${InferOpts<TOpts, "enum">["optional"]}, ${InferOpts<
      TOpts,
      "enum"
    >["nullable"]}, private`,
    TLength,
    TShape
  > {
    const clone = BorgArraySchema.clone(this);
    clone.#opts.private = true;
    return clone as any;
  }

  public(): BorgArraySchema<
    `${InferOpts<TOpts, "enum">["optional"]}, ${InferOpts<
      TOpts,
      "enum"
    >["nullable"]}, public`,
    TLength,
    TShape
  > {
    const clone = BorgArraySchema.clone(this);
    clone.#opts.private = false;
    return clone as any;
  }

  max<const N extends number>(
    length: N,
  ): BorgArraySchema<TOpts, [TLength[0], N], TShape> {
    const clone = BorgArraySchema.clone(this);
    clone.#max = length;
    return clone as any;
  }

  min<const N extends number>(
    length: N,
  ): BorgArraySchema<TOpts, [N, TLength[1]], TShape> {
    const clone = BorgArraySchema.clone(this);
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

class BorgStringSchema<
  const TOpts extends TypeOptions = "required, notNull, public",
  const TLength extends [number | null, number | null] = [null, null],
  const TPattern extends string = ".*",
> extends BorgSchema {
  #opts: InferOpts<TOpts> = {
    optional: false,
    nullable: false,
    private: false,
  } as any;
  #min: TLength[0] = null;
  #max: TLength[1] = null;
  #regex: RegExp | null = null;

  constructor() {
    super();
  }

  static clone<const TBorg extends BorgStringSchema<any, any, any>>(
    borg: TBorg,
  ): TBorg {
    const clone = new BorgStringSchema();
    clone.#opts = { ...borg.#opts };
    clone.#min = borg.#min;
    clone.#max = borg.#max;
    clone.#regex = borg.#regex;
    return clone as any;
  }

  min<const N extends number>(
    min: N,
  ): BorgStringSchema<TOpts, [N, TLength[1]], TPattern> {
    const clone = BorgStringSchema.clone(this);
    clone.#min = min;
    return clone as any;
  }

  max<const N extends number>(
    max: N,
  ): BorgStringSchema<TOpts, [TLength[0], N], TPattern> {
    const clone = BorgStringSchema.clone(this);
    clone.#max = max;
    return clone as any;
  }

  pattern<const S extends string>(
    pattern: S,
  ): BorgStringSchema<TOpts, TLength, S> {
    const clone = BorgStringSchema.clone(this);
    clone.#regex = new RegExp(pattern);
    return clone as any;
  }

  parse(input: unknown): ApplyOpts<string, TOpts> {
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
    if (this.#regex !== null && !this.#regex.test(input)) {
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

  optional(): BorgStringSchema<
    `optional, ${InferOpts<TOpts, "enum">["nullable"]}, ${InferOpts<
      TOpts,
      "enum"
    >["private"]}`,
    TLength,
    TPattern
  > {
    const clone = BorgStringSchema.clone(this);
    clone.#opts.optional = true;
    return clone as any;
  }

  nullable(): BorgStringSchema<
    `${InferOpts<TOpts, "enum">["optional"]}, nullable, ${InferOpts<
      TOpts,
      "enum"
    >["private"]}`,
    TLength,
    TPattern
  > {
    const clone = BorgStringSchema.clone(this);
    clone.#opts.nullable = true;
    return clone as any;
  }

  nullish(): BorgStringSchema<
    `optional, nullable, ${InferOpts<TOpts, "enum">["private"]}`,
    TLength,
    TPattern
  > {
    const clone = BorgStringSchema.clone(this);
    clone.#opts.optional = true;
    clone.#opts.nullable = true;
    return clone as any;
  }

  required(): BorgStringSchema<
    `required, ${InferOpts<TOpts, "enum">["nullable"]}, ${InferOpts<
      TOpts,
      "enum"
    >["private"]}`,
    TLength,
    TPattern
  > {
    const clone = BorgStringSchema.clone(this);
    clone.#opts.optional = false;
    return clone as any;
  }

  notNull(): BorgStringSchema<
    `${InferOpts<TOpts, "enum">["optional"]}, notNull, ${InferOpts<
      TOpts,
      "enum"
    >["private"]}`,
    TLength,
    TPattern
  > {
    const clone = BorgStringSchema.clone(this);
    clone.#opts.nullable = false;
    return clone as any;
  }

  notNullish(): BorgStringSchema<
    `required, notNull, ${InferOpts<TOpts, "enum">["private"]}`,
    TLength,
    TPattern
  > {
    const clone = BorgStringSchema.clone(this);
    clone.#opts.optional = false;
    clone.#opts.nullable = false;
    return clone as any;
  }

  private(): BorgStringSchema<
    `${InferOpts<TOpts, "enum">["optional"]}, ${InferOpts<
      TOpts,
      "enum"
    >["nullable"]}, private`,
    TLength,
    TPattern
  > {
    const clone = BorgStringSchema.clone(this);
    clone.#opts.private = true;
    return clone as any;
  }

  public(): BorgStringSchema<
    `${InferOpts<TOpts, "enum">["optional"]}, ${InferOpts<
      TOpts,
      "enum"
    >["nullable"]}, public`,
    TLength,
    TPattern
  > {
    const clone = BorgStringSchema.clone(this);
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

class BorgNumberSchema<
  TOpts extends TypeOptions = "required, notNull, public",
  TLength extends [number | null, number | null] = [null, null],
> extends BorgSchema {
  #opts: InferOpts<TOpts> = {
    nullable: false,
    optional: false,
    private: false,
  } as any;
  #min: TLength[0] = null;
  #max: TLength[1] = null;

  constructor() {
    super();
  }

  static clone<const TBorg extends BorgNumberSchema<any, any>>(
    borg: TBorg,
  ): TBorg {
    const clone = new BorgNumberSchema() as TBorg;
    clone.#opts = { ...borg.#opts };
    clone.#min = borg.#min;
    clone.#max = borg.#max;
    return clone;
  }

  min<const N extends number>(
    min: N,
  ): BorgNumberSchema<TOpts, [N, TLength[1]]> {
    const clone = BorgNumberSchema.clone(this);
    clone.#min = min;
    return clone as any;
  }

  max<const N extends number>(
    max: N,
  ): BorgNumberSchema<TOpts, [TLength[0], N]> {
    const clone = BorgNumberSchema.clone(this);
    clone.#max = max;
    return clone as any;
  }

  range<const N extends number, const M extends number>(
    min: N,
    max: M,
  ): BorgNumberSchema<TOpts, [N, M]> {
    const clone = BorgNumberSchema.clone(this);
    clone.#min = min;
    clone.#max = max;
    return clone as any;
  }

  parse(input: unknown): ApplyOpts<number, TOpts> {
    if (this.#opts.private) {
      return privateSymbol as any;
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

  fromBson(input: ReturnType<this["toBson"]>): Parameters<this["toBson"]>[0] {
    return input?.valueOf() ?? (input as any);
  }

  serialize(input: ApplyOpts<number, TOpts>) {
    return input;
  }

  deserialize(input: ReturnType<this["serialize"]>) {
    return input;
  }

  optional(): BorgNumberSchema<
    `optional, ${InferOpts<TOpts, "enum">["nullable"]}, ${InferOpts<
      TOpts,
      "enum"
    >["private"]}`,
    TLength
  > {
    const clone = BorgNumberSchema.clone(this);
    clone.#opts.optional = true;
    return clone as any;
  }

  nullable(): BorgNumberSchema<
    `${InferOpts<TOpts, "enum">["optional"]}, nullable, ${InferOpts<
      TOpts,
      "enum"
    >["private"]}`,
    TLength
  > {
    const clone = BorgNumberSchema.clone(this);
    clone.#opts.nullable = true;
    return clone as any;
  }

  required(): BorgNumberSchema<
    `required, ${InferOpts<TOpts, "enum">["nullable"]}, ${InferOpts<
      TOpts,
      "enum"
    >["private"]}`,
    TLength
  > {
    const clone = BorgNumberSchema.clone(this);
    clone.#opts.optional = false;
    return clone as any;
  }

  notNull(): BorgNumberSchema<
    `${InferOpts<TOpts, "enum">["optional"]}, notNull, ${InferOpts<
      TOpts,
      "enum"
    >["private"]}`,
    TLength
  > {
    const clone = BorgNumberSchema.clone(this);
    clone.#opts.nullable = false;
    return clone as any;
  }

  nullish(): BorgNumberSchema<
    `optional, nullable, ${InferOpts<TOpts, "enum">["private"]}`,
    TLength
  > {
    const clone = BorgNumberSchema.clone(this);
    clone.#opts.optional = true;
    clone.#opts.nullable = true;
    return clone as any;
  }

  notNullish(): BorgNumberSchema<
    `required, notNull, ${InferOpts<TOpts, "enum">["private"]}`,
    TLength
  > {
    const clone = BorgNumberSchema.clone(this);
    clone.#opts.optional = false;
    clone.#opts.nullable = false;
    return clone as any;
  }

  private(): BorgNumberSchema<
    `${InferOpts<TOpts, "enum">["optional"]}, ${InferOpts<
      TOpts,
      "enum"
    >["nullable"]}, private`,
    TLength
  > {
    const clone = BorgNumberSchema.clone(this);
    clone.#opts.private = true;
    return clone as any;
  }

  public(): BorgNumberSchema<
    `${InferOpts<TOpts, "enum">["optional"]}, ${InferOpts<
      TOpts,
      "enum"
    >["nullable"]}, public`,
    TLength
  > {
    const clone = BorgNumberSchema.clone(this);
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

class BorgBooleanSchema<
  TOpts extends TypeOptions = "required, notNull, public",
> extends BorgSchema {
  #opts: InferOpts<TOpts> = {
    optional: false,
    nullable: false,
    private: false,
  } as any;

  constructor() {
    super();
  }

  static clone<const TBorg extends BorgBooleanSchema<any>>(
    borg: TBorg,
  ): TBorg {
    const clone = new BorgBooleanSchema();
    clone.#opts = borg.#opts;
    return clone as any;
  }

  parse(input: unknown): ApplyOpts<boolean, TOpts> {
    if (this.#opts.private) {
      return privateSymbol as any;
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

  optional(): BorgBooleanSchema<`optional, ${InferOpts<
    TOpts,
    "enum"
  >["nullable"]}, ${InferOpts<TOpts, "enum">["private"]}`> {
    const clone = BorgBooleanSchema.clone(this);
    clone.#opts.optional = true;
    return clone as any;
  }

  nullable(): BorgBooleanSchema<`${InferOpts<
    TOpts,
    "enum"
  >["optional"]}, nullable, ${InferOpts<TOpts, "enum">["private"]}`> {
    const clone = BorgBooleanSchema.clone(this);
    clone.#opts.nullable = true;
    return clone as any;
  }

  required(): BorgBooleanSchema<`required, ${InferOpts<
    TOpts,
    "enum"
  >["nullable"]}, ${InferOpts<TOpts, "enum">["private"]}`> {
    const clone = BorgBooleanSchema.clone(this);
    clone.#opts.optional = false;
    return clone as any;
  }

  notNull(): BorgBooleanSchema<`${InferOpts<
    TOpts,
    "enum"
  >["optional"]}, notNull, ${InferOpts<TOpts, "enum">["private"]}`> {
    const clone = BorgBooleanSchema.clone(this);
    clone.#opts.nullable = false;
    return clone as any;
  }

  nullish(): BorgBooleanSchema<`optional, nullable, ${InferOpts<
    TOpts,
    "enum"
  >["private"]}`> {
    const clone = BorgBooleanSchema.clone(this);
    clone.#opts.optional = true;
    clone.#opts.nullable = true;
    return clone as any;
  }

  notNullish(): BorgBooleanSchema<`required, notNull, ${InferOpts<
    TOpts,
    "enum"
  >["private"]}`> {
    const clone = BorgBooleanSchema.clone(this);
    clone.#opts.optional = false;
    clone.#opts.nullable = false;
    return clone as any;
  }

  private(): BorgBooleanSchema<`${InferOpts<
    TOpts,
    "enum"
  >["optional"]}, ${InferOpts<TOpts, "enum">["nullable"]}, private`> {
    const clone = BorgBooleanSchema.clone(this);
    clone.#opts.private = true;
    return clone as any;
  }

  public(): BorgBooleanSchema<`${InferOpts<
    TOpts,
    "enum"
  >["optional"]}, ${InferOpts<TOpts, "enum">["nullable"]}, public`> {
    const clone = BorgBooleanSchema.clone(this);
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

class BorgIdSchema<
  TOpts extends TypeOptions = "required, notNull, public",
  TFormat extends string | ObjectId = string,
> extends BorgSchema {
  #opts: InferOpts<TOpts> = {
    optional: false,
    nullable: false,
    private: false,
  } as any;
  #format: TFormat extends ObjectId ? false : true = true as any;

  constructor() {
    super();
  }

  static clone<const TBorg extends BorgIdSchema<any, any>>(
    borg: TBorg,
  ): TBorg {
    const clone = new BorgIdSchema();
    clone.#opts = borg.#opts;
    clone.#format = borg.#format as any;
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

  static fromHex = (val: string) => ObjectId.createFromHexString(val);

  parse(input: unknown): ApplyOpts<TFormat, TOpts> {
    if (this.#opts.private) {
      return privateSymbol as any;
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
        return this.#format ? input : (BorgIdSchema.fromHex(input) as any);
    }
    if (typeof input === "number") {
      const hex = input.toString(16);
      if (ObjectId.isValid(input))
        return this.#format ? hex : (BorgIdSchema.fromHex(hex) as any);
    }
    if (input instanceof Uint8Array) {
      const hex = Buffer.from(input).toString("hex");
      if (ObjectId.isValid(input))
        return this.#format ? hex : (BorgIdSchema.fromHex(hex) as any);
    }
    if (BorgIdSchema.isObjectIdLike(input)) {
      const hex = input.toHexString();
      if (ObjectId.isValid(input))
        return this.#format ? hex : (BorgIdSchema.fromHex(hex) as any);
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
    if (typeof input === "string") return BorgIdSchema.fromHex(input) as any;
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
    return BorgIdSchema.fromHex(input) as any;
  }

  optional(): BorgIdSchema<
    `optional, ${InferOpts<TOpts, "enum">["nullable"]}, ${InferOpts<
      TOpts,
      "enum"
    >["private"]}`,
    TFormat
  > {
    const clone = BorgIdSchema.clone(this);
    clone.#opts.optional = true;
    return clone as any;
  }

  nullable(): BorgIdSchema<
    `${InferOpts<TOpts, "enum">["optional"]}, nullable, ${InferOpts<
      TOpts,
      "enum"
    >["private"]}`,
    TFormat
  > {
    const clone = BorgIdSchema.clone(this);
    clone.#opts.nullable = true;
    return clone as any;
  }

  nullish(): BorgIdSchema<
    `optional, nullable, ${InferOpts<TOpts, "enum">["private"]}`,
    TFormat
  > {
    const clone = BorgIdSchema.clone(this);
    clone.#opts.optional = true;
    clone.#opts.nullable = true;
    return clone as any;
  }

  required(): BorgIdSchema<
    `required, ${InferOpts<TOpts, "enum">["nullable"]}, ${InferOpts<
      TOpts,
      "enum"
    >["private"]}`,
    TFormat
  > {
    const clone = BorgIdSchema.clone(this);
    clone.#opts.optional = false;
    return clone as any;
  }

  notNull(): BorgIdSchema<
    `${InferOpts<TOpts, "enum">["optional"]}, notNull, ${InferOpts<
      TOpts,
      "enum"
    >["private"]}`,
    TFormat
  > {
    const clone = BorgIdSchema.clone(this);
    clone.#opts.nullable = false;
    return clone as any;
  }

  notNullish(): BorgIdSchema<
    `required, notNull, ${InferOpts<TOpts, "enum">["private"]}`,
    TFormat
  > {
    const clone = BorgIdSchema.clone(this);
    clone.#opts.optional = false;
    clone.#opts.nullable = false;
    return clone as any;
  }

  private(): BorgIdSchema<
    `${InferOpts<TOpts, "enum">["optional"]}, ${InferOpts<
      TOpts,
      "enum"
    >["nullable"]}, private`,
    TFormat
  > {
    const clone = BorgIdSchema.clone(this);
    clone.#opts.private = true;
    return clone as any;
  }

  public(): BorgIdSchema<
    `${InferOpts<TOpts, "enum">["optional"]}, ${InferOpts<
      TOpts,
      "enum"
    >["nullable"]}, public`,
    TFormat
  > {
    const clone = BorgIdSchema.clone(this);
    clone.#opts.private = false;
    return clone as any;
  }

  asString(): BorgIdSchema<TOpts, string> {
    const clone = BorgIdSchema.clone(this);
    clone.#format = true as any;
    return clone as any;
  }

  asObjectId(): BorgIdSchema<TOpts, ObjectId> {
    const clone = BorgIdSchema.clone(this);
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

const B = {
  id: () => new BorgIdSchema(),
  string: () => new BorgStringSchema(),
  number: () => new BorgNumberSchema(),
  boolean: () => new BorgBooleanSchema(),
  array: <T extends BorgSchema>(item: T) => new BorgArraySchema(item),
  object: <T extends { [key: string]: BorgSchema }>(shape: T) =>
    new BorgObjectSchema(shape),
  borg: function model<
    const TInputSchema extends BorgObjectSchema<any, any>,
    const TOutputSchema extends BorgObjectSchema<any, any> = TInputSchema,
    TServerModel extends object = InferParsedType<TInputSchema>,
  >(
    schema: TInputSchema,
    transformInput?: (input: InferParsedType<TInputSchema>) => TServerModel,
    transformOutput?: (input: TServerModel) => InferParsedType<TOutputSchema>,
    outputSchema: TOutputSchema = schema as any,
  ) {
    return {
      createFromRequest: (input: unknown): TServerModel => {
        let parsed = schema.parse(input);
        parsed = transformInput?.(parsed as any) ?? parsed;
        return parsed as any;
      },
      sanitizeResponse: (
        input: TServerModel,
      ): InferParsedType<TOutputSchema> => {
        return outputSchema.parse(transformOutput?.(input) ?? input) as any;
      },
      serializeOutput: (
        parsedOutput: InferParsedType<TOutputSchema>,
      ): ReturnType<TOutputSchema["serialize"]> => {
        return outputSchema.serialize(parsedOutput) as any;
      },
      deserializeOutput: (
        serializedOutput: ReturnType<TOutputSchema["serialize"]>,
      ): ReturnType<TOutputSchema["deserialize"]> => {
        return outputSchema.deserialize(serializedOutput) as any;
      },
      serializeInput: (
        parsedInput: InferParsedType<TInputSchema>,
      ): ReturnType<TInputSchema["serialize"]> => {
        return schema.serialize(parsedInput) as any;
      },
      deserializeInput: (
        serializedInput: ReturnType<TInputSchema["serialize"]>,
      ): ReturnType<TInputSchema["deserialize"]> => {
        return schema.deserialize(serializedInput) as any;
      },
      parseInput: (input: unknown): InferParsedType<TInputSchema> => {
        return schema.parse(input) as any;
      },
      parseOutput: (input: unknown): InferParsedType<TOutputSchema> => {
        return outputSchema.parse(input) as any;
      },
    };
  },
};

declare namespace B {
  export type BorgId<
    TOpts extends TypeOptions,
    TFormat extends "string" | "oid",
  > = BorgIdSchema<TOpts, TFormat>;

  export type BorgString<
    TOpts extends TypeOptions,
    TLength extends [number | null, number | null] = [null, null],
    TPattern extends string = ".*",
  > = BorgStringSchema<TOpts, TLength, TPattern>;

  export type BorgNumber<
    TOpts extends TypeOptions,
    TLength extends [number | null, number | null] = [null, null],
  > = BorgNumberSchema<TOpts, TLength>;

  export type BorgBoolean<TOpts extends TypeOptions> = BorgBooleanSchema<TOpts>;

  export type BorgArray<
    TOpts extends TypeOptions,
    TItems extends BorgSchema,
    TLength extends [number | null, number | null] = [null, null],
  > = BorgArraySchema<TOpts, TLength, TItems>;

  export type BorgObject<
    TOpts extends TypeOptions,
    TShape extends { [key: string]: BorgSchema },
  > = BorgObjectSchema<TOpts, TShape>;

  export type Borg = BorgSchema;
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
        BorgObjectSchema<
          "required, notNull, public",
          {
            base: BorgStringSchema<
              "required, notNull, public",
              [null, null],
              ".*"
            >;
            optional: BorgStringSchema<
              "optional, notNull, public",
              [null, null],
              ".*"
            >;
            nullable: BorgStringSchema<
              "required, nullable, public",
              [null, null],
              ".*"
            >;
            nullish: BorgStringSchema<
              "optional, nullable, public",
              [null, null],
              ".*"
            >;
            optionalNullable: BorgStringSchema<
              "optional, nullable, public",
              [null, null],
              ".*"
            >;
            optionalRequired: BorgStringSchema<
              "required, notNull, public",
              [null, null],
              ".*"
            >;
            nullableOptional: BorgStringSchema<
              "optional, nullable, public",
              [null, null],
              ".*"
            >;
            nullableNotNull: BorgStringSchema<
              "required, notNull, public",
              [null, null],
              ".*"
            >;
            nullishNotNullish: BorgStringSchema<
              "required, notNull, public",
              [null, null],
              ".*"
            >;
            private: BorgStringSchema<
              "required, notNull, private",
              [null, null],
              ".*"
            >;
            privatePublic: BorgStringSchema<
              "required, notNull, public",
              [null, null],
              ".*"
            >;
            arbitraryChaining: BorgStringSchema<
              "required, nullable, public",
              [null, null],
              ".*"
            >;
          }
        >
      >(stringTestObject);

      assertType<
        BorgObjectSchema<
          "required, notNull, public",
          {
            base: BorgNumberSchema<"required, notNull, public", [null, null]>;
            optional: BorgNumberSchema<
              "optional, notNull, public",
              [null, null]
            >;
            nullable: BorgNumberSchema<
              "required, nullable, public",
              [null, null]
            >;
            nullish: BorgNumberSchema<
              "optional, nullable, public",
              [null, null]
            >;
            optionalNullable: BorgNumberSchema<
              "optional, nullable, public",
              [null, null]
            >;
            optionalRequired: BorgNumberSchema<
              "required, notNull, public",
              [null, null]
            >;
            nullableOptional: BorgNumberSchema<
              "optional, nullable, public",
              [null, null]
            >;
            nullableNotNull: BorgNumberSchema<
              "required, notNull, public",
              [null, null]
            >;
            nullishNotNullish: BorgNumberSchema<
              "required, notNull, public",
              [null, null]
            >;
            private: BorgNumberSchema<
              "required, notNull, private",
              [null, null]
            >;
            privatePublic: BorgNumberSchema<
              "required, notNull, public",
              [null, null]
            >;
            arbitraryChaining: BorgNumberSchema<
              "required, nullable, public",
              [null, null]
            >;
          }
        >
      >(numberTestObject);

      assertType<
        BorgObjectSchema<
          "required, notNull, public",
          {
            strings: BorgObjectSchema<
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
            numbers: BorgObjectSchema<
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
        BorgObjectSchema<
          "required, notNull, public",
          {
            withProperties: BorgObjectSchema<
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
            withoutProperties: BorgObjectSchema<
              "required, notNull, public",
              {}
            >;
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
