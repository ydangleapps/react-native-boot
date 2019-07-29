
const path = require('path')
const fs = require('fs-extra')
const plist = require('plist')
const chalk = require('chalk')

module.exports = runner => {

    //
    // Add function to attach a custom URL scheme
    runner.register().after('_init.ios').do(async ctx => {

        // Adds a custom URL scheme to the app
        ctx.ios.addURLScheme = async scheme => {

            // Add custom URL scheme to Info.plist -- Read plist
            let plistPath = path.resolve(ctx.ios.path, 'HelloWorld/Info.plist')
            let plistTxt = await fs.readFile(plistPath, 'utf8')
            let plistObj = plist.parse(plistTxt)
            
            // Add URL section if not exists
            if (!plistObj.CFBundleURLTypes)
                plistObj.CFBundleURLTypes = []

            // Add URL type
            plistObj.CFBundleURLTypes.push({
                CFBundleTypeRole: 'Editor',
                CFBundleURLName: scheme,
                CFBundleURLSchemes: [
                    scheme
                ]
            })

            // Write plist file back
            plistTxt = plist.build(plistObj)
            await fs.writeFile(plistPath, plistTxt)

        }

    })

    //
    // Attach custom URL schemes
    runner.register('prepare.ios.urlscheme').name('Register URL schemes').do(async ctx => {

        // Go through all URL schemes and attach them
        for (let scheme of ctx.property('urlSchemes') || []) {

            // Add it
            ctx.status('Registering URL scheme ' + chalk.cyan(scheme + '://*'))
            await ctx.ios.addURLScheme(scheme)

        }

    })

}