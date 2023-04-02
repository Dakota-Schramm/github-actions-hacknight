import type * as _ from ".";

export type BsonSchema<TMeta extends _.Meta> = _.PrettyPrint<
  TMeta extends _.UnionMeta<
    infer TFlags extends _.Flags,
    infer TBorgs extends _.Borg[]
  >
    ? UnionBsonSchema<_.UnionMeta<TFlags, TBorgs>>
    : TMeta extends _.ObjectMeta<
        infer TFlags extends _.Flags,
        infer TOtherProps extends "strict" | "strip" | "passthrough" | _.Borg,
        infer TShape extends { [k in infer _k]: infer _b extends _.Borg }
      >
    ? ObjectBsonSchema<_.ObjectMeta<TFlags, TOtherProps, TShape>>
    : TMeta extends _.ArrayMeta<
        infer TFlags extends _.Flags,
        infer TMinMax extends _.MinMax,
        infer TItems
      >
    ? ArrayBsonSchema<_.ArrayMeta<TFlags, TMinMax, TItems>>
    : TMeta extends _.IdMeta<
        infer TFlags extends _.Flags,
        infer TFormat extends string | _.ObjectId
      >
    ? IdBsonSchema<_.IdMeta<TFlags, TFormat>>
    : TMeta extends _.NumberMeta<
        infer TFlags extends _.Flags,
        infer TMinMax extends _.MinMax
      >
    ? NumberBsonSchema<_.NumberMeta<TFlags, TMinMax>>
    : TMeta extends _.StringMeta<
        infer TFlags extends _.Flags,
        infer TMinMax extends _.MinMax,
        infer TPattern extends string
      >
    ? StringBsonSchema<_.StringMeta<TFlags, TMinMax, TPattern>>
    : TMeta extends _.BooleanMeta<infer TFlags extends _.Flags>
    ? BooleanBsonSchema<_.BooleanMeta<TFlags>>
    : never
>;

type UnionBsonSchema<TMeta extends Extract<_.Meta, { kind: "union" }>> = {
  oneOf: [
    ...TMeta["borgMembers"][number]["bsonSchema"][],
    ...(TMeta["nullable"] extends true ? [{ bsonType: "null" }] : [])
  ];
};

type IdBsonSchema<TMeta extends Extract<_.Meta, { kind: "id" }>> = {
  bsonType: TMeta["nullable"] extends true ? ["objectId", "null"] : "objectId";
};

type ObjectBsonSchema<TMeta extends Extract<_.Meta, { kind: "object" }>> = {
  bsonType: TMeta["nullable"] extends true ? ["object", "null"] : "object";
  required: TMeta["requiredKeys"];
  properties: {
    [k in keyof TMeta["borgShape"]]: TMeta["borgShape"][k]["bsonSchema"];
  };
} & (TMeta["additionalProperties"] extends "strict" | "strip"
  ? { additionalProperties: false }
  : TMeta["additionalProperties"] extends _.Borg
  ? { additionalProperties: TMeta["additionalProperties"]["bsonSchema"] }
  : {});

type ArrayBsonSchema<TMeta extends Extract<_.Meta, { kind: "array" }>> = {
  bsonType: TMeta["nullable"] extends true ? ["array", "null"] : "array";
  items: TMeta["borgItems"]["bsonSchema"];
} & (TMeta["minItems"] extends number ? { minItems: TMeta["minItems"] } : {}) &
  (TMeta["maxItems"] extends number ? { maxItems: TMeta["maxItems"] } : {});

type NumberBsonSchema<TMeta extends Extract<_.Meta, { kind: "number" }>> = {
  bsonType: TMeta["nullable"] extends true ? ["number", "null"] : "number";
} & (TMeta["min"] extends number ? { minimum: TMeta["min"] } : {}) &
  (TMeta["max"] extends number ? { maximum: TMeta["max"] } : {});

type StringBsonSchema<TMeta extends _.StringMeta<_.Flags, _.MinMax, string>> = {
  bsonType: TMeta["nullable"] extends true ? ["string", "null"] : "string";
} & (TMeta["minLength"] extends number
  ? { minLength: TMeta["minLength"] }
  : {}) &
  (TMeta["maxLength"] extends number ? { maxLength: TMeta["maxLength"] } : {}) &
  (TMeta["pattern"] extends ".*" ? {} : { pattern: TMeta["pattern"] });

type BooleanBsonSchema<TMeta extends Extract<_.Meta, { kind: "boolean" }>> = {
  bsonType: TMeta["nullable"] extends true ? ["bool", "null"] : "bool";
};

/* c8 ignore start */
//@ts-expect-error - Vite handles this import.meta check
if (import.meta.vitest) {
  const [
    { describe, it }
    //@ts-expect-error - Vite handles this top-level await... I'm using a syntax hack to keep it to 1 ts-ignore directive
  ] = await Promise.all([import("vitest")]);

  describe.todo("BsonSchema Type Helpers", () => {
    it("should produce the expected types", () => {});
  });
}
/* c8 ignore stop */
