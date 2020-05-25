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
import { Text, View, FlatList, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { SearchBar } from "react-native-elements";
import Icon from 'react-native-vector-icons/Ionicons';
import FAIcon from 'react-native-vector-icons/FontAwesome';
import ActionButton from 'react-native-action-button';

import MPDConnection from './MPDConnection';
import { styles as common, playlistDetailsStyles as styles } from './Styles';

export default class PlaylistDetails extends React.Component {
    static navigationOptions = ({ navigation }) => {
        return {
            title: navigation.getParam('playlist')
        };
    };

    constructor(props) {
        super(props);
        this.state = {
          searchValue: "",
          playlist: [],
          fullset: [],
          loading: false
        };
    }

    componentDidMount() {
        const { navigation } = this.props;
        this.playlistName = navigation.getParam('playlist');
        const isNew = navigation.getParam('isNew');
        //if (!isNew) {
        //    this.load();
        //}

        this.didFocusSubscription = this.props.navigation.addListener(
            'didFocus',
            payload => {
                this.load();
            }
        );
    }

    componentWillUnmount() {
        this.didFocusSubscription.remove();
    }

    load() {
        this.setState({loading: true});
        MPDConnection.current().getNamedPlayListInfo(this.playlistName)
        .then((playlist) => {
            this.setState({loading: false});
            playlist.forEach((entry, index) => {
                entry.pos = index;
            })
            this.setState({playlist: playlist, fullset: playlist});
        })
        .catch((err) => {
            this.setState({loading: false});
            if (err.indexOf("No such playlist") === -1) {
                Alert.alert(
                    "MPD Error",
                    "Error : "+err
                );
            }
        });
    }

    search = (text) => {
        if (text.length > 0) {
            let filtered = this.state.fullset.filter((entry) => {
                return entry.title.toLowerCase().indexOf(text.toLowerCase()) > -1;
            });
            this.setState({playlist: filtered, searchValue: text});
        } else {
            this.setState({playlist: this.state.fullset, searchValue: text});
        }
    }

    onPress(item, index) {
        Alert.alert(
            "Delete Playlist Entry",
            "Are you sure you want to delete ''"+item.title+"'' ?",
            [
                {text: 'OK', onPress: () => {
                    this.setState({loading: true});
                    MPDConnection.current().deletePlayListItem(this.playlistName, index)
                    .then(() => {
                        this.setState({loading: false});
                        this.load();
                    })
                    .catch((err) => {
                        this.setState({loading: false});
                        Alert.alert(
                            "MPD Error",
                            "Error : "+err
                        );
                    });
                }},
                {text: 'Cancel'}
            ]
        );
    }

    onDelete() {
        const { navigation } = this.props;
        Alert.alert(
            "Delete Playlist",
            "Are you sure you want to delete ?",
            [
                {text: 'OK', onPress: () => {
                    this.setState({loading: true});
                    MPDConnection.current().deletePlayList(this.playlistName)
                    .then(() => {
                        this.setState({loading: false});
                        navigation.pop();
                    })
                    .catch((err) => {
                        this.setState({loading: false});
                        Alert.alert(
                            "MPD Error",
                            "Error : "+err
                        );
                    });
                }},
                {text: 'Cancel'}
            ]
        );
    }

    onLoad(autoplay) {
        this.setState({loading: true});

        MPDConnection.current().loadPlayList(this.playlistName, autoplay)
        .then(() => {
            this.setState({loading: false});
        })
        .catch((err) => {
            this.setState({loading: false});
            Alert.alert(
                "MPD Error",
                "Error : "+err
            );
        });
    }

    renderSeparator = () => {
        return (
            <View
                style={styles.separator}
            />
        );
    };

    renderItem = ({item, index}) => {
        return (
            <TouchableOpacity onPress={this.onPress.bind(this, item, index)}>
                <View style={styles.container6}>
                    <Icon name="ios-musical-notes" size={20} color="black" style={styles.icon}/>
                    <View style={styles.container7}>
                        {item.name !== undefined &&
                            <Text numberOfLines={1} ellipsizeMode='tail' style={styles.item}>{item.name}</Text>
                        }
                        <Text numberOfLines={1} ellipsizeMode='tail' style={styles.item}>{item.title}</Text>
                        <Text numberOfLines={1} ellipsizeMode='tail' style={styles.item}>{item.artist}</Text>
                        <Text numberOfLines={1} ellipsizeMode='tail' style={styles.item}>{item.album}</Text>
                        {item.time !== undefined &&
                            <Text numberOfLines={1} ellipsizeMode='tail' style={styles.item}>Time: {item.time}</Text>
                        }
                    </View>
                    <Icon name="ios-trash" size={28} color="black" style={styles.icon}/>
                </View>
            </TouchableOpacity>
        );
    };

    render() {
        return (
            <View style={styles.container1}>
                <View style={styles.container2}>
                    <View style={styles.container3}>
                        <SearchBar
                            clearIcon
                            lightTheme
                            round
                            cancelButtonTitle="Cancel"
                            placeholder='Search'
                            onChangeText={this.search}
                            value={this.state.searchValue}
                            containerStyle={styles.searchbarContainer}
                            inputContainerStyle={styles.searchbarInputContainer}
                            inputStyle={styles.searchbarInput}
                    />
                    </View>
                    <View style={styles.container4}>
                        <Text style={styles.text}>
                            Total : {this.state.playlist.length}
                        </Text>
                    </View>
                </View>
                <View style={styles.container5}>
                <FlatList
                    data={this.state.playlist}
                    renderItem={this.renderItem}
                    renderSectionHeader={({section}) => <Text style={styles.sectionHeader}>{section.title}</Text>}
                    keyExtractor={item => ""+item.pos}
                    ItemSeparatorComponent={this.renderSeparator}
                />
                </View>
                {this.state.loading &&
                    <View style={styles.loading}>
                        <ActivityIndicator size="large" color="#0000ff"/>
                    </View>
                }
                <ActionButton buttonColor="rgba(231,76,60,1)" hideShadow={true}>
                    <ActionButton.Item buttonColor='#1abc9c' title="Play Now" size={40} textStyle={styles.actionButtonText} onPress={() => {this.onLoad(true);}}>
                        <FAIcon name="play" size={15} color="#e6e6e6" />
                    </ActionButton.Item>
                    <ActionButton.Item buttonColor='#3498db' title="Queue" size={40} textStyle={styles.actionButtonText} onPress={() => {this.onLoad();}}>
                        <Icon name="ios-checkmark" size={30} color="#e6e6e6" />
                    </ActionButton.Item>
                    <ActionButton.Item buttonColor='#1abc9c' title="Delete" size={40} textStyle={styles.actionButtonText} onPress={() => {this.onDelete();}}>
                        <Icon name="ios-trash" size={23} color="#e6e6e6" />
                    </ActionButton.Item>
                </ActionButton>
            </View>
        );
    }
}
