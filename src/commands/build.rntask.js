
const chalk = require('chalk')
const fs = require('fs-extra')
const path = require('path')

module.exports = runner => {

    //
    // Build output for each installed platform. Each platform must build it's output files to ${ctx.project.path}/output.
    runner.register('build').name('Build for release').do(async ctx => {

        // Add context entry for storing all built products
        ctx.build = {}
        ctx.build.outputs = []

        // Setup project if needed
        await runner.run('setup.check', ctx)
        if (ctx.setupNeeded)
            await runner.run('setup', ctx)

        // Check if no platforms exist
        if (Object.keys(ctx.platforms).length == 0)
            throw new Error('No platforms found.')

        // Make sure output folder exists
        await fs.ensureDir(path.resolve(ctx.project.path, 'output'))

        // Find all platforms
        for (let platformID in ctx.platforms) {

            // Get platform info
            let platform = ctx.platforms[platformID]

            try {

                // Build for this platform
                ctx.status('Starting build for ' + chalk.cyan(platform.name))
                await runner.run('build.' + platformID, ctx)

            } catch (err) {

                // Push error output
                ctx.build.outputs.push({
                    platform: platformID,
                    error: err
                })

            }

        }

        // Stop if no outputs
        if (ctx.build.outputs.length == 0)
            throw new Error('No platforms built.')

        // Show output
        console.log('\n\nBuild output:')
        for (let output of ctx.build.outputs) {

            // Get platform info
            let platform = ctx.platforms[output.platform]

            // Output error or final path
            if (output.error)
                console.log('- ' + chalk.cyan(platform.name) + ': ' + chalk.yellow('Failed. ') + output.error.message)
            else
                console.log('- ' + chalk.cyan(platform.name) + ': Built ' + chalk.green('output/' + output.filename))

        }

        // Done
        console.log(' \n\n')

    })

}