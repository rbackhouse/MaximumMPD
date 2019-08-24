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
import { Text, View, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Modal, Picker, PickerIOS, Dimensions } from 'react-native';
import { SearchBar, FormLabel, FormInput, Button } from 'react-native-elements'

import ActionButton from 'react-native-action-button';

import Icon from 'react-native-vector-icons/Ionicons';
import FAIcon from 'react-native-vector-icons/FontAwesome';

import MPDConnection from './MPDConnection';
import Base64 from './Base64';

class RandomPlaylistTypeModal extends React.Component {
    state = {
        type: "artist",
        value: ""
    }

    onOk() {
        this.props.setRandomPlaylistType(this.state.type, this.state.value);
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
                        <Text style={{fontSize: 20, fontFamily: 'GillSans-Italic'}}>Random Playlist Type</Text>
                    </View>
                    <Picker
                        selectedValue={this.state.type}
                        onValueChange={(itemValue, itemIndex) => this.setState({type: itemValue})}
                        >
                        <Picker.Item label="By Artist" value="artist" />
                        <Picker.Item label="By Album" value="album" />
                        <Picker.Item label="By Title" value="title" />
                        <Picker.Item label="By Genre" value="genre" />
                    </Picker>
                    <FormLabel>Value</FormLabel>
                    <FormInput value={this.state.value} onChangeText={(value) => this.setState({value})} style={styles.entryField}></FormInput>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' }}>
                        <Button
                            onPress={() => {this.onOk();}}
                            title="Ok"
                            icon={{name: 'check', type: 'font-awesome'}}
                            raised={true}
                            rounded
                            backgroundColor={'#3396FF'}
                        />
                        <Button
                            onPress={() => {this.onCancel();}}
                            title="Cancel"
                            icon={{name: 'times-circle', type: 'font-awesome'}}
                            raised={true}
                            rounded
                            backgroundColor={'#3396FF'}
                        />
                    </View>

                </View>
            </Modal>
        );
    }
}

export default class PlaylistScreen extends React.Component {
    static navigationOptions = {
        title: 'Playlist'
    };

    constructor(props) {
        super(props);
        this.state = {
          playlist: [],
          status: undefined,
          selected: (new Map(): Map<string, boolean>),
          loading: false,
          isPlaying: false,
          currentSongId: -1,
          modalVisible: false,
          totalTime: "",
          isEditing: false
        };
    }

    componentDidMount() {
        this.load();
        this.onStatus = MPDConnection.getEventEmitter().addListener(
            "OnStatus",
            (status) => {
                this.setState({status: status, isPlaying: status.state === "play"});
                this.setState((state) => {
                    const selected = new Map(state.selected);
                    for (let key of selected.keys()) {
                        selected.set(key, false);
                    }
                    if (status.currentsong) {
                        const curr = status.currentsong;
                        selected.set(curr.artist+curr.album+curr.title, true);
                    }
                    return {selected};
                });
                if (status.songid && status.consume === '1') {
                    if (this.state.currentSongId !== status.songid) {
                        this.load();
                    }
                }
                this.setState({currentSongId: status.songid});
            }
        );
        this.didFocusSubscription = this.props.navigation.addListener(
            'didFocus',
            payload => {
                this.load();
            }
        );
    }

    componentWillUnmount() {
        this.didFocusSubscription.remove();
        this.onStatus.remove();
    }

    onPrevious() {
        MPDConnection.current().previous();
    }

    onPlayPause() {
        this.state.isPlaying ? MPDConnection.current().pause() : MPDConnection.current().play();
    }

    onNext() {
        MPDConnection.current().next();
    }

    onStop() {
        MPDConnection.current().stop();
    }

    onRepeat() {
    }

    search = (text) => {
    }

    onPress(item) {
        if (this.state.isEditing) {
            Alert.alert(
                "Remove Song from Queue",
                "Are you sure you want to remove ''"+item.title+"'' ?",
                [
                    {text: 'OK', onPress: () => {
                        this.setState({loading: true});
                        MPDConnection.current().removeSong(item.id)
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
        } else {
            MPDConnection.current().play(item.id);
        }
    }

    onRandom(type, value) {
        console.log("type "+ type+" value "+value);
        this.setState({loading: true, modalVisible: false});
        MPDConnection.current().clearPlayList();
        MPDConnection.current().randomPlayList(type, value)
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
    }

    onClear() {
        MPDConnection.current().clearPlayList();
        this.load();
    }

    onEdit() {
        this.state.isEditing ? this.setState({isEditing: false}) : this.setState({isEditing: true})
    }

    load() {
        this.setState({loading: true});

        MPDConnection.current().getPlayListInfo()
        .then((playlist) => {
            this.setState({loading: false});
            this.setState({playlist: playlist});

            let totalTime = 0;
            playlist.forEach((entry) => {
                totalTime += Math.floor(parseInt(entry.rawTime));
            });
            if (totalTime > 0) {
                const hours = Math.floor(totalTime / 3600)
                if (hours > 0) {
                    totalTime %= 3600;
                }
                const minutes = Math.floor(totalTime / 60);
        		let seconds = totalTime - minutes * 60;
        		seconds = (seconds < 10 ? '0' : '') + seconds;
                if (hours > 0) {
        		    this.setState({totalTime: hours+"h "+minutes+"m "+seconds+"s"});
                } else {
                    this.setState({totalTime: minutes+"m "+seconds+"s"});
                }
            } else {
                this.setState({totalTime: ""});
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

    doRandom() {
        if (MPDConnection.current().isRandomPlaylistByType()) {
            this.setState({modalVisible: true});
        } else {
            this.onRandom();
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
        let timeTrack = "Time: "+item.time;
        let bitrate;
        let audio;
        const isSelected = this.state.selected.get(item.artist+item.album+item.title)
        const selected = isSelected ? "flex" : "none";
        const editSelectIcon = this.state.isEditing === true ? "ios-trash" : "ios-musical-notes";

        if (isSelected && this.state.status && this.state.status.time) {
            let time = Math.floor(parseInt(this.state.status.time));
            let minutes = Math.floor(time / 60);
            let seconds = time - minutes * 60;
            seconds = (seconds < 10 ? '0' : '') + seconds;
            let elapsed = minutes+":"+seconds;
            timeTrack = "Time: "+item.time+" Elapsed: "+elapsed;
            bitrate = "Bitrate: "+this.state.status.bitrate +" kbps";
            audio = "Format: "+this.state.status.audio;
        }
        return (
            <TouchableOpacity onPress={this.onPress.bind(this, item)}>
                <View style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}>
                    <Icon name={editSelectIcon} size={20} color="black" style={{ paddingLeft: 20, paddingRight: 20 }}/>
                    <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-evenly', alignItems: 'stretch', padding: 5}}>
                        {item.artist !== "" &&
                            <Text style={styles.item}>{item.artist}</Text>
                        }
                        {item.album !== "" &&
                            <Text style={styles.item}>{item.album}</Text>
                        }
                        <Text style={styles.item}>{item.title}</Text>
                        <Text style={styles.item}>{timeTrack}</Text>
                        {bitrate != undefined &&
                            <Text style={styles.item}>{bitrate}</Text>
                        }
                        {audio != undefined &&
                            <Text style={styles.item}>{audio}</Text>
                        }
                    </View>
                    <Icon name="ios-checkmark" size={30} color="black" style={{ display: selected, paddingLeft: 20, paddingRight: 20 }}/>
                </View>
            </TouchableOpacity>
        );
    };

    render() {
        const {height, width} = Dimensions.get('window');
        let actionButtonSize = 40;
        if (height < 570) {
            actionButtonSize = 30;
        }
        const playPauseIcon = this.state.isPlaying == true ? "pause" : "play";
        const playPauseLabel = this.state.isPlaying == true ? "Pause" : "Play";
        return (
            <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'stretch' }}>
                <View style={{flex: .1, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{flex: 1, justifyContent: 'center'}}>
                        <Text style={{fontSize: 15,fontFamily: 'GillSans-Italic', paddingLeft: 10}}>
                            Total : {this.state.playlist.length}   Time : {this.state.totalTime}
                        </Text>
                    </View>
                </View>
                <FlatList
                    data={this.state.playlist}
                    renderItem={this.renderItem}
                    renderSectionHeader={({section}) => <Text style={styles.sectionHeader}>{section.title}</Text>}
                    keyExtractor={item => ""+item.id}
                    ItemSeparatorComponent={this.renderSeparator}
                    extraData={this.state.selected}
                />
                {this.state.loading &&
                    <View style={styles.loading}>
                        <ActivityIndicator size="large" color="#0000ff"/>
                    </View>
                }
                <ActionButton buttonColor="rgba(231,76,60,1)">
                    <ActionButton.Item size={actionButtonSize} buttonColor='#3498db' title="Edit/Select" textStyle={styles.actionButtonText} onPress={this.onEdit.bind(this)}>
                        <FAIcon name="edit" size={15} color="#e6e6e6" />
                    </ActionButton.Item>
                    <ActionButton.Item size={actionButtonSize} buttonColor='#3498db' title="Random Playlist" textStyle={styles.actionButtonText} onPress={() => this.doRandom()}>
                        <FAIcon name="random" size={15} color="#e6e6e6" />
                    </ActionButton.Item>
                    <ActionButton.Item size={actionButtonSize} buttonColor='#1abc9c' title="Clear Queue" textStyle={styles.actionButtonText} onPress={this.onClear.bind(this)}>
                        <FAIcon name="eraser" size={15} color="#e6e6e6" />
                    </ActionButton.Item>
                    <ActionButton.Item size={actionButtonSize} buttonColor='#9b59b6' title="Previous" textStyle={styles.actionButtonText} onPress={this.onPrevious.bind(this)}>
                        <FAIcon name="fast-backward" size={15} color="#e6e6e6" />
                    </ActionButton.Item>
                    <ActionButton.Item size={actionButtonSize} buttonColor='#3498db' title="Stop" textStyle={styles.actionButtonText} onPress={this.onStop.bind(this)}>
                        <FAIcon name="stop" size={12} color="#e6e6e6" />
                    </ActionButton.Item>
                    <ActionButton.Item size={actionButtonSize} buttonColor='#1abc9c' title="Play/Pause" textStyle={styles.actionButtonText} onPress={this.onPlayPause.bind(this)}>
                        <FAIcon name={playPauseIcon} size={15} color="#e6e6e6" />
                    </ActionButton.Item>
                    <ActionButton.Item size={actionButtonSize} buttonColor='#9b59b6' title="Next" textStyle={styles.actionButtonText} onPress={this.onNext.bind(this)}>
                        <FAIcon name="fast-forward" size={15} color="#e6e6e6" />
                    </ActionButton.Item>
                </ActionButton>
                <RandomPlaylistTypeModal visible={this.state.modalVisible} setRandomPlaylistType={(type, value) => {this.onRandom(type, value)}} onCancel={() => this.setState({modalVisible: false})}></RandomPlaylistTypeModal>
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
    button: {
        width: 35,
        height: 35,
        backgroundColor: '#3396FF',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 50
    },
    tabBar: {
        paddingLeft: 20,
        paddingRight: 20,
        paddingTop: 10,
        flexDirection: 'row',
        width: "85%"
    },
    tabBarButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    actionButtonIcon: {
        fontSize: 20,
        height: 22,
        color: 'white',
    },
    actionButtonText: {
        fontSize: 13,
        fontFamily: 'GillSans-Italic'
    },
    entryField: {
        width: 150,
        height: 30,
        margin: 15,
        borderColor: '#e3e5e5',
        borderWidth: 1
    }
});
