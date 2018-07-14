![Blazingly](./.github/logo.png)

# Blazingly (Proof Of Concept/Experiment)

Blazingly™ is a SSR cli tool using parcel in the background for creating web projects that load insanely fast without having to worry about anything as a developer, thanks to the power of parcel and the many tools already included within this CLI.

## What makes it so Blazing?

Blazingly uses parcel which causes insanely fast rebuilds during development.
Besides using Parcel, Blazingly also optimises your web project in other ways using plugins/presets designed specifically for blazingly to utilise performance best practises as much as it can.

- Usage of service workers right from the get-go
- Lazy loading all js and css files
- Extracting critical css when building

## Sounds awesome! How does it work?

## Installing blazingly

### Global

using yarn

```bash
yarn global add @blazingly/cli
```

or using npm

```bash
npm install -g @blazingly/cli
```

### Local

You can also install it locally if you don't want to clutter your global package folder with dozens or hundreds of packages.

using yarn

```bash
yarn add @blazingly/cli -D
```

or using npm

```bash
npm install @blazingly/cli -D
```

Create a scripts section in your package.json, otherwise it's probably not gonna work

```Json
{
  "scripts": {
    "serve": "blazingly serve ./src",
    "build": "blazingly build ./src",
    "production-server": "blazingly prod-serve"
  }
}
```

## Using blazingly

Well Blazingly has a very strict naming and folder structure convention, besides that you can pretty much do whatever you want.

Project structure:
```
/root
  /.root - This is the root of the project '/' route
  /<page-name> - This is a route to whatever you put as pagename for example a folder named hello will result in '/hello'
  /contact - This is an example of a possible folder name/route results in '/contact'
    /css - This contains all css files for the app, every file as a direct child of this folder is considered an entrypoint
      /<subfolder> - subfolders of the css folder are not being used as entrypoints
      style.css - Entrypoint transpiled by postCSS
      anotherstyle.scss - Entrypoint transpiled by node-sass
    /js - This contains all the javascript code for the page
      App.js - This is the entrypoint (You can use any extension as long as parcel understands it and it outputs as Javascript)
    pageData.json - This file can contain any page specific data
    handleRequest.js - This file handles allows you to add custom pre-processing and data injection into the app, before it gets rendered (You can use any extension as long as parcel understands it and it outputs as Javascript)
  siteData.json - This file can contain any site specific data
```

Starting the application:
```bash
blazingly serve <folder containing all the pages {in the above case ./root}>
```

Building for production
```bash
blazingly build <folder containing all the pages {in the above case ./root}>
```

Starting the production server (run blazingly build first!)
```bash
blazingly prod-serve <the output folder of the build command>
```