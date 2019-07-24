
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
        let keystorePass = ''
        let keystoreAlias = ''
        let keystoreAliasPassword = ''

        // Check if project has a keystore in the usual spot
        location = path.resolve(ctx.project.path, 'metadata/android.keystore')
        if (!await fs.exists(location)) {
        
            // No default keystore, ask user what they want to do
            let newLocation = await ctx.console.ask({ question: 'Enter path to Android keystore, or leave blank to generate one:' })
            if (newLocation) {
                
                // Use user's keystore file
                location = newLocation

                // Make sure it exists
                location = path.resolve(location)
                if (!await fs.exists(location))
                    throw new Error('Unable to find Android keystore at ' + chalk.cyan(location))

                // Fetch password if needed
                while (!keystorePass) {

                    // Ask user for password
                    let pwd = await ctx.console.ask({ type: 'password', question: 'Enter your keystore password:' })

                    // Try load password
                    try {
                        await ctx.runWithOutput(`keytool -list -keystore "${location}" -storepass "${pwd.replace(/"/g, '\"')}"`)
                        keystorePass = pwd
                        ctx.status('Password accepted!')
                        break
                    } catch (err) {
                        ctx.warning(err.message)
                        continue
                    }

                }

                // Fetch list of aliases
                if (!keystoreAlias) {
                    await ctx.run(`keytool -list -keystore "${location}" -storepass "${keystorePass.replace(/"/g, '\"')}"`)
                    while (true) {

                        // Ask user for alias
                        let alias = await ctx.console.ask({ question: 'Enter your keystore alias:' })

                        // Try load it
                        try {
                            await ctx.runWithOutput(`keytool -list -keystore "${location}" -storepass "${keystorePass.replace(/"/g, '\"')}" -alias "${alias}"`)
                            keystoreAlias = alias
                            ctx.status('Alias accepted!')
                            break
                        } catch (err) {
                            ctx.warning(err.message)
                            continue
                        }

                    }
                }

                // Try the store password to see if it can be used on the alias
                try {
                    await ctx.runWithOutput(`keytool -keypasswd -keystore "${location}" -storepass "${keystorePass.replace(/"/g, '\"')}" -alias "${keystoreAlias}" -keypass "${keystorePass.replace(/"/g, '\"')}" -new "${keystorePass.replace(/"/g, '\"')}"`)
                    keystoreAliasPassword = keystorePass
                } catch (err) {
                    // Not the same password
                }

                // Fetch alias password if needed
                while (!keystoreAliasPassword) {

                    // Ask user for password
                    let pwd = await ctx.console.ask({ type: 'password', question: 'Enter your keystore password for alias ' + chalk.cyan(keystoreAlias) + ':' })

                    // Try load password
                    try {
                        await ctx.runWithOutput(`keytool -keypasswd -keystore "${location}" -storepass "${keystorePass.replace(/"/g, '\"')}" -alias "${keystoreAlias}" -keypass "${pwd.replace(/"/g, '\"')}" -new "${pwd.replace(/"/g, '\"')}"`)
                        keystoreAliasPassword = pwd
                        ctx.status('Password accepted!')
                        break
                    } catch (err) {
                        ctx.warning(err.message)
                        continue
                    }

                }

            } else {

                // Generate one
                keystorePass = keystoreAliasPassword = await generateSigningKeystore(ctx)
                keystoreAlias = 'androidreleasekey'

            }

        } else {

            // Ask user for the project's keystore password
            keystoreAlias = 'androidreleasekey'
            while (!keystoreAliasPassword) {

                // Ask user for password
                let pwd = await ctx.console.ask({ type: 'password', question: 'Enter your keystore password for alias ' + chalk.cyan(keystoreAlias) + ':' })

                // Try load password
                try {
                    await ctx.runWithOutput(`keytool -keypasswd -keystore "${location}" -storepass "${pwd.replace(/"/g, '\"')}" -alias "${keystoreAlias}" -keypass "${pwd.replace(/"/g, '\"')}" -new "${pwd.replace(/"/g, '\"')}"`)
                    keystoreAliasPassword = keystorePass = pwd
                    ctx.status('Password accepted!')
                    break
                } catch (err) {
                    ctx.warning(err.message)
                    continue
                }

            }

        }

        // Store it
        ctx.session.set('android.keystore.path', location)
        ctx.session.set('android.keystore.password', keystorePass)
        ctx.session.set('android.keystore.alias.name', keystoreAlias)
        ctx.session.set('android.keystore.alias.password', keystoreAliasPassword)

    })

    //
    // Ensure signing is set up correctly before building the Android app
    runner.register('build.android.sign').before('build.android').name('Code signing').do(async ctx => {

        // Check session to find signing file
        let keystorePath = ctx.session.get('android.keystore.path')
        let keystorePass = ctx.session.get('android.keystore.password')
        let keystoreAlias = ctx.session.get('android.keystore.alias.name')
        let keystoreAliasPassword = ctx.session.get('android.keystore.alias.password')
        if (!keystorePath || !keystorePass || !keystoreAlias || !keystoreAliasPassword || !await fs.exists(keystorePath)) {

            // No signing available, run the signing setup
            ctx.status("No keystore found, running signing setup...")
            await runner.run('setup.android.signing', ctx)

            // If STILL unavailable, stop
            keystorePath = ctx.session.get('android.keystore.path')
            keystorePass = ctx.session.get('android.keystore.password')
            keystoreAlias = ctx.session.get('android.keystore.alias.name')
            keystoreAliasPassword = ctx.session.get('android.keystore.alias.password')
            if (!keystorePath || !keystorePass || !keystoreAlias || !keystoreAliasPassword || !await fs.exists(keystorePath))
                throw new Error("Unable to find keystore for signing.")

            // Ok, signing is set up now. Rebuild the native project.
            await runner.run('clean.android', ctx)

        }

    })

    //
    // Add signing information to the native project when preparing the native project folder
    runner.register('prepare.android.sign').name('Code signing').do(async ctx => {

        // Check session to find signing file
        let keystorePath = ctx.session.get('android.keystore.path')
        let keystorePass = ctx.session.get('android.keystore.password')
        let keystoreAlias = ctx.session.get('android.keystore.alias.name')
        let keystoreAliasPassword = ctx.session.get('android.keystore.alias.password')
        if (!keystorePath || !keystorePass || !keystoreAlias || !keystoreAliasPassword || !await fs.exists(keystorePath)) {

            // Signing unavailable!
            ctx.warning('Keystore not found, your app will not be signed!')
            return

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
                        storeFile file("${keystorePath.replace(/\\/g, '\\\\')}")
                        storePassword ${signingName}_RELEASE_STORE_PASSWORD
                        keyAlias "${keystoreAlias}"
                        keyPassword ${signingName}_RELEASE_KEY_PASSWORD
                    }
                }
            `
        })
        replace.sync({
            files: path.resolve(ctx.android.path, 'app/build.gradle'),
            from: '/*INJECT_SIGNING_CONFIG_BUILDTYPE*/',
            to: `signingConfig signingConfigs.release`
        })

    })

}

//
// Generate a new keystore for the user
async function generateSigningKeystore(ctx) {

    // Ask user for new password
    console.log('We will now generate a new signing key for you. Make sure you write down this password, as it is ' + chalk.yellow('required') + ' to upload new versions to the Play Store.')

    // Ask for first password
    let pass1 = await ctx.console.ask({ 
        question: 'Enter new signing password:', 
        type: 'password', 
        validate: 'password' 
    })
    
    // Ask for second password
    let pass2 = await ctx.console.ask({ 
        question: 'Enter new signing password:', 
        type: 'password', 
        validate: ['password', inp => inp == pass1 ? true : 'Password did not match.']
    })

    // Generate keystore
    ctx.status('Saving keystore to ' + chalk.cyan('metadata/android.keystore'))
    let kpath = path.resolve(ctx.project.path, 'metadata/android.keystore')
    await fs.ensureDir(path.resolve(kpath, '..'))
    await ctx.runWithOutput(`keytool -genkeypair -keystore "${kpath}" -storepass "${pass1}" -alias androidreleasekey -keypass "${pass1}" -keyalg RSA -keysize 2048 -validity 100000 -dname "CN=${ctx.android.packageName}" -noprompt`)
    return pass1

}