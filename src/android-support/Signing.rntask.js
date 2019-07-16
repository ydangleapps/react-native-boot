
const path = require('path')
const replace = require('replace-in-file')
const fs = require('fs')
const chalk = require('chalk')

module.exports = runner => {
    
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
        

//         // Add signing config
//         ctx.status(`Adding signing config...`)
//         replace.sync({
//             files: path.resolve(ctx.project.path, 'android/app/build.gradle'),
//             from: 'android {',
//             to: `android {
//                 signingConfigs {
//                     release {
//                         if (project.hasProperty('${ctx.project.signingName}_RELEASE_STORE_PASSWORD')) {
//                             storeFile file("${keystore.replace(/\\/g, '\\\\')}")
//                             storePassword ${signingName}_RELEASE_STORE_PASSWORD
//                             keyAlias "${ctx.signing.keystoreAlias}"
//                             keyPassword ${signingName}_RELEASE_KEY_PASSWORD
//                         }
//                     }
//                 }
//             `
//         })
//         replace.sync({
//             files: path.resolve(ctx.project.path, 'android/app/build.gradle'),
//             from: /buildTypes[\s\S]*?release {/g,
//             to: `buildTypes {
//                 release {
//                 signingConfig signingConfigs.release
//             `
//         })

//     })

//     // Setup a generic signing profile on the current device
//     runner.register('signing.android.setup').name('Generate keystore').do(async ctx => {

//         ctx.status('NOT IMPLEMENTED YET')

//     })

}