
const path = require('path')
const replace = require('replace-in-file')
const fs = require('fs-extra')

module.exports = runner => {

    //
    // Add library to info output, since this library does not use the standard layout it won't be detected correctly
    runner.register('info.react-native-navigation').after('info.android').name('Android').do(async ctx => {
        ctx.infocmd.libraries['react-native-navigation'] = {
            platforms: ['android', 'ios']
        }
    })
    
    //
    // This lib requires minimum Android SDK 19
    runner.register().before('android.prepare.minsdk').requires(ctx => ctx.project.uses('react-native-navigation')).do(ctx => {
        ctx.android.requireMinSDK(19)
    })
    
    //
    // Modify Android source code to support this library
    runner.register('react-native-navigation:android').name('react-native-navigation').after('prepare.android.link').requires(ctx => ctx.project.uses('react-native-navigation')).priority(-9).do(async ctx => {

        // Change native code as required by the react-native-navigation lib
        ctx.status('Modifying Android code...')
        let androidLibPath = path.resolve(ctx.project.path, 'node_modules/react-native-navigation/lib/android/app')
        let androidLibName = 'react-native-navigation'
        let androidProjectName = 'react-native-navigation'

        // Add to build process
        replace.sync({ 
            files: path.resolve(ctx.android.path, 'settings.gradle'), 
            from: "include ':app'",
            to: `include ':${androidProjectName}'\nproject(':${androidProjectName}').projectDir = new File('${androidLibPath.replace(/\\/g, '\\\\')}')\ninclude ':app'`
        })
        replace.sync({ 
            files: path.resolve(ctx.android.path, 'app/build.gradle'), 
            from: "/*PROJECT_DEPS_INJECT*/",
            to: `/*PROJECT_DEPS_INJECT*/\n    implementation project(':${androidProjectName}')`
        })
        
        // Choose correct variant
        replace.sync({
            files: path.resolve(ctx.android.path, 'app/build.gradle'),
            from: "defaultConfig {",
            to: `defaultConfig {
                missingDimensionStrategy "RNN.reactNativeVersion", "reactNative57_5"
            `
        })

        // This is not needed, since we now run Android with the correct Gradle commands
        replace.sync({
            files: path.resolve(ctx.android.path, 'app/build.gradle'),
            from: "/*PROJECT_DEPS_INJECT*/",
            to: `/*PROJECT_DEPS_INJECT*/

        // Additions for react-native-navigation
        // implementation 'androidx.core:core:1.0.2'
        // implementation 'com.android.support:multidex:1.0.1'
        subprojects { subproject ->
            afterEvaluate {
                if ((subproject.plugins.hasPlugin('android') || subproject.plugins.hasPlugin('android-library'))) {
                    android {
                        variantFilter { variant ->
                            def names = variant.flavors*.name
                            if (names.contains("reactNative51") || names.contains("reactNative55") || names.contains("reactNative56") || names.contains("reactNative57")) {
                                setIgnore(true)
                            }
                        }
                    }
                }
            }
        }
            `
        })

        // Add application replacer definition so if we include AndoridX and the old android support lib, it known which one to use
        // replace.sync({
        //     files: path.resolve(ctx.android.path, 'app/src/main/AndroidManifest.xml'),
        //     from: '<application',
        //     to: '<application tools:replace="android:appComponentFactory"'
        // })
        
        // Add jitpack maven repository
        replace.sync({
            files: path.resolve(ctx.android.path, 'build.gradle'),
            from: /repositories {/g,
            to: `repositories {
                maven { url 'https://jitpack.io' }
            `
        })

        // Update main activity class code
        replace.sync({
            files: path.resolve(ctx.android.path, 'app/src/main/java/**/MainActivity.java'),
            from: 'import com.facebook.react.ReactActivity;',
            to: 'import com.reactnativenavigation.NavigationActivity;'
        })
        replace.sync({
            files: path.resolve(ctx.android.path, 'app/src/main/java/**/MainActivity.java'),
            from: 'public class MainActivity extends ReactActivity',
            to: 'public class MainActivity extends NavigationActivity'
        })
        replace.sync({
            files: path.resolve(ctx.android.path, 'app/src/main/java/**/MainActivity.java'),
            from: /\@Override[\s\S]*?protected String getMainComponentName\(\) {[\s\S]*?}/g,
            to: ' '
        })

        // Update main application class code
        replace.sync({
            files: path.resolve(ctx.android.path, 'app/src/main/java/**/MainApplication.java'),
            from: 'import com.facebook.soloader.SoLoader;',
            to: `import com.facebook.soloader.SoLoader;
                import com.reactnativenavigation.NavigationApplication;
                import com.reactnativenavigation.react.NavigationReactNativeHost;
                import com.reactnativenavigation.react.ReactGateway;
                // import android.support.multidex.MultiDex;
                // import android.content.Context;
            `
        })
        replace.sync({
            files: path.resolve(ctx.android.path, 'app/src/main/java/**/MainApplication.java'),
            from: /public class[\s\S]*getPackages\(\) {([\s\S]*?)}[\s\S]*/g,
            to: (m, p1) => `public class MainApplication extends NavigationApplication {

                @Override
                protected void attachBaseContext(Context base) {
                    super.attachBaseContext(base);
                    MultiDex.install(this);
                }
                
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

        // // HACK: Add support libraries
        // // Add imports
        // ctx.status('Adding support libraries...')
        // await fs.appendFile(path.resolve(ctx.project.path, 'node_modules/react-native-navigation/lib/android/app/build.gradle'), `
        //     dependencies {
        //         compileOnly 'com.android.support:support-v4:27.0.2' // v4
        //     }`
        // )

        // // Set a config so it doesn't use jetify
        // await fs.writeFile(path.resolve(ctx.project.path, 'node_modules/react-native-navigation/lib/android/app/gradle.properties'), `
        //     android.useAndroidX=false
        //     android.enableJetifier=false
        // `)

    })
    
    //
    // Modify iOS source code to support this library
    runner.register('react-native-navigation:ios').name('react-native-navigation').before('prepare.ios.link').requires(ctx => ctx.project.uses('react-native-navigation')).priority(-9).do(async ctx => {

        // Change native code as required by the react-native-navigation lib
        ctx.status('Modifying iOS code...')

        // Add header to AppDelegate.m
        replace.sync({
            files: path.resolve(ctx.ios.path, 'HelloWorld/AppDelegate.m'),
            from: '#import',
            to: `#import <ReactNativeNavigation/ReactNativeNavigation.h>\n#import`
        })

        // Replace appDidLaunch
        replace.sync({
            files: path.resolve(ctx.ios.path, 'HelloWorld/AppDelegate.m'),
            from: /launchOptions\s*?{[\s\S]*?}/,
            to: `launchOptions {

                // Replaced by react-native-navigation
                NSURL *jsCodeLocation = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
                [ReactNativeNavigation bootstrap:jsCodeLocation launchOptions:launchOptions];

                return YES;

            }`
        })


    })

}