# React Native Do

This is an experimental replacement for the standard CLI that comes with react-native. 
The difference with this tool is that the **native folders are temporary,** and hidden away
from app creators.

If you'd like to create a react native app but don't want to work with any native code, give
this tool a try!

## New project setup (NOT IMPLEMENTED YET)

To create a new react-native project, make sure you have [Node](https://nodejs.org) installed, and then run:

``` sh
npx react-native-do new.project
```

## Add to existing project

To add this library to your existing project:

- Remove all native-specific folders from your project like `ios/`, `android/` etc
- Install: `npm install --save-dev github:jjv360/react-native-do`
- Update your scripts. In your `package.json`, change the `scripts` section to:

``` json
{
    ...
    "scripts": {
        "start": "node ./node_modules/react-native-do/cli.js",
        "do": "node ./node_modules/react-native-do/cli.js"
    }
}
```

## Usage

Now that you have the tool installed, you can run any of the commands by doing `npm start <CMD>`, or `yarn do <CMD>`. See below for a list of available commands.

Command         | Description
----------------|---------------------
`run`           | Builds and runs your app.
`devices`       | Lists available devices and allows you to to choose which one to run your app on.
`build`         | Build an executable for each platform.
`publish`       | Publish to the app stores
`setup`         | This is run the first time you `run` your app, but if you want to change any options you can run it again.
`info`          | Display information about your app.

## Contributing and extending

All contributions are welcome! [Here](About.md) is a description of how the task management system works, which allows tasks to be added by this package, or by included packages, or by the main project itself.