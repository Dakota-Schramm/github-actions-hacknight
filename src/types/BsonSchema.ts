import { Borg } from "../Borg";

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
    ...(TMeta["nullable"] extends true ? [{ bsonType: "null" }] : []),
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

export function getBsonSchema<const TMeta extends _.Meta>(
  meta: TMeta,
): BsonSchema<TMeta> {
  switch (meta.kind) {
    case "union": {
      const { nullable, borgMembers } = meta;
      return Object.freeze({
        oneOf: [
          ...borgMembers.map(m => m.bsonSchema),
          ...(nullable ? [{ bsonType: "null" }] : []),
        ],
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
      const { minItems, maxItems, nullable, borgItems } = meta;
      return {
        bsonType: nullable ? Object.freeze(["array", "null"]) : "array",
        items: borgItems.bsonSchema,
        ...(minItems !== null ? { minItems } : {}),
        ...(maxItems !== null ? { maxItems } : {}),
      } as any;
    }
    case "object": {
      const { nullable, borgShape, requiredKeys, additionalProperties } = meta;
      const properties = Object.fromEntries(
        Object.entries(borgShape).map(([key, value]) => [
          key,
          value.bsonSchema,
        ]),
      );

      return {
        bsonType: nullable ? Object.freeze(["object", "null"]) : "object",
        ...(Object.keys(properties).length > 0
          ? { properties: Object.freeze(properties) }
          : {}),
        ...(requiredKeys.length > 0
          ? { required: Object.freeze([...requiredKeys]) }
          : {}),
        ...(additionalProperties === "strict" ||
        additionalProperties === "strip"
          ? { additionalProperties: false }
          : {}),
        ...(additionalProperties instanceof Borg
          ? { additionalProperties: additionalProperties.bsonSchema }
          : {}),
      } as any;
    }
    case "boolean": {
      const { nullable } = meta;
      return {
        bsonType: nullable ? Object.freeze(["boolean", "null"]) : "boolean",
      } as any;
    }
    case "id": {
      const { nullable } = meta;
      return {
        bsonType: nullable ? Object.freeze(["objectId", "null"]) : "objectId",
      } as any;
    }
  }
}

/* c8 ignore start */
//@ts-expect-error - Vite handles this import.meta check
if (import.meta.vitest) {
  //@ts-expect-error - Vite handles this top-level await
  const [{ describe, it, expect }, { default: B }] = await Promise.all([
    import("vitest"),
    import("src"),
  ]);

  describe("getBsonSchema", () => {
    it("should return the correct schema for a union", () => {
      const borg = B.union(B.string(), B.number().nullable(), B.boolean());

      const schema = getBsonSchema(borg.meta);
      expect(schema).toEqual({
        oneOf: [
          { bsonType: "string" },
          { bsonType: ["double", "null"] },
          { bsonType: "boolean" },
        ],
      });

      const schema2 = getBsonSchema(borg.nullable().meta);
      expect(schema2).toEqual({
        oneOf: [
          { bsonType: "string" },
          { bsonType: ["double", "null"] },
          { bsonType: "boolean" },
          { bsonType: "null" },
        ],
      });

      const schema3 = getBsonSchema(borg.nullish().notNull().meta);
      expect(schema3).toEqual({
        oneOf: [
          { bsonType: "string" },
          { bsonType: ["double", "null"] },
          { bsonType: "boolean" },
        ],
      });
    });

    it("should return the correct schema for a string", () => {
      const borg = B.string().minLength(5).maxLength(10);

      const schema = getBsonSchema(borg.meta);
      expect(schema).toEqual({
        bsonType: "string",
        minLength: 5,
        maxLength: 10,
      });

      const schema2 = getBsonSchema(borg.length(11).pattern("^a$").meta);
      expect(schema2).toEqual({
        bsonType: "string",
        minLength: 11,
        maxLength: 11,
        pattern: "^a$",
      });

      const schema3 = getBsonSchema(
        borg.pattern("^a$").length(null).pattern(null).nullable().meta,
      );
      expect(schema3).toEqual({
        bsonType: ["string", "null"],
      });
    });

    it("should return the correct schema for a number", () => {
      const borg = B.number().min(5).max(10);

      const schema = getBsonSchema(borg.meta);
      expect(schema).toEqual({
        bsonType: "double",
        minimum: 5,
        maximum: 10,
      });

      const schema2 = getBsonSchema(
        borg.min(null).max(null).nullish().required().meta,
      );
      expect(schema2).toEqual({
        bsonType: ["double", "null"],
      });
    });

    it("should return the correct schema for a boolean", () => {
      const borg = B.boolean();

      const schema = getBsonSchema(borg.meta);
      expect(schema).toEqual({
        bsonType: "boolean",
      });

      const schema2 = getBsonSchema(borg.nullable().meta);
      expect(schema2).toEqual({
        bsonType: ["boolean", "null"],
      });
    });

    it("should return the correct schema for an id", () => {
      const borg = B.id();

      const schema = getBsonSchema(borg.meta);
      expect(schema).toEqual({
        bsonType: "objectId",
      });

      const schema2 = getBsonSchema(borg.nullable().meta);
      expect(schema2).toEqual({
        bsonType: ["objectId", "null"],
      });
    });

    it("should return the correct schema for an array", () => {
      const borg = B.array(B.string().minLength(5).maxLength(10))
        .minLength(1)
        .maxLength(5);
      const schema = getBsonSchema(borg.meta);
      expect(schema).toEqual({
        bsonType: "array",
        items: {
          bsonType: "string",
          minLength: 5,
          maxLength: 10,
        },
        minItems: 1,
        maxItems: 5,
      });

      const schema2 = getBsonSchema(
        borg.minLength(null).maxLength(null).nullable().meta,
      );
      expect(schema2).toEqual({
        bsonType: ["array", "null"],
        items: {
          bsonType: "string",
          minLength: 5,
          maxLength: 10,
        },
      });
    });

    it("should return the correct schema for an object", () => {
      const borg = B.object({
        a: B.string().minLength(5).maxLength(10),
        b: B.number().min(5).max(10),
        c: B.boolean(),
        d: B.id(),
        e: B.array(B.string().minLength(5).maxLength(10))
          .minLength(1)
          .maxLength(5),
        f: B.object({
          g: B.string().minLength(5).maxLength(10),
          h: B.number().min(5).max(10).optional(),
          i: B.object({}).additionalProperties(B.string().pattern("^a$")),
          j: B.object({}).additionalProperties("passthrough").nullable(),
        }).additionalProperties("strip"),
        k: B.string().optional(),
      }).additionalProperties("strict");

      const schema = getBsonSchema(borg.meta);
      expect(schema).toEqual({
        bsonType: "object",
        properties: {
          a: {
            bsonType: "string",
            minLength: 5,
            maxLength: 10,
          },
          b: {
            bsonType: "double",
            minimum: 5,
            maximum: 10,
          },
          c: {
            bsonType: "boolean",
          },
          d: {
            bsonType: "objectId",
          },
          e: {
            bsonType: "array",
            items: {
              bsonType: "string",
              minLength: 5,
              maxLength: 10,
            },
            minItems: 1,
            maxItems: 5,
          },
          f: {
            bsonType: "object",
            properties: {
              g: {
                bsonType: "string",
                minLength: 5,
                maxLength: 10,
              },
              h: {
                bsonType: "double",
                minimum: 5,
                maximum: 10,
              },
              i: {
                bsonType: "object",
                additionalProperties: {
                  bsonType: "string",
                  pattern: "^a$",
                },
              },
              j: {
                bsonType: ["object", "null"],
              },
            },
            additionalProperties: false,
            required: ["g", "i", "j"],
          },
          k: {
            bsonType: "string",
          },
        },
        additionalProperties: false,
        required: ["a", "b", "c", "d", "e", "f"],
      });
    });
  });
}

/* c8 ignore stop */
