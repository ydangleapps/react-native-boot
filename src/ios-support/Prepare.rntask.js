
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

        // Update app module name
        replace.sync({
            files: path.resolve(ctx.ios.path, 'HelloWorld/AppDelegate.m'),
            from: 'moduleName:@"HelloWorld"',
            to: `moduleName:@"${ctx.property('name')}"`
        })

        // Copy React headers to temporary folder
        // TODO: Someone please tell me why this is necessary...
        // await copyReactHeaders(ctx, 'React/Base')
        // await copyReactHeaders(ctx, 'React/CxxBridge')
        // await copyReactHeaders(ctx, 'React/CxxModules')
        // await copyReactHeaders(ctx, 'React/DevSupport')
        // await copyReactHeaders(ctx, 'React/Fabric')
        // await copyReactHeaders(ctx, 'React/Inspector')
        // await copyReactHeaders(ctx, 'React/Modules')
        // await copyReactHeaders(ctx, 'React/Profiler')
        // await copyReactHeaders(ctx, 'React/UIUtils')
        // await copyReactHeaders(ctx, 'React/Views')
        // await copyReactHeaders(ctx, 'ReactCommon')
        // // await copyReactHeaders(ctx, 'ReactCommon/better')
        // // await copyReactHeaders(ctx, 'ReactCommon/config')
        // // await copyReactHeaders(ctx, 'ReactCommon/cxxreact')
        // // await copyReactHeaders(ctx, 'ReactCommon/fabric')
        // // await copyReactHeaders(ctx, 'ReactCommon/jsi')
        // // await copyReactHeaders(ctx, 'ReactCommon/jsiexecutor')
        // // await copyReactHeaders(ctx, 'ReactCommon/jsinspector')
        // // await copyReactHeaders(ctx, 'ReactCommon/microprofiler')
        // // await copyReactHeaders(ctx, 'ReactCommon/turbomodule')
        // // await copyReactHeaders(ctx, 'ReactCommon/utils')
        // // await copyReactHeaders(ctx, 'ReactCommon/yoga')
        // await copyReactHeaders(ctx, 'Libraries/ActionSheetIOS')
        // await copyReactHeaders(ctx, 'Libraries/ART')
        // await copyReactHeaders(ctx, 'Libraries/Blob')
        // await copyReactHeaders(ctx, 'Libraries/CameraRoll')
        // await copyReactHeaders(ctx, 'Libraries/fishhook')
        // await copyReactHeaders(ctx, 'Libraries/Geolocation')
        // await copyReactHeaders(ctx, 'Libraries/Image')
        // await copyReactHeaders(ctx, 'Libraries/LinkingIOS')
        // await copyReactHeaders(ctx, 'Libraries/NativeAnimation')
        // await copyReactHeaders(ctx, 'Libraries/Network')
        // await copyReactHeaders(ctx, 'Libraries/PushNotificationIOS')
        // await copyReactHeaders(ctx, 'Libraries/RCTTest')
        // await copyReactHeaders(ctx, 'Libraries/Sample')
        // await copyReactHeaders(ctx, 'Libraries/Settings')
        // await copyReactHeaders(ctx, 'Libraries/SurfaceBackedComponent')
        // await copyReactHeaders(ctx, 'Libraries/SurfaceHostingComponent')
        // await copyReactHeaders(ctx, 'Libraries/Text')
        // await copyReactHeaders(ctx, 'Libraries/Vibration')
        // await copyReactHeaders(ctx, 'Libraries/WebSocket')
        // await copyReactHeaders(ctx, 'Libraries/Wrapper')

        // Add third party dependencies


        // Inject React dependencies
        // ctx.status('Adding support libraries...')
        // await ctx.ios.addLocalPodspecDependency(path.resolve(ctx.project.path, 'node_modules/react-native/React.podspec'))
        // await ctx.ios.addLocalPodspecDependency(path.resolve(ctx.project.path, 'node_modules/react-native/ReactCommon/yoga/yoga.podspec'))
        // await ctx.ios.addLocalPodspecDependency(path.resolve(ctx.project.path, 'node_modules/react-native/third-party-podspecs/Folly.podspec'))
        // await ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/React/React.xcodeproj'))
        // await ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/ActionSheetIOS/RCTActionSheet.xcodeproj'))
        // await ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/ART/ART.xcodeproj'), {
        //     inject: `
        //         spec.dependency 'React'
        //     `
        // })
        // await ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/Blob/RCTBlob.xcodeproj'))
        // await ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/CameraRoll/RCTCameraRoll.xcodeproj'))
        // await ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/Geolocation/RCTGeolocation.xcodeproj'))
        // await ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/Image/RCTImage.xcodeproj'))
        // await ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/LinkingIOS/RCTLinking.xcodeproj'))
        // await ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/NativeAnimation/RCTAnimation.xcodeproj'))
        // await ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/Network/RCTNetwork.xcodeproj'))
        // await ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/PushNotificationIOS/RCTPushNotification.xcodeproj'))
        // await ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/RCTTest/RCTTest.xcodeproj'))
        // await ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/Sample/Sample.xcodeproj'))
        // await ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/Settings/RCTSettings.xcodeproj'))
        // await ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/Text/RCTText.xcodeproj'))
        // await ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/Vibration/RCTVibration.xcodeproj'))
        // await ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, 'node_modules/react-native/Libraries/WebSocket/RCTWebSocket.xcodeproj'))

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