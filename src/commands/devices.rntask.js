
const chalk = require('chalk')

// Create task group.
module.exports = runner => {
    
    //
    // On startup, get stored device from session
    runner.register().after('_init').do(async ctx => {
        ctx.devices = []
        ctx.device = ctx.session.get('selectedDevice')
    })
    
    //
    // Check if selected device is still available
    runner.register('devices.check').name('Check device').do(async ctx => {

       // Empty task, platform plugins will add .after() tasks to actually check the device

    })

    //
    // Allow user to choose their target device
    runner.register('devices').name('Select device').do(async ctx => {

        // Platform plugins will have added devices with a .before('devices') task
        // Check if no devices found
        if (ctx.devices.length == 0)
            throw new Error('No devices connected.')

        // Check if there's only one real device
        let realDevices = ctx.devices.filter(d => !d.simulator)
        if (realDevices.length == 1) {

            // Just select this one
            ctx.status('Selected the only device: ' + chalk.cyan(realDevices[0].name) + chalk.gray(' (' + realDevices[0].id + ')'))
            ctx.device = realDevices[0]
            ctx.session.set('selectedDevice', ctx.device)
            return

        }

        // Ask user to select the device
        ctx.device = await ctx.console.select({ question: 'Which device do you want to use?', choices: ctx.devices.map(d => ({ name: d.name + (d.simulator ? chalk.gray(' (simulator)') : ''), value: d })) })
        ctx.session.set('selectedDevice', ctx.device)

    })

}