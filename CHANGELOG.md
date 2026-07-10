# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

### Fixed

- Fixed constructor injection under esbuild-based runners such as `tsx` by using explicit `@Inject(token)` metadata even when `design:paramtypes` metadata is unavailable.
- Fixed `DIContainer.autoRegister()` so it respects `Injectable({ dependencies: [...] })`.
- Added descriptive boot-time errors for constructor parameters that cannot be resolved from either `@Inject` metadata or emitted type metadata.
