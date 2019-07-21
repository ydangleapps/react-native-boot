# About tasks

Tasks are individual functions which are registered on startup. As soon as any command is executed by the user, all tasks are gathered by searching the main project directory for `**/*.rntask.js`. This means that tasks can be prepended, appended, or modified by any package that has been installed in the user's project.

This repo adds some built-in tasks, as well as some tasks for well known react-native libraries.

Tasks can be attached `before` or `after` other tasks. Here's an example task which runs after the user has built their app:

``` js
// after-build.rntask.js
module.exports = runner => {

    // Register a task to run after the build process is completed
    runner.register().after('build').do(async ctx => {

        // Build task has completed
        console.log('Your project was built!')

    })

}
```

# About commands

"Commands" are just named tasks that the user can execute by running `yarn do <TaskName>`. Here is an example custom command:

``` js
// custom.rntask.js
module.exports = runner => {

    // Register custom named task
    runner.register('hello').do(async ctx => {

        // Say hello back
        console.log('Hello!')

    })

}
```

Now the user can run `yarn do hello` in the terminal.

When a command is run, multiple tasks are spawned. Run the `view.tasks` command to get an output of the entire task dependency tree and run order.

# About context

There is a shared `ctx` object which is available to all running tasks. You can add your own content to this object if you wish. Before any task is run, a `_init` task is run which adds information to the context.

Here's an example of a custom function added to the context, which can then be used by any other task:

``` js
// init-custom.rntask.js
module.exports = runner => runner.register().after('_init').do(async ctx => {

    // Add a helper function
    ctx.helpme = function() {
        console.log("You've been helped!")
    }

})
```

``` js
// another.rntask.js
module.exports = runner => register().after('build').do(async ctx => {

    // Call the helper function
    ctx.helpme()

})
```

The built-in tasks add the following items to the context:

Field                           | Description
--------------------------------|--------------------
`ctx.run(cmd, opts)`            | Executes a shell command in the project's root directory. `opts` is any custom params to pass to `child_process.spawn()`.
`ctx.runWithOutput(cmd, opts)`  | Executes a shell command in the project's root directory. `opts` is any custom params to pass to `child_process.exec()`. Returns the output of the command.
`ctx.iosPermissions.add(key, text)` | Adds a text description for the specified permission key. See [here](https://www.iosdev.recipes/info-plist/permissions/) for a list of keys. If `text` is not specified, the build will fail until the project sets a text description, so this can be used by libraries to register that a permission usage description needs to be set without actually setting it.
`ctx.project`                   | Details about the project
`ctx.project.appInfo`           | Contents of the project's `app.json`
`ctx.project.info`              | Contents of the project's `package.json`
`ctx.project.path`              | Absolute path to the project root.
`ctx.project.uses(module)`      | Returns `true` if the project uses the specified module.
`ctx.project.stateHash`         | A hash which changes whenever a new package is installed or the app information changes.
`ctx.status(txt)`               | Display current task to the user. Will display the task stack as well.

# About errors

Tasks are run in order, and if any one fails the entire task stack will be aborted. Due to this, registering your task as a `.before()` or `.after()` of another task is important. If your task failing should prevent the parent task from running, you should use `.before()`.

An example of this is the `prepare` task. This task includes some logic to prevent recreating the native projects if nothing in the main project has changed. Platform plugins which prepare a native project should use `.before('prepare')`, so that if it fails it will be retried on the next run.

# About build lifecycle

Each step of the build process can be extended with a `.before()` or `.after()` task. The general flow is:

- `setup` : Asks the user for information about their project.
- `prepare` : Builds the native project folders in a temporary directory.
- `devices` : Selects a device to run the app on.
- `run` : Builds and runs the app.
- `publish` : Creates a production build of the app for releasing.

Known tasks:

### `_init`

This is always run at the beginning when the user runs a command. You can use it to register new functions and data on the shared `ctx`.

``` js
// my-custom-utils.rntask.js
module.exports = r => r.register().before('_init').name('Add utility function').do(async ctx => {

    // Register some extra stuff on the context
    ctx.add = function(a, b) {
        return a + b
    }

})
```

### `setup.check`

This checks that the project is set up correctly.

Plugins can register an `.after('setup.check')` task to check for plugin-specific app settings. Set `ctx.setupNeeded = true` if you think the project setup should be run again.

``` js
// android-check.rntask.js
module.exports = r => r.register().after('setup.check').name('Check for app name').do(async ctx => {

    // Run setup again if no app name
    if (!ctx.property('name'))
        ctx.setupNeeded = true

})
```

### `setup`

This is run when the user's project is incomplete, on first run, or if the user runs `yarn do setup`. This will ask the user for information about the project and write it to app.json.

Plugins can register an `.after('setup')` task to ask the user for additional information if necessary.

### `prepare`

This is run when the project state changes. The user can also run `yarn do prepare` to run this step manually. It recreates the native project folders in a temporary location.

Platform plugins can create tasks with `.register('prepare.platformname').before('prepare')` to create their native projects.

Libraries which need to customize the native project structure can then register an `.after('prepare.platformname')` task and modify the native project as they need.

``` js
// android-support.rntask.js - provided by a platform plugin
module.exports = r => r.register('prepare.android').before('prepare').name('Android').do(async ctx => {

    // These fields must be set by platform plugins
    ctx.android = {}
    ctx.android.path = // ... temporary path location

})
```

``` js
// my-library-android.rntask.js - provided by a library plugin
module.exports = r => r.register('my-library-name').after('prepare.android').do(async ctx => {

    // Modify native project files
    fs.writeFile(ctx.android.path + '/file', 'data')    // etc

})
```

### `devices`

This is run when the user needs to choose a device to run their app on. Platform plugins should register a `.before('devices')` task to populate the device list, like so:

``` js
// populate-device-list.rntask.js
module.exports = r => r.register().before('devices').do(async ctx => {

    // Add devices
    ctx.devices.push({ 
        id: 'mydevice1',            // Unique ID for this device. Will be set to ctx.deviceID when running
        name: 'My Device',          // User-visible name of the device
        runTask: 'run.android',     // Task to execute if the user runs on this device
        platform: 'Android'         // User-visible platform name
    })

})
```

### `run`

This executes the app on the selected device.

If `setup.check` returns `ctx.setupNeeded = true`, the `setup` task will be run.

If `prepare.check` returns `ctx.prepareNeeded = true`, the `prepare` task will be run.

If `device.check` returns `ctx.device == null`, the `devices` task will be run.

The platform-specific task name in `ctx.device.runTask` will then be run.