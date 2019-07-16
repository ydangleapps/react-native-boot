
const path = require('path')
const replace = require('replace-in-file')
const fs = require('fs-extra')
const chalk = require('chalk')
const glob = require('glob')
const rimraf = require('rimraf')

module.exports = runner => {

    //
    // Update android native project to reference the included libraries
    runner.register('prepare.android.link').after('prepare.android').name('Link libraries').do(async ctx => {

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
            ctx.status('Linking ' + chalk.cyan(androidLibName))

            // Strip funny chars for the android project name
            let androidProjectName = androidLibName.replace(/[@\/\\:;"'\(\)\[\]]/g, '')

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

            // Check if the lib needs to be updated to AndroidX
            // let oldAndroidSupport = await ctx.files.contains(path.resolve(androidLibPath, '**/*.java'), 'import android.support.')
            // if (oldAndroidSupport) {
                
                // // Make a copy
                // ctx.status('Library ' + chalk.cyan(androidLibName) + ' is ' + chalk.yellow('not using AndroidX'))
                // let newPath = path.resolve(ctx.tempPath, 'android-' + androidProjectName)
                // if (await fs.exists(newPath)) rimraf
                // await fs.copy(androidLibPath, newPath)
                // androidLibPath = newPath

                // // Set a config so it uses jetify
                // await fs.writeFile(path.resolve(androidLibPath, 'gradle.properties'), `
                //     android.useAndroidX=false
                //     android.enableJetifier=false
                // `)
                // await fs.appendFile(path.resolve(androidLibPath, 'build.gradle'), `
                //     dependencies {
                //         implementation 'com.android.support:support-v4:27.0.2' // v4
                //         implementation 'com.android.support:appcompat-v7:23.2.0' // v7
                //         implementation 'com.android.support:support-v13:23.2.0' //v13
                //     }`
                // )
                
            // }

            // Add to build process
            replace.sync({ 
                files: path.resolve(ctx.android.path, 'settings.gradle'), 
                from: "include ':app'",
                to: `include ':${androidProjectName}'\nproject(':${androidProjectName}').projectDir = new File('${androidLibPath.replace(/\\/g, '\\\\')}')\ninclude ':app'`
            })
            replace.sync({ 
                files: path.resolve(ctx.android.path, 'app/build.gradle'), 
                from: "/*PROJECT_DEPS_INJECT*/",
                to: `/*PROJECT_DEPS_INJECT*/\n    implementation project(':${androidProjectName}')`
            })

            // Link in the app code
            replace.sync({ 
                files: path.resolve(ctx.android.path, '**/MainApplication.java'), 
                from: "/*INJECT_LIB_INCLUDES*/",
                to: `/*INJECT_LIB_INCLUDES*/\nimport ${packageInclude}.${packageName};`
            })
            replace.sync({ 
                files: path.resolve(ctx.android.path, '**/MainApplication.java'), 
                from: "/*INJECT_LIB_PACKAGES*/",
                to: `/*INJECT_LIB_PACKAGES*/\n      packages.add(new ${packageName}());`
            })

        }

    })

}