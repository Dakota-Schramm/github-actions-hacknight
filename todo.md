
/**
 * To-Do list for features to implement:
 * @see https://www.mongodb.com/docs/manual/reference/operator/query/jsonSchema/#std-label-jsonSchema-keywords
 * //TODO: Implement:
 * - Maps & Sets
 * - Better errors
 * - Unions
 * - Tuples?
 * - BorgArray.unique()? BorgArray.uniqueBy()? BorgArray.uniqueByPath()?
 * - "Additional Properties" & "Additional Items"
 * - Enums
 * - Documents
 * - Dates
 * - "Passthrough" & "Strip" & "Strict" modes
 * - Coercion
 */

//TODO  Divide and conquer?
//TODO  Maybe:
//TODO  - Move deserialization into a seperate lib that will be used as the transformer in `trpc`. It will also be responsible for handling the result of `try` by either handling the error, throwing, or calling `.serialize()` and serializing meta which will be used for deserialization AND bson generation.
//TODO  - Rename serialization/deserialization to something more idiomatic (stringify, toString, toJson, [Symbol.toPrimitive], etc.)
//TODO  - Create helper functions for describing the relationship between client models and server models (transforms, sanitization, ACL)
//TODO: Change serialization to include minified metadata with serialized objects for deserialization (where necessary)
//TODO: Create a helper type that takes as a type parameter a schema and returns the deserialized type for that schema
//TODO: 
