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
import { Text, View, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { SearchBar } from "react-native-elements";
import Icon from 'react-native-vector-icons/Ionicons';
import FAIcon from 'react-native-vector-icons/FontAwesome';
import ActionButton from 'react-native-action-button';

import MPDConnection from './MPDConnection';
import Base64 from './Base64';

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
        if (!isNew) {
            this.load();
        }

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
                style={{
                  height: 1,
                  width: "90%",
                  backgroundColor: "#CED0CE",
                  marginLeft: "5%"
                }}
            />
        );
    };

    renderItem = ({item, index}) => {
        return (
            <TouchableOpacity onPress={this.onPress.bind(this, item, index)}>
                <View style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}>
                    <Icon name="ios-musical-notes" size={20} color="black" style={{ paddingLeft: 20, paddingRight: 20 }}/>
                    <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-evenly', alignItems: 'stretch', padding: 5}}>
                        <Text style={styles.item}>{item.title}</Text>
                        <Text style={styles.item}>{item.artist}</Text>
                        <Text style={styles.item}>{item.album}</Text>
                    </View>
                    <Icon name="ios-trash" size={28} color="black" style={{ paddingLeft: 20, paddingRight: 20 }}/>
                </View>
            </TouchableOpacity>
        );
    };

    render() {
        return (
            <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'stretch' }}>
                <View style={{flex: .1, flexDirection: 'row', alignItems: 'center'}}>
                    <View style={{flex: .75}}>
                        <SearchBar
                            clearIcon
                            lightTheme
                            round
                            cancelButtonTitle="Cancel"
                            placeholder='Search'
                            onChangeText={this.search}
                            value={this.state.searchValue}
                        />
                    </View>
                    <View style={{flex: .25}}>
                        <Text style={{fontSize: 15,fontFamily: 'GillSans-Italic'}}>
                            Total : {this.state.playlist.length}
                        </Text>
                    </View>
                </View>
                <FlatList
                    data={this.state.playlist}
                    renderItem={this.renderItem}
                    renderSectionHeader={({section}) => <Text style={styles.sectionHeader}>{section.title}</Text>}
                    keyExtractor={item => ""+item.pos}
                    ItemSeparatorComponent={this.renderSeparator}
                />
                {this.state.loading &&
                    <View style={styles.loading}>
                        <ActivityIndicator size="large" color="#0000ff"/>
                    </View>
                }
                <ActionButton buttonColor="rgba(231,76,60,1)">
                    <ActionButton.Item buttonColor='#1abc9c' title="Play Now" size={40} textStyle={styles.actionButtonText} onPress={() => {this.onLoad(true);}}>
                        <FAIcon name="play" size={15} color="#e6e6e6" />
                    </ActionButton.Item>
                    <ActionButton.Item buttonColor='#3498db' title="Queue" size={40} textStyle={styles.actionButtonText} onPress={() => {this.onLoad();}}>
                        <Icon name="ios-checkmark" size={30} color="#e6e6e6" />
                    </ActionButton.Item>
                    <ActionButton.Item buttonColor='#1abc9c' title="Delete" size={40} textStyle={styles.actionButtonText} onPress={() => {this.onDelete();}}>
                        <Icon name="ios-trash" size={23} color="#e6e6e6" />
                    </ActionButton.Item>
                    <ActionButton.Item buttonColor='#9b59b6' title="Set Active" size={40} textStyle={styles.actionButtonText} onPress={() => {MPDConnection.current().setCurrentPlaylistName(this.playlistName);}}>
                        <FAIcon name="plus-square" size={15} color="#e6e6e6" />
                    </ActionButton.Item>
                </ActionButton>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    item: {
        fontSize: 17,
        fontFamily: 'GillSans-Italic'
    },
    sectionHeader: {
        paddingTop: 2,
        paddingLeft: 10,
        paddingRight: 10,
        paddingBottom: 2,
        fontSize: 14,
        fontWeight: 'bold',
        backgroundColor: 'rgba(247,247,247,1.0)',
    },
    loading: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center'
    },
    actionButtonText: {
        fontSize: 13,
        fontFamily: 'GillSans-Italic'
    }
});
