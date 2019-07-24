
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
        let errors = []
        for (let platformID in ctx.platforms) {

            // Get platform info
            let platform = ctx.platforms[platformID]

            try {

                // Build for this platform
                ctx.status('Starting build for ' + chalk.cyan(platform.name))
                ctx.build = {}
                await runner.run('build.' + platformID, ctx)

                // Get output file/folder and copy to output directory in the project
                let outputLocalPath = `output/${ctx.project.appInfo.name} for ${platform.name}${ctx.build.outputExt}`
                await fs.ensureDir(path.resolve(ctx.project.path, 'output'))
                await fs.copy(ctx.build.output, path.resolve(ctx.project.path, outputLocalPath))
                outputs.push(outputLocalPath)

            } catch (err) {
                errors.push('Failed to build for ' + chalk.cyan(platform.name) + ': ' + err.message)
            }

        }

        // Show output files
        if (outputs.length)
            console.log('\nBuild complete! Generated apps:\n' + outputs.map(o => '- ' + chalk.cyan(o) + '\n') + '\n')

        // Show errors
        if (errors.length)
            console.log(chalk.red('\nErrors: \n') + errors.map(e => `- ${e}\n`))

        // Done
        console.log('')

    })

}