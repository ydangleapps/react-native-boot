//
// Build the Android APK

// const { run } = require('./utils')
// const colors = require('colors')
// const replace = require('replace-in-file')
// const path = require('path')

// async function start() {

//     // First, remove all native app folders
//     console.log('')
//     console.log('  +---------------------+')
//     console.log('  |    Build Android    |')
//     console.log('  +---------------------+')
//     console.log('')
//     console.log('We will now build an Android APK for production release.')
//     console.log('')

//     // Update app version number to match package
//     let versionName = require('../package.json').version
//     let versionComps = versionName.split('.')
//     let versionCode = 0
//     for (let i = 0 ; i < versionComps.length ; i++)
//         versionCode += Math.pow(100, versionComps.length-i) * (parseInt(versionComps[i]) || 0)

//     console.log(`Updated native app version to ${versionName.cyan} (code ${versionCode.toString().cyan})...`)

//     replace.sync({
//         files: path.resolve(__dirname, '../android/app/build.gradle'),
//         from: /versionName ".*?"/g,
//         to: `versionName "${versionName}"`
//     })
//     replace.sync({
//         files: path.resolve(__dirname, '../android/app/build.gradle'),
//         from: /versionCode [0-9]*/g,
//         to: `versionCode ${versionCode}`
//     })

//     // Run build command
//     console.log('Building...')
//     run('gradlew app:assembleRelease', { cwd: path.resolve(__dirname, '../android') })

//     // Done
//     console.log('Done! APK can be found at ' + 'android/app/build/outputs/apk/release/app-release.apk'.cyan)

// }

// start().catch(err => console.log('ERROR: '.red + err.message))