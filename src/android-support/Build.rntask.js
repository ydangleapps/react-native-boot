
const path = require('path')
const fs = require('fs-extra')

module.exports = runner => {

    //
    // Build the Android APK for release
    runner.register('build.android').name('Android').do(async ctx => {

        // Prepare Android projet folder
        await runner.run('prepare.android', ctx)

        // Build for release
        ctx.status('Building...')
        await ctx.android.gradle('app:assembleRelease')

        // Check for unsigned APK
        let unsigned = path.resolve(ctx.android.path, 'app/build/outputs/apk/release/app-release-unsigned.apk')
        if (await fs.exists(unsigned)) {

            // Unsigned app was generated
            let filename = `${ctx.property('displayName') || ctx.property('name')} for Android (unsigned).apk`
            await fs.copyFile(unsigned, path.resolve(ctx.project.path, 'output', filename))
            ctx.build.outputs.push({ platform: 'android', filename })
            return

        }

        // Check for signed APK
        let signed = path.resolve(ctx.android.path, 'app/build/outputs/apk/release/app-release.apk')
        if (await fs.exists(signed)) {

            // Unsigned app was generated
            let filename = `${ctx.property('displayName') || ctx.property('name')} for Android.apk`
            await fs.copyFile(signed, path.resolve(ctx.project.path, 'output', filename))
            ctx.build.outputs.push({ platform: 'android', filename })
            return

        }

        // Nothing was built!
        throw new Error('Nothing was generated!')

    })

}