# Safe Parse API

```ts
import lib from "lib";
const stringSchema = lib.string();
const asserted = stringSchema.assert("hello"); // 'hello' | never
const syncParsed = stringSchema.parse("hello"); // { ok: true, data: 'hello' } | { ok: false, error: ParseError }
const awaited = await stringSchema.parseAsync("hello"); // 'hello' | never
const asyncParsed = stringSchema.parseAsync("hello"); // Promise<'hello' | never>
const caught = stringSchema.parseAsync("hello").catch(error => {
  console.error(error); // ParseError;
  return "caught";
}); // Promise<'hello' | 'caught'>
```

## Alternative Sync Parse Non-Fatal Return Types

```ts
T | ParseError
{ ok: true, data: T } | { ok: false, error: ParseError }
{ then: <TResult>(callback: (data: T) => TResult) => TResult, catch: <TResult>(callback: (error: ParseError) => TResult) => TResult }
```

## Alternative Method Names

| Fatal       | Sync                 | Async                     | Notes                                                                                |
| ----------- | -------------------- | ------------------------- | ------------------------------------------------------------------------------------ |
| `assert`    | `parse`              | `parseAsync` or `promise` | I like `assert` `parse` `promise` - short and descriptive                            |
| `assert`    | `try` or `parseSync` | `parse`                   | This makes async parsing first-class, especially with `parseSync` which has symmetry |
| `parse`     | `try` or `check`     | `parseAsync` or `promise` | I feel like `parse` is the wrong name for what is essentially an assertion           |
| `parseSync` | `check`              | `try`                     | `parse` Same issue as directly above                                                 |
