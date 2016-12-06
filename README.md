# Auto Install - MagicMirror² module

This is a module for [MagicMirror²](https://github.com/MichMich/MagicMirror).
Checks the configuration for modules that are used, not but installed.
Missing modules are fetched from the configured repository and `npm install`
is run afterwards.

## Installing the module

To install the module, just clone this repository to your __modules__ folder:
`git clone https://github.com/qistoph/MMM-autoinstall.git autoinstall`.
Then run `cd autoinstall` and `npm install` to install the dependencies.

## Using the module

This module should be loaded before any modules with a repository URL. Preferably
configure this module first in your config:

```javascript
modules: [
  {
    module: 'autoinstall'
  },
]
```

Modules that should be automatically installed need to have a repository set.
E.g.

```javascript
modules: [
  {
    module: 'nstreinen',
    repository: 'https://www.github.com/qistoph/MMM-nstreinen',
    config: {
      ...
    }
  }
]
```

If only default modules or modules with a repository configured are used, you
now only have to copy your config.js to a new system (e.g. from your dev/test
to your actual mirror) and all modules will automatically be installed.
