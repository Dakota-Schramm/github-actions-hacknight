import type { Borg, Type } from "../Borg";

/* 
type StripSchemasDeep<T> = T extends Extract<Meta, { kind: "object" }>
  ? {
      [K in keyof T["borgShape"]]: StripSchemasDeep<T["borgShape"][K]["meta"]>;
    }
  : T extends Extract<Meta, { kind: "array" }>
  ? StripSchemasDeep<T["borgItems"]["meta"]>[]
  : T extends Extract<Meta, { kind: "union" }>`
  ? Array<StripSchemasDeep<T["borgMembers"][number]["meta"]>>[number]
  : T extends Borg
  ? T["meta"]
  : T;
 */

export type AdditionalProperties = "passthrough" | "strict" | "strip" | Borg;

export type IsNegativeNum<T extends number | string | null> = TrimLeft<
  `${T}`,
  " "
> extends `-${infer Val extends string}`
  ? TrimLeft<TrimRight<Val, 0>, 0> extends ``
    ? false
    : TrimRight<`${Val}`, " "> extends "Infinity"
    ? false
    : true
  : false;

type StringIsLongerThan<
  TLong extends string,
  TShort extends string
> = TLong extends `${infer _}${infer LTail}`
  ? TShort extends `${infer _}${infer STail}`
    ? StringIsLongerThan<LTail, STail>
    : true
  : false;

type TrimLeft<
  T extends string,
  C extends string | number
> = T extends `${C}${infer Tail}` ? TrimLeft<Tail, C> : T;

type TrimRight<
  T extends string,
  C extends string | number
> = T extends `${infer Head}${C}` ? TrimRight<Head, C> : T;

type StrToNum<T extends string> = T extends `${infer N extends number}`
  ? N
  : never;

export type GreaterThan<
  A extends number | string | null,
  B extends number | string | null
> = [IsNegativeNum<A>, IsNegativeNum<B>] extends [true, false] // "A" is negative, "B" is positive
  ? false
  : [IsNegativeNum<A>, IsNegativeNum<B>] extends [false, true] // "A" is positive, "B" is negative
  ? true
  : [`${A}`, `${B}`] extends [
      `${infer _ extends "-" | ""}0`,
      `${infer _ extends "-" | ""}0`
    ] // both are 0, even if one is -0
  ? false
  : [`${A}`, `${B}`] extends [`${B}`, `${A}`] // they are the same number
  ? false
  : StringIsLongerThan<
      TrimLeft<`${A}`, 0 | " " | "-">,
      TrimLeft<`${B}`, 0 | " " | "-">
    > extends true // Without leading zeroes, spaces, or signs, "A" has more digits than "B" (or they are the same length)
  ? IsNegativeNum<A> extends true // "A" is negative (so is "B" - we checked that the signs are the same above)
    ? false // A longer negative number is not greater than a shorter negative number
    : true // A longer positive number is greater than a shorter positive number
  : StringIsLongerThan<
      TrimLeft<`${B}`, 0 | " " | "-">,
      TrimLeft<`${A}`, 0 | " " | "-">
    > extends true // Without leading zeroes, spaces, or signs, "B" has more digits than "A"
  ? IsNegativeNum<A> extends true // "A" is negative (so is "B" - we checked that the signs are the same above)
    ? true // A longer negative number is greater than a shorter negative number
    : false // A longer positive number is not greater than a shorter positive number
  : // Without leading zeroes, "A" and "B" have the same number of digits
  [`${A}`, `${B}`] extends [
      `${infer AHead}${infer ATail}`, // "A" is split into its first digit and the rest of the number
      `${infer BHead}${infer BTail}` // "B" is split into its first digit and the rest of the number
    ]
  ? [true] extends [
      // The expression inside this array would be the final result IF we ignore negative numbers
      AHead extends BHead
        ? GreaterThan<ATail, BTail>
        : DigitIsGreater<StrToNum<AHead>, StrToNum<BHead>>
    ] // We wrap the result (so we can check if it is true or false) because we must invert the result if both numbers are negative
    ? IsNegativeNum<A> extends true
      ? false
      : true
    : IsNegativeNum<A> extends true
    ? true
    : false
  : never;

type DigitIsGreater<
  A extends number,
  B extends number,
  Count extends 1[] = []
> = Count["length"] extends A
  ? false
  : Count["length"] extends B
  ? true
  : DigitIsGreater<A, B, [...Count, 1]>;

type RequiredKeys<TObj extends object> = TObj extends {
  [_ in infer K]: any;
}
  ? keyof { [k in K as undefined extends TObj[k] ? never : k]: k }
  : never;

export type RequiredKeysArray<TShape extends { [key: string]: Borg }> =
  TShape extends infer T extends { [key: string]: Borg }
    ? Array<
        RequiredKeys<{
          [k in keyof T]: Type<T[k]>;
        }>
      >
    : never;

export type PrettyPrint<T> = T extends infer U extends object
  ? { [K in keyof U]: U[K] }
  : T extends object
  ? never
  : T;

type RequiredFlag = "required" | "optional";
type NullFlag = "notNull" | "nullable";
type PrivateFlag = "public" | "private";

export type Flags = [RequiredFlag, NullFlag, PrivateFlag];
export type MinMax = [number | null, number | null];

export type Parsed<TType, TFlags extends Flags> = [
  TFlags[0],
  TFlags[1]
] extends [infer TOptional extends Flags[0], infer TNullable extends Flags[1]]
  ?
      | TType
      | (TNullable extends "nullable" ? null : never)
      | (TOptional extends "optional" ? undefined : never)
  : never;

export type Sanitized<TType, TFlags extends Flags> = TFlags extends [
  infer TOptional extends Flags[0],
  infer TNullable extends Flags[1],
  infer TPublic extends Flags[2]
]
  ? TPublic extends "private"
    ? never
    : Parsed<TType, [TOptional, TNullable, "public"]>
  : never;

export type SetRequired<TFlags extends Flags> = SetFLags<
  TFlags,
  ["required", "", ""]
>;
export type SetOptional<TFlags extends Flags> = SetFLags<
  TFlags,
  ["optional", "", ""]
>;
export type SetNullable<TFlags extends Flags> = SetFLags<
  TFlags,
  ["", "nullable", ""]
>;
export type SetNotNull<TFlags extends Flags> = SetFLags<
  TFlags,
  ["", "notNull", ""]
>;
export type SetPublic<TFlags extends Flags> = SetFLags<
  TFlags,
  ["", "", "public"]
>;
export type SetPrivate<TFlags extends Flags> = SetFLags<
  TFlags,
  ["", "", "private"]
>;
export type SetNullish<TFlags extends Flags> = SetFLags<
  TFlags,
  ["optional", "nullable", ""]
>;
export type SetNotNullish<TFlags extends Flags> = SetFLags<
  TFlags,
  ["required", "notNull", ""]
>;

export type GetFlags<
  TFlags extends Flags,
  TFormat extends "enum" | "bool" = "bool"
> = TFlags extends [infer TOptional, infer TNullable, infer TPrivate]
  ? {
      optional: TOptional extends "optional"
        ? TFormat extends "enum"
          ? "optional"
          : true
        : TFormat extends "enum"
        ? "required"
        : false;
      nullable: TNullable extends "nullable"
        ? TFormat extends "enum"
          ? "nullable"
          : true
        : TFormat extends "enum"
        ? "notNull"
        : false;
      private: TPrivate extends "private"
        ? TFormat extends "enum"
          ? "private"
          : true
        : TFormat extends "enum"
        ? "public"
        : false;
    }
  : never;

type FlagOps = [Flags[0] | "", Flags[1] | "", Flags[2] | ""];
type SetFLags<TFlags extends Flags, TOps extends FlagOps> = [
  TOps,
  TFlags
] extends [
  [
    infer Op_0 extends Flags[0] | "",
    infer Op_1 extends Flags[1] | "",
    infer Op_2 extends Flags[2] | ""
  ],
  [
    infer TFlag_0 extends Flags[0],
    infer TFlag_1 extends Flags[1],
    infer TFlag_2 extends Flags[2]
  ]
]
  ? [
      Op_0 extends Flags[0] ? Op_0 : TFlag_0,
      Op_1 extends Flags[1] ? Op_1 : TFlag_1,
      Op_2 extends Flags[2] ? Op_2 : TFlag_2
    ]
  : never;

/* c8 ignore start */

//@ts-expect-error - Vite handles this import.meta check
if (import.meta.vitest) {
  const [{ describe, it, assertType }, { default: b }] =
    //@ts-expect-error - Vite handles this top-level await
    await Promise.all([import("vitest"), import("../")]);

  describe("IsNegativeNum type", () => {
    it("produces `true` on negative integers", () => {
      assertType<IsNegativeNum<-1>>(true);
      assertType<IsNegativeNum<-99>>(true);
      assertType<IsNegativeNum<-9999999999>>(true);
      assertType<IsNegativeNum<-9007199254740991>>(true);
    });
    it("produces `false` on positive integers", () => {
      assertType<IsNegativeNum<1>>(false);
      assertType<IsNegativeNum<99>>(false);
      assertType<IsNegativeNum<9999999999>>(false);
      assertType<IsNegativeNum<9007199254740991>>(false);
    });
    it("produces `true` on negative floats", () => {
      assertType<IsNegativeNum<-1.1>>(true);
      assertType<IsNegativeNum<-99.99>>(true);
      assertType<IsNegativeNum<-9999999999.9999999999>>(true);
      assertType<IsNegativeNum<-9007199254740991.1>>(true);
    });
    it("produces `false` on positive floats", () => {
      assertType<IsNegativeNum<1.1>>(false);
      assertType<IsNegativeNum<99.99>>(false);
      assertType<IsNegativeNum<9999999999.9999999999>>(false);
      assertType<IsNegativeNum<9007199254740991.1>>(false);
    });
    it("produces `false` on both `0` and `-0`", () => {
      assertType<IsNegativeNum<0>>(false);
      assertType<IsNegativeNum<-0>>(false);
    });
    it("produces `false` on `NaN`, `null`, `Infinity` and -Infinity", () => {
      const NegativeInfinity = -Infinity;
      assertType<IsNegativeNum<typeof NaN>>(false);
      assertType<IsNegativeNum<null>>(false);
      assertType<IsNegativeNum<typeof NegativeInfinity>>(false);
      assertType<IsNegativeNum<typeof Infinity>>(false);
    });
    it("works on strings", () => {
      assertType<IsNegativeNum<"0">>(false);
      assertType<IsNegativeNum<"1">>(false);
      assertType<IsNegativeNum<"99">>(false);
      assertType<IsNegativeNum<"9007199254740991">>(false);
      assertType<IsNegativeNum<"0.1">>(false);
      assertType<IsNegativeNum<"99.99">>(false);
      assertType<IsNegativeNum<"9999999999.9999999999">>(false);
      assertType<IsNegativeNum<"9007199254740991.1">>(false);
      assertType<IsNegativeNum<"NaN">>(false);
      assertType<IsNegativeNum<"Infinity">>(false);
      assertType<IsNegativeNum<"-Infinity">>(false);
      assertType<IsNegativeNum<"-1">>(true);
      assertType<IsNegativeNum<"-99">>(true);
      assertType<IsNegativeNum<"-9007199254740991">>(true);
      assertType<IsNegativeNum<"-0.1">>(true);
      assertType<IsNegativeNum<"-99.99">>(true);
      assertType<IsNegativeNum<"-9999999999.9999999999">>(true);
      assertType<IsNegativeNum<"-9007199254740991.1">>(true);
    });

    it("works on strings with leading and trailing spaces or zeroes", () => {
      assertType<IsNegativeNum<" 0">>(false);
      assertType<IsNegativeNum<" 1">>(false);
      assertType<IsNegativeNum<" 99">>(false);
      assertType<IsNegativeNum<" 0.1">>(false);
      assertType<IsNegativeNum<" 99.99">>(false);
      assertType<IsNegativeNum<"NaN">>(false);
      assertType<IsNegativeNum<"Infinity">>(false);
      assertType<IsNegativeNum<" -Infinity">>(false);
      assertType<IsNegativeNum<" -0">>(false);
      assertType<IsNegativeNum<" -1">>(true);
      assertType<IsNegativeNum<" -99">>(true);
      assertType<IsNegativeNum<" -0.1">>(true);
      assertType<IsNegativeNum<" -99.99">>(true);
      assertType<IsNegativeNum<"0 ">>(false);
      assertType<IsNegativeNum<"1 ">>(false);
      assertType<IsNegativeNum<"99 ">>(false);
      assertType<IsNegativeNum<"0.1 ">>(false);
      assertType<IsNegativeNum<"99.99 ">>(false);
      assertType<IsNegativeNum<"NaN ">>(false);
      assertType<IsNegativeNum<"Infinity ">>(false);
      assertType<IsNegativeNum<" -Infinity ">>(false);
      assertType<IsNegativeNum<" -1 ">>(true);
      assertType<IsNegativeNum<" -99 ">>(true);
      assertType<IsNegativeNum<" -0.1 ">>(true);
      assertType<IsNegativeNum<" -99.99 ">>(true);
      assertType<IsNegativeNum<" 0 ">>(false);
      assertType<IsNegativeNum<" 1 ">>(false);
      assertType<IsNegativeNum<" 99 ">>(false);
      assertType<IsNegativeNum<" 0.1 ">>(false);
      assertType<IsNegativeNum<"000">>(false);
      assertType<IsNegativeNum<"001">>(false);
      assertType<IsNegativeNum<"099">>(false);
      assertType<IsNegativeNum<"000.1">>(false);
      assertType<IsNegativeNum<"099.99">>(false);
      assertType<IsNegativeNum<"NaN">>(false);
      assertType<IsNegativeNum<"Infinity">>(false);
      assertType<IsNegativeNum<" -Infinity">>(false);
      assertType<IsNegativeNum<" -000">>(false);
      assertType<IsNegativeNum<" -001">>(true);
      assertType<IsNegativeNum<" -000.1">>(true);
      assertType<IsNegativeNum<" -099.99">>(true);
      assertType<IsNegativeNum<"000 ">>(false);
      assertType<IsNegativeNum<"099 ">>(false);
      assertType<IsNegativeNum<"000.1 ">>(false);
      assertType<IsNegativeNum<"099.99 ">>(false);
      assertType<IsNegativeNum<" -001 ">>(true);
    });
  });

  describe("StringIsLongerThan type", () => {
    it("produces `true` when the left string is longer than the right", () => {
      assertType<StringIsLongerThan<"a", "">>(true);
      assertType<StringIsLongerThan<"aa", "a">>(true);
      assertType<StringIsLongerThan<"aaa", "aa">>(true);
    });
    it("produces `false` when the left string is shorter than the right", () => {
      assertType<StringIsLongerThan<"a", "a">>(false);
      assertType<StringIsLongerThan<"a", "aa">>(false);
      assertType<StringIsLongerThan<"aa", "aa">>(false);
      assertType<StringIsLongerThan<"aa", "aaa">>(false);
      assertType<StringIsLongerThan<"", "">>(false);
      assertType<StringIsLongerThan<"", "a">>(false);
    });
  });

  describe("GreaterThan type", () => {
    it("Works when the left number is negative", () => {
      assertType<GreaterThan<-4, 4>>(false);
      assertType<GreaterThan<-4, 5>>(false);
      assertType<GreaterThan<-5, 4>>(false);
      assertType<GreaterThan<-10, 20>>(false);
      assertType<GreaterThan<-10, 5>>(false);
      assertType<GreaterThan<-1111, 11111>>(false);
      assertType<GreaterThan<-11111, 1111>>(false);
      assertType<GreaterThan<-23456, 3456>>(false);
      assertType<GreaterThan<-23456, 2345>>(false);
      assertType<GreaterThan<-2345, 23456>>(false);
      assertType<GreaterThan<-3456, 23456>>(false);
    });

    it("Works when the right number is negative", () => {
      assertType<GreaterThan<4, -4>>(true);
      assertType<GreaterThan<4, -5>>(true);
      assertType<GreaterThan<5, -4>>(true);
      assertType<GreaterThan<10, -20>>(true);
      assertType<GreaterThan<10, -5>>(true);
      assertType<GreaterThan<1111, -11111>>(true);
      assertType<GreaterThan<11111, -1111>>(true);
      assertType<GreaterThan<23456, -3456>>(true);
      assertType<GreaterThan<23456, -2345>>(true);
      assertType<GreaterThan<2345, -23456>>(true);
      assertType<GreaterThan<3456, -23456>>(true);
    });

    it("Works when both numbers are negative", () => {
      assertType<GreaterThan<-4, -4>>(false);
      assertType<GreaterThan<-4, -5>>(true);
      assertType<GreaterThan<-5, -4>>(false);
      assertType<GreaterThan<-10, -20>>(true);
      assertType<GreaterThan<-10, -5>>(false);
      assertType<GreaterThan<-1111, -11111>>(true);
      assertType<GreaterThan<-11111, -1111>>(false);
      assertType<GreaterThan<-23456, -3456>>(false);
      assertType<GreaterThan<-23456, -2345>>(false);
      assertType<GreaterThan<-2345, -23456>>(true);
      assertType<GreaterThan<-3456, -23456>>(true);
    });

    it("Works when both numbers are positive", () => {
      assertType<GreaterThan<4, 4>>(false);
      assertType<GreaterThan<4, 5>>(false);
      assertType<GreaterThan<5, 4>>(true);
      assertType<GreaterThan<10, 20>>(false);
      assertType<GreaterThan<10, 5>>(true);
      assertType<GreaterThan<1111, 11111>>(false);
      assertType<GreaterThan<11111, 1111>>(true);
      assertType<GreaterThan<23456, 3456>>(true);
      assertType<GreaterThan<23456, 2345>>(true);
      assertType<GreaterThan<2345, 23456>>(false);
      assertType<GreaterThan<3456, 23456>>(false);
    });

    it("Works when any number is `0` or `-0`", () => {
      assertType<GreaterThan<0, 0>>(false);
      assertType<GreaterThan<-0, -0>>(false);
      assertType<GreaterThan<-0, 0>>(false);
      assertType<GreaterThan<0, -0>>(false);
      assertType<GreaterThan<0, 1>>(false);
      assertType<GreaterThan<1, 0>>(true);
      assertType<GreaterThan<0, -1>>(true);
      assertType<GreaterThan<-1, 0>>(false);
      assertType<GreaterThan<1, -0>>(true);
      assertType<GreaterThan<-0, 1>>(false);
      assertType<GreaterThan<-1, -0>>(false);
    });

    it("Works for floats", () => {
      assertType<GreaterThan<0.1, 0.1>>(false);
      assertType<GreaterThan<0.1, 0.2>>(false);
      assertType<GreaterThan<0.2, 0.1>>(true);
      assertType<GreaterThan<0.1, -0.1>>(true);
      assertType<GreaterThan<-0.1, 0.1>>(false);
      assertType<GreaterThan<-0.1, -0.1>>(false);
      assertType<GreaterThan<-0.1, -0.2>>(true);
      assertType<GreaterThan<-0.2, -0.1>>(false);
    });

    it("Works for strings in the same way as numbers", () => {
      assertType<GreaterThan<"-4", "4">>(false);
      assertType<GreaterThan<"-4", "5">>(false);
      assertType<GreaterThan<"-5", "4">>(false);
      assertType<GreaterThan<"-10", "20">>(false);
      assertType<GreaterThan<"-10", "5">>(false);
      assertType<GreaterThan<"-1111", "11111">>(false);
      assertType<GreaterThan<"-11111", "1111">>(false);
      assertType<GreaterThan<"-23456", "3456">>(false);
      assertType<GreaterThan<"-23456", "2345">>(false);
      assertType<GreaterThan<"-2345", "23456">>(false);
      assertType<GreaterThan<"-3456", "23456">>(false);
      assertType<GreaterThan<"4", "-4">>(true);
      assertType<GreaterThan<"4", "-5">>(true);
      assertType<GreaterThan<"5", "-4">>(true);
      assertType<GreaterThan<"10", "-20">>(true);
      assertType<GreaterThan<"10", "-5">>(true);
      assertType<GreaterThan<"1111", "-11111">>(true);
      assertType<GreaterThan<"11111", "-1111">>(true);
      assertType<GreaterThan<"23456", "-3456">>(true);
      assertType<GreaterThan<"23456", "-2345">>(true);
      assertType<GreaterThan<"2345", "-23456">>(true);
      assertType<GreaterThan<"3456", "-23456">>(true);
      assertType<GreaterThan<"-4", "-4">>(false);
      assertType<GreaterThan<"-4", "-5">>(true);
      assertType<GreaterThan<"-5", "-4">>(false);
      assertType<GreaterThan<"-10", "-20">>(true);
      assertType<GreaterThan<"-10", "-5">>(false);
      assertType<GreaterThan<"-1111", "-11111">>(true);
      assertType<GreaterThan<"-11111", "-1111">>(false);
      assertType<GreaterThan<"-23456", "-3456">>(false);
      assertType<GreaterThan<"-23456", "-2345">>(false);
      assertType<GreaterThan<"-2345", "-23456">>(true);
      assertType<GreaterThan<"-3456", "-23456">>(true);
      assertType<GreaterThan<"4", "4">>(false);
      assertType<GreaterThan<"4", "5">>(false);
      assertType<GreaterThan<"5", "4">>(true);
      assertType<GreaterThan<"10", "20">>(false);
      assertType<GreaterThan<"10", "5">>(true);
      assertType<GreaterThan<"1111", "11111">>(false);
      assertType<GreaterThan<"11111", "1111">>(true);
      assertType<GreaterThan<"23456", "3456">>(true);
      assertType<GreaterThan<"23456", "2345">>(true);
      assertType<GreaterThan<"2345", "23456">>(false);
      assertType<GreaterThan<"3456", "23456">>(false);
      assertType<GreaterThan<"0", "0">>(false);
      assertType<GreaterThan<"-0", "-0">>(false);
      assertType<GreaterThan<"-0", "0">>(false);
      assertType<GreaterThan<"0", "-0">>(false);
      assertType<GreaterThan<"0", "1">>(false);
      assertType<GreaterThan<"1", "0">>(true);
      assertType<GreaterThan<"0", "-1">>(true);
      assertType<GreaterThan<"-1", "0">>(false);
      assertType<GreaterThan<"1", "-0">>(true);
      assertType<GreaterThan<"-0", "1">>(false);
      assertType<GreaterThan<"-1", "-0">>(false);
      assertType<GreaterThan<"0.1", "0.1">>(false);
      assertType<GreaterThan<"0.1", "0.2">>(false);
      assertType<GreaterThan<"0.2", "0.1">>(true);
      assertType<GreaterThan<"0.1", "-0.1">>(true);
      assertType<GreaterThan<"-0.1", "0.1">>(false);
      assertType<GreaterThan<"-0.1", "-0.1">>(false);
      assertType<GreaterThan<"-0.1", "-0.2">>(true);
      assertType<GreaterThan<"-0.2", "-0.1">>(false);
    });

    it("works for strings with leading and/or trailing 0s or spaces", () => {
      assertType<GreaterThan<" 0", "0">>(false);
      assertType<GreaterThan<"0", " 0">>(false);
      assertType<GreaterThan<" 0", " 0">>(false);
      assertType<GreaterThan<" 0", " 1">>(false);
      assertType<GreaterThan<" 1", " 0">>(true);
      assertType<GreaterThan<" 0", "-1">>(true);
      assertType<GreaterThan<"-1", " 0">>(false);
      assertType<GreaterThan<" 1", "-0">>(true);
      assertType<GreaterThan<"-0", " 1">>(false);
      assertType<GreaterThan<"-1", "-0">>(false);
      assertType<GreaterThan<" 0.1", "0.1">>(false);
      assertType<GreaterThan<"0.1", " 0.1">>(false);
      assertType<GreaterThan<" 0.1", " 0.1">>(false);
      assertType<GreaterThan<" 0.1", " 0.2">>(false);
      assertType<GreaterThan<" 0.2", " 0.1">>(true);
      assertType<GreaterThan<" 0.1", "-0.1">>(true);
      assertType<GreaterThan<"-0.1", " 0.1">>(false);
      assertType<GreaterThan<"-0.1", "-0.1">>(false);
      assertType<GreaterThan<"-0.1", "-0.2">>(true);
      assertType<GreaterThan<"-0.2", "-0.1">>(false);
    });
  });

  describe("RequiredKeysArray", () => {
    it.todo(
      "works for borgs with a mix of optional and required properties",
      () => {
        const borg = b.object({
          name: b.string(),
          age: b.number(),
          isAlive: b.boolean().optional(),
          isDead: b.boolean().optional()
        });

        assertType<RequiredKeysArray<(typeof borg)["meta"]["borgShape"]>>([
          "name",
          "age"
        ]);
      }
    );

    it.todo("works for borgs with only required properties", () => {
      const borg = b.object({
        name: b.string(),
        age: b.number()
      });

      assertType<RequiredKeysArray<(typeof borg)["meta"]["borgShape"]>>([
        "name",
        "age"
      ]);
    });

    it.todo("works for borgs with only optional properties", () => {
      const borg = b.object({
        isAlive: b.boolean().optional(),
        isDead: b.boolean().optional()
      });

      assertType<RequiredKeysArray<(typeof borg)["meta"]["borgShape"]>>([]);
    });

    it.todo("works for borgs with no properties", () => {
      const borg = b.object({});
      assertType<RequiredKeysArray<(typeof borg)["meta"]["borgShape"]>>([]);
    });
  });
}

/* c8 ignore stop */
