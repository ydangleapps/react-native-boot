# Support

List of libraries which require custom build tasks. We have included build tasks for these
libraries in order to make installing them easier.

Any library not listed here may still work, but we haven't tested it. If you encounter a library which doesn't work, please submit an issue.

```
Current react native version: 0.59.10
```

Library                         | Version   | Android   | iOS   | Windows   | Build task
--------------------------------|-----------|-----------|-------|-----------|------------------
react-native-boot-android       |           | ✓         |       |           | _(embedded)_ Adds platform support for Android.
react-native-boot-ios           |           |           | x     |           | _(embedded)_ Adds platform support for iOS
react-native-boot-windows       |           |           |       | x         | _(embedded)_ Adds platform support for Windows UWP
react-native-image-picker       | 0.28.1    | ✓         |       |           | Adds missing permissions.
react-native-navigation         | 2.22.3    | ✓         |       |           | Modifies the native project code structure. (could cause conflicts)
react-native-zeroconf           | 0.11.0     | ✓         |       |           | Adds missing Android permissions