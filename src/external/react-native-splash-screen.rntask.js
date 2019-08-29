
const replace = require('replace-in-file')
const path = require('path')
const fs = require('fs-extra')

module.exports = runner => {
    
    // Update Android code
    runner.register('react-native-splash-screen:android').after('prepare.android.link').requires(ctx => ctx.project.uses('react-native-splash-screen')).do(async ctx => {

        // Update app activity
        ctx.status('Updating native source code')
        replace.sync({
            files: path.resolve(ctx.android.path, 'app/src/main/java/**/MainActivity.java'),
            from: 'import',
            to: `import org.devio.rn.splashscreen.SplashScreen;
            import android.os.Bundle;
            import`
        })
        replace.sync({
            files: path.resolve(ctx.android.path, 'app/src/main/java/**/MainActivity.java'),
            from: '{',
            to: `{

                @Override
                protected void onCreate(Bundle savedInstanceState) {
                    SplashScreen.show(this);
                    super.onCreate(savedInstanceState);
                }

            `
        })

        // Attach launch screen layout file
        await fs.ensureDir(path.resolve(ctx.android.path, 'app/src/main/res/layout'))
        await fs.writeFile(path.resolve(ctx.android.path, 'app/src/main/res/layout/launch_screen.xml'), `
        
            <?xml version="1.0" encoding="utf-8"?>
            <RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
                android:orientation="vertical" android:layout_width="match_parent"
                android:layout_height="match_parent"
                android:background="#414B55"
                android:gravity="center">
                <ImageView android:layout_width="128dp" android:layout_height="128dp" android:src="@mipmap/ic_launcher" android:scaleType="fitCenter" android:gravity="center" />
            </RelativeLayout>
        
        `.trim())

    })

    // Update iOS code
    runner.register('react-native-splash-screen:ios').after('prepare.ios.link').requires(ctx => ctx.project.uses('react-native-splash-screen')).do(async ctx => {

        // TODO: This is broken
        return

        // Update app delegate
        ctx.status('Updating native source code')
        replace.sync({
            files: path.resolve(ctx.ios.path, 'HelloWorld/AppDelegate.m'),
            from: '#import',
            to: `#import "RNSplashScreen.h"\n#import`
        })
        replace.sync({
            files: path.resolve(ctx.ios.path, 'HelloWorld/AppDelegate.m'),
            from: /launchOptions\s*?{/,
            to: `launchOptions {

                // Added by react-native-splash-screen
                [RNSplashScreen show];
            `
        })

    })

}