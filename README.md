![status](https://img.shields.io/badge/status-pre%20alpha-red.svg)
![npm](https://img.shields.io/npm/dw/react-native-boot.svg)
[![npm (tag)](https://img.shields.io/npm/v/react-native-boot/latest.svg)](https://github.com/wix/react-native-navigation/tree/master)
[![StackExchange](https://img.shields.io/stackexchange/stackoverflow/t/react-native-navigation.svg)](https://stackoverflow.com/questions/tagged/react-native-boot)

<h1 align="center">
  React Native Boot
</h1>

React Native Boot is an experimental CLI tool for building and running react native apps _without ever
seeing any native code or configuration._ If you like the idea of a pure Javascript React Native app,
give it a try!

Check [here](Support.md) for current library and platform support.

## New project setup (NOT IMPLEMENTED YET)

To create a new react-native project, make sure you have [Node](https://nodejs.org) installed, and then run:

``` sh
npx github:ydangleapps/react-native-boot new
```

## Add to existing project

To add this library to your existing project:

- Remove all native-specific folders from your project like `ios/`, `android/` etc
- Install: `npm install --save-dev github:ydangleapps/react-native-boot`
- Update your scripts. In your `package.json`, change the `scripts` section to:

```
"scripts": {
    "start": "node ./node_modules/react-native-boot/cli.js",
    "boot": "node ./node_modules/react-native-boot/cli.js"
}
```

## Usage

Now that you have the tool installed, you can run your app with `npm start`. You can also run any of the commands by doing `npm run boot <CMD>`, or `yarn boot <CMD>`. See below for a list of available commands.

Command         | Description
----------------|---------------------
`run`           | Builds and runs your app. If no `<CMD>` is specified, this is the default task which is run.
`devices`       | Lists available devices and allows you to to choose which one to run your app on.
`build`         | Build an executable for each platform. _(NOT IMPLEMENTED)_
`publish`       | Publish to the app stores. _(NOT IMPLEMENTED)_
`setup`         | This is run the first time you `run` your app, but if you want to change any options you can run it again.
`info`          | Display information about your app.

## Contributing and extending

All contributions are welcome! [Here](About.md) is a description of how the task management system works, which allows tasks to be collected from this package, or from the project's dependecies, or from the project itself.

The goal of this tool is to provide a no-config way of linking native libraries and running the app. Ideally
installing a new react-native library into your project should be seamless. This means that any libraries which don't follow the standard project layout or have a special install process, needs a custom run task to be used with this tool automatically.

We include a collection of run tasks for well known libraries. If you encounter a library which does not install automatically, please submit an issue, or submit a PR with a run task. If you're a library creator, you can also include a run task directly in your library, like in [this example](src/external/react-native-navigation.rntask.js).