
const path = require('path')
const replace = require('replace-in-file')
const fs = require('fs')
const chalk = require('chalk')

module.exports = runner => {
    
    //
    // Helper for dealing with minimum SDK version
    runner.register().after('_init.android').do(ctx => {

        // Add function to set the minimum SDK version
        ctx.android.minSDK = 19
        ctx.android.requireMinSDK = function(version) {
            ctx.android.minSDK = Math.max(ctx.android.minSDK, version)
        }

    })

    //
    // Update android native project to use the correct minimum SDK version
    runner.register('prepare.android.minsdk').name('Minimum SDK').do(async ctx => {

        // Stop if unchanged
        if (ctx.android.minSDK <= 19)
            return

        // Update min SDK
        ctx.status('Updating Android minimum SDK to ' + chalk.blue(ctx.android.minSDK))
        replace.sync({
            files: path.resolve(ctx.android.path, 'build.gradle'),
            from: /minSdkVersion = [0-9]*/g,
            to: `minSdkVersion = ${ctx.android.minSDK}`
        })

    })

}