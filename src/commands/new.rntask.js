
const chalk = require('chalk')
const path = require('path')
const fs = require('fs-extra')
const replace = require('replace-in-file')

module.exports = runner => {

    //
    // Create helper functions for registering templates
    runner.register().before('_init').do(ctx => {

        // List of templates
        ctx.templates = []

        // Function to copy a template from the specified directory
        ctx.createFromTemplate = async ({ source }) => {

            // Copy from folder
            await fs.copy(source, ctx.create.path, {
                overwrite: false,
                errorOnExist: true
            })

            // Replace vars in files
            replace.sync({
                files: path.resolve(ctx.create.path, '**\*'),
                from: /HelloWorld/g,
                to: ctx.create.name
            })
            replace.sync({
                files: path.resolve(ctx.create.path, '**\*'),
                from: /Hello World Display Name/g,
                to: ctx.create.displayName
            })

        }

    })

    //
    // Command for generating a new template
    runner.register('new').name('New').requiresProject(false).do(async ctx => {

        // Get project name
        ctx.create = {}
        ctx.create.displayName = await ctx.console.ask({ question: 'Enter the name for your new project:', defaultValue: 'My App' })
        if (!ctx.create.displayName) 
            throw new Error("Invalid name.")

        // Create project name from display name
        ctx.create.name = ctx.create.displayName.toLowerCase().replace(/\W/g, '-')

        // Create project path
        ctx.create.path = path.resolve(process.cwd(), ctx.create.name)

        // Ask user which template to use
        let template = await ctx.console.select({
            question: 'Which template?',
            choices: ctx.templates.map(t => ({
                name: t.name,
                value: t
            }))
        })

        // Confirm one last time
        ctx.status(`You are about to create a new ${chalk.cyan(template.name)} at ${chalk.cyan(ctx.create.path)}.`)
        let confirm = await ctx.console.confirm({ question: 'Create it now?' })
        if (!confirm)
            return

        // Run the chosen creation task
        await template.create()

        // Install dependencies
        await ctx.run('npm install', { cwd: ctx.create.path })

        // Done!
        console.log(`\n\nDone! You can now run ${chalk.cyan('cd ' + ctx.create.name)} to switch to your project, and then ${chalk.cyan('npm start')} to run your app.\n`)

    })

}