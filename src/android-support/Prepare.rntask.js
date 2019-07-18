
const path = require('path')
const fs = require('fs-extra')
const os = require('os')
const rimraf = require('rimraf')
const replace = require('replace-in-file')
const which = require('which')

module.exports = runner => {

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