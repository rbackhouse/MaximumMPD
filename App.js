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
import Icon  from 'react-native-vector-icons/Ionicons';
import FAIcon  from 'react-native-vector-icons/FontAwesome';
import { createStackNavigator, createBottomTabNavigator, createSwitchNavigator } from 'react-navigation';
import HeaderButtons from 'react-navigation-header-buttons';

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
import MPDConnection from './MPDConnection';

class Header extends React.Component {
    state = {
        isConnected: false
    }

    componentDidMount() {
        this.setState({isConnected: MPDConnection.isConnected()});
        this.onConnect = MPDConnection.getEventEmitter().addListener(
            "OnConnect",
            () => {
                this.setState({isConnected: true});
            }
        );

        this.onDisconnect = MPDConnection.getEventEmitter().addListener(
            "OnDisconnect",
            () => {
                this.setState({isConnected: false});
            }
        );
    }

    componentWillUnmount() {
        this.onConnect.remove();
        this.onDisconnect.remove();
    }

    render() {
        const color = this.state.isConnected ? "red" : "gray";
        const icon = this.state.isConnected ? "link" : "unlink";
        return (
            <FAIcon name={icon} size={15} color={color} style={{ paddingRight: 15 }}/>
        );
    }
}

const PlayStack = createStackNavigator(
    {
        Play: { screen: PlayScreen },
        PlaylistDetails: { screen: PlaylistDetails },
        Artists: { screen: ArtistsScreen },
        Albums: { screen: AlbumsScreen},
        Songs: { screen: SongsScreen}
    },
    {
        navigationOptions: ({ navigation }) => ({
            headerRight: (
                <Header navigation={navigation}></Header>
            ),
            headerBackTitle: null
        })
    }
);

const BrowseStack = createStackNavigator(
    {
        Artists: { screen: ArtistsScreen },
        Albums: { screen: AlbumsScreen},
        Songs: { screen: SongsScreen}
    },
    {
        navigationOptions: ({ navigation }) => ({
            headerRight: (
                <Header navigation={navigation}></Header>
            ),
            headerBackTitle: null
        })
    }
);

const SearchStack = createStackNavigator(
    {
        Search: { screen: SearchScreen },
        Albums: { screen: AlbumsScreen},
        Songs: { screen: SongsScreen}
    },
    {
        navigationOptions: ({ navigation }) => ({
            headerRight: (
                <Header navigation={navigation}></Header>
            ),
            headerBackTitle: null
        })
    }
);

const FilesStack = createStackNavigator(
    {
        Files: { screen: FilesScreen }
    },
    {
        navigationOptions: ({ navigation }) => ({
            headerRight: (
                <Header navigation={navigation}></Header>
            ),
            headerBackTitle: null
        })
    }
);

const SettingsStack = createStackNavigator(
    {
        Settings: { screen: SettingsScreen },
        Connections: { screen: ConnectionsScreen }
    },
    {
        navigationOptions: ({ navigation }) => ({
            headerRight: (
                <Header navigation={navigation}></Header>
            ),
            headerBackTitle: null
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
    navigationOptions: ({ navigation }) => ({
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
        }
    }),
    tabBarPosition: 'bottom',
    tabBarOptions: {
      activeTintColor: 'red',
      inactiveTintColor: 'gray',
    },
    animationEnabled: false,
    swipeEnabled: false
  }
);

export default createSwitchNavigator(
    {
        WelcomeScreen: { screen: WelcomeScreen },
        MainPage: { screen: MainPage }
    },
    {
        initialRouteName: 'WelcomeScreen'
    }
);
