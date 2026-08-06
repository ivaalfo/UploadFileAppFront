# FileTransfer - Martico

## Running the project

### Development server

First of all you need to install project dependencies, run `npm ci`.

Run `npm start` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of
the source files (placed in the `src/` directory).

By default it will use the 'mock server' for the API. Change the content of the `src/config.js` file to point to any other
server during development or start the dev server against other environment. For example, to run against dev environment (It uses `src/environments/config.dev.js` configuration file) run `ng serve -c dev` or use the npm script `npm run start:dev`

### Mock server

Run `npm run mock-server` to have a local mocked API server. Use `fulano` or `mengano` usernames to login (any password). The mock will automatically reload if you change any of the source files (placed in the `mockserver/` directory).

#### Getting mock data

In the dev server there are some JSON files with mock data. You can get them by running scp, for example:

```bash
scp avarela@192.168.2.83:/home/ecna/fileTransfer/mock/datos/PrevisionLlegadasMockImp.json mockserver/mock-data/PrevisionLlegadasMockImp.json
scp avarela@192.168.2.83:/home/ecna/fileTransfer/mock/datos/Almacenes.json mockserver/mock-data/Almacenes.json
```

You can also change the content of any of those files (`/home/ecna/fileTransfer/mock/datos/*.json`) to view different
content on the test server.

### Quality assurance

#### Linting

Run `npm run lint` to ensure code consistency.

#### Testing

Run `npm test` to run frontend tests.

## Deploying the project

First of all you need to install project dependencies, run `npm ci`.

Run `npm run build` to generate the files 'compiled' ready for production.

This command creates the production files in the `dist/fileTransfer/` directory.

Change the content of the `dist/fileTransfer/config.js` file with the proper environment configuration parameters (mainly the API urls).
This can be automatically done for the testing environment by running the command `npm run config:dev`.

Upload the content of the `dist/fileTransfer/` directory to the webserver public folder.

## Testing the project locally with production configuration/compilation (AOT)

Run `npm run mock-server` to have a local mocked API server, run `npm run build` in another terminal to generate the files 'compiled' for production and run `npm run config:local` to configure the mock server
urls.

Ensure you have the `http-server` tool installed globally (`npm i -g http-server`), and run the recently compiled files: `http-server dist/ -p 4200 -o fileTransfer`.

## Directory structure of the project

### The Core Module

```
|-- src/app/core
       |-- [+] guards
       |-- [+] interceptors
       |-- [+] services
       |-- ...
       |-- core.module.ts
```

The Core Module takes on the role of the root App Module , but is not the module which gets bootstrapped by Angular at run-time. The CoreModule should contain singleton services (which is usually the case) and other features where there’s only once instance per application. To prevent re-importing the core module elsewhere, there is a guard called `module-loaded-once.guard.ts` that ensures the module is not being loaded more than once.

### The Shared Module

```
|-- src/app/shared
     |-- [+] components
     |-- [+] directives
     |-- [+] pipes
     |-- ...
     |-- shared.module.ts
```

The Shared Module is where any shared components, pipes/filters, ... should go. The Shared Module can be imported in any other module when those items will be re-used. The shared module shouldn’t have any dependency to the rest of the application and should therefore not rely on any other module.

For example, the components folder contains all the "shared" components. This are components like spinners and buttons, which multiple components would benefit from.

### The Layout Directory

```
|-- src/app/layout
     |-- [+] auth-layout
     |-- [+] content-layout
     |-- [+] toaster-notification
     |-- ...
```

The layout directory is a container of components which are declared in the AppModule. The directory contains page-level components of content such as a common footer, navigation, and header.

### The Data Directory

```
|-- src/app/data
     |-- ...
```

The data module is a top level directory and holds the models or entities for data consumed by the application.

### The Module Directory

```
|-- modules
       |-- home
       |   |-- [+] components
       |   |-- pages
       |   |    |-- home
       |   |         |-- home.component.ts|html|scss|spec
       |   |
       |   |-- home.routing.ts
       |   |-- home.module.ts
       |
       |-- othersection
       |   |-- [+] components
       |   |-- [+] pages
       |   |-- othersection.routing.ts
       |   |-- othersection.module.ts
       |
       |-- ...
```

The modules directory contains a collection of modules which are each independent of each other. This allows Angular to load only the module it requires to display the request thereby saving bandwidth and speeding the entire application.

## The Styles Directory

```
|-- src/styles
     |-- base
     |-- global
```

It is used to store scss style sheets for the application.

The `base/` folder contains files that are helpers that can be imported into any component like variables or mixins.

The `global/` folder contains styles that are applied globally to the whole web. Don't missuse this folder and try to keep styles scoped to each component.

## The Assets Directory

```
|-- src/assets
     |-- ...
```

The assets directory is used to store supporting files for the application. Things like images, videos or the text translation files.
