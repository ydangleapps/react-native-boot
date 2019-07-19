

<h1 align="center">
  React Native Boot
</h1>
<div align="center">
  <img src="https://img.shields.io/badge/android-unstable-orange.svg"/>
  <img src="https://img.shields.io/badge/ios-no-red.svg"/>
  <img src="https://img.shields.io/badge/windows-no-red.svg"/>
</div>

React Native Boot is an experimental CLI tool for building and running react native apps **without any native code or configuration.** If you like the idea of a pure Javascript React Native app,
give it a try!

## New project setup

To create a new react-native project, make sure you have [Node](https://nodejs.org) installed, and then run:

``` sh
npx github:ydangleapps/react-native-boot new
```

## Add to existing project

To add this library to an existing project:

- Remove all native-specific folders from your project like `ios/`, `android/` etc
- Install: `npm install --save-dev github:ydangleapps/react-native-boot`
- Update your scripts. In your `package.json`, change the `scripts` section to:

```
"scripts": {
    "start": "node ./node_modules/react-native-boot/cli.js"
}
```

## Usage

Now that you have the tool installed, you can run your app with `npm start`. You can also run any of the commands by doing `npm start <CMD>`. See below for a list of available commands.

Command         | Description
----------------|---------------------
`run`           | Builds and runs your app. If no `<CMD>` is specified, this is the default task which is run.
`devices`       | Lists available devices and allows you to to choose which one to run your app on.
`build`         | Build an executable for each platform.
`info`          | Display information about your app.

## Contributing and extending

All contributions are welcome! Some documentation:

- [Here](Recipes.md) is a collection of example tasks
- [Here](About.md) is a description of how task collection and execution works
- [Here](Support.md) is a list of supported platforms and libraries

The goal of this tool is to provide a zero-config React Native environment. Ideally
installing a new react-native library into your project should be seamless. This means that any libraries which don't follow the standard project layout or have a special install process, need a custom run task.

We include a collection of run tasks for well known libraries. If you encounter a library which does not install automatically, please submit an issue, or submit a PR with a run task. If you're a library creator, you can also include a run task directly in your library.
