
const path = require('path')
const replace = require('replace-in-file')

//
// This task modifies the native project's version to match the package.json version
module.exports = runner => runner.register('prepare.android.version').after('prepare.android').name('App version').do(async ctx => {

    // Update app version number to match package
    ctx.status(`Updating native app version to match package...`)
    let versionName = ctx.project.info.version
    replace.sync({
        files: path.resolve(ctx.android.path, 'app/build.gradle'),
        from: /versionName ".*?"/g,
        to: `versionName "${versionName}"`
    })

    // Calculate version code based on number of dots in the version
    let versionComps = versionName.split('.')
    let versionCode = 0
    for (let i = 0 ; i < versionComps.length ; i++)
        versionCode += Math.pow(100, versionComps.length-i) * (parseInt(versionComps[i]) || 0)

    // If a specific version code is set in the app.json, use that instead
    if (ctx.property('versionCode.android'))
        versionCode = ctx.property('versionCode.android')

    replace.sync({
        files: path.resolve(ctx.android.path, 'app/build.gradle'),
        from: /versionCode [0-9]*/g,
        to: `versionCode ${versionCode}`
    })

    // replace.sync({
    //     files: path.resolve(ctx.project.path, 'ios/Flick/Info.plist'),
    //     from: /<key>CFBundleShortVersionString<\/key>[\s\S]*?<string>[0-9\.]*?<\/string>/g,
    //     to: `<key>CFBundleShortVersionString</key><string>${versionName}</string>`
    // })
    // replace.sync({
    //     files: path.resolve(ctx.project.path, 'ios/Flick/Info.plist'),
    //     from: /<key>CFBundleVersion<\/key>[\s\S]*?<string>[0-9\.]*?<\/string>/g,
    //     to: `<key>CFBundleVersion</key><string>${versionName}</string>`
    // })

})