
const path = require('path')
const replace = require('replace-in-file')
const fs = require('fs-extra')
const chalk = require('chalk')
const glob = require('glob')
const rimraf = require('rimraf')

module.exports = runner => {

    //
    // Add linking configuration options
    runner.register().after('_init.android').do(ctx => {

        // Allows libraries to override auto linking for a library by doing `ctx.android.linking.skip['my-lib'] = true`
        ctx.android.linking = {}
        ctx.android.linking.skip = {}

    })

    //
    // Update android native project to reference the included libraries
    runner.register('prepare.android.link').after('prepare.android').name('Link libraries').do(async ctx => {

        // Find all libraries to link
        ctx.status('Searching for native libraries...')
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
            if (ctx.android.linking.skip[androidLibName]) continue
            ctx.status('Linking ' + chalk.cyan(androidLibName))

            // Find Java package file and read it
            let packageName = ''
            let packageInclude = ''
            let files = glob.sync(path.resolve(androidLibPath, '**/*.java'), { follow: true })
            for (let file of files) {

                // Extract required parts of the code
                let txt = await fs.readFile(path.resolve(androidLibPath, file), 'utf8')
                let match = /package (.*?);.*class\s+(\S+?)\s+implements.+?ReactPackage/sg.exec(txt)
                if (!match || !match[1] || !match[2])
                    continue

                // Found the info we're looking for
                packageInclude = match[1]
                packageName = match[2]
                break

            }
            if (!packageName || !packageInclude) {
                ctx.warning('Unable to parse package info for library ' + chalk.cyan(androidLibName))
                continue
            }

            // Add to build process
            ctx.android.injectProject(androidLibName, androidLibPath)

            // Link in the app code
            ctx.android.injectRNPackage(packageInclude, packageName)

        }

    })

}