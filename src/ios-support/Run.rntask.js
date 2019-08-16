
const path = require('path')
const chalk = require('chalk')
const fs = require('fs-extra')

module.exports = runner => {

    //
    // Build and run on the specified Android device
    runner.register('run.ios').name('iOS').do(async ctx => {

        // Prepare native project folder
        await runner.run('prepare.ios', ctx)

        // Start Metro bundler through CLI
        ctx.run(`node ./node_modules/react-native/cli.js start`)

        // Create xcodeubild command
        ctx.status('Building...')
        let cmd = `xcodebuild`
            + ` -workspace HelloWorld.xcworkspace -scheme HelloWorld -destination "id=${ctx.device.serial}"`
            + ` -allowProvisioningUpdates -allowProvisioningDeviceRegistration`
            + ` -derivedDataPath "${path.resolve(ctx.tempPath, 'ios-build')}"`

        // Add xcpretty to the command
        cmd = `set -o pipefail && ${cmd} | xcpretty`

        try {

            // Build for debug
            await ctx.run(cmd, { cwd: ctx.ios.path })
        
        } catch (err) {

            // If exited with error code 70, the target device is no longer connected.
            if (err.message == 'Process exited with error code 70') {

                // Clear device
                ctx.session.set('selectedDevice', null)
                throw new Error('Target device is no longer connected.')

            }

            // Other error, just throw it
            throw err

        }
        
        // File has been built! Get path to output .app
        let bundlePath = path.resolve(ctx.tempPath, 'ios-build/Build/Products/Debug-iphoneos/HelloWorld.app')
        
        // Deploy and run on device
        // TODO: Nice output, switch --justlaunch to --debug
        await ctx.run(`ios-deploy --id "${ctx.device.serial}" --bundle "${bundlePath}" --justlaunch`)

    })

}