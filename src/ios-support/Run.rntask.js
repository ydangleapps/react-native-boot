
const path = require('path')
const chalk = require('chalk')
const fs = require('fs-extra')

module.exports = runner => {

    //
    // Build and run on the specified Android device
    runner.register('run.ios').name('iOS').do(async ctx => {

        // Prepare native projet folder
        await runner.run('prepare.ios', ctx)

        // Ask for team ID if needed
        if (!ctx.project.appInfo.iosTeamID) {

            // Ask for it
            console.log('You need to specify your Apple development team ID. You can find it by logging in to ' + chalk.cyan('developer.apple.com') + ' and then going to Account > Membership.')
            ctx.project.appInfo.iosTeamID = await ctx.console.ask({ question: 'What is your Apple development team ID?' })
            ctx.project.save()

        }

        // Create xcodeubild command
        ctx.status('Building...')
        let cmd = `xcodebuild build`
            + ` -workspace HelloWorld.xcworkspace -scheme HelloWorld -destination "id=${ctx.device.serial}"`
            + ` -allowProvisioningUpdates -allowProvisioningDeviceRegistration`
            + ` DEVELOPMENT_TEAM="${ctx.project.appInfo.iosTeamID}"`

        // If xcpretty is installed, use that
        if (await ctx.pathTo('xcpretty')) {

            // Add xcpretty to the command
            cmd = `set -o pipefail && ${cmd}  | xcpretty`

        } else {

            // Fail
            throw new Error('xcpretty not found, please run ' + chalk.cyan('sudo gem install xcpretty') + '.')

        }

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
        

    })

}