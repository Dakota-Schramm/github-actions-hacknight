# Borg

<!--Badges-->

[![Version](https://img.shields.io/npm/v/@alecvision/borg)](https://www.npmjs.com/package/@alecvision/borg)
[![License](https://img.shields.io/npm/l/borg?registry_uri=https%3A%2F%2Fregistry.npmjs.com%2F%40alecvision)](https://www.npmjs.com/package/@alecvision/borg)
[![NPM Downloads](https://img.shields.io/npm/dt/@alecvision/borg?color=yellow)](https://www.npmjs.com/package/@alecvision/borg)

Borg is TypeSafety as code. Borg Schemas are "Write Once, Use Everywhere" - you can use Borg to parse, validate, assert, ~serialize, deserialize,~ (coming soon) and even generate BSON or ~JSON schemas~ (coming soon). Pair Borg with tRPC for a complete end-to-end solution for your API.

- [Borg](#borg)
  - [Getting Started](#getting-started)
    - [Installation](#installation)
    - [Creating a Schema](#creating-a-schema)
    - [Type Inference](#type-inference)
    - [Parsing](#parsing)
    - [Validating](#validating)
    - [Error Handling](#error-handling)
  - [API](#api)
    - [`.parse()`](#parse)
    - [`.try()`](#try)
    - [`.is()`](#is)
    - [`.serialize()`](#serialize)
  - [Common Chainable Methods](#common-chainable-methods)
    - [`.copy()`](#copy)
    - [`.optional()`](#optional)
    - [`.required()`](#required)
    - [`.nullable()`](#nullable)
    - [`.notNull()`](#notnull)
    - [`.nullish()`](#nullish)
    - [`.notNullish()`](#notnullish)
    - [`.private()`](#private)
    - [`.public()`](#public)
  - [Chainable String Schema Instance Methods](#chainable-string-schema-instance-methods)
    - [`.minLength()`, `.maxLength()`, `.length()`](#minlength-maxlength-length)
    - [`.pattern()`](#pattern)
  - [Chainable Number Schema Instance Methods](#chainable-number-schema-instance-methods)
    - [`.min()`, `.max()`, `.range()`](#min-max-range)
  - [Chainable Array Schema Instance Methods](#chainable-array-schema-instance-methods)
    - [`.minItems()`, `.maxLength()`, `.length()`](#minitems-maxlength-length)
  - [Chaining](#chaining)

## **Getting Started**

### **Installation**

```bash
npm install @alecvision/borg
```

### **Creating a Schema**

Borg uses a fluent API to define schemas:

```ts
import b from "@alecvision/borg";

const userSchema = b.object({
  name: b.string().minLength(1).required(),
  age: b.number().min(0).required(),
  isAdmin: b.boolean().optional()
});
```

### Type Inference

You can use Borg to infer types from your schema, or to infer the type of the object after conversion to BSON:

```ts
import b from "@alecvision/borg";

const userSchema = b.object({
  id: b.id(),
  name: b.string().minLength(1).required(),
  age: b.number().min(0).required(),
  isAdmin: b.boolean().optional()
});

type User = b.Type<typeof userSchema>; // { id: string, name: string; age: number; isAdmin?: boolean; }
type UserBson = b.bsonType<typeof userSchema>; // { id: ObjectId, name: string; age: Double; isAdmin?: boolean; }
```
<!-- TODO: This currently does not work for objects as it should. It results in an `any` type. -->

### **Parsing**

Parsing produces a new reference, which is strongly typed:

```ts
const user = {
  name: "John Doe",
  age: 30,
  isAdmin: true
};

const parsedUser = userSchema.parse(user);
type ParsedUser = typeof parsedUser; // { name: string; age: number; isAdmin: boolean; }
console.log(`User Name: ${parsedUser.name}`); // User Name: John Doe
console.log(`User Age: ${parsedUser.age}`); // User Age: 30
console.log(`User Is Admin: ${parsedUser.isAdmin}`); // User Is Admin: true
console.log(parsedUser === user); // false
```

### **Validating**

You can validate an object in place using the `is` method:

```ts
if (userSchema.is(user)) {
  type User = typeof user; // { name: string; age: number; isAdmin: boolean; }
  console.log(`User Name: ${user.name}`); // User Name: John Doe
  console.log(`User Age: ${user.age}`); // User Age: 30
  console.log(`User Is Admin: ${user.isAdmin}`); // User Is Admin: true
}
```

<!--
### **Serialization**

To serialize objects, first use the try() method to parse the object. You can then serialize the result in one of two ways:

- If you want to throw an error when the object does not match the schema, use the serialize() method.

```ts
const serializedUser = userSchema.try(user).serialize();
console.log("Serialized user data:", serializedUser); // Serialized user data: {"name":"John Doe","age":30,"isAdmin":true}
```

- If you want to handle errors yourself, check that `.try().ok === true` and then serialize the result using the schema that was used to parse the object.

```ts
const result = userSchema.try(user);

if (result.ok) {
  const serializedUser = userSchema.serialize(result.value);
  console.log("Serialized user data:", serializedUser); // Serialized user data: {"name":"John Doe","age":30,"isAdmin":true}
} else {
  console.log("The user object does not match the schema.");
}
```
-->

### **Error Handling**

When `.parse()` fails, it throws an instance of `BorgError`. When `.try()` fails, it returns an object of the shape `{ ok: false, error: BorgError }`. You can use the `try()` method to handle errors gracefully:

```ts
const result = userSchema.try(user);
if (!result.ok) console.log("Validation failed with errors:", result.error);
```

Or, you can use an error boundary and an `instanceof` check to handle errors:

```ts
try {
  const parsedUser = userSchema.parse(user);
} catch (error) {
  if (error instanceof BorgError) {
    console.log("Validation failed with errors:", error.errors);
  } else {
    throw error;
  }
}
```

## **API**

### **`.parse()`**

Parses the input and returns a new reference that is strongly typed. Throws `BorgError` if validation fails.

### **`.try()`**

Parses an object and returns a result object with the following shape:

<!--
```ts
{ ok: false, error: BorgError } | { ok: true, value: T, meta: TMeta, serialize: () => schema.serialize.call(schema, value) }
```
-->

```ts
{ ok: false, error: BorgError } | { ok: true, value: T, meta: TMeta }
```

### **`.is()`**

A type guard that returns true if the object matches the schema. It asserts that the object is of the correct type.

### **`.serialize()`**

Serializes an object to JSON that includes metadata for deserialization with a separate library (coming soon)<!--TODO-->

## **Common Chainable Methods**

### **`.copy()`**

Returns a copy of the schema. (This is used under the hood to create new instances of the schema when chaining methods. Because Borg schemas are immutable, you can safely chain methods without mutating the original schema, likely obviating the need for this method.)

### **`.optional()`**

Returns an instance of the schema that permits undefined or missing values.

### **`.required()` (_default_)**

Returns an instance of the schema that must be present and not undefined.

### **`.nullable()`**

Returns an instance of the schema that permits null values.

### **`.notNull()`** (_default_)

Returns an instance of the schema that does not permit null values.

### **`.nullish()`**

Short for `.nullable().optional()`

### **`.notNullish()`**

Short for `.notNull().required()`

### **`.private()`** (_currently does nothing_)

Returns an instance of the schema that parses as normal, but fails serialization. If part of an object, the property is removed from the serialized object. If part of an array, the item is removed from the serialized array.

### **`.public()`** (_default_) (_currently does nothing_)

Returns an instance of the schema that parses and serializes as normal.

### **Chainable String Schema Instance Methods**

- #### **`.minLength()`, `.maxLength()`, `.length()`**

Returns an instance of the schema that validates the length of the string.

```ts
b.string().length(5); // string must be exactly 5 characters long
b.string().minLength(5); // string must be at least 5 characters long
b.string().maxLength(5); // string must be at most 5 characters long
b.string().length(5, 10); // string must be between 5 and 10 characters long, inclusive
b.string().minLength(4).length(null); // string may be any length
```

- #### **`.pattern()`** (_default_: `null` [*shows as `.*` in type hint*])

Returns an instance of the schema that validates the string against a regular expression, supplied as a string.

```ts
b.string().pattern("^[a-z]+$"); // string must contain only lowercase letters
```

**NOTE**: Special characters in the regular expression must be double-escaped. The typescript inference will display the correct string in all cases EXCEPT when the regular expression includes backslashes. When using backslashes, the type hint will show **_the incorrect number of slashes_**. To work around this, Borg will parse a regex correctly when an additional backslash is used in the backslash escape sequence. i.e. `\\\\` will parse the same as `\\\`, however will show 4 slashes in the type hint.

```ts
b.string().pattern("^[a-z\\\\]+$"); // string must contain only lowercase letters and backslashes
//  ?^
//  BorgString<["required", "notNull", "public"], [null, null], "^[a-z\\\\]+$">

b.string().pattern("^[a-z\\]+$"); // string must contain only lowercase letters and backslashes
//  ?^
//  BorgString<["required", "notNull", "public"], [null, null], "^[a-z\\]+$"> <-- (**incorrect**)
```

### **Chainable Number Schema Instance Methods**

- #### **`.min()`, `.max()`, `.range()`**

Returns an instance of the schema that validates the number against a range.

```ts
b.number().range(5, 10); // number must be between 5 and 10, inclusive
b.number().min(5); // number must be at least 5
b.number().max(10); // number must be at most 10
b.number().min(5).max(10).range(5, null); // number must be at least 5
```

### **Chainable Array Schema Instance Methods**

- #### **`.minItems()`, `.maxItems()`, `.length()`**

Returns an instance of the schema that validates the length of the array.

```ts
b.array(b.number()).length(5); // array must be exactly 5 items long
b.array(b.number()).minItems(5); // array must be at least 5 items long
b.array(b.number()).maxItems(5); // array must be at most 5 items long
b.array(b.number()).length(5, 10); // array must be at least 5 and at most 10 items long
b.array(b.number()).minItems(4).minItems(null); // array may be any length
```

## **Chaining**

Borg schemas are immutable, so you can chain methods to create new instances of the schema. The effects are applied in the order that they are called, making them reversible and composable.

```ts
const nameSchema = b.string().minLength(5).maxLength(10).notNull().private();
```

is exactly the same as

```ts
const nameSchema = b
  .string()
  .private()
  .public()
  .minLength(10)
  .nullable()
  .notNull()
  .optional()
  .required()
  .nullish()
  .notNullish()
  .nullish()
  .required()
  .maxLength(15)
  .private()
  .minLength(null)
  .length(5, 10);
```
