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
import { Text, View, Modal, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SearchBar, Input, Button } from "react-native-elements";
import Icon from 'react-native-vector-icons/Ionicons';

import MPDConnection from './MPDConnection';

export default class NewPlaylistModal extends React.Component {
    state = {
        loading: false,
        playlistName: "",
        searchValue: "",
        playlists: [],
        fullset: []
    }

    constructor(props) {
        super(props);
    }

    load() {
        this.setState({loading: true});
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
                    <Icon name="ios-add-circle" size={20} color="black" style={{ paddingLeft: 20, paddingRight: 20 }}/>
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
                <View style={{marginTop: 25, flex: 1, flexDirection: 'column', justifyContent: 'space-around'}}>
                    <View style={{ flex: .1, justifyContent: 'flex-start', alignItems: 'stretch', marginBottom: 20 }}>
                        <View style={{ flex: .5, flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                            <Text style={{fontSize: 20, fontFamily: 'GillSans-Italic'}}>Select Playlist</Text>
                        </View>
                        <View style={{ flex: .5, flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                            <Text style={{fontSize: 16, fontFamily: 'GillSans-Italic'}}>Pick from List OR Enter a new name below</Text>
                        </View>
                    </View>
                    <View style={{ flex: .6, justifyContent: 'flex-start', alignItems: 'stretch'}}>
                        <View style={{flex: .1, flexDirection: 'row', alignItems: 'center'}}>
                            <View style={{flex: 1}}>
                                <SearchBar
                                    round
                                    clearIcon
                                    lightTheme
                                    cancelButtonTitle="Cancel"
                                    placeholder='Search'
                                    onChangeText={this.search}
                                    value={this.state.searchValue}
                                    containerStyle={{backgroundColor: "#fff"}}
                                    inputContainerStyle={{backgroundColor: '#EBECEC'}}
                                    inputStyle={{backgroundColor: "#EBECEC"}}                                    
                                />
                            </View>
                        </View>
                        <FlatList
                            data={this.state.playlists}
                            renderItem={this.renderItem}
                            renderSectionHeader={({section}) => <Text style={styles.sectionHeader}>{section.title}</Text>}
                            keyExtractor={item => item}
                            ItemSeparatorComponent={this.renderSeparator}
                        />
                    </View>
                    <View style={{ flex: .1, justifyContent: 'flex-start', alignItems: 'stretch', marginTop: 15}}>
                        <Input label="Create New Playlist" autoCapitalize="none" onChangeText={(playlistName) => this.setState({playlistName})} style={styles.entryField}></Input>
                    </View>
                    <View style={{ flex: .2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' }}>
                        <Button
                            onPress={() => {this.onOk();}}
                            title="Create"
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
                    {this.state.loading &&
                        <View style={styles.loading}>
                            <ActivityIndicator size="large" color="#0000ff"/>
                        </View>
                    }
                </View>
            </Modal>
        );
    }
}

const styles = StyleSheet.create({
    entryField: {
        width: 150,
        height: 30,
        margin: 15,
        borderColor: '#e3e5e5',
        borderWidth: 1
    },
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
    }
});
