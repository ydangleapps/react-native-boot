
const path = require('path')
const replace = require('replace-in-file')
const fs = require('fs')

module.exports = runner => {
    
    //
    // This lib requires minimum Android SDK 19
    runner.register().before('android.prepare.minsdk').requires(ctx => ctx.project.uses('react-native-navigation')).do(ctx => {
        ctx.android.requireMinSDK(19)
    })
    
    //
    // Modify Android source code to support this library
    runner.register('react-native-navigation').after('prepare.android').requires(ctx => ctx.project.uses('react-native-navigation')).do(async ctx => {

        // Change native code as required by the react-native-navigation lib
        ctx.status('Modifying Android code...')
        replace.sync({
            files: path.resolve(ctx.project.path, 'android/settings.gradle'),
            from: "include ':app'",
            to: `
            include ':react-native-navigation'
            project(':react-native-navigation').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-navigation/lib/android/app/')

            include ':app'
            `
        })
        replace.sync({
            files: path.resolve(ctx.project.path, 'android/app/build.gradle'),
            from: "dependencies {",
            to: `dependencies {
                implementation project(':react-native-navigation')
            `
        })
        replace.sync({
            files: path.resolve(ctx.project.path, 'android/app/build.gradle'),
            from: "defaultConfig {",
            to: `defaultConfig {
                missingDimensionStrategy "RNN.reactNativeVersion", "reactNative57_5"
            `
        })

        // This is not needed, since we now run Android with the correct Gradle commands
        // replace.sync({
        //     files: path.resolve(ctx.project.path, 'android/app/build.gradle'),
        //     from: "dependencies {",
        //     to: `

        // subprojects { subproject ->
        //     afterEvaluate {
        //         if ((subproject.plugins.hasPlugin('android') || subproject.plugins.hasPlugin('android-library'))) {
        //             android {
        //                 variantFilter { variant ->
        //                     def names = variant.flavors*.name
        //                     if (names.contains("reactNative51") || names.contains("reactNative55") || names.contains("reactNative56") || names.contains("reactNative57")) {
        //                         setIgnore(true)
        //                     }
        //                 }
        //             }
        //         }
        //     }
        // }

        // dependencies {
        //     `
        // })
        
        // Add jitpack maven repository
        replace.sync({
            files: path.resolve(ctx.project.path, 'android/build.gradle'),
            from: /repositories {/g,
            to: `repositories {
                maven { url 'https://jitpack.io' }
            `
        })

        // Update main activity class code
        replace.sync({
            files: path.resolve(ctx.project.path, 'android/app/src/main/java/com/ydangleapps/flick/MainActivity.java'),
            from: 'import com.facebook.react.ReactActivity;',
            to: 'import com.reactnativenavigation.NavigationActivity;'
        })
        replace.sync({
            files: path.resolve(ctx.project.path, 'android/app/src/main/java/com/ydangleapps/flick/MainActivity.java'),
            from: 'public class MainActivity extends ReactActivity',
            to: 'public class MainActivity extends NavigationActivity'
        })
        replace.sync({
            files: path.resolve(ctx.project.path, 'android/app/src/main/java/com/ydangleapps/flick/MainActivity.java'),
            from: /\@Override[\s\S]*?protected String getMainComponentName\(\) {[\s\S]*?}/g,
            to: ' '
        })

        // Update main application class code
        replace.sync({
            files: path.resolve(ctx.project.path, 'android/app/src/main/java/com/ydangleapps/flick/MainApplication.java'),
            from: 'import com.facebook.soloader.SoLoader;',
            to: `import com.facebook.soloader.SoLoader;
                import com.reactnativenavigation.NavigationApplication;
                import com.reactnativenavigation.react.NavigationReactNativeHost;
                import com.reactnativenavigation.react.ReactGateway;
            `
        })
        replace.sync({
            files: path.resolve(ctx.project.path, 'android/app/src/main/java/com/ydangleapps/flick/MainApplication.java'),
            from: /public class[\s\S]*getPackages\(\) {([\s\S]*?)}[\s\S]*/g,
            to: (m, p1) => `public class MainApplication extends NavigationApplication {
                
                @Override
                protected ReactGateway createReactGateway() {
                    ReactNativeHost host = new NavigationReactNativeHost(this, isDebug(), createAdditionalReactPackages()) {
                        @Override
                        protected String getJSMainModuleName() {
                            return "index";
                        }
                    };
                    return new ReactGateway(this, isDebug(), host);
                }
            
                @Override
                public boolean isDebug() {
                    return BuildConfig.DEBUG;
                }
            
                protected List<ReactPackage> getPackages() {
                    ${p1}
                }
            
                @Override
                public List<ReactPackage> createAdditionalReactPackages() {
                    return getPackages();
                }
                
            }`
        })

        
        // ctx.status('Modifying iOS code...')
        // fs.writeFileSync(path.resolve(ctx.project.path, 'ios/Flick/AppDelegate.m'), `
        //     #import "AppDelegate.h"

        //     #import <React/RCTBundleURLProvider.h>
        //     #import <React/RCTRootView.h>
        //     #import <ReactNativeNavigation/ReactNativeNavigation.h>

        //     @implementation AppDelegate

        //     - (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
        //     {
        //         NSURL *jsCodeLocation = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
        //         [ReactNativeNavigation bootstrap:jsCodeLocation launchOptions:launchOptions];

        //         return YES;
        //     }

        //     @end
        // `)

    })

}