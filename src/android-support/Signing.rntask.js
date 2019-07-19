
const path = require('path')
const replace = require('replace-in-file')
const fs = require('fs-extra')
const chalk = require('chalk')
const os = require('os')

module.exports = runner => {

    //
    // Guided signing setup
    runner.register('setup.android.signing').name('Setup signing').do(async ctx => {

        // Notice
        ctx.status(chalk.yellow('You need to setup signing to build for Android.'))

        // Ask user what they want to do
        let location = await ctx.console.ask({ question: 'Enter path to Android keystore, or leave blank to generate one:' })
        if (!location) {

            // Generate one


        }

        // Make sure it exists
        location = path.resolve(location)
        if (!await fs.exists(location))
            throw new Error('Unable to find Android keystore at ' + chalk.cyan(location))

        // Store it
        ctx.session.set('android.keystore.path', location)
        ctx.session.set('android.keystore.password', '')
        ctx.session.set('android.keystore.alias.name', '')
        ctx.session.set('android.keystore.alias.password', '')

    })

    //
    // Prepare signing
    runner.register('build.android.sign').before('build.android').name('Sign').do(async ctx => {

        // Check session to find signing file
        let keystorePath = ctx.session.get('android.keystore.path')
        let keystorePass = ctx.session.get('android.keystore.password')
        let keystoreAlias = ctx.session.get('android.keystore.alias.name')
        let keystoreAliasPassword = ctx.session.get('android.keystore.alias.password')
        if (!keystorePath || !await fs.exists(keystorePath)) {

            // No signing available, run the signing setup
            ctx.status("No keystore, running signing setup...")
            await runner.run('setup.android.signing', ctx)

            // If STILL unavailable, stop
            let keystorePath = ctx.session.get('android.keystore')
            if (!keystorePath || !await fs.exists(keystorePath))
                throw new Error("Unable to find keystore for signing.")

        }

        // Fetch password if needed
        ctx.status('Using keystore at ' + chalk.cyan(keystorePath))
        while (!keystorePass) {

            // Ask user for password
            let pwd = await ctx.console.ask({ type: 'password', question: 'Enter your Android keystore password:' })

            // Try load password
            let data = ''
            try {
                await ctx.runWithOutput(`keytool -list -keystore "${keystorePath}" -storepass "${pwd.replace(/"/g, '\"')}"`)
                keystorePass = pwd
                ctx.session.set('android.keystore.password', keystorePass)
                ctx.status('Password accepted!')
                break
            } catch (err) {
                ctx.warning(err.message)
                continue
            }

        }

        // Fetch list of aliases
        if (!keystoreAlias) {
            await ctx.run(`keytool -list -keystore "${keystorePath}" -storepass "${keystorePass.replace(/"/g, '\"')}"`)
            while (true) {

                // Ask user for alias
                let alias = await ctx.console.ask({ question: 'Enter your Android keystore alias:' })

                // Try load it
                let data = ''
                try {
                    await ctx.runWithOutput(`keytool -list -keystore "${keystorePath}" -storepass "${keystorePass.replace(/"/g, '\"')}" -alias "${alias}"`)
                    keystoreAlias = alias
                    ctx.session.set('android.keystore.alias.name', keystoreAlias)
                    ctx.status('Alias accepted!')
                    break
                } catch (err) {
                    ctx.warning(err.message)
                    continue
                }

            }
        }

        // Fetch alias password if needed
        while (!keystoreAliasPassword) {

            // Ask user for password
            let pwd = await ctx.console.ask({ type: 'password', question: 'Enter your Android keystore password for alias ' + chalk.cyan(keystoreAlias) + ':' })

            // Try load password
            try {
                await ctx.runWithOutput(`keytool -keypasswd -keystore "${keystorePath}" -storepass "${keystorePass.replace(/"/g, '\"')}" -alias "${keystoreAlias}" -keypass "${pwd.replace(/"/g, '\"')}" -new "${pwd.replace(/"/g, '\"')}"`)
                keystoreAliasPassword = pwd
                ctx.session.set('android.keystore.alias.password', keystoreAliasPassword)
                ctx.status('Password accepted!')
                break
            } catch (err) {
                ctx.warning(err.message)
                continue
            }

        }

        // Get project app signing key name
        let signingName = ctx.project.appInfo.name.toUpperCase().replace(/[^0-9a-zA-Z]/g, '_')

        // Add password to ~/.gradle/gradle.properties
        let systemGradlePropertiesPath = path.resolve(os.homedir(), '.gradle/gradle.properties')
        await fs.ensureFile(systemGradlePropertiesPath)
        let contents = await fs.readFile(systemGradlePropertiesPath, 'utf8')
        if (contents.indexOf(signingName + '_RELEASE_STORE_PASSWORD') == -1) {

            // Doesn't exist, append to file
            await fs.appendFile(systemGradlePropertiesPath, `\n\n${signingName}_RELEASE_STORE_PASSWORD = "${keystorePass}"\n${signingName}_RELEASE_KEY_PASSWORD = "${keystoreAliasPassword}"\n`)

        } else {

            // Exists, replace existing definitions
            contents = contents.replace(new RegExp(`${signingName}_RELEASE_STORE_PASSWORD = ".*?"`, 'g'), `${signingName}_RELEASE_STORE_PASSWORD = "${keystorePass}"`)
            contents = contents.replace(new RegExp(`${signingName}_RELEASE_KEY_PASSWORD = ".*?"`, 'g'), `${signingName}_RELEASE_KEY_PASSWORD = "${keystoreAliasPassword}"`)
            await fs.writeFile(systemGradlePropertiesPath, contents)

        }

        // Add signing config
        replace.sync({
            files: path.resolve(ctx.android.path, 'app/build.gradle'),
            from: '/*INJECT_SIGNING_CONFIGS*/',
            to: `signingConfigs {
                    release {
                        if (project.hasProperty('${signingName}_RELEASE_STORE_PASSWORD')) {
                            storeFile file("${keystorePath.replace(/\\/g, '\\\\')}")
                            storePassword ${signingName}_RELEASE_STORE_PASSWORD
                            keyAlias "${keystoreAlias}"
                            keyPassword ${signingName}_RELEASE_KEY_PASSWORD
                        }
                    }
                }
            `
        })
        replace.sync({
            files: path.resolve(ctx.android.path, 'android/app/build.gradle'),
            from: '/*INJECT_SIGNING_CONFIG_BUILDTYPE*/',
            to: `signingConfig signingConfigs.release`
        })

    })
    
//     // Prepare signing
//     runner.register('prepare.signing.android').after('prepare').name('Android code signing').do(async ctx => {

//         // Get project app signing key name
//         let signingName = ctx.project.appInfo.name.toUpperCase().replace(/[^0-9a-zA-Z]/g, '_')

//         // Run initial signing setup
//         await runner.run('signing.android.setup', ctx)

//         // Get signing information from user's local home folder
//         try {

//             // Load signing information
//             let settingsPath = path.resolve(require('os').homedir(), '.react-native/signing', signingName + '.json')
//             let txt = await fs.promises.readFile(settingsPath, 'utf8')
//             ctx.signing = JSON.parse(txt)

//         } catch (err) {

//             // Unable to load signing info! TODO: Ask questions to help user set up the signing
//             ctx.status(chalk.yellow('Warning: ') + 'Skipping signing due to invalid config.')
//             return

//         }

//         // Get location of keystore
//         let keystore = path.resolve(ctx.signing.keystore)
//         if (!fs.existsSync(keystore))
//             throw new Error("Android keystore file does not exist: " + chalk.blue(keystore))

//         // TODO: Make sure password is written to ~/.gradle/gradle.properties
        

        // // Add signing config
        // ctx.status(`Adding signing config...`)
        // replace.sync({
        //     files: path.resolve(ctx.project.path, 'android/app/build.gradle'),
        //     from: 'android {',
        //     to: `android {
        //         signingConfigs {
        //             release {
        //                 if (project.hasProperty('${ctx.project.signingName}_RELEASE_STORE_PASSWORD')) {
        //                     storeFile file("${keystore.replace(/\\/g, '\\\\')}")
        //                     storePassword ${signingName}_RELEASE_STORE_PASSWORD
        //                     keyAlias "${ctx.signing.keystoreAlias}"
        //                     keyPassword ${signingName}_RELEASE_KEY_PASSWORD
        //                 }
        //             }
        //         }
        //     `
        // })
        // replace.sync({
        //     files: path.resolve(ctx.project.path, 'android/app/build.gradle'),
        //     from: /buildTypes[\s\S]*?release {/g,
        //     to: `buildTypes {
        //         release {
        //         signingConfig signingConfigs.release
        //     `
        // })

//     })

//     // Setup a generic signing profile on the current device
//     runner.register('signing.android.setup').name('Generate keystore').do(async ctx => {

//         ctx.status('NOT IMPLEMENTED YET')

//     })

}