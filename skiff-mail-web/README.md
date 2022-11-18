# Skemail Web App


## Introduction
The Skemail frontend uses the [Next.js](https://nextjs.org/docs) framework, which build on top of React and adds features like [file-based routing](https://nextjs.org/docs/routing/introduction), a [built-in API](https://nextjs.org/docs/routing/introduction), [server-side rendering](https://nextjs.org/docs/basic-features/data-fetching/get-server-side-props), and many others.

## Dev Setup
First, copy the `.env.example` file into a `.env` file so the app has the proper env vars setup.

```bash
cp apps/skemail-web/.env.example apps/skemail-web/.env
```

If you followed the instructions in the root [README.md](../../README.md) (the `make` commands), the `skemail-web` container should be running at http://localhost:4200.

You can also run the app locally if you're running into issues with the Docker container.

```bash
docker stop skemail-web
yarn
cd apps/skemail-web
yarn dev
```

## GraphQL

Within a React component, use a hook in [graphql.tsx](generated/graphql.tsx) to query the supergraph.

If you're in a `.ts` file or working on server-side code, import the [ApolloClient](apollo/client.ts) directly and use `client.query` or `client.mutate`.

To add a new query or mutation, add it to the [queries.graphql](graphql/queries.graphql) or [mutations.graphql](graphql/mutations.graphql) file and run `make skemail-web/codegen` at the root.
