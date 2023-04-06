# @alecvision/borg

## 0.4.0

### Minor Changes

- [BREAKING]: Incomplete features were removed, various bugs fixed, and 100% test coverage has been achieved.

## 0.3.1

### Patch Changes

- bump to 0.3.1

## 0.3.0

### Minor Changes

- Introduces .try(), .is(), and BorgUnion

## 0.2.1

### Patch Changes

- e389e00: Type improvements

## [0.2.0]

- 5739cc5:

### Breaking Changes

[IMPROVE]: Generated schemas and schema meta are now immutable and frozen, accessible via getters.
[FIX]: Clarified the symantics of `.private()`; `private` schemas parse as normal, but are not included in the output of `.serialize()`.

### Features

[FEAT]: New methods: `B.Number().range(...)`, `B.String().length(...)`, and `B.Array().length(...)`

### Bug Fixes, Refactors, and Other Changes

[IMPROVE]: Better types, better error messages, better tooltips.
[FIX]: Various bug fixes and type corrections.

## [0.1.0]

### Minor Changes

- eeed9c4:
  [IMPROCE] Types are now more correct and (slightly) less verbose
  [FEAT]: Various utility types are now availble
  [FEAT]: New, strictly-typed `meta` property grants readonly access to instance configs
  [FEAT]: New `copy()` method for reproducing a schema exactly
  [FIX]: Various bug-fixes and quality of life improvements

## [0.0.1]

### Patch Changes

- 18e46a6: add support for string, number, boolean, ObjectId, objects, and arrays,
- 121fe90: restrict to node version 16+
