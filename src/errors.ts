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

export class BorgError<
  const T extends BorgError | undefined = undefined
> extends Error {
  #path: (string | number)[] = [];

  constructor(message: string, cause?: T, path?: (string | number)[]) {
    super(`${message}`);
    this.#path = [...(path || []), ...(cause?.path || [])];
    this.message = `${message} at "${this.#path.join(".") || "{ROOT}"}"${
      cause?.message ? `: ${cause.message}` : ""
    }`;
    if (cause) {
      this.stack = `${this.stack}\n\n### [CAUSED BY]:###\n\n${cause.stack}`;
    }
  }

  get path() {
    return this.#path;
  }
  /* c8 ignore next */
}

/* c8 ignore start */

//@ts-expect-error - Vite handles this import.meta check
if (import.meta.vitest) {
  //@ts-expect-error - Vite handles this top-level await
  const { describe, it, expect } = await import("vitest");
  describe("BorgError", () => {
    it("should be a subclass of Error", () => {
      expect(new BorgError("")).toBeInstanceOf(Error);
    });

    it("should have a path property that is an array", () => {
      expect(Array.isArray(new BorgError("").path)).toBe(true);
    });

    it("should append the path of the cause to the path of the error", () => {
      const cause = new BorgError("cause", undefined, ["cause"]);
      const error = new BorgError("error", cause, ["error"]);
      expect(error.path).toEqual(["error", "cause"]);
    });
  });
}

/* c8 ignore stop */
