
const path = require('path')
const fs = require('fs-extra')
const replace = require('replace-in-file')
const which = require('which')

// Find an executable on the path and return a relative path to it, or return "executable-not-found"
function whichExe(name, resolvePath) {
    try {
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

        // Inject a gradle dependency into the app
        ctx.android.injectDependency = code => {
            replace.sync({
                files: path.resolve(ctx.android.path, 'app/build.gradle'),
                from: "/*PROJECT_DEPS_INJECT*/",
                to: `/*PROJECT_DEPS_INJECT*/\n    ${code}`
            })
        }

        // Inject a project dependency into the app
        ctx.android.injectProject = (name, ppath) => {
            name = name.replace(/[@\/\\:;"'\(\)\[\]]/g, '')
            replace.sync({ 
                files: path.resolve(ctx.android.path, 'settings.gradle'), 
                from: "include ':app'",
                to: `include ':${name}'\nproject(':${name}').projectDir = new File('${ppath.replace(/\\/g, '\\\\')}')\ninclude ':app'`
            })
            replace.sync({ 
                files: path.resolve(ctx.android.path, 'app/build.gradle'), 
                from: "/*PROJECT_DEPS_INJECT*/",
                to: `/*PROJECT_DEPS_INJECT*/\n    implementation project(':${name}')`
            })
        }

        // Inject a react native package into the load chain
        ctx.android.injectRNPackage = (importPath, name) => {
            replace.sync({ 
                files: path.resolve(ctx.android.path, '**/MainApplication.java'), 
                from: "/*INJECT_LIB_INCLUDES*/",
                to: `/*INJECT_LIB_INCLUDES*/\nimport ${importPath}.${name};`
            })
            replace.sync({ 
                files: path.resolve(ctx.android.path, '**/MainApplication.java'), 
                from: "/*INJECT_LIB_PACKAGES*/",
                to: `/*INJECT_LIB_PACKAGES*/\n      packages.add(new ${name}());`
            })
        }

        // Inject a gradle classpath dependency
        ctx.android.injectClasspathDependency = code => {
            replace.sync({
                files: path.resolve(ctx.android.path, 'build.gradle'),
                from: '/*INJECT_CLASSPATH_DEPENDENCIES*/',
                to: "/*INJECT_CLASSPATH_DEPENDENCIES*/\n        " + code
            })
        }

        // Inject a Gradle repo
        ctx.android.injectGradleRepo = code => {
            replace.sync({
                files: path.resolve(ctx.android.path, 'build.gradle'),
                from: /\/\*INJECT_REPOS\*\//g,
                to: "/*INJECT_REPOS*/\n        " + code
            })
        }

        // Inject gradle plugin
        ctx.android.injectGradlePlugin = async code => {
            await fs.appendFile(path.resolve(ctx.android.path, 'app/build.gradle'), '\n' + code)
        }

    })

}