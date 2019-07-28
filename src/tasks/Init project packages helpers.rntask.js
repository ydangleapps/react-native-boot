
const path = require('path')
const fs = require('fs-extra')
const stringHash = require('string-hash')

// Create task group.
module.exports = runner => {

    //    
    // On startup, calculate a hash which will change whenever something in the project changes, ie packages installed, app metadata updated, etc
    runner.register().name('Calculate dependency state hash').after('_init.project').require(ctx => ctx.project).do(async ctx => {

        // Calculate the hash of the package lock files
        let txt = ''
        try {
            txt += await fs.readFile(path.resolve(ctx.project.path, 'package-lock.json'), 'utf8')
        } catch (err) {}
        try {
            txt += await fs.readFile(path.resolve(ctx.project.path, 'yarn.lock'), 'utf8')
        } catch (err) {}
        try {
            txt += await fs.readFile(path.resolve(ctx.project.path, 'package.json'), 'utf8')
        } catch (err) {}
        try {
            txt += await fs.readFile(path.resolve(ctx.project.path, 'app.json'), 'utf8')
        } catch (err) {}
        ctx.project.stateHash = stringHash(txt).toString()

    })

}