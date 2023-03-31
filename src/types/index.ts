export type * from "./BsonSchema";
export type * from "./Meta";
export type * from "./utils";
export type * from "../Borg";
export type { ObjectIdLike, ObjectId, Double } from "bson";

/**
FIXME: This is not correct. We want to be able to do this: `type A = ArrayToTuple<(1 | 2 | 3)[]> //--> [1, 2, 3]`

The code below gives us [1 | 2 | 3] instead - a tuple of length 1 where the only element is the union of 1, 2, and 3.

While `[1, 2, 3]` is the preferred representation of the required keys type,
`(1 | 2 | 3)[]` is more correct than `[1 | 2 | 3]`.

-----------------
type ArrayToTuple<TArr extends any[], TTup extends [...any[]] = []> = [
  ...TTup,
  TArr[0],
] extends infer U ? TArr extends [infer _, ...infer U2]
    ? [...U2, U]
    : U
  : never;
*/

/*TODO: Useful for exact-optional?

export type AddQuestionMarksToOptionalProperties<
  T extends { [key: string | symbol]: any },
  R extends keyof T = RequiredKeysIn<T>,
> = Pick<Required<T>, R> & Partial<T>;
*/

/* c8 ignore start */
//@ts-expect-error - Vite handles this import.meta check
if (import.meta.vitest) {
  //@ts-expect-error - Vite handles this top-level await
  const { describe, it, expect } = await import("vitest");
  describe("Type Index", () => {
    it("should do nothing", () => {});
  });
}
/* c8 ignore stop */
