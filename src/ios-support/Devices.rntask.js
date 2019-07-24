
const chalk = require('chalk')
const path = require('path')

module.exports = runner => {

    //
    // Check if the user's chosen device is still connected
    runner.register().after('devices.check').name('iOS').requires(ctx => ctx.ios).do(async ctx => {

        // Stop if no current device or if it's not an android device
        if (!ctx.device || !ctx.device.id.startsWith('ios:'))
            return

        // TODO:

    })

    //
    // Get list of attached devices
    runner.register('devices.ios').before('devices').name('Get connected iOS devices').allowFail().do(async ctx => {

        // Stop if no iOS support
        if (!ctx.ios)
            return

        // Get connected devices from xcodebuild, by trying to run on an invalid target. xcodebuild then helpfully includes available targets
        // in the error response. I did try using -showdestinations, but for some reason it doesn't list all devices.
        // https://mgrebenets.github.io/xcode/2015/02/18/whats-your-destination
        ctx.status('Fetching...')
        let txt = ''
        try {
            txt = await ctx.runWithOutput(`xcodebuild test -project HelloWorld.xcodeproj -scheme HelloWorld -destination "id=NoSuchDestination" -destination-timeout 2`, { cwd: path.resolve(__dirname, 'native-template') })
        } catch (err) {
            txt = err.message
        }

        // Extract devices
        let lastIdx = 0
        let ineligibleAfter = txt.indexOf('Ineligible destinations')
        if (ineligibleAfter == -1) ineligibleAfter = txt.length
        while (true) {

            // Extract next device
            let match = /{ platform:(.*?), id:(.*?), name:(.*?)(, error:(.*?))? }/g.exec(txt.substring(lastIdx))
            if (!match)
                break

            // Update index
            lastIdx = lastIdx + match.index + 10

            // Ignore if not an iOS device
            if (match[1] != 'iOS' && match[1] != 'iOS Simulator')
                continue

            // Ignore the generic device
            if (match[2].includes('dvtdevice'))
                continue

            // Check if device is ineligible
            if (match[5]) {
                ctx.warning('Device ' + chalk.cyan(match[3]) + ' is not eligible: ' + match[5])
                continue
            }
            if (match.index > ineligibleAfter) {
                ctx.warning('Device ' + chalk.cyan(match[3]) + ' is not eligible: ' + chalk.gray('(no error given)'))
                continue
            }

            // Save device
            ctx.devices.push({
                id: 'ios:' + match[2],
                serial: match[2],
                name: match[3],
                platform: 'ios',
                simulator: match[1] == 'iOS Simulator'
            })

        }

    })

}