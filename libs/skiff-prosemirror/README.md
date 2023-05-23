Running a local version of `@skiff-org/prosemirror-tables` using yarn link:

- In folder for `@skiff-org/prosemirror-tables`: `yarn watch` (build and watch)
- In this folder (skiff-world's `libs/skiff-prosemirror`): `yarn link <path to @skiff-org/prosemirror-tables>`

Afterwards, changes to your local version of `@skiff-org/prosemirror-tables` will automatically show up in skiff-world's editor frontend, assuming you have all the necessary `watch` processes running (`yarn watch` in `@skiff-org/prosemirror-tables`, `yarn libs:watch` in skiff-world, and `yarn editor:watch` or `yarn editor-front:dev-local` in skiff-world).

When switching between skiff-world branches that are linked vs unlinked, you should run `yarn webpack:clean` in the `react-client/` folder (or main folder), then restart the editor-web server (e.g., restart `yarn editor:watch`). Otherwise, webpack might remember the wrong `@skiff-org/prosemirror-tables` version, giving errors like
```
Module not found: Error: Can't resolve '@skiff-org/prosemirror-tables/style/table-headers.css' in 'skiff-world/.yarn/__virtual__/skiff-prosemirror-virtual-054729f7ed/1/libs/skiff-prosemirror/dist/esm'
```

Be careful not to commit the yarn changes caused by linking; these show up in `.pnp.cjs`, `.yarn/cache/@skiff-org-prosemirror-tables-...`, `package.json`, and `yarn.lock`.

To unlink the local version (reverting to the published npm version):
- `git restore` the yarn changes caused by linking
- Run `yarn`
- Run `yarn webpack:clean`
