
const path = require('path')
const chalk = require('chalk')
const fs = require('fs-extra')
// const Metro = require('metro')
// const http = require('http')

module.exports = runner => {

    //
    // Build and run on the specified Android device
    runner.register('run.android').name('Android').do(async ctx => {

        // The Android app project has already been prepared. Build for debug
        ctx.status('Building...')
        await ctx.android.gradle('app:assembleDebug')

        // Start Metro bundler through CLI
        ctx.runNode('react-native', 'start')

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

        // Install to device
        ctx.status('Installing to device...')
        await ctx.android.adb(`-s ${ctx.device.serial} install "${path.resolve(ctx.android.path, 'app/build/outputs/apk/debug/app-debug.apk')}"`)

        // Forward TCP port to the device
        await ctx.android.adb(`-s ${ctx.device.serial} reverse tcp:8081 tcp:8081`)

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