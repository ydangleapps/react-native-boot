
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

        // Copy React headers into project directory
        // Someone please tell me why this is necessary...
        // await copyReactHeaders(ctx, 'React/Base')
        // await copyReactHeaders(ctx, 'React/CxxBridge')
        // await copyReactHeaders(ctx, 'React/CxxModule')
        // await copyReactHeaders(ctx, 'React/CxxUtils')
        // await copyReactHeaders(ctx, 'React/DevSupport')
        // await copyReactHeaders(ctx, 'React/Fabric')
        // await copyReactHeaders(ctx, 'React/Inspector')
        // await copyReactHeaders(ctx, 'React/Modules')
        // await copyReactHeaders(ctx, 'React/Profiler')
        // await copyReactHeaders(ctx, 'React/UIUtils')
        // await copyReactHeaders(ctx, 'React/Views')
        // await copyReactHeaders(ctx, 'ReactCommon/better')
        // await copyReactHeaders(ctx, 'ReactCommon/config')
        // await copyReactHeaders(ctx, 'ReactCommon/cxxreact')
        // await copyReactHeaders(ctx, 'ReactCommon/fabric')
        // await copyReactHeaders(ctx, 'ReactCommon/jsi')
        // await copyReactHeaders(ctx, 'ReactCommon/jsiexecutor')
        // await copyReactHeaders(ctx, 'ReactCommon/jsinspector')
        // await copyReactHeaders(ctx, 'ReactCommon/microprofiler')
        // await copyReactHeaders(ctx, 'ReactCommon/turbomodule')
        // await copyReactHeaders(ctx, 'ReactCommon/utils')
        // await copyReactHeaders(ctx, 'ReactCommon/yoga')

        // Inject React dependencies
        ctx.status('Adding support libraries...')
        await ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/React/React.xcodeproj'))
        await ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/ActionSheetIOS/RCTActionSheet.xcodeproj'))
        await ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/ART/ART.xcodeproj'))
        await ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/Blob/RCTBlob.xcodeproj'))
        await ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/CameraRoll/RCTCameraRoll.xcodeproj'))
        await ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/Geolocation/RCTGeolocation.xcodeproj'))
        await ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/Image/RCTImage.xcodeproj'))
        await ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/LinkingIOS/RCTLinking.xcodeproj'))
        await ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/NativeAnimation/RCTAnimation.xcodeproj'))
        await ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/Network/RCTNetwork.xcodeproj'))
        await ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/PushNotificationIOS/RCTPushNotification.xcodeproj'))
        await ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/RCTTest/RCTTest.xcodeproj'))
        await ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/Sample/Sample.xcodeproj'))
        await ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/Settings/RCTSettings.xcodeproj'))
        await ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/Text/RCTText.xcodeproj'))
        await ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/Vibration/RCTVibration.xcodeproj'))
        await ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/WebSocket/RCTWebSocket.xcodeproj'))

        // Link other libraries
        await runner.run('prepare.ios.link', ctx)

        // Store state hash
        ctx.session.set('ios.last-build-hash', ctx.project.stateHash)

    })

}

// Copy headers from the React project into a temporary "system headers" folder
async function copyReactHeaders(ctx, modulePath) {

    // Find files
    let files = await ctx.files.glob('**/*.h', path.resolve(ctx.project.path, 'node_modules/react-native', modulePath))

    // Copy them
    for (let file of files)
        fs.copy(path.resolve(ctx.project.path, 'node_modules/react-native', modulePath, file), path.resolve(ctx.ios.path, 'React', file))

}