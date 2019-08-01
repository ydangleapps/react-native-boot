
const chalk = require('chalk')
const replace = require('replace-in-file')
const path = require('path')

module.exports = runner => {

    //
    // Register file extensions to be opened by the app
    runner.register('prepare.android.file-extensions').name('File extensions').do(async ctx => {

        // Check if any file extensions are set
        let exts = ctx.property('fileExtensions.android')
        if (!exts)
            return
        if (typeof exts == 'string')
            exts = [exts]
        if (exts.length == 0)
            return

        // Apply file extension intent filter
        for (let ext of exts) {

            // Apply intent filter
            ctx.status('Adding intent filter for file extension ' + chalk.cyan(ext))

            // If a wildcard '*' was passed, change it to a regex wildcard '.*'
            ext = ext.replace(/\*/g, '.*')

            // Add to manifest
            replace.sync({
                files: path.resolve(ctx.android.path, 'app/src/main/AndroidManifest.xml'),
                from: '<!--MAIN ACTIVITY INJECT INTENT FILTERS-->',
                to: `<!--MAIN ACTIVITY INJECT INTENT FILTERS-->
                <intent-filter>

                    <!-- https://stackoverflow.com/a/39885806/1008736 -->
                    <action android:name="android.intent.action.VIEW" />
                    <category android:name="android.intent.category.DEFAULT" />
                    <category android:name="android.intent.category.BROWSABLE" />
                    <data android:scheme="file" />
                    <data android:scheme="content" />
                    <data android:mimeType="*/*" />
                    <!--
                        Work around Android's ugly primitive PatternMatcher
                        implementation that can't cope with finding a . early in
                        the path unless it's explicitly matched.
                    -->
                    <data android:host="*" />
                    <data android:pathPattern=".*\\.${ext}" />
                    <data android:pathPattern=".*\\..*\\.${ext}" />
                    <data android:pathPattern=".*\\..*\\..*\\.${ext}" />
                    <data android:pathPattern=".*\\..*\\..*\\..*\\.${ext}" />
                    <!-- keep going if you need more -->

                </intent-filter>
                `
            })

        }

    })

}