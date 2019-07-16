
const path = require('path')
const fs = require('fs-extra')
const os = require('os')
const rimraf = require('rimraf')
const replace = require('replace-in-file')

module.exports = runner => {

    //
    // Add android project settings to the context
    runner.register('_init.android').after('_init').do(async ctx => {

        // Get path to Android project
        ctx.android = {}
        ctx.android.path = path.resolve(ctx.tempPath, 'android')
        ctx.android.packageName = ctx.property('packageID.android')

        // Find SDK location from common locations
        ctx.android.sdkRoot = [

            // Check the env var
            process.env.ANDROID_HOME,
            
            // Common install path on Mac
            path.resolve(require('os').homedir(), 'Library/Android/sdk')

        ].find(loc => fs.existsSync(loc))

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
    runner.register().before('prepare.check').do(async ctx => {

        // Recreate if project folder no longer exists
        if (!fs.existsSync(ctx.android.path))
            ctx.prepareNeeded = true

    })

    //
    // The 'prepare' task is run when the native project needs to be recreated.
    runner.register('prepare.android').before('prepare').name('Android').do(async ctx => {

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

        // Check Android SDK exists
        if (!ctx.android.sdkRoot)
            throw new Error(`Couldn't find your Android SDK. Have you installed Android Studio?`)

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