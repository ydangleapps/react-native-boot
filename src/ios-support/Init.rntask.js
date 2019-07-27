
const path = require('path')
const chalk = require('chalk')

module.exports = runner => {

    //
    // Add iOS project settings to the context
    runner.register('_init.ios').name('iOS').after('_init').requires(ctx => ctx.project).requires(async ctx => {

        // Make sure we're on a Mac


        // Make sure Xcode exists
        if (!await ctx.pathTo('xcodebuild')) {
            return false
        }

        // Make sure cocoapods is installed
        if (!await ctx.pathTo('pod')) {
            ctx.warning('To build for iOS, please install cocoapods by running ' + chalk.cyan('sudo gem install cocoapods'))
            return false
        }

        // Make sure ios-deploy is installed
        if (!await ctx.pathTo('ios-deploy')) {
            ctx.warning('To build for iOS, please install ios-deploy by running ' + chalk.cyan('npm install -g ios-deploy'))
            return false
        }

        // Make sure xcpretty is installed
        if (!await ctx.pathTo('xcpretty')) {
            ctx.warning('To build for iOS, please install xcpretty by running ' + chalk.cyan('sudo gem install xcpretty'))
            return false
        }

        // Success, iOS is available
        return true

    }).do(async ctx => {

        // Register platform
        ctx.ios = {}
        ctx.platforms['ios'] = {
            name: 'iOS'
        }

        // Get path to iOS project
        ctx.ios.path = path.resolve(ctx.tempPath, 'ios')
        ctx.ios.bundleID = ctx.property('packageID.ios')
        if (!ctx.ios.bundleID)
            ctx.ios.bundleID = 'com.' + ctx.property('name.ios').replace(/-/g, '')

    })

}