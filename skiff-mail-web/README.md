# Skiff Mail Web App

## Introduction

The Skiff Mail frontend uses the [Next.js](https://nextjs.org/docs) framework, which build on top of React and adds features like [file-based routing](https://nextjs.org/docs/routing/introduction), a [built-in API](https://nextjs.org/docs/routing/introduction), [server-side rendering](https://nextjs.org/docs/basic-features/data-fetching/get-server-side-props), and many others.

## Dev Setup

To run locally, you will need to [install Yarn](https://classic.yarnpkg.com/lang/en/docs/install) and set Yarn version 3.0+.

```bash
git clone https://github.com/skiff-org/skiff-apps.git
cd skiff-apps/
yarn set version berry
```

Then, proceed to installing the dependencies, building libraries, and running the app.

```bash
yarn
yarn build:lib
yarn dev
```

Navigate to http://localhost:4200/mail/inbox to test out the app. It currently uses mock data - we may add API access in the future.
