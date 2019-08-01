# Recipes

Here a collection of example run tasks for different cases. App creators can create run tasks directly in their project, and library creators can create run tasks in their libraries.

To create a run task, create a file with a `.rntask.js` extension. It will be automatically loaded.

### Require a minimum Android SDK target:

``` js
// min-android-sdk.rntask.js
module.exports = r => r.register().before('prepare.android').do(ctx => {
    ctx.android.requireMinSDK(21)
})
```

### Require the user to set an iOS permission usage string:

``` js
// ios-permissions.rntask.js
module.exports = r => r.register().before('prepare.ios.permissions').do(ctx => {
    ctx.ios.permissions.add('NSPhotoLibraryUsageDescription')
})
```

### Set an iOS permission usage string:

``` js
// ios-permissions.rntask.js
module.exports = r => r.register().before('prepare.ios.permissions').do(ctx => {
    ctx.ios.permissions.add('NSPhotoLibraryUsageDescription', 'Allows you to pick a photo from your photo library.')
})
```