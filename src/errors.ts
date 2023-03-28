
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
  const T extends BorgError | undefined = undefined,
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
