
const path = require('path')
const chalk = require('chalk')
const fs = require('fs-extra')
// const Metro = require('metro')
// const http = require('http')

module.exports = runner => {

    //
    // Build and run on the specified Android device
    runner.register('run.android').name('Android').do(async ctx => {

        // Prepare Android projet folder
        await runner.run('prepare.android', ctx)

        // The Android app project has already been prepared. Build for debug
        ctx.status('Building...')
        await ctx.android.gradle('app:assembleDebug')

        // Create metro config
        // let config = {
        //     projectRoot: ctx.project.path,
        //     watch: true,
        //     server: {
        //         enableVisualizer: true,
        //         port: 8081
        //     },
        //     resolver: {
        //         useWatchman: true
        //     }
        // }

        // // Start the metro bundler
        // ctx.status('Starting Javascript bundler...')
        // let config = await Metro.loadConfig()
        // config.server.port = 8081
        // // config.resolver.blacklistRE = /(node_modules[\\\\]react[\\\\]dist[\\\\].*|website\\node_modules\\.*|heapCapture\\bundle\.js|.*\\__tests__\\.*|node_modules[\\\/]react-native-boot[\\\/].*)$/
        // console.log(config)
        // let metro = await Metro.runMetro(config)

        // // Start HTTP server
        // let server = http.createServer((req, res, next) => {
            
        //     // HACK: Workaround for a bug in Metro where it expects a third next() function
        //     metro.processRequest(req, res, next || function(){})
            
        // })
        // server.listen(config.server.port)

        try {

            // Install to device
            ctx.status('Installing to device...')
            let result = await ctx.android.adb(`-s ${ctx.device.serial} install "${path.resolve(ctx.android.path, 'app/build/outputs/apk/debug/app-debug.apk')}"`)
            
            // Decode error from older devices
            let errMatch = /Failure \[(.*)\]/.exec(result)
            if (errMatch)
                throw new Error("Couldn't install apk: " + errMatch[1])

        } catch (err) {

            // Check if error is an incompatible signature, which often occurs when the debug certificate changes.
            if (!err.message.includes('signatures do not match') && !err.message.includes('INSTALL_FAILED_ALREADY_EXISTS') && !err.message.includes('INSTALL_FAILED_UPDATE_INCOMPATIBLE'))
                throw err

            // Ask the user if they want to uninstall the old app
            ctx.warning('The app already exists on the target device, but the signatures do not match!')
            let confirm = await ctx.console.confirm({ question: 'Would you like to uninstall the previous version? (app data will be lost)' })
            if (!confirm)
                throw new Error('Unable to install updated app onto the device.')

            // Uninstall old app
            ctx.status('Uninstalling previous version...')
            await ctx.android.adb(`-s ${ctx.device.serial} uninstall ${ctx.android.packageName}`)

            // Try install again now
            ctx.status('Installing new version...')
            await ctx.android.adb(`-s ${ctx.device.serial} install "${path.resolve(ctx.android.path, 'app/build/outputs/apk/debug/app-debug.apk')}"`)

        }

        // Start Metro bundler through CLI
        ctx.run(`node ./node_modules/react-native/cli.js start`)

        // Forward TCP port to the device
        ctx.android.adb(`-s ${ctx.device.serial} reverse tcp:8081 tcp:8081`)

        // Clear old logs
        await ctx.android.adb(`-s ${ctx.device.serial} logcat --clear`)

        // Start the app on the device
        ctx.status('Starting app: ' + chalk.blue(ctx.android.packageName))
        await ctx.android.adb(`-s ${ctx.device.serial} shell monkey -p ${ctx.android.packageName} 1`)

        // Get app process ID
        let txt = await ctx.android.adb(`-s ${ctx.device.serial} shell ps`)
        let appPid = txt.split('\n').map(line => new RegExp(`^.*? ([0-9]+?) .*? ${ctx.android.packageName}$`).exec(line.trim())).filter(m => !!m).map(m => m[1])[0]
        ctx.status('Displaying logs for process ' + chalk.cyan(appPid))

        // Log output
        ctx.android.adbStream(`-s ${ctx.device.serial} logcat`, line => {

            // Extract fields
            let matched = /^([0-9][0-9]-[0-9][0-9])\s+?([0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9])\s+([0-9]+)\s+([0-9]+)\s+([VDIWE])\s+(.*)$/gs.exec(line.trim())
            if (!matched) return
            let pid = matched[3]
            let severity = matched[5]
            let txt = matched[6]

            // Hide if not from this app
            if (pid != appPid/* && txt.indexOf(ctx.android.packageName) == -1*/)
                return

            // Hide debug severity
            if (severity == 'V' || severity == 'D')
                return

            // Log it
            console.log(severity + ' ' + txt)

        })

    })

}