import B from "src/index";
import { expect, it, describe } from "vitest";

const string = B.string();
const number = B.number();
const boolean = B.boolean();
const oid = B.id();
/* 
const obj1 = B.object({
  str: string,
  num: number,
  bool: boolean,
  id: oid,
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
  strArr,
  numArr,
  boolArr,
  oidArr,
});
 */
const makeOptionalRecursive = (schema: B.Borg): B.Borg => {
  if (schema.meta.kind === "object") {
    const out = B.object(
      Object.fromEntries(
        Object.entries(schema.meta.shape).map(([key, value]) => [
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
    const out = B.array(makeOptionalRecursive(schema.meta.shape));
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
        Object.entries(schema.meta.shape).map(([key, value]) => [
          key,
          makeNullableRecursive(value),
        ]),
      ),
    ).nullable();
  } else if (schema.meta.kind === "array") {
    return B.array(makeNullableRecursive(schema.meta.shape)).nullable();
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
      expect(priv.parse(value)).toSatisfy((x: any) => typeof x === "symbol");
      expect(priv.parse(null)).toSatisfy((x: any) => typeof x === "symbol");
      expect(priv.parse(undefined)).toSatisfy((x: any) => typeof x === "symbol")
      let privNullable = schema.private().nullable();
      expect(privNullable.parse(value)).toSatisfy((x: any) => typeof x === "symbol");
      expect(privNullable.parse(null)).toSatisfy((x: any) => typeof x === "symbol");
      expect(privNullable.parse(undefined)).toSatisfy((x: any) => typeof x === "symbol");
      let privOptional = schema.private().optional();
      expect(privOptional.parse(value)).toSatisfy((x: any) => typeof x === "symbol");
      expect(privOptional.parse(null)).toSatisfy((x: any) => typeof x === "symbol");
      expect(privOptional.parse(undefined)).toSatisfy((x: any) => typeof x === "symbol");
      let privNullish = schema.private().nullish();
      expect(privNullish.parse(value)).toSatisfy((x: any) => typeof x === "symbol");
      expect(privNullish.parse(null)).toSatisfy((x: any) => typeof x === "symbol");
      expect(privNullish.parse(undefined)).toSatisfy((x: any) => typeof x === "symbol");
      let privOptionalNullable = schema.private().optional().nullable();
      expect(privOptionalNullable.parse(value)).toSatisfy((x: any) => typeof x === "symbol");
      expect(privOptionalNullable.parse(null)).toSatisfy((x: any) => typeof x === "symbol");
      expect(privOptionalNullable.parse(undefined)).toSatisfy((x: any) => typeof x === "symbol");
      let privNullableOptional = schema.private().nullable().optional();
      expect(privNullableOptional.parse(value)).toSatisfy((x: any) => typeof x === "symbol");
      expect(privNullableOptional.parse(null)).toSatisfy((x: any) => typeof x === "symbol");
      expect(privNullableOptional.parse(undefined)).toSatisfy((x: any) => typeof x === "symbol");
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
      expect(nullishRequired.parse(null)).toBeNull()
      expect(() => nullishRequired.parse(undefined)).toThrow();
      let nullishNotNull = nullish.nullish().notNull();
      expect(nullishNotNull.parse(value)).toEqual(value);
      expect(() => nullishNotNull.parse(null)).toThrow();
      expect(nullishNotNull.parse(undefined)).toBeUndefined();
      let convoluted = schema.private().nullable().optional().notNull().required().nullish().notNullish().public().nullable()
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
      expect(convolutedPrivate.parse(value)).toSatisfy((x: any) => typeof x === "symbol");
      expect(convolutedPrivate.parse(null)).toSatisfy((x: any) => typeof x === "symbol");
      expect(convolutedPrivate.parse(undefined)).toSatisfy((x: any) => typeof x === "symbol");
      let convolutedPublic = convoluted.public();
      expect(convolutedPublic.parse(value)).toEqual(value);
      expect(convolutedPublic.parse(null)).toBeNull();
      expect(() => convolutedPublic.parse(undefined)).toThrow();

    }
  })
})
