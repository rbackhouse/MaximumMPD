/*
* The MIT License (MIT)
*
* Copyright (c) 2018 Richard Backhouse
*
* Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"),
* to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
* and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
* DEALINGS IN THE SOFTWARE.
*/

import React from 'react';
import { ActivityIndicator, View, TouchableOpacity, Appearance, useColorScheme } from 'react-native';
import Icon  from 'react-native-vector-icons/Ionicons';
import FAIcon  from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/dist/MaterialIcons';

import { createStackNavigator } from 'react-navigation-stack';
import { createBottomTabNavigator } from 'react-navigation-tabs';
import { createAppContainer, createSwitchNavigator } from 'react-navigation';

import { StyleManager } from './Styles';

import PlayScreen from './PlayScreen';
import SearchScreen from './SearchScreen';
import SettingsScreen from './SettingsScreen';
import FilesScreen from './FilesScreen';
import ConnectionsScreen from './ConnectionsScreen';
import ArtistsScreen from './ArtistsScreen';
import AlbumsScreen from './AlbumsScreen';
import SongsScreen from './SongsScreen';
import PlaylistDetails from './PlaylistDetails';
import WelcomeScreen from './WelcomeScreen';
import OutputsScreen from './OutputsScreen';
import DebugScreen from './DebugScreen';
import AlbumArtScreen from './AlbumArtScreen';
import MPDConnection from './MPDConnection';

class Header extends React.Component {
    state = {
        connectionState: 0
    }

    componentDidMount() {
        this.setState({connectionState: MPDConnection.isConnected() ? 2 : 0});
        this.onConnect = MPDConnection.getEventEmitter().addListener(
            "OnConnect",
            () => {
                this.setState({connectionState: 2});
            }
        );

        this.onConnecting = MPDConnection.getEventEmitter().addListener(
            "OnConnecting",
            () => {
                this.setState({connectionState: 1});
            }
        );

        this.onDisconnect = MPDConnection.getEventEmitter().addListener(
            "OnDisconnect",
            () => {
                this.setState({connectionState: 0});
            }
        );

        this.onApperance = Appearance.addChangeListener(({ colorScheme }) => {
            this.setState({connectionState: this.state.connectionState});
        });
    }

    componentWillUnmount() {
        this.onConnect.remove();
        this.onConnecting.remove();
        this.onDisconnect.remove();
        if (this.onApperance) {
            this.onApperance.remove();
        }
    }

    render() {
        let color;
        let icon;
        let isConnecting = false;
        switch (this.state.connectionState) {
            case 0:
                color = "gray";
                icon = "unlink";
                break;
            case 1:
                isConnecting = true;
                break;
            case 2:
                color = "red";
                icon = "link";
                break;
        }
        const styles = StyleManager.getStyles("appStyles");

        return (
            <View>
            {isConnecting &&
                <View style={styles.connecting}>
                    <ActivityIndicator size="small" color="#0000ff" style={styles.paddingRight}/>
                </View>
            }
            {!isConnecting &&
                <FAIcon name={icon} size={20} color={color} style={styles.paddingRight}/>
            }
            </View>
        );
    }
}

class SortHeader extends React.Component {
    render() {
        const styles = StyleManager.getStyles("appStyles");
        const { navigation } = this.props;
        return (
            <View>
                <TouchableOpacity onPress={navigation.getParam('sort')}>
                    <MaterialIcon name="sort" size={20} color="gray" style={styles.paddingRight}/>
                </TouchableOpacity>
            </View>
        );
    }
}

const PlayStack = createStackNavigator(
    {
        Play: { 
            screen: PlayScreen 
        },
        PlaylistDetails: { 
            screen: PlaylistDetails 
        }
    },
    {
        defaultNavigationOptions: ({ navigation }) => ({
            headerRight: (
                <Header navigation={navigation}></Header>
            ),
            headerBackTitle: null,
            headerStyle: StyleManager.getStyles("appStyles").headerStyle,
            headerTitleStyle: StyleManager.getStyles("appStyles").headerTitleStyle
        })
    }
);

const BrowseStack = createStackNavigator(
    {
        Artists: { 
            screen: ArtistsScreen
        },
        Albums: { 
            screen: AlbumsScreen,
            navigationOptions: ({ navigation }) => ({
                headerRight: (
                    <Header navigation={navigation}></Header>
                ),
                headerBackTitle: null,
                headerStyle: StyleManager.getStyles("appStyles").headerStyle,
                headerTitleStyle: StyleManager.getStyles("appStyles").headerTitleStyle
            })
        },
        Songs: { 
            screen: SongsScreen
        }
    },
    {
        defaultNavigationOptions: ({ navigation }) => ({
            headerRight: (
                <SortHeader navigation={navigation}></SortHeader>
            ),
            headerBackTitle: null,
            headerStyle: StyleManager.getStyles("appStyles").headerStyle,
            headerTitleStyle: StyleManager.getStyles("appStyles").headerTitleStyle
        })
    }
);

const SearchStack = createStackNavigator(
    {
        Search: { 
            screen: SearchScreen 
        },
        Albums: { 
            screen: AlbumsScreen
        },
        Songs: { 
            screen: SongsScreen,
            navigationOptions: ({ navigation }) => ({
                headerRight: (
                    <SortHeader navigation={navigation}></SortHeader>
                ),
                headerBackTitle: null,
                headerStyle: StyleManager.getStyles("appStyles").headerStyle,
                headerTitleStyle: StyleManager.getStyles("appStyles").headerTitleStyle
            })    
        }
    },
    {
        defaultNavigationOptions: ({ navigation }) => ({
            headerRight: (
                <Header navigation={navigation}></Header>
            ),
            headerBackTitle: null,
            headerStyle: StyleManager.getStyles("appStyles").headerStyle,
            headerTitleStyle: StyleManager.getStyles("appStyles").headerTitleStyle
        })
    }
);

const FilesStack = createStackNavigator(
    {
        Files: { 
            screen: FilesScreen,
            navigationOptions: ({ navigation }) => ({
                headerRight: (
                    <SortHeader navigation={navigation}></SortHeader>
                ),
                headerBackTitle: null,
                headerStyle: StyleManager.getStyles("appStyles").headerStyle,
                headerTitleStyle: StyleManager.getStyles("appStyles").headerTitleStyle
            })    
        }
    }
);

const SettingsStack = createStackNavigator(
    {
        Settings: { 
            screen: SettingsScreen 
        },
        Connections: { 
            screen: ConnectionsScreen 
        },
        Outputs: { 
            screen: OutputsScreen 
        },
        Debug: { 
            screen: DebugScreen 
        },
        AlbumArt: {
            screen: AlbumArtScreen
        }
    },
    {
        defaultNavigationOptions: ({ navigation }) => ({
            headerRight: (
                <Header navigation={navigation}></Header>
            ),
            headerBackTitle: null,
            headerStyle: StyleManager.getStyles("appStyles").headerStyle,
            headerTitleStyle: StyleManager.getStyles("appStyles").headerTitleStyle
        })
    }
);

const MainPage = createBottomTabNavigator(
  {
    Play: { screen: PlayStack },
    Browse: { screen: BrowseStack },
    Search: { screen: SearchStack },
    Files: { screen: FilesStack },
    Settings: { screen: SettingsStack }
  },
  {
    defaultNavigationOptions: ({ navigation }) => ({
        tabBarIcon: ({ focused, tintColor }) => {
            const { routeName } = navigation.state;
            let iconName;
            if (routeName === 'Play') {
                //iconName = `ios-musical-notes${focused ? '' : '-outline'}`;
                iconName = `ios-musical-notes`;
            } else if (routeName === 'Browse') {
                //iconName = `ios-list${focused ? '' : '-outline'}`;
                iconName = `ios-list`;
            } else if (routeName === 'Search') {
                //iconName = `ios-search${focused ? '' : '-outline'}`;
                iconName = `ios-search`;
            } else if (routeName === 'Files') {
                //iconName = `ios-folder${focused ? '' : '-outline'}`;
                iconName = `ios-folder`;
            } else if (routeName === 'Settings') {
                //iconName = `ios-settings${focused ? '' : '-outline'}`;
                iconName = `ios-settings`;
            }

            return <Icon name={iconName} size={25} color={tintColor} />;
        },
        tabBarOnPress: ({navigation, defaultHandler}) => {
            if (MPDConnection.isConnected()) {
                defaultHandler();
            }
        },
        tabBarOptions: {
            activeTintColor: 'red',
            inactiveTintColor: 'gray',
            style: StyleManager.getStyles("appStyles").tabBar
        }
    }),
    tabBarPosition: 'bottom',
    animationEnabled: true,
    swipeEnabled: false
  }
);

const SwitchPage = createSwitchNavigator(
    {
        WelcomeScreen: { screen: WelcomeScreen },
        MainPage: { screen: MainPage }
    },
    {
        initialRouteName: 'WelcomeScreen'
    }
);

let App = createAppContainer(SwitchPage);

export default () => {
    let theme = useColorScheme();
    return (
        <App theme={theme}/>
    )
}
