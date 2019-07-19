
const path = require('path')
const fs = require('fs-extra')

module.exports = runner => {

    //
    // Build the Android APK for release
    runner.register('build.android').name('Android').do(async ctx => {

        // Build for release
        ctx.status('Building...')
        await ctx.android.gradle('app:assembleRelease')

        // Done
        ctx.build.output = path.resolve(ctx.android.path, 'app/build/outputs/apk/release/app-release-unsigned.apk')
        ctx.build.outputExt = '-unsigned.apk'

    })

}