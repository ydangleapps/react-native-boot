
const chalk = require('chalk')
const fs = require('fs-extra')
const path = require('path')

module.exports = runner => {

    //
    // Build output for each installed platform
    runner.register('build').name('Build for release').do(async ctx => {

        // Setup project if needed
        await runner.run('setup.check', ctx)
        if (ctx.setupNeeded)
            await runner.run('setup', ctx)

        // Check if no platforms exist
        if (Object.keys(ctx.platforms).length == 0)
            throw new Error('No platforms found.')

        // Find all platforms
        let outputs = []
        for (let platformID in ctx.platforms) {

            // Get platform info
            let platform = ctx.platforms[platformID]

            // Recreate native folders if necessary
            ctx.status('Starting build for ' + chalk.cyan(platform.name))
            ctx.prepareNeeded = false
            await runner.run(`prepare.${platformID}.check`, ctx)
            if (ctx.prepareNeeded)
                await runner.run(`prepare.${platformID}`, ctx)

            // Begin building
            ctx.build = {}
            await runner.run('build.' + platformID, ctx)

            // Get output file/folder and copy to output directory in the project
            let outputLocalPath = `output/${ctx.project.appInfo.name}-${platformID}${ctx.build.outputExt}`
            await fs.ensureDir(path.resolve(ctx.project.path, 'output'))
            await fs.copy(ctx.build.output, path.resolve(ctx.project.path, outputLocalPath))
            outputs.push(outputLocalPath)

        }

        // Done!
        console.log('\nBuild complete! Generated apps:\n' + outputs.map(o => '- ' + chalk.cyan(o) + '\n') + '\n')

    })

}