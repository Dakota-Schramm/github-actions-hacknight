import { ObjectId } from "bson";
import { Flags, MinMax, Borg, Meta, PrettyPrint, ObjectMeta, ArrayMeta, BooleanMeta, IdMeta, NumberMeta, StringMeta, UnionMeta } from ".";

export type BsonSchema<TMeta extends Meta> = PrettyPrint<
TMeta extends UnionMeta<infer TFlags extends Flags, infer TBorgs extends Borg[]>
? UnionBsonSchema<UnionMeta<TFlags, TBorgs>> :
  TMeta extends ObjectMeta<infer TFlags extends Flags, infer TShape extends {[k in infer _k]: infer _b extends Borg}>
    ? ObjectBsonSchema<ObjectMeta<TFlags, TShape>>
    : TMeta extends ArrayMeta<infer TFlags extends Flags, infer TMinMax extends MinMax, infer TItems>
    ? ArrayBsonSchema<ArrayMeta<TFlags, TMinMax, TItems>>
    : TMeta extends IdMeta<infer TFlags extends Flags, infer TFormat extends string | ObjectId>
    ? IdBsonSchema<IdMeta<TFlags, TFormat>>
    : TMeta extends NumberMeta<infer TFlags extends Flags, infer TMinMax extends MinMax>
    ? NumberBsonSchema<NumberMeta<TFlags, TMinMax>>
    : TMeta extends StringMeta<infer TFlags extends Flags, infer TMinMax extends MinMax, infer TPattern extends string>
    ? StringBsonSchema<StringMeta<TFlags, TMinMax, TPattern>>
    : TMeta extends BooleanMeta<infer TFlags extends Flags>
    ? BooleanBsonSchema<BooleanMeta<TFlags>>
    : never
>;

type UnionBsonSchema<TMeta extends Extract<Meta, { kind: "union" }>> = {
  oneOf: [...TMeta["borgMembers"][number]["bsonSchema"][], ...(TMeta["nullable"] extends true ? [{ bsonType: "null" }] : [])];
};

type IdBsonSchema<TMeta extends Extract<Meta, { kind: "id" }>> = {
  bsonType: TMeta["nullable"] extends true ? ["objectId", "null"] : "objectId";
};

type ObjectBsonSchema<TMeta extends Extract<Meta, { kind: "object" }>> = {
  bsonType: TMeta["nullable"] extends true ? ["object", "null"] : "object";
  required: TMeta["requiredKeys"];
  properties: {
    [k in keyof TMeta["borgShape"]]: TMeta["borgShape"][k]["bsonSchema"];
  };
};

type ArrayBsonSchema<TMeta extends Extract<Meta, { kind: "array" }>> = {
  bsonType: TMeta["nullable"] extends true ? ["array", "null"] : "array";
  items: TMeta["borgItems"]["bsonSchema"];
} & (TMeta["minItems"] extends number ? { minItems: TMeta["minItems"] } : {}) &
  (TMeta["maxItems"] extends number ? { maxItems: TMeta["maxItems"] } : {});

type NumberBsonSchema<TMeta extends Extract<Meta, { kind: "number" }>> = {
  bsonType: TMeta["nullable"] extends true ? ["number", "null"] : "number";
} & (TMeta["min"] extends number ? { minimum: TMeta["min"] } : {}) &
  (TMeta["max"] extends number ? { maximum: TMeta["max"] } : {});

type StringBsonSchema<TMeta extends StringMeta<Flags, MinMax, string>> = {
  bsonType: TMeta["nullable"] extends true ? ["string", "null"] : "string";
} & (TMeta["minLength"] extends number
  ? { minLength: TMeta["minLength"] }
  : {}) &
  (TMeta["maxLength"] extends number ? { maxLength: TMeta["maxLength"] } : {}) &
  (TMeta["pattern"] extends ".*" ? {} : { pattern: TMeta["pattern"] });

type BooleanBsonSchema<TMeta extends Extract<Meta, { kind: "boolean" }>> = {
  bsonType: TMeta["nullable"] extends true ? ["bool", "null"] : "bool";
};

export function getBsonSchema<const TMeta extends Meta>(
  meta: TMeta
): BsonSchema<TMeta> {
  switch (meta.kind) {
    case "union": {
        const { nullable, borgMembers } = meta;
        return Object.freeze({
            oneOf: [...borgMembers.map((m) => getBsonSchema(m.meta)), ...(nullable ? [{ bsonType: "null" }] : [])],
        }) as any;
    }
    case "string": {
      const { minLength: min, maxLength: max, nullable, regex } = meta;
      return Object.freeze({
        bsonType: nullable ? Object.freeze(["string", "null"]) : "string",
        ...(min !== null ? { minLength: min } : {}),
        ...(max !== null ? { maxLength: max } : {}),
        ...(regex ? { pattern: regex.source } : {}),
      }) as any;
    }
    case "number": {
      const { min, max, nullable } = meta;
      return {
        bsonType: nullable ? Object.freeze(["double", "null"]) : "double",
        ...(min !== null ? { minimum: min } : {}),
        ...(max !== null ? { maximum: max } : {}),
      } as any;
    }
    case "array": {
      const { minItems, maxItems, nullable, borgItems: itemsBorg } = meta;
      return {
        bsonType: nullable ? Object.freeze(["array", "null"]) : "array",
        items: itemsBorg.bsonSchema,
        ...(minItems !== null ? { minItems } : {}),
        ...(maxItems !== null ? { maxItems } : {}),
      } as any;
    }
    case "object": {
      const { nullable, borgShape: shape, requiredKeys } = meta;
      return {
        bsonType: nullable ? Object.freeze(["object", "null"]) : "object",
        required: Object.freeze([...requiredKeys]),
        properties: Object.fromEntries(
          Object.entries(shape).map(([key, value]) => [key, value.bsonSchema]),
        ),
      } as any;
    }
    case "boolean": {
      const { nullable } = meta;
      return {
        bsonType: nullable ? Object.freeze(["bool", "null"]) : "bool",
      } as any;
    }
    case "id": {
      const { nullable } = meta;
      return {
        bsonType: nullable ? Object.freeze(["objectId", "null"]) : "objectId",
      } as any;
    }
    default: {
      throw new Error("unreachable");
    }
  }
}
