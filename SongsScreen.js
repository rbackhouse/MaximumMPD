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
import { Text, View, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SearchBar } from "react-native-elements";

import Icon from 'react-native-vector-icons/Ionicons';
import FAIcon from 'react-native-vector-icons/FontAwesome';

import ActionButton from 'react-native-action-button';

import { Button } from 'react-native-elements'

import MPDConnection from './MPDConnection';
import Base64 from './Base64';

export default class SongsScreen extends React.Component {
    static navigationOptions = ({ navigation }) => {
        return {
            title: "Songs ("+navigation.getParam('album')+")"
        };
    };

    constructor(props) {
        super(props);
        this.state = {
          songs: [],
          loading: false
        };
    }

    componentDidMount() {
        const { navigation } = this.props;
        const artist = navigation.getParam('artist');
        const album = navigation.getParam('album');
        this.playlistMode = navigation.getParam('playlistMode', false);
        this.playlistName = navigation.getParam('playlistName');

        this.setState({loading: true});

        MPDConnection.current().getSongsForAlbum(
            album,
            artist,
            (songs) => {
                this.setState({loading: false});
                this.setState({songs: songs});
            },
            (err) => {
                this.setState({loading: false});
                Alert.alert(
                    "MPD Error",
                    "Error : "+err
                );
            }
        );
        this.onDisconnect = MPDConnection.getEventEmitter().addListener(
            "OnDisconnect",
            () => {
                this.setState({songs: []});
                this.props.navigation.popToTop();
            }
        );
    }

    componentWillUnmount() {
        this.onDisconnect.remove();
    }

    addAll() {
        const { navigation } = this.props;
        const artist = navigation.getParam('artist');
        const album = navigation.getParam('album');

        this.setState({loading: true});

        if (this.playlistMode === true) {
            MPDConnection.current().addAlbumToNamedPlayList(
                album,
                artist,
                this.playlistName,
                () => {
                    this.setState({loading: false});
                },
                (err) => {
                    this.setState({loading: false});
                    Alert.alert(
                        "MPD Error",
                        "Error : "+err
                    );
                }
            );
        } else {
            MPDConnection.current().addAlbumToPlayList(
                album,
                artist,
                () => {
                    this.setState({loading: false});
                },
                (err) => {
                    this.setState({loading: false});
                    Alert.alert(
                        "MPD Error",
                        "Error : "+err
                    );
                }
            );
        }
    }

    search = (text) => {
    }

    onPress(item) {
        this.setState({loading: true});

        if (this.playlistMode === true) {
            MPDConnection.current().addSongToNamedPlayList(
                decodeURIComponent(Base64.atob(item.b64file)),
                this.playlistName,
                () => {
                    this.setState({loading: false});
                },
                (err) => {
                    this.setState({loading: false});
                    Alert.alert(
                        "MPD Error",
                        "Error : "+err
                    );
                }
            );

        } else {
            MPDConnection.current().addSongToPlayList(
                decodeURIComponent(Base64.atob(item.b64file)),
                () => {
                    this.setState({loading: false});
                },
                (err) => {
                    this.setState({loading: false});
                    Alert.alert(
                        "MPD Error",
                        "Error : "+err
                    );
                }
            );
        }
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

    renderItem = ({item}) => {
        return (
            <TouchableOpacity onPress={this.onPress.bind(this, item)}>
                <View style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}>
                    <Icon name="ios-musical-notes" size={20} color="black" style={{ paddingLeft: 20, paddingRight: 20 }}/>
                    <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-evenly', alignItems: 'stretch', padding: 5}}>
                        <Text style={styles.item}>{item.title}</Text>
                        <Text style={styles.item}>Track: {item.track} Time: {item.time}</Text>
                    </View>
                    <Icon name="ios-add" size={20} color="black" style={{ paddingLeft: 20, paddingRight: 20 }}/>
                </View>
            </TouchableOpacity>
        );
    };

    render() {
        const addAllButtonTitle = this.playlistMode === true ? "Add to Playlist" : "Add to Queue";

        return (
            <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'stretch' }}>
                <View style={{flex: .1, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{flex: 1, justifyContent: 'center'}}>
                        <Text style={{fontSize: 15,fontFamily: 'GillSans-Italic', paddingLeft: 10}}>
                            Songs : {this.state.songs.length}
                        </Text>
                    </View>
                </View>
                <FlatList
                    data={this.state.songs}
                    renderItem={this.renderItem}
                    renderSectionHeader={({section}) => <Text style={styles.sectionHeader}>{section.title}</Text>}
                    keyExtractor={item => item.b64file}
                    ItemSeparatorComponent={this.renderSeparator}
                />
                {this.state.loading &&
                    <View style={styles.loading}>
                        <ActivityIndicator size="large" color="#0000ff"/>
                    </View>
                }
                <ActionButton buttonColor="rgba(231,76,60,1)">
                    <ActionButton.Item buttonColor='#3498db' title={addAllButtonTitle} size={40} textStyle={styles.actionButtonText} onPress={() => {this.addAll();}}>
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
        fontFamily: 'GillSans-Italic',
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
