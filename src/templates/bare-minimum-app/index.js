
import React from 'react'
import { AppRegistry, View, Text } from 'react-native'

// Create UI
const App = props => <View style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: '#08F', alignItems: 'center', justifyContent: 'center' }}>
    <Text>Hello World!</Text>
</View>

// Register app component
AppRegistry.registerComponent(require('./app.json').name, () => App);