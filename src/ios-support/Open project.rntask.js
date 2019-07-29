
const path = require('path')
const chalk = require('chalk')

//
// This task allows the user to open the native project in it's default IDE.
module.exports = runner => runner.register('open.ios').name('Open iOS project').do(async ctx => {

    // Check for iOS support
    if (!ctx.ios)
        throw new Error('iOS support is disabled, some required apps are missing from your system.')

    // Confirm with the user
    console.log('You are about to open the ' + chalk.yellow('temporary') + ' native iOS project. Any changes you make will not be saved.')
    let c = await ctx.console.confirm({ question: 'Are you sure you want to open the native project?' })
    if (!c)
        return

    // Prepare iOS project folder
    await runner.run('prepare.ios', ctx)

    // Open it
    ctx.status('Opening project...')
    await ctx.run(`open "${path.resolve(ctx.ios.path, 'HelloWorld.xcworkspace')}"`)

})