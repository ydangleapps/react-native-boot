
const path = require('path')
const fs = require('fs-extra')
const replace = require('replace-in-file')
const PBX = require('./PBX')

module.exports = runner => {

    //
    // The 'prepare' task is run when the native project needs to be recreated.
    runner.register('prepare.ios').name('Prepare native project').do(async ctx => {

        // Check if we can skip creating the native project and reuse the existing one
        let sameHash = ctx.session.get('ios.last-build-hash') === ctx.project.stateHash
        let nativeProjectExists = await fs.exists(ctx.ios.path)
        if (sameHash && nativeProjectExists)
            return

        // Delete temporary project directory if it exists
        ctx.status('Preparing native project...')
        await fs.remove(ctx.ios.path)

        // Copy template project
        await fs.copy(path.resolve(__dirname, 'native-template'), ctx.ios.path)

        // Update project bundle ID
        replace.sync({ 
            files: path.resolve(ctx.ios.path, 'HelloWorld.xcodeproj/project.pbxproj'), 
            from: /org.reactjs.native.example.\$\(PRODUCT_NAME:rfc1034identifier\)/g,
            to: ctx.ios.bundleID
        })

        // Update app name
        replace.sync({
            files: path.resolve(ctx.ios.path, 'HelloWorld/Info.plist'),
            from: /<key>CFBundleName<\/key>\s*?<string>\$\(PRODUCT_NAME\)<\/string>/g,
            to: `<key>CFBundleName</key><string>${ctx.property('name')}</string>`
        })
        replace.sync({
            files: path.resolve(ctx.ios.path, 'HelloWorld/Info.plist'),
            from: /<key>CFBundleDisplayName<\/key>\s*?<string>Hello App Display Name<\/string>/g,
            to: `<key>CFBundleDisplayName</key><string>${ctx.property('displayName') || ctx.property('name')}</string>`
        })

        // Update app version
        replace.sync({
            files: path.resolve(ctx.ios.path, 'HelloWorld/Info.plist'),
            from: /<key>CFBundleShortVersionString<\/key>\s*?<string>1.0<\/string>/g,
            to: `<key>CFBundleShortVersionString</key><string>${ctx.project.info.version}</string>`
        })
        replace.sync({
            files: path.resolve(ctx.ios.path, 'HelloWorld/Info.plist'),
            from: /<key>CFBundleVersion<\/key>\s*?<string>1<\/string>/g,
            to: `<key>CFBundleVersion</key><string>${ctx.project.info.version}</string>`
        })
        
        // Update project references
        replace.sync({ 
            files: path.resolve(ctx.ios.path, '**/*'), 
            from: /\.\.\/node_modules\/react-native/g,
            to: path.resolve(ctx.project.path, 'node_modules/react-native')
        })

        // Update shell script which compiles the JS portion of the app
        replace.sync({
            files: path.resolve(ctx.ios.path, 'HelloWorld.xcodeproj/project.pbxproj'),
            from: /shellScript = ".*?"/g,
            to: `shellScript = "export NODE_BINARY=node\\n\\"${path.resolve(ctx.project.path, 'node_modules/react-native/scripts/react-native-xcode.sh')}\\""`
        })

        // Update Podfile react-native path
        replace.sync({
            files: path.resolve(ctx.ios.path, 'Podfile'),
            from: /rn_path = '.*?'/g,
            to: `rn_path = '${path.resolve(ctx.project.path, 'node_modules/react-native')}'`
        })

        // Update app name
        replace.sync({
            files: path.resolve(ctx.ios.path, 'HelloWorld/Base.lproj/LaunchScreen.xib'),
            from: '"HelloWorld"',
            to: `"${ctx.property('displayName') || ctx.property('name')}"`
        })

        // Update app name on placeholder launch screen
        replace.sync({
            files: path.resolve(ctx.ios.path, 'HelloWorld/Base.lproj/LaunchScreen.xib'),
            from: '"HelloWorld"',
            to: `"${ctx.property('displayName') || ctx.property('name')}"`
        })
        
        // Ask for team ID if needed
        if (!ctx.project.appInfo.iosTeamID) {

            // Ask for it
            console.log('You need to specify your Apple development team ID. You can find it by logging in to ' + chalk.cyan('developer.apple.com') + ' and then going to Account > Membership.')
            ctx.project.appInfo.iosTeamID = await ctx.console.ask({ question: 'What is your Apple development team ID?' })
            if (!ctx.project.appInfo.iosTeamID) throw new Error("No Apple development team ID specified.")
            ctx.project.save()

        }

        // Set team ID on each target's attributes
        let xcode = new PBX(path.resolve(ctx.ios.path, 'HelloWorld.xcodeproj/project.pbxproj'))
        let project = xcode.projects()[0]
        let targets = xcode.projectTargets(project.id)
        for (let target of targets) xcode.setTargetAttribute(target.id, 'DevelopmentTeam', ctx.project.appInfo.iosTeamID)
        xcode.save()

        // Do other prepare steps
        await runner.run('prepare.ios.link', ctx)
        await runner.run('prepare.ios.icons', ctx)
        await runner.run('prepare.ios.permissions', ctx)
        await runner.run('prepare.ios.urlscheme', ctx)

        // Store state hash
        ctx.session.set('ios.last-build-hash', ctx.project.stateHash)

    })

}