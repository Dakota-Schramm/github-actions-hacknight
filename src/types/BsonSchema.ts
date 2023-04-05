import type * as _ from ".";

export type BsonSchema<TMeta extends _.Meta> = _.PrettyPrint<
  TMeta extends {
    kind: "string";
    nullable: infer TNullable;
    optional: infer TOptional;
    private: infer TPrivate;
    minLength: infer TMinLength extends number | null;
    maxLength: infer TMaxLength extends number | null;
    pattern: infer TPattern extends string | null;
  }
    ? StringBsonSchema<
        _.StringMeta<
          [
            TOptional extends true ? "optional" : "required",
            TNullable extends true ? "nullable" : "notNull",
            TPrivate extends true ? "private" : "public"
          ],
          [TMinLength, TMaxLength],
          TPattern extends string ? TPattern : ".*"
        >
      >
    : TMeta extends {
        kind: "number";
        nullable: infer TNullable;
        optional: infer TOptional;
        private: infer TPrivate;
        min: infer TMin extends number | null;
        max: infer TMax extends number | null;
      }
    ? NumberBsonSchema<
        _.NumberMeta<
          [
            TOptional extends true ? "optional" : "required",
            TNullable extends true ? "nullable" : "notNull",
            TPrivate extends true ? "private" : "public"
          ],
          [TMin, TMax]
        >
      >
    : TMeta extends {
        kind: "union";
        nullable: infer TNullable;
        optional: infer TOptional;
        private: infer TPrivate;
        borgMembers: infer TBorgs extends _.Borg[];
      }
    ? UnionBsonSchema<
        _.UnionMeta<
          [
            TOptional extends true ? "optional" : "required",
            TNullable extends true ? "nullable" : "notNull",
            TPrivate extends true ? "private" : "public"
          ],
          TBorgs
        >
      >
    : TMeta extends {
        kind: "object";
        nullable: infer TNullable;
        optional: infer TOptional;
        private: infer TPrivate;
        additionalProperties: infer TAdditionalProperties extends
          | _.Borg
          | "passthrough"
          | "strict"
          | "strip";
        borgShape: infer TShape extends { [key: string]: _.Borg };
      }
    ? ObjectBsonSchema<
        _.ObjectMeta<
          [
            TOptional extends true ? "optional" : "required",
            TNullable extends true ? "nullable" : "notNull",
            TPrivate extends true ? "private" : "public"
          ],
          TAdditionalProperties,
          TShape
        >
      >
    : TMeta extends {
        kind: "array";
        nullable: infer TNullable;
        optional: infer TOptional;
        private: infer TPrivate;
        borgItems: infer TItems extends _.Borg;
        minItems: infer TMin extends number | null;
        maxItems: infer TMax extends number | null;
      }
    ? ArrayBsonSchema<
        _.ArrayMeta<
          [
            TOptional extends true ? "optional" : "required",
            TNullable extends true ? "nullable" : "notNull",
            TPrivate extends true ? "private" : "public"
          ],
          [TMin, TMax],
          TItems
        >
      >
    : TMeta extends {
        kind: "id";
        nullable: infer TNullable;
        optional: infer TOptional;
        private: infer TPrivate;
        format: infer TFormat extends "string" | "oid";
      }
    ? IdBsonSchema<
        _.IdMeta<
          [
            TOptional extends true ? "optional" : "required",
            TNullable extends true ? "nullable" : "notNull",
            TPrivate extends true ? "private" : "public"
          ],
          TFormat
        >
      >
    : TMeta extends {
        kind: "boolean";
        nullable: infer TNullable;
        optional: infer TOptional;
        private: infer TPrivate;
      }
    ? BooleanBsonSchema<
        _.BooleanMeta<
          [
            TOptional extends true ? "optional" : "required",
            TNullable extends true ? "nullable" : "notNull",
            TPrivate extends true ? "private" : "public"
          ]
        >
      >
    : never
>;

type UnionBsonSchema<TMeta extends Extract<_.Meta, { kind: "union" }>> = {
  oneOf: (TMeta["borgMembers"][number]["bsonSchema"] | (TMeta["nullable"] extends true ? { bsonType: "null" } : never))[];
};

type IdBsonSchema<TMeta extends Extract<_.Meta, { kind: "id" }>> = {
  bsonType: TMeta["nullable"] extends true ? ["objectId", "null"] : "objectId";
};

type ObjectBsonSchema<TMeta extends Extract<_.Meta, { kind: "object" }>> = {
  bsonType: TMeta["nullable"] extends true ? ["object", "null"] : "object";
} & (TMeta["requiredKeys"] extends never[]
  ? {}
  : { required: TMeta["requiredKeys"] }) &
  ({} extends TMeta["borgShape"]
    ? {}
    : {
        properties: {
          [k in keyof TMeta["borgShape"]]: TMeta["borgShape"][k]["bsonSchema"];
        };
      }) &
  (TMeta["additionalProperties"] extends "strict" | "strip"
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

type StringBsonSchema<TMeta extends Extract<_.Meta, { kind: "string" }>> = {
  bsonType: TMeta["nullable"] extends true ? ["string", "null"] : "string";
} & (TMeta["minLength"] extends number
  ? { minLength: TMeta["minLength"] }
  : {}) &
  (TMeta["maxLength"] extends number ? { maxLength: TMeta["maxLength"] } : {}) &
  (TMeta["pattern"] extends null ? {} : { pattern: TMeta["pattern"] });

type BooleanBsonSchema<TMeta extends Extract<_.Meta, { kind: "boolean" }>> = {
  bsonType: TMeta["nullable"] extends true ? ["bool", "null"] : "bool";
};

/* c8 ignore start */
//@ts-expect-error - Vite handles this import.meta check
if (import.meta.vitest) {
  const [
    { describe, it, assertType },
    { default: b }
    //@ts-expect-error - Vite handles this top-level await... I'm using a syntax hack to keep it to 1 ts-ignore directive
  ] = await Promise.all([import("vitest"), import("../")]);

  const TestCase = b.object({
    a: b.object({
      b: b
        .string()
        .minLength(5)
        .maxLength(10)
        .pattern("C:\\\\User\\\\.+\\.txt"),
      c: b
        .string()
        .length(1, 2)
        .pattern("C:\\\\User\\\\.+\\.txt")
        .pattern(null),
      d: b.string().minLength(1).nullable(),
      e: b.string().maxLength(1).maxLength(null).nullable().optional(),
      f: b.string().length(2).nullable(),
      g: b.string()
    }),
    h: b.object({
      i: b.number().min(1).max(2).nullable(),
      j: b.number().min(1).min(null).nullable(),
      k: b.number().range(2, 5).optional(),
      l: b.number().range(5, 9).min(null).nullable(),
      m: b.number().min(0),
      n: b.number()
    }),
    o: b
      .object({
        p: b.boolean().nullable(),
        r: b.boolean()
      })
      .optional(),
    s: b.object({
      t: b
        .array(
          b
            .string()
            .minLength(5)
            .maxLength(10)
            .pattern("C:\\\\User\\\\.+\\.txt")
        )
        .nullable(),
      u: b
        .array(
          b
            .object({})
            .additionalProperties(
              b
                .string()
                .minLength(5)
                .maxLength(10)
                .pattern("C:\\\\User\\\\.+\\.txt")
                .optional()
            )
        )
        .nullable(),
      v: b.array(b.string().minLength(1).nullable()),
      w: b.array(b.string().maxLength(1).maxLength(null).nullable()),
      x: b.array(b.string().length(2).nullable()).optional(),
      y: b.array(b.string()),
      z: b.array(b.string().nullable())
    }),
    aa: b.object({
      bb: b.id().nullable(),
      cc: b.id().optional(),
      dd: b.id().asObjectId().nullish(),
      ee: b.id().asString().nullable()
    }),
    ff: b.object({
      gg: b
        .union(
          b.string(),
          b.number().optional(),
          b.boolean(),
          b.id(),
          b.array(b.string()),
          b.object({ hh: b.array(b.string()) }).additionalProperties("strict")
        )
        .nullable(),
      ii: b
        .union(
          b.object({ jj: b.string() }).additionalProperties("passthrough"),
          b.object({ jj: b.number() }).additionalProperties("strict").optional()
        )
        .nullish()
    })
  });

  describe.todo("String BsonSchemas", () => {
    it("should produce the correct bsonschema for strings", () => {
      assertType<BsonSchema<(typeof TestCase)["meta"]>>({
        bsonType: "object",
        required: ["a", "h", "s", "aa", "ff"],
        properties: {
          a: {
            bsonType: "object",
            required: ["b", "c", "d", "f", "g"],
            properties: {
              b: {
                bsonType: "string",
                minLength: 5,
                maxLength: 10,
                pattern: "C:\\\\User\\\\.+\\.txt"
              },
              c: {
                bsonType: "string",
                minLength: 1,
                maxLength: 2
              },
              d: {
                bsonType: ["string", "null"],
                minLength: 1
              },
              e: {
                bsonType: ["string", "null"]
              },
              f: {
                bsonType: ["string", "null"],
                minLength: 2,
                maxLength: 2
              },
              g: {
                bsonType: "string"
              }
            },
            additionalProperties: false
          },
          h: {
            bsonType: "object",
            required: ["i", "j", "l", "m", "n"],
            properties: {
              i: {
                bsonType: ["number", "null"],
                minimum: 1,
                maximum: 2
              },
              j: {
                bsonType: ["number", "null"]
              },
              k: {
                bsonType: "number",
                minimum: 2,
                maximum: 5
              },
              l: {
                bsonType: ["number", "null"],
                maximum: 9
              },
              m: {
                bsonType: "number",
                minimum: 0
              },
              n: {
                bsonType: "number"
              }
            },
            additionalProperties: false
          },
          o: {
            bsonType: "object",
            required: ["p", "r"],
            properties: {
              p: {
                bsonType: ["bool", "null"]
              },
              r: {
                bsonType: "bool"
              }
            },
            additionalProperties: false
          },
          s: {
            bsonType: "object",
            required: ["t", "u", "v", "w", "y", "z"],
            properties: {
              t: {
                bsonType: ["array", "null"],
                items: {
                  bsonType: "string",
                  minLength: 5,
                  maxLength: 10,
                  pattern: "C:\\\\User\\\\.+\\.txt"
                }
              },
              u: {
                bsonType: ["array", "null"],
                items: {
                  bsonType: "object",
                  additionalProperties: {
                    bsonType: "string",
                    minLength: 5,
                    maxLength: 10,
                    pattern: "C:\\\\User\\\\.+\\.txt"
                  }
                }
              },
              v: {
                bsonType: "array",
                items: {
                  bsonType: ["string", "null"],
                  minLength: 1
                }
              },
              w: {
                bsonType: "array",
                items: {
                  bsonType: ["string", "null"]
                }
              },
              x: {
                bsonType: "array",
                items: {
                  bsonType: ["string", "null"],
                  minLength: 2,
                  maxLength: 2
                }
              },
              y: {
                bsonType: "array",
                items: {
                  bsonType: "string"
                }
              },
              z: {
                bsonType: "array",
                items: {
                  bsonType: ["string", "null"]
                }
              }
            },
            additionalProperties: false
          },
          aa: {
            bsonType: "object",
            required: ["bb", "ee"],
            properties: {
              bb: {
                bsonType: ["objectId", "null"]
              },
              cc: {
                bsonType: "objectId"
              },
              dd: {
                bsonType: ["objectId", "null"]
              },
              ee: {
                bsonType: ["objectId", "null"]
              }
            },
            additionalProperties: false
          },
          ff: {
            bsonType: "object",
            required: ["gg", "ii"],
            properties: {
              gg: {
                oneOf: [
                  {
                    bsonType: "string"
                  },
                  {
                    bsonType: "number"
                  },
                  {
                    bsonType: "bool"
                  },
                  {
                    bsonType: "objectId"
                  },
                  {
                    bsonType: "array",
                    items: {
                      bsonType: "string"
                    }
                  },
                  {
                    bsonType: "object",
                    properties: {
                      hh: {
                        bsonType: "array",
                        items: {
                          bsonType: "string"
                        },
                      }
                    },
                    additionalProperties: false,
                  },
                  {
                    bsonType: "null"
                  },
                ]
              },
              ii: {
                bsonType: ["object", "null"],
                required: ["jj"],
                properties: {
                  jj: {
                    bsonType: ["string", "number"]
                  }
                },
                additionalProperties: {
                  bsonType: ["string", "number"]
                }
              }
            }
          }
        }
      });
    });
  });
}
/* c8 ignore stop */
