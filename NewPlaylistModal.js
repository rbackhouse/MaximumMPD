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
import { Text, View, Modal, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SearchBar, Input, Button } from "react-native-elements";
import Icon from 'react-native-vector-icons/Ionicons';

import MPDConnection from './MPDConnection';
import { styles as common, newPlaylistStyles as styles, iconColor } from './Styles';

export default class NewPlaylistModal extends React.Component {
    state = {
        loading: false,
        playlistName: "",
        searchValue: "",
        playlists: [],
        fullset: [],
        createDisabled: true
    }

    constructor(props) {
        super(props);
    }

    load() {
        this.setState({loading: true, createDisabled: true, playlistName: ""});
        MPDConnection.current().listPlayLists()
        .then((playlists) => {
            this.setState({loading: false, playlists: playlists, fullset: playlists, playlistName: "", searchValue: ""});
        })
        .catch((err) => {
            this.setState({loading: false});
            Alert.alert(
                "MPD Error",
                "Error : "+err
            );
        });
    }

    onOk() {
        if (this.state.playlistName !== "") {
            this.props.onSet(this.state.playlistName.trim(), this.props.selectedItem);
        }
    }

    onCancel(visible) {
        this.props.onCancel();
    }

    onPress(item) {
        this.props.onSet(item, this.props.selectedItem);
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

    renderSeparator = () => {
        return (
            <View
                style={common.separator}
            />
        );
    };

    renderItem = ({item}) => {
        return (
            <TouchableOpacity onPress={this.onPress.bind(this, item)}>
                <View style={common.container3}>
                    <Icon name="ios-list" size={20} color={iconColor} style={common.icon}/>
                    <View style={common.container4}>
                        <Text style={styles.item}>{item}</Text>
                    </View>
                    <Icon name="ios-add-circle" size={20} color={iconColor} style={common.icon}/>
                </View>
            </TouchableOpacity>
        );
    };

    render() {
        const visible = this.props.visible;
        const value = this.props.value;
        return (
            <Modal
                animationType="fade"
                transparent={false}
                visible={visible}
                onShow={() => {this.load();}}
            >
                <View style={styles.container3}>
                    <View style={styles.container4}>
                        <View style={styles.container5}>
                            <Text style={styles.text1}>Select or Create New Playlist</Text>
                        </View>
                        <View style={styles.container6}>
                            <Text style={styles.text2}>Provide name below OR Select from List</Text>
                        </View>
                    </View>
                    <View style={styles.container7}>
                        <Input placeholder="Click here to enter name" label="Create New Playlist" autoCapitalize="none" onChangeText={(playlistName) => { this.setState({playlistName}); playlistName.length < 1 ?  this.setState({createDisabled: true}) : this.setState({createDisabled: false}); }} style={styles.entryField} inputStyle={styles.label} labelStyle={styles.label}></Input>
                    </View>
                    <View style={styles.container8}>
                        <Button
                            onPress={() => {this.onOk();}}
                            title="Create"
                            icon={{name: 'check',  size: 15, type: 'font-awesome'}}
                            raised={true}
                            type="outline"
                            disabled={this.state.createDisabled}
                        />
                        <Button
                            onPress={() => {this.onCancel();}}
                            title="Cancel"
                            icon={{name: 'times-circle',  size: 15, type: 'font-awesome'}}
                            raised={true}
                            type="outline"
                        />
                    </View>
                    <View style={styles.container9}>
                        <View style={styles.container10}>
                            <View style={common.flex75}>
                                <SearchBar
                                    round
                                    clearIcon
                                    lightTheme
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
                                <Text style={styles.text3}>
                                    Total : {this.state.playlists.length}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.container13}>
                        <FlatList
                            data={this.state.playlists}
                            renderItem={this.renderItem}
                            renderSectionHeader={({section}) => <Text style={common.sectionHeader}>{section.title}</Text>}
                            keyExtractor={item => item}
                            ItemSeparatorComponent={this.renderSeparator}
                        />
                        </View>
                    </View>
                    {this.state.loading &&
                        <View style={common.loading}>
                            <ActivityIndicator size="large" color="#0000ff"/>
                        </View>
                    }
                </View>
            </Modal>
        );
    }
}
