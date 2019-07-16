//
// This file aims to rebuild the native part of this project, including all the funny stuff required by libraries and react-native itself.

const path = require('path')
const fs = require('fs-extra')
const stringHash = require('string-hash')

// Create task group.
module.exports = runner => {
    
    // On startup, calculate hash of all packages
    runner.register().name('Calculate dependency state hash').before('_init').do(async ctx => {

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
        ctx.dependencyHash = stringHash(txt).toString()

    })
    
    // Prepare command group
    runner.register('prepare').name('Prepare').do(async ctx => {

        // Store the dependency state to file to prevent recreating the native projects again on next run
        ctx.session.set('lastDependencyHash', ctx.dependencyHash)

    })

    // Rebuild native projects if any of the project's dependencies or configuration have changed
    runner.register('prepare.check').do(async ctx => {

        // Check if project dependencies have changed, if so rebuild the native projects
        if (ctx.session.get('lastDependencyHash') != ctx.dependencyHash)
            ctx.prepareNeeded = true

    })

}



    //     replace.sync({
    //         files: path.resolve(ctx.project.path, 'ios/Flick.xcodeproj/project.pbxproj'),
    //         from: /org.reactjs.native.example.\$\(PRODUCT_NAME:rfc1034identifier\)/g,
    //         to: `com.ydangleapps.Flick`
    //     })