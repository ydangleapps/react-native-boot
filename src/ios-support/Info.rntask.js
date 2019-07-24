
const path = require('path')
const replace = require('replace-in-file')
const fs = require('fs-extra')
const chalk = require('chalk')
const glob = require('glob')
const rimraf = require('rimraf')
const os = require('os')

module.exports = runner => {

    //
    // Fetch information about this platform
    runner.register('libinfo.ios').before('info').name('iOS').do(async ctx => {

        // Stop if iOS support is disabled
        if (!ctx.ios)
            return ctx.infocmd.problems.push("iOS support is disabled.")

    })

    //
    // Display information about the Android app
    runner.register('info.ios').after('info').do(async ctx => {

        // Check if supported
        console.log(chalk.cyan('=== iOS app ==='))
        if (!ctx.ios)
            return console.log(chalk.gray('(platform not available)\n'))

        // Log package name
        console.log(chalk.blue('Bundle ID: ') + ctx.ios.packageName)

        

        // Done
        console.log('')

    })

}