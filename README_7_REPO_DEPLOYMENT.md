# MYLINGO 7-Repository Deployment

## Architecture

MYLINGO uses **7 GitHub repositories but one deployed web origin**:

- `mylingoE1` = main application + GitHub Pages deployment
- `mylingoE1A1` = A1 level source
- `mylingoE1A2` = A2 level source
- `mylingoE1B1` = B1 level source
- `mylingoE1B2` = B2 level source
- `mylingoE1C1` = C1 level source
- `mylingoE1C2` = C2 level source

The workflow checks out all six level repositories and copies their level
folders into the main repository's `site/a1` through `site/c2` folders before
GitHub Pages deployment.

### Why this matters

Do **not** deploy the six level repositories as six separate Pages sites.
The current MYLINGO runtime expects sibling level folders, relative URLs, a
root service worker, and one browser storage origin. The seven repositories
are therefore a source/assembly architecture, not seven independent websites.

## Required GitHub setup

1. Create all seven repositories under the `Anglo4git` account with the exact
   names above.
2. Put the contents of each supplied repository folder at the repository root.
3. In the main `mylingoE1` repository, keep the supplied
   `.github/workflows/static.yml`.
4. In **Settings → Actions → General**, allow GitHub Actions to run.
5. In **Settings → Pages**, choose **GitHub Actions** as the source.

### If the six level repositories are private

Create a GitHub Personal Access Token with permission to read the six level
repositories, then save it in the main repository as:

`MYLINGO_REPOS_TOKEN`

The workflow uses this secret to read the six sibling repositories.

If all six level repositories are public, the secret is normally unnecessary;
the workflow can use the default GitHub Actions token.

## Branch

The workflow runs on both `main2` and `main`. Therefore the first deployment
can be made from the user's current `main2` branch.

## Result

The deployed application remains one origin, for example:

`https://anglo4git.github.io/mylingoE1/`

with runtime paths such as:

- `/a1/`
- `/a2/`
- `/b1/`
- `/b2/`
- `/c1/`
- `/c2/`

The six repositories remain independently editable while the learner sees
one integrated MYLINGO application.
