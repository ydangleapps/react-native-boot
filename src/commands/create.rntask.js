
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
                from: /HelloWorld/,
                to: ctx.create.name
            })

        }

    })

    //
    // Command for generating a new template
    runner.register('create').name('Create').requiresProject(false).do(async ctx => {

        // Check project name
        ctx.create = {}
        ctx.create.name = process.argv[3]
        if (!ctx.create.name) throw new Error("Please specify the name of your project, ie " + chalk.cyan('npx react-native-boot create MyApp'))
        ctx.create.path = path.resolve(process.cwd(), ctx.create.name)

        // Ask user which template to use
        let template = await ctx.console.select({
            question: 'Which template?',
            choices: ctx.templates.map(t => ({
                name: t.name,
                value: t
            }))
        })

        // Run the chosen creation task
        await template.create()

        // Install dependencies
        await ctx.run('npm install', { cwd: ctx.create.path })

        // Done!
        console.log(`\n\nDone! You can now run ${chalk.cyan('cd ' + ctx.create.name)} to switch to your project, and then ${chalk.cyan('npm start')} to run your app.\n`)

    })

}