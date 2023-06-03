# Contributing to Skiff UI

Contributions are always welcome! Here are a few guidelines that will help you along the way.

## Summary

- [Code of Conduct](#code-of-conduct)
- [Your first Pull Request](#your-first-pull-request)
- [Opening a Pull Request](#opening-a-pull-request)
- [How to structure Pull Requests](#how-to-structure-pull-requests)
- [Documentation](#documentation)
- [Code style](#code-style)
- [Translations](#translations)
- [Roadmap](#roadmap)
- [License](#license)

## Code of Conduct

Skiff UI contributors adhere to the [Contributor Covenant](https://www.contributor-covenant.org/) as the Code of Conduct. The full text is [available here](./CODE_OF_CONDUCT.md).

## Your first Pull Request

To get familiar with contributing to Skiff UI, you can start by looking at our list of [good first issues](https://github.com/skiff-org/skiff-apps/issues?q=is:open+is:issue+label:"good+first+issue"). These issues are either small in scope or have a clear solution in the ticket description.

Once you've become familiar, you can also take a look at the list of [dev ready](https://github.com/skiff-org/skiff-apps/issues?q=is:open+is:issue+label:"dev+ready") tickets. These are issues that are slightly larger in scope but have a clear solution in the ticket description.

You should expect issues that lack a clear solution or are not already on our roadmap, to undergo a longer development and review process.

To avoid duplicated effort, you must comment that you are taking the issue on the thread. Assigned contributors will show up in the "Assignee" section. If there have been no commits or progress past 7 days, anyone should feel free to leave a comment and take over the issue.

## Opening a Pull Request

Always make sure to create an issue first, before opening a Pull Request. You should aim to keep Pull Requests small and associated with only a single issue for faster review.

1. Fork the repository.

2. Clone the fork to your local machine and add upstream remote:

```sh
git clone https://github.com/<your username>/skiff-apps.git
cd libs/skiff-crypto
git remote add upstream https://github.com/skiff-org/skiff-apps.git
```

<!-- #default-branch-switch -->

3. Synchronize your local `main` branch with the upstream one:

```sh
git checkout main
git pull upstream main
```

4. Install the dependencies with yarn:

```sh
yarn install
```

5. Create a new branch:

```sh
git checkout -b new-branch
```

6. Make changes, commit and push to your fork:

```sh
git push -u origin HEAD
```

7. Go to [the repository](https://github.com/skiff-org/skiff-apps/pulls) and make a Pull Request.

The core team will promptly review your Pull Request and either merge it or request changes.

### How to structure Pull Requests?

- All branches should be targeted at `main`.
- The reference issue number should be include in the branch name.
- Pull Request titles should be formated as `[Issue #] [Component] Imperative description`. For example, `[#1045] [Button] Add force theme support.`
- There should be a description for the reviewer on how the code is structured and what to review.
- All code should be linted, well-formated, and type-safe (running `yarn prettier`, `yarn lint`, and `yarn typescript`)
- Any API changes should tag the core team to update documentation.
- Self-reviewing and commenting on your own code is highly appreciated.
- The branch should be up-to-date with the target branch `main`.

### Documentation

Skiff UI's documentation is hosted separately on (https://skiff.com/crypto). Any changes should tag the core team to update the site.

### Code style

Make sure to enable lint on-save. You can also run the commands `yarn prettier` and `yarn lint`. This will be checked by CI when you open a Pull request.
