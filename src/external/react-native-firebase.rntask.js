
const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')
const replace = require('replace-in-file')
const PBX = require('../ios-support/PBX')

//
// To reconfigure installed modules, run `npm start firebase.setup`

module.exports = runner => {
    

    //
    // Skip autolinking of this library on Android
    runner.register().requires(c => c.project.uses('react-native-firebase')).before('prepare.android.link').do(ctx => {
        ctx.android.linking.skip['react-native-firebase'] = true
    })

    //
    // Create command to ask which submodules to use
    runner.register('firebase.setup').name('Firebase setup').do(async ctx => {

        // Make sure fields exist
        ctx.project.appInfo.firebase = ctx.project.appInfo.firebase || {}

        // Ask the user which modules they want to use
        let modules = await ctx.console.selectMultiple({
            question: 'Select which Firebase modules to use',
            choices: [
                { value: 'admob', name: 'Ad Mob', checked: !!ctx.project.appInfo.firebase['admob'] },
                { value: 'analytics', name: 'Analytics', checked: !!ctx.project.appInfo.firebase['analytics'] },
                { value: 'auth', name: 'Authentication', checked: !!ctx.project.appInfo.firebase['auth'] },
                { value: 'firestore', name: 'Cloud Firestore', checked: !!ctx.project.appInfo.firebase['firestore'] },
                { value: 'functions', name: 'Cloud Functions', checked: !!ctx.project.appInfo.firebase['functions'] },
                { value: 'messaging', name: 'Cloud Messaging', checked: !!ctx.project.appInfo.firebase['messaging'] },
                { value: 'firestore', name: 'Cloud Firestore', checked: !!ctx.project.appInfo.firebase['firestore'] },
                { value: 'crashlytics', name: 'Crashlytics', checked: !!ctx.project.appInfo.firebase['crashlytics'] },
                { value: 'database', name: 'Database', checked: !!ctx.project.appInfo.firebase['database'] },
                { value: 'links', name: 'Dynamic Links', checked: !!ctx.project.appInfo.firebase['links'] },
                { value: 'instanceid', name: 'Instance ID', checked: !!ctx.project.appInfo.firebase['instanceid'] },
                { value: 'notifications', name: 'Notifications', checked: !!ctx.project.appInfo.firebase['notifications'] },
                { value: 'remoteconfig', name: 'Remote Config', checked: !!ctx.project.appInfo.firebase['remoteconfig'] },
                { value: 'storage', name: 'Storage', checked: !!ctx.project.appInfo.firebase['storage'] },
                { value: 'perfmon', name: 'Performance Monitoring', checked: !!ctx.project.appInfo.firebase['perfmon'] },
            ]
        })

        // Apply modules
        for (let name of modules) {

            if (name == 'links') {

                // Ask user for hostname
                ctx.project.appInfo.firebase.links = {
                    host: await ctx.console.ask({ question: 'Enter deep link host name', defaultValue: 'example.com' })
                }

            } else {

                // other modules, just enable
                ctx.project.appInfo.firebase[name] = true

            }

        }

        // Save
        ctx.project.save()

    })

    //
    // Prepare Android code
    runner.register('react-native-firebase:android').name('react-native-firebase').requires(c => c.project.uses('react-native-firebase')).after('prepare.android.link').do(async ctx => {

        // Check if user has not set up firebase yet
        if (!ctx.project.appInfo.firebase)
            await runner.run('firebase.setup', ctx)

        // Find path to Android JSON
        let jsonPath = path.resolve(ctx.project.path, 'metadata/google-services-android.json')
        if (!await fs.exists(jsonPath))
            throw new Error(`The file ${chalk.cyan('metadata/google-services-android.json')} was not found. Please go to the Firebase console > Project Settings > Add Android and download the google-services.json file. Then, copy it to this path in your project.`)

        // Copy android config
        ctx.status('Modifying native code...')
        await fs.copyFile(
            jsonPath,
            path.resolve(ctx.android.path, 'app/google-services.json')
        )

        // Modify firebase build script to reference React Native's correct location
        replace.sync({
            files: path.resolve(ctx.project.path, 'node_modules/react-native-firebase/android/build.gradle'),
            from: /parentDir,.*?'node_modules\/react-native'/s,
            to: `'${path.resolve(ctx.project.path, 'node_modules/react-native').replace(/\\/g, '\\\\')}'`
        })
        replace.sync({
            files: path.resolve(ctx.project.path, 'node_modules/react-native-firebase/android/build.gradle'),
            from: /parentDir,.*?'node_modules\/react-native\/android'/s,
            to: `'${path.resolve(ctx.project.path, 'node_modules/react-native/android').replace(/\\/g, '\\\\')}'`
        })

        // Inject main module
        await ctx.android.injectGradlePlugin("apply plugin: 'com.google.gms.google-services'")
        await ctx.android.injectClasspathDependency("classpath 'com.google.gms:google-services:4.2.0'")
        await ctx.android.injectDependency("implementation 'com.google.android.gms:play-services-base:16.1.0'")
        await ctx.android.injectDependency("implementation 'com.google.firebase:firebase-core:16.0.9'")
        await ctx.android.injectProject('react-native-firebase', path.resolve(ctx.project.path, 'node_modules/react-native-firebase/android'))
        await ctx.android.injectRNPackage('io.invertase.firebase', 'RNFirebasePackage')

        // Run setup tasks
        for (let key in ctx.project.appInfo.firebase)
            if (runner.tasks['firebase.android.' + key])
                await runner.run('firebase.android.' + key, ctx)

    })

    //
    // Add module support for Android
    runner.register('firebase.android.admob').do(async ctx => {
        await ctx.android.injectDependency("implementation 'com.google.firebase:firebase-ads:17.2.1'")
        await ctx.android.injectRNPackage('io.invertase.firebase.admob', 'RNFirebaseAdMobPackage')
    })
    runner.register('firebase.android.analytics').do(async ctx => {
        await ctx.android.injectRNPackage('io.invertase.firebase.analytics', 'RNFirebaseAnalyticsPackage')
    })
    runner.register('firebase.android.auth').do(async ctx => {
        await ctx.android.injectDependency("implementation 'com.google.firebase:firebase-auth:17.0.0'")
        await ctx.android.injectRNPackage('io.invertase.firebase.auth', 'RNFirebaseAuthPackage')
    })
    runner.register('firebase.android.firestore').do(async ctx => {
        await ctx.android.injectDependency("implementation 'com.google.firebase:firebase-firestore:19.0.0'")
        await ctx.android.injectRNPackage('io.invertase.firebase.firestore', 'RNFirebaseFirestorePackage')
    })
    runner.register('firebase.android.functions').do(async ctx => {
        await ctx.android.injectDependency("implementation 'com.google.firebase:firebase-functions:17.0.0'")
        await ctx.android.injectRNPackage('io.invertase.firebase.functions', 'RNFirebaseFunctionsPackage')
    })
    runner.register('firebase.android.messaging').do(async ctx => {
        await ctx.android.injectDependency("implementation 'com.google.firebase:firebase-messaging:18.0.0'")
        await ctx.android.injectDependency("implementation 'me.leolin:ShortcutBadger:1.1.21@aar'")
        await ctx.android.injectRNPackage('io.invertase.firebase.messaging', 'RNFirebaseMessagingPackage')

        // Add messaging service
        replace.sync({
            files: path.resolve(ctx.android.path, 'app/src/main/AndroidManifest.xml'),
            from: '</application>',
            to: `

                <service android:name="io.invertase.firebase.messaging.RNFirebaseBackgroundMessagingService" />
                <service android:name="io.invertase.firebase.messaging.RNFirebaseMessagingService">
                    <intent-filter>
                        <action android:name="com.google.firebase.MESSAGING_EVENT" />
                    </intent-filter>
                </service>
                    
            </application>`
        })

    })
    runner.register('firebase.android.crashlytics').do(async ctx => {
        await ctx.android.injectDependency("implementation('com.crashlytics.sdk.android:crashlytics:2.9.9@aar') {\n        transitive = true\n    }")
        await ctx.android.injectClasspathDependency("classpath 'com.google.gms:google-services:4.2.0'")
        await ctx.android.injectClasspathDependency("classpath 'io.fabric.tools:gradle:1.28.1'")
        await ctx.android.injectGradleRepo("maven { url 'https://maven.fabric.io/public' }")
        await ctx.android.injectGradlePlugin("apply plugin: 'io.fabric'")
        await ctx.android.injectRNPackage('io.invertase.firebase.fabric.crashlytics', 'RNFirebaseCrashlyticsPackage')
    })
    runner.register('firebase.android.database').do(async ctx => {
        await ctx.android.injectDependency("implementation 'com.google.firebase:firebase-database:17.0.0'")
        await ctx.android.injectRNPackage('io.invertase.firebase.database', 'RNFirebaseDatabasePackage')
    })
    runner.register('firebase.android.links').do(async ctx => {
        await ctx.android.injectDependency("implementation 'com.google.firebase:firebase-invites:17.0.0'")
        await ctx.android.injectRNPackage('io.invertase.firebase.links', 'RNFirebaseLinksPackage')
        replace.sync({
            files: path.resolve(ctx.android.path, 'app/src/main/AndroidManifest.xml'),
            from: '<!--MAIN ACTIVITY INJECT INTENT FILTERS-->',
            to: `<!--MAIN ACTIVITY INJECT INTENT FILTERS-->
            <intent-filter>
                <action android:name="android.intent.action.VIEW"/>
                <category android:name="android.intent.category.DEFAULT"/>
                <category android:name="android.intent.category.BROWSABLE"/>
                <data android:host="${ctx.project.appInfo.firebase.links.host}" android:scheme="http"/>
                <data android:host="${ctx.project.appInfo.firebase.links.host}" android:scheme="https"/>
            </intent-filter>
            `
        })
    })
    runner.register('firebase.android.instanceid').do(async ctx => {
        await ctx.android.injectRNPackage('io.invertase.firebase.instanceid', 'RNFirebaseInstanceIdPackage')
    })
    runner.register('firebase.android.notifications').do(async ctx => {
        await ctx.android.injectRNPackage('io.invertase.firebase.notifications', 'RNFirebaseNotificationsPackage')
        await ctx.android.injectPermission(`<uses-permission android:name="android.permission.INTERNET" />`)
        await ctx.android.injectPermission(`<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />`)
        await ctx.android.injectPermission(`<uses-permission android:name="android.permission.VIBRATE" />`)
        replace.sync({
            files: path.resolve(ctx.android.path, 'app/src/main/AndroidManifest.xml'),
            from: '</application>',
            to: `

                <receiver android:name="io.invertase.firebase.notifications.RNFirebaseNotificationReceiver"/>
                <receiver android:enabled="true" android:exported="true"  android:name="io.invertase.firebase.notifications.RNFirebaseNotificationsRebootReceiver">
                <intent-filter>
                    <action android:name="android.intent.action.BOOT_COMPLETED"/>
                    <action android:name="android.intent.action.QUICKBOOT_POWERON"/>
                    <action android:name="com.htc.intent.action.QUICKBOOT_POWERON"/>
                    <category android:name="android.intent.category.DEFAULT" />
                </intent-filter>
                </receiver>
                
            </application>`
        })
    })
    runner.register('firebase.android.remoteconfig').do(async ctx => {
        await ctx.android.injectDependency("implementation 'com.google.firebase:firebase-config:17.0.0'")
        await ctx.android.injectRNPackage('io.invertase.firebase.config', 'RNFirebaseRemoteConfigPackage')
    })
    runner.register('firebase.android.storage').do(async ctx => {
        await ctx.android.injectDependency("implementation 'com.google.firebase:firebase-storage:17.0.0'")
        await ctx.android.injectRNPackage('io.invertase.firebase.storage', 'RNFirebaseStoragePackage')
    })
    runner.register('firebase.android.perfmon').do(async ctx => {
        await ctx.android.injectDependency("implementation 'com.google.firebase:firebase-perf:17.0.2'")
        await ctx.android.injectClasspathDependency("classpath 'com.google.firebase:perf-plugin:1.2.1'")
        await ctx.android.injectGradlePlugin(`apply plugin: "com.google.firebase.firebase-perf"`)
        await ctx.android.injectRNPackage('io.invertase.firebase.perf', 'RNFirebasePerformancePackage')
    })

    

    //
    // Prepare iOS code
    runner.register('react-native-firebase:ios').name('react-native-firebase').requires(c => c.project.uses('react-native-firebase')).before('prepare.ios.podinstall').do(async ctx => {

        // Check if user has not set up firebase yet
        if (!ctx.project.appInfo.firebase)
            await runner.run('firebase.setup', ctx)

        // Find path to iOS JSON
        let plistPath = path.resolve(ctx.project.path, 'metadata/google-services-ios.plist')
        if (!await fs.exists(plistPath))
            throw new Error(`The file ${chalk.cyan('metadata/google-services-ios.plist')} was not found. Please go to the Firebase console > Project Settings > Add iOS and download the plist file. Then, copy it to this path in your project.`)

        // Copy iOS config
        ctx.status('Modifying native code...')
        await fs.copyFile(
            plistPath,
            path.resolve(ctx.ios.path, 'GoogleService-Info.plist')
        )

        // Add reference to project
        let proj = new PBX(path.resolve(ctx.ios.path, 'HelloWorld.xcodeproj/project.pbxproj'))
        proj.addResource('GoogleService-Info.plist')
        await proj.save()

        // Modify source code
        await ctx.ios.injectDependency("pod 'Firebase/Core', '~> 6.3.0'")
        replace.sync({
            files: path.resolve(ctx.ios.path, 'HelloWorld/AppDelegate.m'),
            from: '#import',
            to: `#import <Firebase.h>\n#import`
        })
        replace.sync({
            files: path.resolve(ctx.ios.path, 'HelloWorld/AppDelegate.m'),
            from: '{',
            to: `{\n[FIRApp configure];\n`
        })

        // Run setup tasks
        for (let key in ctx.project.appInfo.firebase)
            if (runner.tasks['firebase.ios.' + key])
                await runner.run('firebase.ios.' + key, ctx)

    })

    //
    // Add module support for iOS
    runner.register('firebase.ios.admob').do(async ctx => {
        await ctx.ios.injectDependency("pod 'Firebase/AdMob', '~> 6.3.0'")
    })
    runner.register('firebase.ios.analytics').do(async ctx => {
        await ctx.ios.injectDependency("pod 'GoogleIDFASupport', '~> 3.14.0'")
    })
    runner.register('firebase.ios.auth').do(async ctx => {
        await ctx.ios.injectDependency("pod 'Firebase/Auth', '~> 6.3.0'")
    })
    runner.register('firebase.ios.messaging').do(async ctx => {
        await ctx.ios.injectDependency("pod 'Firebase/Messaging', '~> 6.3.0'")
    })
    runner.register('firebase.ios.firestore').do(async ctx => {
        await ctx.ios.injectDependency("pod 'Firebase/Firestore', '~> 6.3.0'")
    })
    runner.register('firebase.ios.functions').do(async ctx => {
        await ctx.ios.injectDependency("pod 'Firebase/Functions', '~> 6.3.0'")
    })
    runner.register('firebase.ios.crashlytics').do(async ctx => {
        await ctx.ios.injectDependency("pod 'Fabric', '~> 1.10.2'")
        await ctx.ios.injectDependency("pod 'Crashlytics', '~> 3.13.2'")
        // TODO: Add build script
    })
    runner.register('firebase.ios.database').do(async ctx => {
        await ctx.ios.injectDependency("pod 'Firebase/Database', '~> 6.3.0'")
    })
    runner.register('firebase.ios.links').do(async ctx => {

        // Add custom URL scheme
        let customURL = 'firebase-' + ctx.property('name.ios').toLowerCase().replace(/[^0-9a-z]/g, '')
        await ctx.ios.addURLScheme(customURL)
        
        // Add dependency
        await ctx.ios.injectDependency("pod 'Firebase/DynamicLinks', '~> 6.3.0'")

        // Modify AppDelegate.m
        replace.sync({
            files: path.resolve(ctx.ios.path, 'HelloWorld/AppDelegate.m'),
            from: '#import',
            to: `#import "RNFirebaseLinks.h"\n#import <React/RCTLinkingManager.h>\n#import`
        })
        replace.sync({
            files: path.resolve(ctx.ios.path, 'HelloWorld/AppDelegate.m'),
            from: '[FIRApp configure];',
            to: `[FIROptions defaultOptions].deepLinkURLScheme = @"${customURL}";\n[FIRApp configure];`
        })
        replace.sync({
            files: path.resolve(ctx.ios.path, 'HelloWorld/AppDelegate.m'),
            from: '@implementation AppDelegate',
            to: `@implementation AppDelegate
            
                - (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
                    
                    // Handle with React Native link manager
                    BOOL handled = [RCTLinkingManager application:application openURL:url options:options];

                    // If not handled, handle with Firebase link manager
                    if (!handled)
                        handled = [[RNFirebaseLinks instance] application:application openURL:url options:options];
                    
                    // Done
                    return handled;

                }

                - (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity restorationHandler:(void (^)(NSArray *))restorationHandler {
                
                    // Handle with React Native link manager
                    BOOL handled = [RCTLinkingManager application:application continueUserActivity:userActivity restorationHandler:restorationHandler];

                    // If not handled, handle with Firebase link manager
                    if (!handled)
                        handled = [[RNFirebaseLinks instance] application:application continueUserActivity:userActivity restorationHandler:restorationHandler];
                
                    // Done
                    return handled;

                }
            
            `
        })
        
    })
    runner.register('firebase.ios.notifications').do(async ctx => {

        // Modify AppDelegate.m
        replace.sync({
            files: path.resolve(ctx.ios.path, 'HelloWorld/AppDelegate.m'),
            from: '#import',
            to: `#import "RNFirebaseNotifications.h"\n#import "RNFirebaseMessaging.h"\n#import`
        })
        replace.sync({
            files: path.resolve(ctx.ios.path, 'HelloWorld/AppDelegate.m'),
            from: '[FIRApp configure];',
            to: `[FIRApp configure];\n    [RNFirebaseNotifications configure];`
        })
        replace.sync({
            files: path.resolve(ctx.ios.path, 'HelloWorld/AppDelegate.m'),
            from: '@implementation AppDelegate',
            to: `@implementation AppDelegate

- (void)application:(UIApplication *)application didReceiveLocalNotification:(UILocalNotification *)notification {
    [[RNFirebaseNotifications instance] didReceiveLocalNotification:notification];
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(nonnull NSDictionary *)userInfo fetchCompletionHandler:(nonnull void (^)(UIBackgroundFetchResult))completionHandler{
    [[RNFirebaseNotifications instance] didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
}

- (void)application:(UIApplication *)application didRegisterUserNotificationSettings:(UIUserNotificationSettings *)notificationSettings {
    [[RNFirebaseMessaging instance] didRegisterUserNotificationSettings:notificationSettings];
}

`
        })
        
    })
    runner.register('firebase.ios.remoteconfig').do(async ctx => {
        await ctx.ios.injectDependency("pod 'Firebase/RemoteConfig', '~> 6.3.0'")
    })
    runner.register('firebase.ios.storage').do(async ctx => {
        await ctx.ios.injectDependency("pod 'Firebase/Storage', '~> 6.3.0'")
    })
    runner.register('firebase.ios.performance').do(async ctx => {
        await ctx.ios.injectDependency("pod 'Firebase/Performance', '~> 6.3.0'")
    })

}