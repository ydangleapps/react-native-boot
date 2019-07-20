
const path = require('path')
const replace = require('replace-in-file')
const fs = require('fs-extra')
const chalk = require('chalk')
const glob = require('glob')
const rimraf = require('rimraf')
const os = require('os')

module.exports = runner => {

    //
    // Fetch information about this platform
    runner.register('libinfo.android').before('info').name('Android').do(async ctx => {

        // Stop if Android support is disabled
        if (!ctx.android)
            return ctx.infocmd.problems.push("Android support is disabled.")

        // Find all libraries to link
        let files = await new Promise((resolve, reject) => glob('**/android/build.gradle', {
            cwd: ctx.project.path,
            follow: true
        }, (err, matches) => {
            if (err) reject(err)
            else resolve(matches)
        }))
        
        // Link each library
        for (let file of files) {

            // Skip projects where the android directory is not in the root of the project
            if (!await fs.exists(path.resolve(ctx.project.path, file, '../../package.json')))
                continue

            // Skip projects with an app.json, since those are most likely template full apps and not a library
            if (await fs.exists(path.resolve(ctx.project.path, file, '../../app.json')))
                continue

            // Get project info
            let androidLibPath = path.resolve(ctx.project.path, file, '..')
            let androidLibName = require(path.resolve(androidLibPath, '../package.json')).name
            
            // Add it
            ctx.infocmd.libraries[androidLibName] = ctx.infocmd.libraries[androidLibName] || {}
            ctx.infocmd.libraries[androidLibName].platforms = ctx.infocmd.libraries[androidLibName].platforms || []
            ctx.infocmd.libraries[androidLibName].platforms.push('android')

        }

    })

    //
    // Display information about the Android app
    runner.register('info.android').after('info').do(async ctx => {

        // Output info about the Android app
        console.log(chalk.cyan('=== Android app ==='))
        console.log(chalk.blue('Package: ') + ctx.android.packageName)

        // Get debug signature
        let keystore = path.resolve(os.homedir(), '.android/debug.keystore')
        let txt = await ctx.runWithOutput(`keytool -list -keystore "${keystore}" -storepass android -alias androiddebugkey`)
        let match = /([0-9A-F][0-9A-F]\:){19}[0-9A-F][0-9A-F]/g.exec(txt)
        console.log(chalk.blue('Debug SHA1 fingerprint: ') + (match && match[0] || chalk.gray('(not found)')))

        // Get release signature
        let keystorePath = ctx.session.get('android.keystore.path')
        let keystorePass = ctx.session.get('android.keystore.password')
        let keystoreAlias = ctx.session.get('android.keystore.alias.name')
        if (keystorePath) console.log(chalk.blue('Release keystore: ') + keystorePath)
        if (keystoreAlias) console.log(chalk.blue('Release keystore alias: ') + keystoreAlias)
        if (keystorePath && keystorePass && keystoreAlias) {

            // We have all info, get the fingerprint
            let txt = await ctx.runWithOutput(`keytool -list -keystore "${keystorePath}" -storepass "${keystorePass}" -alias "${keystoreAlias}"`)
            let match = /([0-9A-F][0-9A-F]\:){19}[0-9A-F][0-9A-F]/g.exec(txt)
            console.log(chalk.blue('Release SHA1 fingerprint: ') + (match && match[0] || chalk.gray('(not found)')))

        } else {

            // Not enough info
            console.log(chalk.yellow('App signing for release is not set up.') + ' Please run ' + chalk.cyan('npm start setup.android.signing'))

        }

    })

}