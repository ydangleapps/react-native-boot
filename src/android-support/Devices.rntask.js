
const chalk = require('chalk')

module.exports = runner => {

    //
    // Check if the user's chosen device is still connected
    runner.register().after('devices.check').name('Android').requires(ctx => ctx.android).do(async ctx => {

        // Stop if no current device or if it's not an android device
        if (!ctx.device || !ctx.device.id.startsWith('android:'))
            return

        // Get list of connected device IDs
        let txt = await ctx.android.adb('devices')
        let deviceIDs = txt.split('\n').map(r => r.trim()).filter(r => !!r).slice(1).map(l => l.split('\t')[0])
        if (!deviceIDs.includes(ctx.device.serial)) {

            // User's selected device is no longer connected
            ctx.status(`Device ${chalk.cyan(ctx.device.name)} is no longer connected.`)
            ctx.device = null

        }

    })

    //
    // Get list of attached devices
    runner.register('devices.android').before('devices').name('Get connected Android devices').allowFail().do(async ctx => {

        // Stop if no Android SDK
        if (!ctx.android)
            return

        // Get output from adb
        let txt = await ctx.android.adb('devices')
        let deviceIDs = txt.split('\n').map(r => r.trim()).filter(r => !!r).slice(1).map(l => l.split('\t')[0])
        
        // Query each device
        for (let deviceID of deviceIDs) {

            // Setup device
            let device = {
                id: 'android:' + deviceID,
                serial: deviceID,
                name: deviceID + ' (no info)',
                platform: 'android'
            }

            // Try fetch device info
            try {

                // Get all device info
                let infoTxt = await ctx.android.adb(`-s "${deviceID}" shell getprop`, { timeout: 5000 })
                let manufacturer = /\[ro.product.manufacturer\]: \[(.*?)\]/g.exec(infoTxt)[1]
                let model = /\[ro.product.model\]: \[(.*?)\]/g.exec(infoTxt)[1]
                device.name = `${manufacturer} ${model}`.trim() 

            } catch (err) {
                device.warning = err.message
            }

            // Add device
            ctx.devices.push(device)

        }

    })

}