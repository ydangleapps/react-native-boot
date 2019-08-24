
const path = require('path')
const chalk = require('chalk')
const replace = require('replace-in-file')

module.exports = runner => {

    //
    // Add function to attach a custom URL scheme
    runner.register().after('_init.android').do(async ctx => {

        // Adds a custom URL scheme to the app
        ctx.android.addURLScheme = async scheme => {

            // Add to manifest
            replace.sync({
                files: path.resolve(ctx.android.path, 'app/src/main/AndroidManifest.xml'),
                from: '<!--MAIN ACTIVITY INJECT INTENT FILTERS-->',
                to: `<!--MAIN ACTIVITY INJECT INTENT FILTERS-->
                <intent-filter>
                    <action android:name="android.intent.action.VIEW"/>
                    <category android:name="android.intent.category.DEFAULT"/>
                    <category android:name="android.intent.category.BROWSABLE"/>
                    <data android:host="*" android:scheme="${scheme}"/>
                </intent-filter>
                `
            })

        }

    })

    //
    // Attach custom URL schemes
    runner.register('prepare.android.urlscheme').name('Register URL schemes').do(async ctx => {

        // Go through all URL schemes and attach them
        for (let scheme of ctx.property('urlSchemes') || []) {

            // Add it
            ctx.status('Registering URL scheme ' + chalk.cyan(scheme + '://*'))
            await ctx.android.addURLScheme(scheme)

        }

    })

}