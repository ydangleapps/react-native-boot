
const path = require('path')
const fs = require('fs-extra')
const chalk = require('chalk')

module.exports = runner => {

    //
    // Build the iOS archive for release
    runner.register('build.ios').name('iOS').do(async ctx => {

        // Check for iOS support
        if (!ctx.ios)
            throw new Error('iOS support disabled, some required apps are missing from your system.')

        // Not supported yet
        throw new Error('Building for iOS automatically is not supported yet. Please run ' + chalk.blue('npm start open.ios') + ' and build from Xcode.')

        // // Prepare iOS project folder
        // await runner.run('prepare.ios', ctx)

        // // Ask for team ID if needed
        // if (!ctx.project.appInfo.iosTeamID) {

        //     // Ask for it
        //     console.log('You need to specify your Apple development team ID. You can find it by logging in to ' + chalk.cyan('developer.apple.com') + ' and then going to Account > Membership.')
        //     ctx.project.appInfo.iosTeamID = await ctx.console.ask({ question: 'What is your Apple development team ID?' })
        //     ctx.project.save()

        // }

        // // Create xcodeubild command
        // ctx.status('Building...')
        // let cmd = `xcodebuild`
        //     + ` archive -archivePath "${path.resolve(ctx.tempPath, 'ios-archive.xcarchive')}"`
        //     + ` -workspace HelloWorld.xcworkspace -scheme HelloWorld -destination "id=${ctx.device.serial}"`
        //     + ` -allowProvisioningUpdates -allowProvisioningDeviceRegistration`
        //     + ` -derivedDataPath "${path.resolve(ctx.tempPath, 'ios-build')}"`
        //     + ` DEVELOPMENT_TEAM="${ctx.project.appInfo.iosTeamID}"`

        // // Add xcpretty to the command
        // cmd = `set -o pipefail && ${cmd} | xcpretty`

        // // Build for archive
        // await ctx.run(cmd, { cwd: ctx.ios.path })

    })

}