# Data Format V1 (Import/Export)

## Goal

Define a stable JSON format for local backup/restore in v1, covering both encounter runtime state and creature library data.

## Top-level Shape

```json
{
  "version": "1",
  "exportedAt": "2026-05-15T12:00:00.000Z",
  "app": "dnd-toolkit",
  "encounter": {},
  "library": {}
}
```

## Field Definitions

- `version`: string format version (`"1"` for v1)
- `exportedAt`: ISO timestamp
- `app`: constant identifier (`"dnd-toolkit"`)
- `encounter`: active encounter payload
- `library`: user creature-library payload

## Encounter Section

```json
{
  "activeCreatureId": "uuid-or-string-id",
  "round": 3,
  "creatures": []
}
```

- `activeCreatureId`: current active creature ID, or empty string
- `round`: integer >= 1
- `creatures`: array of creature records used by combat runtime

### Creature Record (V1 Export Contract)

Creature entries should preserve all currently used combat/runtime fields, including:

- Core: `id`, `name`, `ac`, `maxHp`, `currentHp`, `initiative`, `isPlayer`
- Rules metadata: `abilityScores`, `savingThrowBonuses`, `skillBonuses`, `proficiencyBonus`
- Features: `featureGroups`, `featureState`, `legendaryActions`, `lastActionResult`
- Effect model: `effects` (round-based and turn-start timing fields)
- Source linkage: `sourceCreature`

Import should accept missing optional fields and hydrate defaults where possible.

## Library Section

```json
{
  "creatures": []
}
```

- `creatures`: array of library creature templates/custom entries
- Shape aligns with existing library storage model in app services

## Import Validation Rules (V1)

- Reject if top-level is not an object
- Reject if `version` is missing
- Reject unknown `app` value when present
- Require `encounter` and `library` objects
- Coerce/repair safe defaults where possible:
  - missing `round` -> `1`
  - missing `activeCreatureId` -> first sorted creature ID or empty string
  - missing creature IDs -> regenerate unique IDs
- On partial invalid creature entries, skip invalid entries and continue import

## Conflict and Merge Behavior

V1 default behavior:

- Import replaces current in-browser encounter + library state.
- No automatic deep-merge.
- Prompt user before overwrite.

Optional future behavior:

- Merge mode for library entries keyed by creature ID/name.

## Forward Compatibility

- Future versions increment `version` (`"2"`, `"3"`, ...).
- Importer must:
  - accept known older versions with migration
  - reject unknown newer versions with clear error

## Security Notes

- Treat import files as untrusted input.
- Never execute imported content.
- Validate shape and types before writing to `localStorage`.

## Example Minimal Export

```json
{
  "version": "1",
  "exportedAt": "2026-05-15T12:00:00.000Z",
  "app": "dnd-toolkit",
  "encounter": {
    "activeCreatureId": "",
    "round": 1,
    "creatures": []
  },
  "library": {
    "creatures": []
  }
}
```
