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
import { Text, View, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image, Modal } from 'react-native';
import { SearchBar, Input, Button } from "react-native-elements";
import Icon from 'react-native-vector-icons/Ionicons';
import FAIcon from 'react-native-vector-icons/FontAwesome';
import ActionButton from 'react-native-action-button';

import MPDConnection from './MPDConnection';
import Base64 from './Base64';
import NewPlaylistModal from './NewPlaylistModal';

class AddStreamURLModal extends React.Component {
    state = {
        streamName: "",
        streamURL: ""
    }

    onOk() {
        if (this.state.streamName !== "" && this.state.streamURL != "") {
            const valid = /^(ftp|http|https):\/\/[^ "]+$/.test(this.state.streamURL);
            if (valid) {
                this.props.onSet(this.state.streamName, this.state.streamURL);
            } else {
                Alert.alert(
                    "Invalid Stream URL",
                    "Stream URL ["+this.state.streamURL+"] is invalid"
                );
            }
        }
    }

    onCancel(visible) {
        this.props.onCancel();
    }

    render() {
        const visible = this.props.visible;
        return (
            <Modal
                animationType="fade"
                transparent={false}
                visible={visible}
                onRequestClose={() => {
            }}>
                <View style={{marginTop: 22, flex: .6, flexDirection: 'column', justifyContent: 'space-around'}}>
                    <View style={{ flex: .3, flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                        <Text style={{fontSize: 20, fontFamily: 'GillSans-Italic'}}>Add a Stream URL</Text>
                    </View>
                    <Input label="Name" autoCapitalize="none" onChangeText={(streamName) => this.setState({streamName: streamName})} style={styles.entryField}></Input>
                    <Input label="Stream URL" autoCapitalize="none" onChangeText={(url) => this.setState({streamURL: url})} style={styles.entryField}></Input>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' }}>
                        <Button
                            onPress={() => {this.onOk();}}
                            title="Ok"
                            icon={{name: 'check',  size: 15, type: 'font-awesome'}}
                            raised={true}
                            type="outline"
                        />
                        <Button
                            onPress={() => {this.onCancel();}}
                            title="Cancel"
                            icon={{name: 'times-circle',  size: 15, type: 'font-awesome'}}
                            raised={true}
                            type="outline"
                        />
                    </View>

                </View>
            </Modal>
        );
    }
}

export default class PlaylistEditor extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
          searchValue: "",
          playlists: [],
          fullset: [],
          loading: false,
          modalVisible: false,
          playlistFromQueue: false,
          addStreamURLVisible: false
        };
    }

    componentDidMount() {
        const { navigation } = this.props;
        this.load();
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

        MPDConnection.current().listPlayLists()
        .then((playlists) => {
            this.setState({loading: false});
            this.setState({playlists: playlists, fullset: playlists});
        })
        .catch((err) => {
            this.setState({loading: false});
            Alert.alert(
                "MPD Error",
                "Error : "+err
            );
        });
    }

    search = (text) => {
        if (text.length > 0) {
            let filtered = this.state.fullset.filter((playlist) => {
                return playlist.toLowerCase().indexOf(text.toLowerCase()) > -1;
            });
            this.setState({playlists: filtered, searchValue: text});
        } else {
            this.setState({playlists: this.state.fullset, searchValue: text});
        }
    }

    onPress(item) {
        const { navigation } = this.props;
        navigation.navigate('PlaylistDetails', {playlist: item, isNew: false});
    }

    fromQueue() {
        this.setState({loading: true});

        MPDConnection.current().getPlayListInfo()
        .then((playlist) => {
            this.setState({loading: false});

            if (playlist.length > 0) {
                this.setState({modalVisible: true, playlistFromQueue: true});
            } else {
                Alert.alert(
                    "MPD Error",
                    "Cannot create Playlist from an Empty Queue"
                );
            }
        })
        .catch((err) => {
            this.setState({loading: false});
            Alert.alert(
                "MPD Error",
                "Error : "+err
            );
        });
    }

    createNewPlaylist(name) {
        this.setState({modalVisible: false});
        if (this.state.playlistFromQueue) {
            this.setState({loading: true});

            MPDConnection.current().savePlayList(name)
            .then(() => {
                this.setState({loading: false});
                this.load();
                Alert.alert(
                    "Playlist Created",
                    "Playlist "+name+" created from current queue"
                );
            })
            .catch((err) => {
                this.setState({loading: false});
                Alert.alert(
                    "MPD Error",
                    "Error : "+err
                );
            });
        } else {
            const { navigation } = this.props;
            navigation.navigate('PlaylistDetails', {playlist: name, isNew: true});
        }
    }

    addStreamURL(name, url) {
        this.setState({addStreamURLVisible: false});
        if (name !== "" && url !== "") {
            this.setState({loading: true});
            MPDConnection.current().addSongToNamedPlayList(url, "Stream_"+name)
            .then(() => {
                this.setState({loading: false});
                this.load();
            })
            .catch((err) => {
                this.setState({loading: false});
            });
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
                    <Icon name="ios-list" size={20} color="black" style={{ paddingLeft: 20, paddingRight: 20 }}/>
                    <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-evenly', alignItems: 'stretch', padding: 5}}>
                        <Text style={styles.item}>{item}</Text>
                    </View>
                    <Icon name="ios-more" size={20} color="black" style={{ paddingLeft: 20, paddingRight: 20 }}/>
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
                            platform="ios"
                            cancelButtonTitle="Cancel"
                            placeholder='Search'
                            onChangeText={this.search}
                            value={this.state.searchValue}
                            containerStyle={{backgroundColor: 'white'}}
                            inputContainerStyle={{backgroundColor: '#EBECEC'}}
                            inputStyle={{backgroundColor: '#EBECEC'}}
                    />
                    </View>
                    <View style={{flex: .25}}>
                        <Text style={{fontSize: 15,fontFamily: 'GillSans-Italic'}}>
                            Total : {this.state.playlists.length}
                        </Text>
                    </View>
                </View>
                <FlatList
                    data={this.state.playlists}
                    renderItem={this.renderItem}
                    renderSectionHeader={({section}) => <Text style={styles.sectionHeader}>{section.title}</Text>}
                    keyExtractor={item => item}
                    ItemSeparatorComponent={this.renderSeparator}
                />
                {this.state.loading &&
                    <View style={styles.loading}>
                        <ActivityIndicator size="large" color="#0000ff"/>
                    </View>
                }
                <NewPlaylistModal visible={this.state.modalVisible} onSet={(name) => {this.createNewPlaylist(name)}} onCancel={() => this.setState({modalVisible: false})}></NewPlaylistModal>
                <AddStreamURLModal visible={this.state.addStreamURLVisible} onSet={(name, url) => {this.addStreamURL(name, url)}} onCancel={() => this.setState({addStreamURLVisible: false})}></AddStreamURLModal>
                <ActionButton buttonColor="rgba(231,76,60,1)">
                    <ActionButton.Item buttonColor='#1abc9c' title="Add Stream URL" size={40} textStyle={styles.actionButtonText} onPress={() => {this.setState({addStreamURLVisible: true});}}>
                        <FAIcon name="plus-square" size={15} color="#e6e6e6" />
                    </ActionButton.Item>
                    <ActionButton.Item buttonColor='#9b59b6' title="Playlist from Queue" size={40} textStyle={styles.actionButtonText} onPress={() => {this.fromQueue();}}>
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
        padding: 10
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
