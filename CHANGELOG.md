# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

Add support for `stdin()` while featuring a solid implementation of a ring buffer that can be used to write to any writable stream diligently and efficiently.

### Changed

If `options.stdio` is a string, defaults `options.stdio` to `['pipe', options.stdio, 'inherit']`.

This change will allow errors to be written to `stderr` automatically.

If the user decides to define specifics of `stdio`, it must pass an array instead of a string.

See: https://nodejs.org/api/child_process.html#optionsstdio

[unreleased]: https://github.com/olivierlacan/keep-a-changelog/compare/v0.1.3...HEAD
[0.1.3]: https://github.com/olivierlacan/keep-a-changelog/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/olivierlacan/keep-a-changelog/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/olivierlacan/keep-a-changelog/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/olivierlacan/keep-a-changelog/compare/v0.0.10...v0.1.0
[0.0.10]: https://github.com/olivierlacan/keep-a-changelog/compare/v0.0.9...v0.0.10
[0.0.9]: https://github.com/olivierlacan/keep-a-changelog/compare/v0.0.8...v0.0.9
[0.0.8]: https://github.com/olivierlacan/keep-a-changelog/compare/v0.0.7...v0.0.8
[0.0.7]: https://github.com/olivierlacan/keep-a-changelog/compare/v0.0.6...v0.0.7
[0.0.6]: https://github.com/olivierlacan/keep-a-changelog/compare/v0.0.5...v0.0.6
[0.0.5]: https://github.com/olivierlacan/keep-a-changelog/releases/tag/v0.0.5
