# App details

Here is a list of files which allow you to modify your app name, icon, etc.

## Icon

- `metadata/icon.png` - Your app's icon. Should be at least 512x512.
- `metadata/icon-android.png` - _(optional)_ An Android specific icon for your app.
- `metadata/icon-ios.png` - _(optional)_ An iOS specific icon for your app.

## Version

Your app's version matches the `version` field in `package.json`. Make sure to only use numbers and `.` for best compatibility, eg `33` or `2.0.3` etc.

## Fields in app.json

Many other options can be controlled by setting fields in `app.json`. Any field can be customized per platform, eg:

``` javascript
// Generic field
{
    displayName: "My app"
}

// Platform specific field
{
    displayName: {
        android: "My Android app",
        ios: "My iOS app"
    }
}
```

Here is an example `app.json`:

``` javascript
{

    // (required) The module name for your app. This should not have any spaces.
    name: "MyApp",

    // The name of your app. This is displayed under the icon when a user adds your app to their home screen.
    displayName: "My app",

    // The bundle ID or package ID of your app. The default is `com.<name>`
    packageID: "com.mycompany.MyApp",

    // (required for iOS only) Your Apple developer team ID. If this is not specified, you will be
    // asked for it when building on iOS.
    iosTeamID: "ABCD123456",

    // URL schemes you'd like to launch your app. This example below will open the app when the 
    // url `myapp://something` is launched.
    urlSchemes: [
        "myapp"
    ],

    // List of file type extensions your app supports. When a file is opened in your app, you can use
    // React Native's `Linking` module to receive the file:// or content:// URL.
    // You can also pass "*" to support opening any file type.
    fileExtensions: [
        "txt"
    ]

}
```