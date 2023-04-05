import { BorgObject } from "./BorgObject";
import { BorgArray } from "./BorgArray";
import { BorgString } from "./BorgString";
import { BorgBoolean } from "./BorgBoolean";
import { BorgNumber } from "./BorgNumber";
import { BorgId } from "./BorgId";
import { BorgUnion } from "./BorgUnion";
import type * as _ from "./types";

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
  id: () => new BorgId(),
  string: () => new BorgString(),
  number: () => new BorgNumber(),
  boolean: () => new BorgBoolean(),
  array: <const T extends _.Borg>(itemSchema: T) => new BorgArray(itemSchema),
  object: <const T extends { [key: string]: _.Borg }>(shape: T) =>
    new BorgObject(shape),
  union: <const T extends _.Borg[]>(...members: T) => new BorgUnion(members)
};

declare module B {
  export type Boolean<TFlags extends _.Flags = _.Flags> = InstanceType<
    typeof BorgBoolean<TFlags>
  >;

  export type Id<
    TFlags extends _.Flags = _.Flags,
    TFormat extends "string" | "oid" = "string" | "oid"
  > = InstanceType<typeof BorgId<TFlags, TFormat>>;

  export type Number<
    TFlags extends _.Flags = _.Flags,
    TLength extends _.MinMax = _.MinMax
  > = InstanceType<typeof BorgNumber<TFlags, TLength>>;

  export type String<
    TFlags extends _.Flags = _.Flags,
    TLength extends _.MinMax = _.MinMax,
    TPattern extends string = string
  > = InstanceType<typeof BorgString<TFlags, TLength, TPattern>>;

  export type Array<
    TFlags extends _.Flags = _.Flags,
    TLength extends _.MinMax = _.MinMax,
    TItems extends _.Borg = _.Borg
  > = InstanceType<typeof BorgArray<TFlags, TLength, TItems>>;

  export type Object<
    TFlags extends _.Flags = _.Flags,
    TOtherProps extends "strict" | "strip" | "passthrough" | _.Borg =
      | "strict"
      | "strip"
      | "passthrough"
      | _.Borg,
    TShape extends { [key: string]: _.Borg } = {
      [key: string]: _.Borg;
    }
  > = InstanceType<typeof BorgObject<TFlags, TOtherProps, TShape>>;

  export type Union<
    TFlags extends _.Flags = _.Flags,
    TMembers extends _.Borg[] = _.Borg[]
  > = InstanceType<typeof BorgUnion<TFlags, TMembers>>;

  export type Borg = _.Borg;
  export type Type<T extends _.Borg> = _.Type<T>;
  export type BsonType<T extends _.Borg> = _.BsonType<T>;
  export type AnyBorg =
    | B.Object
    | B.Array
    | B.String
    | B.Number
    | B.Boolean
    | B.Id
    | B.Union
    | B.Borg;
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

/* c8 ignore start */
// @ts-ignore - vitest handles this import.meta check
if (import.meta.vitest) {
  // @ts-ignore - vitest handles this top-level await
  const { describe, expect, it } = await import("vitest");

  describe("B", () => {
    it("should export the Borg types", () => {
      expect(B).toMatchInlineSnapshot(
`{
  "array": [Function],
  "boolean": [Function],
  "id": [Function],
  "number": [Function],
  "object": [Function],
  "string": [Function],
  "union": [Function],
}`
      );
    });
  });
}
/* c8 ignore stop */
