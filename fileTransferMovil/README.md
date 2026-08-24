# ZAM - Martico mobile

## Before installing the dependencies

The app has a dependecy to the shared library: `@ecna_npm/entralm-shared`. In order to be able to install this dependency you should add an NPM auth token as a environment variable in your machine.

1. Go to `https://www.npmjs.com/settings/ecna_npm/tokens`.
2. Add a read only token.
3. Add `NPM_TOKEN` environment variable.

## Running the project

### Development server

First of all you need to install project dependencies, run `npm ci`.

Run `npm start` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of
the source files (placed in the `src/` directory).

### Quality assurance

#### Linting

Run `npm run lint` to ensure code consistency.

#### Testing

Run `npm test` to run frontend tests.

## Deploying the project

First of all you need to install project dependencies, run `npm ci`.

Run `npm run build-prod` to generate the files 'compiled' ready for production.

This command creates the production files in the `dist/fileTransferMovil/` directory.

Change the content of the `dist/fileTransferMovil/config.js` file with the proper environment configuration parameters (mainly the API urls).
This can be automatically done for the testing environment by running the command `npm run config:dev`.

Upload the content of the `dist/fileTransferMovil/` directory to the webserver public folder.

## Testing the project locally with production configuration/compilation (AOT)

Run `npm run build-dev` and `npm run config:dev` in a terminal to generate the files 'compiled' for development.

Run `npm run build-prod` and `npm run config:dev` in a terminal to generate the files 'compiled' for production.

Ensure you have the `http-server` tool installed globally (`npm i -g http-server`), and run the recently compiled files: `http-server -p 8080 -c-1 dist/fileTransferMovil`.


## Directory structure of the project

### The core folder

```
|-- src/app/core
  |-- components
    |-- base.component.ts
```

The core folder (for now) only has the base component. This component implements the hooks related to the confirmation slider and the nagivation data persistence. Any new component should extends `BaseComponent` and implement the required methods.

### The layout folder

```
|-- src/app/layout
  |-- components
  |-- content-layout
```

Includes app's content layout and related components.

### The modules folder

```
|-- src/app/modules
  |-- home
    |-- components
    |-- pages
    |-- home.module.ts
    |-- home.routing.ts
```

The Home module. Includes routing, pages and components.

### The services folder

```
|-- src/app/services
  |-- navigation-state.service.ts
  |-- pwa.service.ts
```

Application services for navigation state persistence and PWA managing.

### The Shared Module

```
|-- src/app/shared
     |-- [+] components
     |-- shared.module.ts
```

The Shared Module is where any shared components, pipes/filters, ... should go. The Shared Module can be imported in any other module when those items will be re-used. The shared module shouldn’t have any dependency to the rest of the application and should therefore not rely on any other module.

For example, the components folder contains all the "shared" components. This are components like confirm-slider, legend, select...which multiple components would benefit from.

## The Styles Directory

```
|-- src/styles
     |-- base
```

It is used to store scss style sheets for the application. 

The `base/` folder contains files that are helpers that can be imported into any component like variables or mixins.

## The Assets Directory

```
|-- src/assets
     |-- ...
```

The assets directory is used to store supporting files for the application. Things like images, videos or the text translation files.
