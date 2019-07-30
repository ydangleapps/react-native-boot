
const path = require('path')
const chalk = require('chalk')

//
// This task allows the user to open the native project in it's default IDE.
module.exports = runner => runner.register('open.android').name('Open Android project').do(async ctx => {

    // Check for Android support
    if (!ctx.android)
        throw new Error('Android support is disabled, some required apps are missing from your system.')

    // Confirm with the user
    console.log('You are about to open the ' + chalk.yellow('temporary') + ' native Android project. Any changes you make will not be saved.')
    let c = await ctx.console.confirm({ question: 'Are you sure you want to open the native project?' })
    if (!c)
        return

    // Prepare Android project folder
    await runner.run('prepare.android', ctx)

    // Open it
    ctx.status('Project is ready, you can open it at ' + chalk.cyan(ctx.android.path))

})