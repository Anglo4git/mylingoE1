# MYLINGO 7-Repository Architecture

Main application repository: `mylingoE1`

Level repositories:
- `mylingoE1A1`
- `mylingoE1A2`
- `mylingoE1B1`
- `mylingoE1B2`
- `mylingoE1C1`
- `mylingoE1C2`

## Main repository

`mylingoE1` owns the actual web application in `site/`.
It contains the application shell, shared runtime, courses,
course-content data, PWA/offline code, tests, build scripts and CI.

The six level repositories supply only their corresponding level
content. They are assembled into `site/a1`, `site/a2`, `site/b1`,
`site/b2`, `site/c1`, and `site/c2` during deployment.

## Important rule

Do not put a second `site/` folder in a level repository.
A level repository contains its level folder at its repository root,
for example:

    mylingoE1A1/
    └── a1/
        ├── index.html
        ├── dashboard.html
        └── quizzes.json

The deployment workflow in the main repository is responsible for
assembling these folders into the main `site/` before GitHub Pages
deployment.
