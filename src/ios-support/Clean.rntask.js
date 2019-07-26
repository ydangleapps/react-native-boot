
const fs = require('fs-extra')
const path = require('path')
const os = require('os')

module.exports = runner => {

    //
    // Delete native project
    runner.register('clean.ios').name('iOS').do(async ctx => {

        // Delete native project
        ctx.status('Cleaning...')
        await fs.remove(ctx.ios.path)

        // Delete temporary local pods
        await fs.remove(path.resolve(ctx.tempPath, 'ios-pods'))

        // Delete Xcode's DerivedData
        let derivedData = path.resolve(os.homedir(), 'Library/Developer/Xcode/DerivedData')
        for (let file of await ctx.files.glob('HelloWorld-*', derivedData))
            await fs.remove(path.resolve(derivedData, file))

        // Make sure we re-prepare the project on next run
        ctx.session.set('ios.last-build-hash', null)

    })

}