
const path = require('path')
const fs = require('fs-extra')
const rimraf = require('rimraf')
const replace = require('replace-in-file')

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
        rimraf.sync(ctx.ios.path, { glob: false })

        // Copy template project
        await fs.copy(path.resolve(__dirname, 'native-template'), ctx.ios.path)

        // Update project bundle ID
        replace.sync({ 
            files: path.resolve(ctx.ios.path, 'HelloWorld.xcodeproj/project.pbxproj'), 
            from: /org.reactjs.native.example.\$\(PRODUCT_NAME:rfc1034identifier\)/g,
            to: ctx.ios.bundleID
        })
        
        // Update project references
        replace.sync({ 
            files: path.resolve(ctx.ios.path, 'HelloWorld.xcodeproj/project.pbxproj'), 
            from: /INJECT_PROJECT_PATH/g,
            to: ctx.project.path
        })

        // Inject React dependencies
        ctx.status('Adding support libraries...')
        ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/ActionSheetIOS/RCTActionSheet.xcodeproj'))
        ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/ART/ART.xcodeproj'))
        ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/Blob/RCTBlob.xcodeproj'))
        ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/CameraRoll/RCTCameraRoll.xcodeproj'))
        ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/Geolocation/RCTGeolocation.xcodeproj'))
        ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/Image/RCTImage.xcodeproj'))
        ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/LinkingIOS/RCTLinking.xcodeproj'))
        ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/NativeAnimation/RCTAnimation.xcodeproj'))
        ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/Network/RCTNetwork.xcodeproj'))
        ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/PushNotificationIOS/RCTPushNotification.xcodeproj'))
        ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/RCTTest/RCTTest.xcodeproj'))
        ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/Sample/Sample.xcodeproj'))
        ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/Settings/RCTSettings.xcodeproj'))
        ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/Text/RCTText.xcodeproj'))
        ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/Vibration/RCTVibration.xcodeproj'))
        ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/WebSocket/RCTWebSocket.xcodeproj'))

        // Link other libraries
        await runner.run('prepare.ios.link', ctx)

        // Store state hash
        ctx.session.set('ios.last-build-hash', ctx.project.stateHash)

    })

}