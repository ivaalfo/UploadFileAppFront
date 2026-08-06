# Martico Shared library

Shared library for Martico.

## Directory structure of the project

### The assets folder

```
|-- src/lib/assets
     |-- ...
```

The assets directory is used to store supporting files for the application.

### The auth module

```
|-- src/lib/auth
  |-- components
  |-- layout
  |-- pages
  |-- services
  |-- auth.module.ts
```

A complete module that provides the authorization flow for the Martico apps.

### The core module

```
|-- src/lib/core
  |-- guards
  |-- interceptors
  |-- services
  |-- core.module.ts
```

Core components of the shared library: guards, interceptors and services.

### The data folder

```
|-- src/lib/data
  |-- languages.ts
  |-- user-roles.ts
```

Languages and user roles.

### The Shared Module

```
|-- src/lib/shared
     |-- [+] components
     |-- shared.module.ts
```

The Shared Module is where any shared components, pipes/filters, ... should go. The Shared Module can be imported in any other module when those items will be re-used.
The shared module shouldn’t have any dependency to the rest of the application and should therefore not rely on any other module.

For example, the components folder contains all the "shared" components. This are components like the spinner which multiple components would benefit from.

## The Styles Directory

```
|-- src/lib/styles
     |-- base
     |-- global
```

It is used to store scss style sheets for the application. 

The `base/` folder contains files that are helpers that can be imported into any component like variables or mixins.

The `global/` folder contains styles that are applied globally to the whole web. Don't missuse this folder and try to keep styles scoped to each component.

## public-api.ts

The public API for your library is maintained in the public-api.ts file in your library folder. Anything exported from this file is made public when your library is imported into an application.

## Developing the library

Follow this instructions for easy local development:

1. Open 3 terminals in this folders: `fileTransfer`, `fileTransfer\dist\fileTransfer\shared` and the app where we are using the library.
2. In the `fileTransfer` run `npm run build-watch`.
3. In the `fileTransfer\dist\fileTransfer\shared` run `npm link`.

Now you have kinda global npm package pointing to your local folder. So:

4. In the folder of the app we are using the library run `npm link @ecna_npm/entralm-shared`.
5. Make changes in the library and see them applied in your app.
6. Once you finished the changes in the library commit and push them (remember to bump version in package.json). The continous integration will build and publish the package to your npm private registry.
7. In the folder of the app we are using the library run `npm i` to unlink your local folder.



