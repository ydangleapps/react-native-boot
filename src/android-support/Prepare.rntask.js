
const path = require('path')
const fs = require('fs-extra')
const rimraf = require('rimraf')
const replace = require('replace-in-file')

module.exports = runner => {

    //
    // The 'prepare' task is run when the native project needs to be recreated.
    runner.register('prepare.android').name('Prepare native project').do(async ctx => {

        // Check if we can skip creating the native project and reuse the existing one
        let sameHash = ctx.session.get('android.last-build-hash') === ctx.project.stateHash
        let nativeProjectExists = await fs.exists(ctx.android.path)
        if (sameHash && nativeProjectExists)
            return

        // Delete temporary Android project directory if it exists
        ctx.status('Preparing native project...')
        await fs.remove(ctx.android.path)
        ctx.session.set('android.last-build-hash', null)

        // Check if still exists
        if (await fs.exists(ctx.android.path))
            throw new Error('Unable to delete Android build folder. Maybbe you have a stuck instance of ' + chalk.yellow('adb') + ' still running?')

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

        // Do next prepare steps
        await runner.run('prepare.android.icon', ctx)
        await runner.run('prepare.android.link', ctx)
        await runner.run('prepare.android.minsdk', ctx)
        await runner.run('prepare.android.version', ctx)
        await runner.run('prepare.android.file-extensions', ctx)
        await runner.run('prepare.android.sign', ctx)

        // Make sure user has accepted all licenses
        ctx.status('Checking Android SDK licenses...')
        await ctx.run(`"${path.resolve(ctx.android.sdkRoot, 'tools/bin/sdkmanager')}" --licenses`)

        // Store state hash
        ctx.session.set('android.last-build-hash', ctx.project.stateHash)

    })

}