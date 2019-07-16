
const fs = require('fs')
const path = require('path')


module.exports = runner => {

    //
    // Checks if setup needs to be run again for this project
    runner.register('setup.check').do(async ctx => {

        // Check if fields exist
        if (!ctx.property('name') || !ctx.property('displayName'))
            ctx.setupNeeded = true

    })
    
    //
    // Asks the user questions about their project, and sets up the config.
    runner.register('setup').do(async ctx => {

        // Ask user for the app name
        let appDisplayName = await ctx.console.ask({ question: 'App name', defaultValue: ctx.project.appInfo.name })
        let appName = appDisplayName.replace(/\s/g, '')
        let packageName = `com.${appName.toLowerCase()}`

        // Write changes to the app info
        let json = Object.assign({}, ctx.project.appInfo, {
            displayName: appDisplayName,
            name: appName,
            packageID: `com.${appName}`
        })
        await fs.promises.writeFile(path.resolve(ctx.project.path, 'app.json'), JSON.stringify(json, null, 4))

    })

}