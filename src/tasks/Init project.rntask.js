
const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')
const os = require('os')

module.exports = runner => {

    //
    // Get project information
    runner.register('_init.project').before('_init').name('Project').do(async ctx => {

        // Check if requested task needs to be inside a project
        if (!ctx.cli.projectPath && runner.tasks[ctx.cli.task].needsProject)
            throw new Error(`No ${chalk.blue('package.json')} found, are you in a react-native project?`)
        else if (!ctx.cli.projectPath)
            return

        // Add project vars onto the context
        ctx.project = {}
        ctx.project.path = ctx.cli.projectPath
        ctx.project.info = require(path.resolve(ctx.cli.projectPath, 'package.json'))
        ctx.project.appInfo = {}

        // Read app information
        try {
            ctx.project.appInfo = require(path.resolve(ctx.project.path, 'app.json'))
        } catch (err) {
            console.warn(err)
        }

        // Add a temporary path for tasks to use. This can be used as a cache directory between runs on the same machine.
        ctx.tempPath = path.resolve(await fs.realpath(os.tmpdir()), 'react-native', ctx.project.appInfo.name || 'NoName')
        await fs.ensureDir(ctx.tempPath)

        // Check if the project uses the specified module
        ctx.project.uses = moduleName => {

            let json = require(path.resolve(ctx.project.path, 'package.json'))
            return !!(json.dependencies[moduleName] || json.devDependencies[moduleName])

        }

        // Add project getter
        ctx.project.get = function(key) {
            return ctx.project.appInfo[key]
        }
    
        // Add project info saver
        ctx.project.save = function() {
    
            // Write to file
            fs.writeFileSync(path.resolve(ctx.project.path, 'app.json'), JSON.stringify(ctx.project.appInfo, null, 4))
    
        }

    })

}