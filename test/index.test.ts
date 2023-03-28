import B from "src/index";
import { expect, it, describe } from "vitest";

const string = B.string();
const number = B.number();
const boolean = B.boolean();
const oid = B.id();

const obj1 = B.object({
  str: string.optional(),
  num: number.optional(),
  bool: boolean.optional(),
  id: oid.optional(),
});

const arr1 = B.array(obj1);
const strArr = B.array(string);
const numArr = B.array(number);
const boolArr = B.array(boolean);
const oidArr = B.array(oid);
const arr1arr = B.array(arr1);

const obj2 = B.object({
  obj1,
  arr1,
  arr1arr,
  strArr: strArr.optional(),
  numArr,
  boolArr,
  oidArr,
})

const tried = obj2.try({})
if (tried.ok) {
  console.log(tried.meta)
}

const makeOptionalRecursive = (schema: B.Borg): B.Borg => {
  if (schema.meta.kind === "object") {
    const out = B.object(
      Object.fromEntries(
        Object.entries(schema.meta.borgShape).map(([key, value]) => [
          key,
          makeOptionalRecursive(value),
        ]),
      ),
    );
    if (schema.meta.nullable) {
      return schema.meta.private ? out.private().nullable() : out.nullable();
    }
    return schema.meta.private ? out.private() : out;
  } else if (schema.meta.kind === "array") {
    const out = B.array(makeOptionalRecursive(schema.meta.borgItems));
    if (schema.meta.nullable) {
      return schema.meta.private ? out.private().nullable() : out.nullable();
    }
    return schema.meta.private ? out.private() : out;
  }
  return schema.optional();
};

const makeNullableRecursive = (schema: B.Borg): B.Borg => {
  if (schema.meta.kind === "object") {
    return B.object(
      Object.fromEntries(
        Object.entries(schema.meta.borgShape).map(([key, value]) => [
          key,
          makeNullableRecursive(value),
        ]),
      ),
    ).nullable();
  } else if (schema.meta.kind === "array") {
    return B.array(makeNullableRecursive(schema.meta.borgItems)).nullable();
  }
  return schema.nullable();
};

describe("Scalars", () => {
  it("Should parse valid values", () => {
    const mocks = [
      { value: "hello", schema: string },
      { value: 123, schema: number },
      { value: true, schema: boolean },
      { value: "5f9b1b9b9c9c2b0b8c8c8c8c", schema: oid },
    ];

    for (const { value, schema } of mocks) {
      expect(schema.parse(value)).toEqual(value);
      expect(() => schema.parse(null)).toThrow;
      expect(() => schema.parse(undefined)).toThrow;
      let nullable = schema.nullable();
      expect(nullable.parse(value)).toEqual(value);
      expect(nullable.parse(null)).toBeNull();
      expect(() => nullable.parse(undefined)).toThrow();
      let optional = schema.optional();
      expect(optional.parse(value)).toEqual(value);
      expect(() => optional.parse(null)).toThrow();
      expect(optional.parse(undefined)).toBeUndefined();
      let nullish = schema.nullish();
      expect(nullish.parse(value)).toEqual(value);
      expect(nullish.parse(null)).toBeNull();
      expect(nullish.parse(undefined)).toBeUndefined();
      let optionalNullable = schema.optional().nullable();
      expect(optionalNullable.parse(value)).toEqual(value);
      expect(optionalNullable.parse(null)).toBeNull();
      expect(optionalNullable.parse(undefined)).toBeUndefined();
      let nullableOptional = schema.nullable().optional();
      expect(nullableOptional.parse(value)).toEqual(value);
      expect(nullableOptional.parse(null)).toBeNull();
      expect(nullableOptional.parse(undefined)).toBeUndefined();
      let priv = schema.private();
      expect(priv.parse(value)).toEqual(value);
      expect(() => priv.parse(null)).toThrow();
      expect(() => priv.parse(undefined)).toThrow();
      let privNullable = schema.private().nullable();
      expect(privNullable.parse(value)).toEqual(value);
      expect(privNullable.parse(null)).toBeNull();
      expect(() => privNullable.parse(undefined)).toThrow();
      let privOptional = schema.private().optional();
      expect(privOptional.parse(value)).toEqual(value);
      expect(() => privOptional.parse(null)).toThrow();
      expect(privOptional.parse(undefined)).toBeUndefined();
      let privNullish = schema.private().nullish();
      expect(privNullish.parse(value)).toEqual(value);
      expect(privNullish.parse(null)).toBeNull();
      expect(privNullish.parse(undefined)).toBeUndefined();
      let privOptionalNullable = schema.private().optional().nullable();
      expect(privOptionalNullable.parse(value)).toEqual(value);
      expect(privOptionalNullable.parse(null)).toBeNull();
      expect(privOptionalNullable.parse(undefined)).toBeUndefined();
      let privNullableOptional = schema.private().nullable().optional();
      expect(privNullableOptional.parse(value)).toEqual(value);
      expect(privNullableOptional.parse(null)).toBeNull();
      expect(privNullableOptional.parse(undefined)).toBeUndefined();
      let notNull = nullable.notNull();
      expect(notNull.parse(value)).toEqual(value);
      expect(() => notNull.parse(null)).toThrow();
      expect(() => notNull.parse(undefined)).toThrow();
      let required = optional.required();
      expect(required.parse(value)).toEqual(value);
      expect(() => required.parse(null)).toThrow();
      expect(() => required.parse(undefined)).toThrow();
      let notNullish = nullish.notNullish();
      expect(notNullish.parse(value)).toEqual(value);
      expect(() => notNullish.parse(null)).toThrow();
      expect(() => notNullish.parse(undefined)).toThrow();
      let nullishRequired = nullish.required();
      expect(nullishRequired.parse(value)).toEqual(value);
      expect(nullishRequired.parse(null)).toBeNull();
      expect(() => nullishRequired.parse(undefined)).toThrow();
      let nullishNotNull = nullish.nullish().notNull();
      expect(nullishNotNull.parse(value)).toEqual(value);
      expect(() => nullishNotNull.parse(null)).toThrow();
      expect(nullishNotNull.parse(undefined)).toBeUndefined();
      let convoluted = schema
        .private()
        .nullable()
        .optional()
        .notNull()
        .required()
        .nullish()
        .notNullish()
        .public()
        .nullable();
      let convolutedOptional = convoluted.optional();
      expect(convolutedOptional.parse(value)).toEqual(value);
      expect(convolutedOptional.parse(null)).toBeNull();
      expect(convolutedOptional.parse(undefined)).toBeUndefined();
      let convolutedNullable = convoluted.nullable();
      expect(convolutedNullable.parse(value)).toEqual(value);
      expect(convolutedNullable.parse(null)).toBeNull();
      expect(() => convolutedNullable.parse(undefined)).toThrow();
      let convolutedNullish = convoluted.nullish();
      expect(convolutedNullish.parse(value)).toEqual(value);
      expect(convolutedNullish.parse(null)).toBeNull();
      expect(convolutedNullish.parse(undefined)).toBeUndefined();
      let convolutedNotNull = convoluted.notNull();
      expect(convolutedNotNull.parse(value)).toEqual(value);
      expect(() => convolutedNotNull.parse(null)).toThrow();
      expect(() => convolutedNotNull.parse(undefined)).toThrow();
      let convolutedRequired = convoluted.required();
      expect(convolutedRequired.parse(value)).toEqual(value);
      expect(convolutedRequired.parse(null)).toBeNull();
      expect(() => convolutedRequired.parse(undefined)).toThrow();
      let convolutedNotNullish = convoluted.notNullish();
      expect(convolutedNotNullish.parse(value)).toEqual(value);
      expect(() => convolutedNotNullish.parse(null)).toThrow();
      expect(() => convolutedNotNullish.parse(undefined)).toThrow();
      let convolutedPrivate = convoluted.private();
      expect(convolutedPrivate.parse(value)).toEqual(value);
      expect(convolutedPrivate.parse(null)).toBeNull();
      expect(() => convolutedPrivate.parse(undefined)).toThrow();
      let convolutedPublic = convoluted.public();
      expect(convolutedPublic.parse(value)).toEqual(value);
      expect(convolutedPublic.parse(null)).toBeNull();
      expect(() => convolutedPublic.parse(undefined)).toThrow();
    }
  });
});

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
        B.Object<
          ["required", "notNull", "public"],
          {
            base: B.String<
              ["required", "notNull", "public"],
              [null, null],
              ".*"
            >;
            optional: B.String<
              ["optional", "notNull", "public"],
              [null, null],
              ".*"
            >;
            nullable: B.String<
              ["required", "nullable", "public"],
              [null, null],
              ".*"
            >;
            nullish: B.String<
              ["optional", "nullable", "public"],
              [null, null],
              ".*"
            >;
            optionalNullable: B.String<
              ["optional", "nullable", "public"],
              [null, null],
              ".*"
            >;
            optionalRequired: B.String<
              ["required", "notNull", "public"],
              [null, null],
              ".*"
            >;
            nullableOptional: B.String<
              ["optional", "nullable", "public"],
              [null, null],
              ".*"
            >;
            nullableNotNull: B.String<
              ["required", "notNull", "public"],
              [null, null],
              ".*"
            >;
            nullishNotNullish: B.String<
              ["required", "notNull", "public"],
              [null, null],
              ".*"
            >;
            private: B.String<
              ["required", "notNull", "private"],
              [null, null],
              ".*"
            >;
            privatePublic: B.String<
              ["required", "notNull", "public"],
              [null, null],
              ".*"
            >;
            arbitraryChaining: B.String<
              ["required", "nullable", "public"],
              [null, null],
              ".*"
            >;
          }
        >
      >(stringTestObject);

      assertType<
        B.Object<
          ["required", "notNull", "public"],
          {
            base: B.Number<["required", "notNull", "public"], [null, null]>;
            optional: B.Number<["optional", "notNull", "public"], [null, null]>;
            nullable: B.Number<
              ["required", "nullable", "public"],
              [null, null]
            >;
            nullish: B.Number<["optional", "nullable", "public"], [null, null]>;
            optionalNullable: B.Number<
              ["optional", "nullable", "public"],
              [null, null]
            >;
            optionalRequired: B.Number<
              ["required", "notNull", "public"],
              [null, null]
            >;
            nullableOptional: B.Number<
              ["optional", "nullable", "public"],
              [null, null]
            >;
            nullableNotNull: B.Number<
              ["required", "notNull", "public"],
              [null, null]
            >;
            nullishNotNullish: B.Number<
              ["required", "notNull", "public"],
              [null, null]
            >;
            private: B.Number<["required", "notNull", "private"], [null, null]>;
            privatePublic: B.Number<
              ["required", "notNull", "public"],
              [null, null]
            >;
            arbitraryChaining: B.Number<
              ["required", "nullable", "public"],
              [null, null]
            >;
          }
        >
      >(numberTestObject);

      assertType<
        B.Object<
          ["required", "notNull", "public"],
          {
            strings: B.Object<
              ["required", "notNull", "public"],
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
            numbers: B.Object<
              ["required", "notNull", "public"],
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
        B.Object<
          ["required", "notNull", "public"],
          {
            withProperties: B.Object<
              ["required", "notNull", "public"],
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
            withoutProperties: B.Object<["required", "notNull", "public"], {}>;
          }
        >
      >(objectTestObject);
    });
  });

  describe("Parsing", () => {
    it("should parse valid inputs", () => {
      const parsedStrings = stringTestObject.parse(stringsMock);
      expect(parsedStrings).toEqual(stringsMock);

      const parsedNumbers = numberTestObject.parse(numbersMock);
      expect(parsedNumbers).toEqual(numbersMock);

      const parsedScalars = scalarsTestObject.parse(scalarsMock);

      expect(parsedScalars).toEqual({
        strings: {
          base: stringsMock,
          nullable: null,
          private: stringsMock,
          optionalNullable: undefined,
          optionalRequired: stringsMock,
          nullableOptional: null,
          nullableNotNull: stringsMock,
          nullishNotNullish: stringsMock,
          privatePublic: stringsMock,
          arbitraryChaining: stringsMock,
        },
        numbers: {
          base: numbersMock,
          nullable: null,
          private: numbersMock,
          optionalNullable: undefined,
          optionalRequired: numbersMock,
          nullableOptional: null,
          nullableNotNull: numbersMock,
          nullishNotNullish: numbersMock,
          privatePublic: numbersMock,
          arbitraryChaining: numbersMock,
        },
      });
    });
  });
}
/*
TODO: Fix sanitize, parse, etc on B.Object and BorgModel to delete private stuff
TODO: Modify output parsing so that fields not
  present in the output schema pass through untouched.

  When building a client parser, we can use the shape of the input schema,
  and replace the modified fields with those from the output schema.
*/
