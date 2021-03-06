
const plist = require('plist')
const path = require('path')
const fs = require('fs-extra')
const chalk = require('chalk')

/**
 * Handles adding iOS app permission descriptions to the main app. On iOS, in order to use a certain feature (like camera access) the
 * app must give a description string describing to the user why they need the permission. Without this, the app will crash when
 * attempting to access that permission.
 *
 * Recommended usage:
 *
 *      ``` js
 *      module.exports = runner => runner.register().before('prepare.ios.permissions').do(ctx => {
 *
 *          // For the main project: Add a permission with it's usage description
 *          ctx.ios.permissions.add('NSCameraUsageDescription', 'Allows you to take a photo.')
 * 
 *          // For a library: Add a permission and require the project to register it's own description
 *          ctx.ios.permissions.add('NSCameraUsageDescription')
 * 
 *      })
 *      ```
 * 
 */
module.exports = runner => {

    //
    // Add permission manager to the context
    runner.register().after('_init.ios').do(async ctx => {
        ctx.ios.permissions = new IOSPermissions()
    })

    // Add task to install permissions onto the Info.plist of the project
    runner.register('prepare.ios.permissions').name('Permissions').do(async ctx => {

        // Parse current plist file
        ctx.status(`Applying descriptions for ${chalk.blue(Object.values(ctx.ios.permissions.items).length)} permissions...`)
        let plistPath = path.resolve(ctx.ios.path, 'HelloWorld/Info.plist')
        let plistTxt = await fs.readFile(plistPath, 'utf8')
        let plistObj = plist.parse(plistTxt)
        
        // Add each permission
        for (let permission of Object.values(ctx.ios.permissions.items)) {

            // Stop if permission text is missing.
            if (!permission.text)
                throw new Error(`No permission set for ${chalk.cyan(permission.name)}. Please create a ${chalk.cyan('permissions.ios.rntask.js')} file in your project and set the permission string:
${chalk.cyan(`
    module.exports = runner => runner.register().before('prepare.ios.permissions').do(ctx => {
        ctx.ios.permissions.add('${permission.name}', 'Description of why this permission is needed.')
    })
`)}

`)

            // Add permission to plist
            plistObj[permission.name] = permission.text

        }

        // Write plist file back
        plistTxt = plist.build(plistObj)
        await fs.writeFile(plistPath, plistTxt)

    })

}


// Manages iOS permissions
class IOSPermissions {

    constructor() {

        // All permissions
        this.items = {}

    }

    // Add a permission
    add(name, text) {

        // Check if it exists, and the text is the same
        if (this.items[name] && this.items[name].text == text)
            return

        // Check if it exists and the text is not set
        if (this.items[name] && this.items[name].text && !text)
            return

        // Store permission
        this.items[name] = {
            name,
            text
        }

    }

}