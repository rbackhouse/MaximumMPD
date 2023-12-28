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
import { Text, View, FlatList, TouchableOpacity, ActivityIndicator, Alert, Image, Modal } from 'react-native';
import { SearchBar, Input, Button } from "@rneui/themed";
import Icon from 'react-native-vector-icons/Ionicons';
import FAIcon from 'react-native-vector-icons/FontAwesome';
import EntypoIcon from 'react-native-vector-icons/Entypo';
import ActionButton from 'react-native-action-button';

import MPDConnection from './MPDConnection';
import NewPlaylistModal from './NewPlaylistModal';
import { StyleManager } from './Styles';
import SeachUtil from './SeachUtil';

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
        const styles = StyleManager.getStyles("playlistEditorStyles");
        const common = StyleManager.getStyles("styles");
        const visible = this.props.visible;
        return (
            <Modal
                animationType="fade"
                transparent={true}
                visible={visible}
                onRequestClose={() => {
            }}>
                <View style={styles.dialog1}>
                    <View style={styles.dialog2}>
                        <Text style={styles.dialogtext}>Add a Stream URL</Text>
                    </View>
                    <Input label="Name" autoCapitalize="none" onChangeText={(streamName) => this.setState({streamName: streamName})} style={styles.entryField} inputStyle={styles.label} labelStyle={styles.label}></Input>
                    <Input label="Stream URL" autoCapitalize="none" onChangeText={(url) => this.setState({streamURL: url})} style={styles.entryField} inputStyle={styles.label} labelStyle={styles.label}></Input>
                    <View style={styles.dialog3}>
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
            text = SeachUtil.convert(text);
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
        const common = StyleManager.getStyles("styles");
        return (
            <View
                style={common.separator}
            />
        );
    };

    renderItem = ({item}) => {
        const styles = StyleManager.getStyles("playlistEditorStyles");
        const common = StyleManager.getStyles("styles");
        return (
            <TouchableOpacity onPress={this.onPress.bind(this, item)}>
                <View style={common.container3}>
                    <Icon name="ios-list" size={20} style={common.icon}/>
                    <View style={common.container4}>
                        <Text style={styles.item}>{item}</Text>
                    </View>
                    <EntypoIcon name="dots-three-horizontal" size={20} style={common.icon}/>                    
                </View>
            </TouchableOpacity>
        );
    };

    render() {
        const styles = StyleManager.getStyles("playlistEditorStyles");
        const common = StyleManager.getStyles("styles");
        return (
            <View style={common.container1}>
                <View style={common.container2}>
                    <View style={common.flex75}>
                        <SearchBar
                            clearIcon
                            lightTheme
                            round
                            platform="ios"
                            cancelButtonTitle="Cancel"
                            placeholder='Search'
                            onChangeText={this.search}
                            value={this.state.searchValue}
                            containerStyle={common.searchbarContainer}
                            inputContainerStyle={common.searchbarInputContainer}
                            inputStyle={common.searchbarInput}
                    />
                    </View>
                    <View style={common.flex25}>
                        <Text style={common.text}>
                            Total : {this.state.playlists.length}
                        </Text>
                    </View>
                </View>
                <View style={common.container4}>
                <FlatList
                    data={this.state.playlists}
                    renderItem={this.renderItem}
                    renderSectionHeader={({section}) => <Text style={common.sectionHeader}>{section.title}</Text>}
                    keyExtractor={item => item}
                    ItemSeparatorComponent={this.renderSeparator}
                />
                </View>
                {this.state.loading &&
                    <View style={common.loading}>
                        <ActivityIndicator size="large" color="#0000ff"/>
                    </View>
                }
                <NewPlaylistModal visible={this.state.modalVisible} onSet={(name) => {this.createNewPlaylist(name)}} onCancel={() => this.setState({modalVisible: false})}></NewPlaylistModal>
                <AddStreamURLModal visible={this.state.addStreamURLVisible} onSet={(name, url) => {this.addStreamURL(name, url)}} onCancel={() => this.setState({addStreamURLVisible: false})}></AddStreamURLModal>
                <ActionButton buttonColor="rgba(231,76,60,1)" hideShadow={true}>
                    <ActionButton.Item buttonColor='#1abc9c' title="Add Stream URL" size={40} textStyle={common.actionButtonText} onPress={() => {this.setState({addStreamURLVisible: true});}}>
                        <FAIcon name="plus-square" size={15} color="#e6e6e6" />
                    </ActionButton.Item>
                    <ActionButton.Item buttonColor='#9b59b6' title="Playlist from Queue" size={40} textStyle={common.actionButtonText} onPress={() => {this.fromQueue();}}>
                        <FAIcon name="plus-square" size={15} color="#e6e6e6" />
                    </ActionButton.Item>
                </ActionButton>
            </View>
        );
    }
}
