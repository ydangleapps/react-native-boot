
const path = require('path')
const fs = require('fs-extra')
const os = require('os')
const rimraf = require('rimraf')
const replace = require('replace-in-file')
const which = require('which')

// Find an executable on the path and return a relative path to it, or return "executable-not-found"
function whichExe(name, resolvePath) {
    try {
        console.log(name, which.sync(name), resolvePath, path.resolve(which.sync(name), resolvePath))
        return path.resolve(which.sync(name), resolvePath)
    } catch (err) {
        return "executable-not-found"
    }
}

module.exports = runner => {

    // Find SDK location from common locations
    let sdkRoot = [

        // Check the env var
        process.env.ANDROID_HOME,
        
        // Common install path on Mac
        path.resolve(require('os').homedir(), 'Library/Android/sdk'),

        // Common install path on Windows
        path.resolve(require('os').homedir(), 'AppData/Local/Android/Sdk'),

        // Find on path
        whichExe('adb', '..')

    ].find(loc => fs.existsSync(loc))

    //
    // Add android project settings to the context
    runner.register('_init.android').name('Android').after('_init').requires(async ctx => {

        // Make sure SDK exists
        if (!sdkRoot) {
            ctx.warning('Android SDK not installed.')
            return false
        }

        // Make sure Java exists
        if (!ctx.env.JAVA_HOME) {
            ctx.warning('Java is not installed, or JAVA_HOME has not been set.')
            return false
        }

        // Success, Android is available
        return true

    }).do(async ctx => {

        // Register platform
        ctx.android = {}
        ctx.android.sdkRoot = sdkRoot
        ctx.platforms['android'] = {
            name: 'Android'
        }

        // Get path to Android project
        ctx.android.path = path.resolve(ctx.tempPath, 'android')
        ctx.android.packageName = ctx.property('packageID.android')

        // Add ADB run command
        ctx.android.adb = function(args) {
            return ctx.runWithOutput(`"${path.resolve(ctx.android.sdkRoot, 'platform-tools/adb')}" ${args}`)
        }

        // Add ADB run command
        ctx.android.adbForwardOutput = function(args) {
            return ctx.run(`"${path.resolve(ctx.android.sdkRoot, 'platform-tools/adb')}" ${args}`)
        }

        // Add ADB stream command
        ctx.android.adbStream = function(args, callback) {
            return ctx.runStream(`"${path.resolve(ctx.android.sdkRoot, 'platform-tools/adb')}" ${args}`, null, callback)
        }

        // Add gradle run command
        ctx.android.gradle = function(args) {
            return ctx.run(`"${path.resolve(ctx.android.path, 'gradlew')}" ${args}`, { cwd: ctx.android.path })
        }

    })

    //
    // Run checks to see if the project needs to be recreated
    runner.register('prepare.android.check').do(async ctx => {

        // Recreate if project folder no longer exists
        if (!fs.existsSync(ctx.android.path))
            ctx.prepareNeeded = true

    })

    //
    // The 'prepare' task is run when the native project needs to be recreated.
    runner.register('prepare.android').name('Android').do(async ctx => {

        // Delete temporary Android project directory if it exists
        ctx.status('Preparing native project...')
        rimraf.sync(ctx.android.path, { glob: false })

        // Copy Android template project
        await fs.copy(path.resolve(__dirname, 'native-template'), ctx.android.path)

        // Update relative paths in the build config
        replace.sync({ 
            files: path.resolve(ctx.android.path, '**/*.gradle'), 
            from: /PROJECTROOT_INJECT/g,
            to: ctx.project.path.replace(/\\/g, '\\\\')
        })
        replace.sync({ 
            files: path.resolve(ctx.android.path, '**/*.gradle'), 
            from: /ANDROIDSUPPORTROOT_INJECT/g,
            to: path.resolve(__dirname).replace(/\\/g, '\\\\')
        })

        // Change project's package name
        replace.sync({ 
            files: path.resolve(ctx.android.path, '**/*'), 
            from: /com.helloworld/g,
            to: ctx.android.packageName
        })
        replace.sync({ 
            files: path.resolve(ctx.android.path, '**/*'), 
            from: /Hello App Display Name/g,
            to: ctx.property('displayName.android')
        })
        replace.sync({ 
            files: path.resolve(ctx.android.path, 'app/**/*.java'), 
            from: /return "HelloWorld"/g,
            to: `return "${ctx.project.appInfo.name}"`
        })
        replace.sync({ 
            files: path.resolve(ctx.android.path, 'settings.gradle'), 
            from: /HelloWorld/g,
            to: ctx.project.appInfo.name
        })

        // Move package files
        await fs.move(
            path.resolve(ctx.android.path, 'app/src/main/java/com/helloworld/MainActivity.java'), 
            path.resolve(ctx.android.path, 'app/src/main/java', ctx.android.packageName.replace(/\./g, '/'), 'MainActivity.java')
        )
        await fs.move(
            path.resolve(ctx.android.path, 'app/src/main/java/com/helloworld/MainApplication.java'), 
            path.resolve(ctx.android.path, 'app/src/main/java', ctx.android.packageName.replace(/\./g, '/'), 'MainApplication.java')
        )

        // Make gradlew executable for linux-ish OSes
        await fs.chmod(path.resolve(ctx.android.path, 'gradlew'), 0o777)

        // Create local properties
        let config = `
            sdk.dir = ${ctx.android.sdkRoot.replace(/\\/g, '\\\\')}
        `
        await fs.writeFile(path.resolve(ctx.android.path, 'local.properties'), config)

        // Make sure user has accepted all licenses
        ctx.status('Checking Android SDK licenses...')
        await ctx.run(`"${path.resolve(ctx.android.sdkRoot, 'tools/bin/sdkmanager')}" --licenses`)

    })

}