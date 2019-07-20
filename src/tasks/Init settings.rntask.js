
const path = require('path')
const fs = require('fs-extra')

//
// Add helper methods for dealing with project and session properties
module.exports = runner => runner.register().name('Add property helpers').before('_init').do(async ctx => {

    // Function to retrieve an app property, specified in the project's app.json file
    ctx.property = (keyPath) => {

        // Get dot notation value
        let value = ctx.project.appInfo
        for (let key of keyPath.split('.'))
            if (value && value[key])
                value = value[key]

        // Done
        return value === ctx.project.appInfo ? null : value

    }

    // Read session data
    ctx.session = {}
    ctx.session.data = {}
    try {
        let json = await fs.readFile(path.resolve(ctx.tempPath, 'session.json'), 'utf8')
        ctx.session.data = JSON.parse(json)
    } catch (err) {
    }

    // Add getter
    ctx.session.get = function(key) {
        return ctx.session.data[key]
    }

    // Add setter
    ctx.session.set = function(key, value) {

        // Set value
        ctx.session.data[key] = value

        // Write to file
        fs.writeFileSync(path.resolve(ctx.tempPath, 'session.json'), JSON.stringify(ctx.session.data, null, 4))

    }

})