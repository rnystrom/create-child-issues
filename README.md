# Create Child Issues

Example `create-child-issues.yml` using this action:

```yml
name: Create child issues
on:
  issues:
    types: [labeled]

jobs:
  build:
    name: Create child issues
    runs-on: ubuntu-latest
    steps:
      - uses: rnystrom/create-child-issues@master
        #important to prevent over generating
        if: github.event.label.name == 'make'
        with:
          label: 'make'
          repos: 'rnystrom/demo-repo'
```

This will generate an issue in `rnystrom/demo-repo` any time the "make" label is applied to an issue.
