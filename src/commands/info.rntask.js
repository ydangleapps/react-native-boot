//
// Displays details about the project to the user.

const chalk = require('chalk')

module.exports = (runner, ctx) => {

    // Add fields to the context that we'll use later
    ctx.infocmd = {}
    ctx.infocmd.libraries = {}
    ctx.infocmd.problems = []
    
    //
    // Log information about the project
    runner.register('info').do(async ctx => {

        // Log project information
        console.log('')
        console.log(chalk.cyan('=== App information ==='))
        console.log(chalk.blue('Display name: ') + ctx.project.appInfo.displayName)
        console.log(chalk.blue('Project name: ') + ctx.project.appInfo.name)
        console.log('')

        // Log library information, as added by platform plugins
        console.log(chalk.cyan('=== Installed native libraries ==='))
        if (Object.keys(ctx.infocmd.libraries).length == 0) console.log(chalk.gray('(none)'))
        for (let libName in ctx.infocmd.libraries) {

            // Log it
            let lib = ctx.infocmd.libraries[libName]
            console.log(chalk.blue(libName + ': ') + lib.platforms.map(plID => ctx.platforms[plID] && ctx.platforms[plID].name || plID).join(', '))

        }

        // Done
        console.log('')

    })

}