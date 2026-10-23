# Field Labs and Outbreak Resistance visual study

This page documents an illustrative web study, not the live game or an authoritative rules source. It uses local fixtures and does not read or change accounts, recordings, scores, server state or live outbreaks. Field Labs and Outbreak Resistance are implemented in the server and Android test/replay slice behind explicit activation; see their [capabilities](../openspec/specs/field-labs/spec.md) and [Resistance](../openspec/specs/outbreak-resistance/spec.md), plus the [dated integration evidence](field-labs-integration.md).

To inspect the study, start the web workspace from the repository root:

```sh
npm run dev --workspace @sporeward/web -- --host 127.0.0.1 --port 5174
```

Open [the local palettes page](http://127.0.0.1:5174/rendering/palettes). The Field Labs section follows the outbreak cards and map-marker examples. Its Player A / Player B controls illustrate per-player collection state; reward names and map positions are fixtures. The exploratory distance slider was removed after the visual direction was approved. Values embedded in this study are illustrative and provisional, not active gameplay settings or acceptance targets.
