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
import { View, Picker, Modal, Text, Alert, Linking, TextInput, Switch, Keyboard, TouchableWithoutFeedback } from 'react-native';
import SettingsList from 'react-native-settings-list';
import { Input, Button } from 'react-native-elements'
import MPDConnection from './MPDConnection';
import AlbumArt from './AlbumArt';
import Config from './Config';
import { StyleManager, bgColor } from './Styles';

class AlbumArtModal extends React.Component {
    state = {
        albumart: false,
        status: 'Idle',
        downloadStatus: "",
        count: '',
        port: 8080,
        useHTTP: false,
        urlPrefix: "",
        filename: ""
    }

    onOk() {
        this.props.onOk();
    }

    componentDidMount() {
        this.setState({count: ""+AlbumArt.getQueueSize()});
        this.onAlbumArtStart = AlbumArt.getEventEmitter().addListener(
            "OnAlbumArtStart",
            (album) => {
                this.setState({count: ""+AlbumArt.getQueueSize(), status:"Started download of album art for "+album.name, downloadStatus: ""});
            }
        );
        this.OnAlbumArtStatus = AlbumArt.getEventEmitter().addListener(
            "OnAlbumArtStatus",
            (status) => {
                this.setState({status: status.album.artist+" : "+status.album.name, downloadStatus: "Size: "+status.size+"k "+status.percentageDowloaded+"% downloaded"});
            }
        );
        this.onAlbumArtEnd = AlbumArt.getEventEmitter().addListener(
            "OnAlbumArtEnd",
            (album) => {
                this.setState({status:"Completed download of album art for "+album.name, count: ""+AlbumArt.getQueueSize(), downloadStatus: ""});
            }
        );
        this.onAlbumArtError = AlbumArt.getEventEmitter().addListener(
            "OnAlbumArtError",
            (details) => {
                this.setState({status: details.album.artist+" : "+details.album.name+" "+details.err, count: ""+AlbumArt.getQueueSize(), downloadStatus:""});
            }
        );
        this.onAlbumArtComplete = AlbumArt.getEventEmitter().addListener(
            "OnAlbumArtComplete",
            (details) => {
                this.setState({status: "Complete", count: ""+AlbumArt.getQueueSize(), downloadStatus:""});
            }
        );
        AlbumArt.getOptions()
        .then((options) => {
            this.setState({albumart: options.enabled, useHTTP: options.useHTTP, port: options.port, urlPrefix: options.urlPrefix, filename: options.fileName});
        });
    }

    componentWillUnmount() {
        this.onAlbumArtStart.remove();
        this.OnAlbumArtStatus.remove();
        this.onAlbumArtEnd.remove();
        this.onAlbumArtError.remove();
        this.onAlbumArtComplete.remove();
    }

    clearAlbumArt() {
        Alert.alert(
            "Clear Album Art",
            "Are you sure you want to clear the Album Art Cache?",
            [
                {text: 'OK', onPress: () => {
                    AlbumArt.clearCache();
                }},
                {text: 'Cancel'}
            ]
        );
    }

    onAlbumArtChange(value) {
        this.setState({albumart: value});

        if (value === true) {
            AlbumArt.enable();
        } else {
            AlbumArt.disable();
        }
    }

    onUseHTTPSChange(value) {
        this.setState({useHTTP: value});
        AlbumArt.setUseHTTP(value);
    }

    onPortChange(value) {
        let port = parseInt(value);
        if (!isNaN(port)) {
            this.setState({port: port});
            AlbumArt.setHTTPSPort(port);
        }
    }

    onURLPrefixChange(value) {
        this.setState({urlPrefix: value});
        AlbumArt.setURLPrefix(value);
    }

    onFilenameChange(value) {
        this.setState({filename: value});
        AlbumArt.setFileName(value);
    }

    render() {
        const styles = StyleManager.getStyles("settingsStyles");
        const visible = this.props.visible;
        const queueText = "Queue : "+this.state.count;
        return (
            <Modal
                animationType="fade"
                transparent={false}
                visible={visible}
                onRequestClose={() => {
            }}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.container5}>
                <View style={styles.container6}>
                    <Text style={styles.text2}>Album Art</Text>
                </View>
                <View style={styles.container2}>
                    <View style={styles.flexStart}>
                        <Text style={styles.text1}>
                            Enable
                        </Text>
                    </View>
                    <View style={styles.flexEnd}>
                        <Switch
                            onValueChange={(value) => this.onAlbumArtChange(value)}
                            value={this.state.albumart}
                        />
                    </View>
                </View>
                <View style={styles.container2}>
                    <View style={styles.flexStart}>
                        <Text style={styles.text1}>
                            Use HTTP
                        </Text>
                    </View>
                    <View style={styles.flexEnd}>
                        <Switch
                            onValueChange={(value) => this.onUseHTTPSChange(value)}
                            value={this.state.useHTTP}
                        />
                    </View>
                </View>
                <View style={styles.container2}>
                    <View style={styles.flexStart}>
                        <Text style={styles.text1}>
                            HTTP Port
                        </Text>
                    </View>
                    <View style={styles.flexEnd}>
                        <TextInput keyboardType='number-pad' 
                                placeholder="HTTP Port"
                                onChangeText={(port) => this.onPortChange(port)}
                                defaultValue={""+this.state.port}
                                editable={this.state.useHTTP}
                                style={styles.textInput1} 
                                inputStyle={styles.label}>
                        </TextInput>
                    </View>
                </View>
                <View style={styles.container2}>
                    <View style={styles.flexStart}>
                        <Text style={styles.text1}>
                            HTTP URL Prefix
                        </Text>
                    </View>
                    <View style={styles.flexEnd}>
                        <TextInput keyboardType='default' 
                                placeholder="HTTP URL Prefix"
                                onChangeText={(urlPrefix) => this.onURLPrefixChange(urlPrefix)}
                                defaultValue={""+this.state.urlPrefix}
                                editable={this.state.useHTTP}
                                style={styles.textInput2} 
                                autoCapitalize='none'
                                inputStyle={styles.label}>
                        </TextInput>
                    </View>
                </View>
                <View style={styles.container2}>
                    <View style={styles.flexStart}>
                        <Text style={styles.text1}>
                            Album Art Filename
                        </Text>
                    </View>
                    <View style={styles.flexEnd}>
                        <TextInput keyboardType='default' 
                                placeholder="Album Art Filename"
                                onChangeText={(filename) => this.onFilenameChange(filename)}
                                defaultValue={""+this.state.filename}
                                editable={this.state.useHTTP}
                                style={styles.textInput2} 
                                autoCapitalize='none'
                                inputStyle={styles.label}>
                        </TextInput>
                    </View>
                </View>
                <View style={styles.container4}>
                    <View style={styles.flexStart}>
                        <Text style={styles.text1}>
                            Clear Cache
                        </Text>
                    </View>
                    <View style={styles.flexEnd}>
                        <Button
                            onPress={() => {this.clearAlbumArt();}}
                            title="Clear"
                            icon={{name: 'trash',  size: 15, type: 'font-awesome'}}
                            raised={true}
                            type="outline"
                        />
                    </View>
                </View>
                <View style={styles.flex2}>
                    <Text numberOfLines={1} ellipsizeMode='tail' style={styles.status}>{queueText}</Text>
                </View>
                <View style={styles.flex2}>
                    <Text numberOfLines={1} ellipsizeMode='tail' style={styles.status}>{this.state.status}</Text>
                </View>
                <View style={styles.flex2}>
                    <Text numberOfLines={1} ellipsizeMode='tail' style={styles.status}>{this.state.downloadStatus}</Text>
                </View>
                <View style={styles.container3}>
                    <Button
                        onPress={() => {this.onOk();}}
                        title="Ok"
                        icon={{name: 'check',  size: 15, type: 'font-awesome'}}
                        raised={true}
                        type="outline"
                    />
                </View>
            </View>
            </TouchableWithoutFeedback>
            </Modal>
        );
    }
}

class CrossfadeModal extends React.Component {
    state = {
        crossFade: 3
    }

    onOk() {
        this.props.onSet(this.state.crossFade);
    }

    onCancel(visible) {
        this.props.onCancel();
    }

    render() {
        const styles = StyleManager.getStyles("settingsStyles");
        const visible = this.props.visible;
        return (
            <Modal
                animationType="fade"
                transparent={false}
                visible={visible}
                onRequestClose={() => {
            }}>
                <View style={styles.container1}>
                    <View style={styles.flex3}>
                        <Text style={styles.text2}>Set Crossfade</Text>
                    </View>
                    <Input keyboardType='numeric' label="Crossfade (Seconds)" maxLength={5} onChangeText={(crossFade) => this.setState({crossFade})} inputStyle={styles.label} labelStyle={styles.label}></Input>
                    <View style={styles.flex1}>
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

class ReplayGainModal extends React.Component {
    state = {
        replayGain: ""
    }

    onOk() {
        this.props.onSet(this.state.replayGain);
    }

    onCancel(visible) {
        this.props.onCancel();
    }

    render() {
        const styles = StyleManager.getStyles("settingsStyles");
        const visible = this.props.visible;
        return (
            <Modal
                animationType="fade"
                transparent={false}
                visible={visible}
                onRequestClose={() => {
            }}>
                <View style={styles.container1}>
                    <View style={styles.flex3}>
                        <Text style={styles.text2}>Set Replay Gain</Text>
                    </View>
                    <Picker
                        itemStyle={styles.picker}
                        selectedValue={this.state.replayGain}
                        onValueChange={(itemValue, itemIndex) => this.setState({replayGain: itemValue})}>
                        <Picker.Item label="Off" value="off" />
                        <Picker.Item label="Track" value="track" />
                        <Picker.Item label="Album" value="album" />
                        <Picker.Item label="Auto" value="auto" />
                    </Picker>
                    <View style={styles.flex1}>
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

class AboutModal extends React.Component {
    onOk() {
        this.props.onOk();
    }

    render() {
        const styles = StyleManager.getStyles("settingsStyles");
        const visible = this.props.visible;
        return (
            <Modal
                animationType="fade"
                transparent={false}
                visible={visible}
                onRequestClose={() => {
            }}>
                <View style={styles.container1}>
                    <View style={styles.flex3}>
                        <Text style={styles.text2}>About Maximum MPD</Text>
                    </View>
                    <Text style={[styles.text1, {padding: 15}]}>Version: 3.4</Text>
                    <Text style={[styles.text1, {padding: 15}]}>Author: Richard Backhouse</Text>
                    <Text style={[styles.text1, {padding: 15}]}>Various Images provided by Icons8 (https://icons8.com)</Text>
                    <View style={styles.flex1}>
                        <Button
                            onPress={() => {this.onOk();}}
                            title="Ok"
                            icon={{name: 'check',  size: 15, type: 'font-awesome'}}
                            raised={true}
                            type="outline"
                        />
                        <Button
                            onPress={ ()=>{ Linking.openURL('http://rbackhouse.github.io/MaximumMPD.html')}}
                            title="Help"
                            icon={{name: 'question',  size: 15, type: 'font-awesome'}}
                            raised={true}
                            type="outline"
                        />
                    </View>
                </View>
            </Modal>
        );
    }
}

class MaxListSizeModal extends React.Component {
    state = {
        maxListSize: 0
    }

    onOk() {
        this.props.onSet(this.state.maxListSize);
    }

    onCancel(visible) {
        this.props.onCancel();
    }

    render() {
        const styles = StyleManager.getStyles("settingsStyles");
        const visible = this.props.visible;
        const value = this.props.value;
        return (
            <Modal
                animationType="fade"
                transparent={false}
                visible={visible}
                onRequestClose={() => {
            }}>
                <View style={styles.container1}>
                    <View style={styles.flex3}>
                        <Text style={styles.text2}>Set Crossfade</Text>
                    </View>
                    <Input keyboardType='numeric' label="Max List Size" maxLength={5} value={value} onChangeText={(maxListSize) => this.setState({maxListSize})} inputStyle={styles.label} labelStyle={styles.label}></Input>
                    <View style={styles.flex1}>
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

export default class SettingsScreen extends React.Component {
    static navigationOptions = {
        title: 'Settings'
    };

    state = {
        replayGain: "Off",
        replayGainVisible: false,
        crossfade: 3,
        crossfadeVisible: false,
        maxListSize: 0,
        maxListSizeVisible: false,
        shuffle: false,
        repeat: false,
        stopAftetSongPlayed: false,
        removeSongAfterPlay: false,
        randomPlaylistByType: false,
        albumartVisible: false,
        aboutVisible: false,
        sortAlbumsByDate: false,
        autoConnect: false,
        useDeviceVolume: false,
        useGridView: false,
        darkMode: false
    }

    componentDidMount() {
        Config.isSortAlbumsByDate()
        .then((sortAlbumsByDate) => {
            this.setState({sortAlbumsByDate: sortAlbumsByDate});
        });
        Config.isAutoConnect()
        .then((autoConnect) => {
            this.setState({autoConnect: autoConnect.autoConnect});
        });
        Config.isRandomPlaylistByType()
        .then((value) => {
            this.setState({randomPlaylistByType: value});
        });
        Config.isUseDeviceVolume()
        .then((value) => {
            this.setState({useDeviceVolume: value});
        });
        Config.isUseGrdiView()
        .then((value) => {
            this.setState({useGridView: value});
        });
        this.onConnect = MPDConnection.getEventEmitter().addListener(
            "OnConnect",
            () => {
                this.getStatus();
            }
        );
        this.onDisconnect = MPDConnection.getEventEmitter().addListener(
            "OnDisconnect",
            () => {
                console.log("settings disconnect");
                this.setState({
                    replayGain: "off",
                    crossfade: 0,
                    shuffle: false,
                    repeat: false,
                    stopAftetSongPlayed: false,
                    removeSongAfterPlay: false
                });
            }
        );
        if (MPDConnection.isConnected()) {
            this.getStatus();
        }
    }

    componentWillUnmount() {
        this.onConnect.remove();
        this.onDisconnect.remove();
    }

    getStatus() {
        MPDConnection.current().getStatus(
            (status) => {
                this.setState({
                    replayGain: status.replayGainStatus,
                    crossfade: status.xfade || 0,
                    shuffle: (status.random === '1') ? true : false,
                    repeat: (status.repeat === '1') ? true : false,
                    stopAftetSongPlayed: (status.single === '1') ? true : false,
                    removeSongAfterPlay: (status.consume === '1') ? true : false
                });
            },
            (err) => {
                Alert.alert(
                    "MPD Error",
                    "Error : "+err
                );
            }
        );
    }

    updateDB() {
        if (MPDConnection.isConnected()) {
            MPDConnection.current().update();
            Alert.alert(
                "DB Update",
                "DB update has started"
            );
        }
    }

    onDarkModeChange(value) {
        this.setState({darkMode: value});
        StyleManager.changeMode(value);
    }

    onShuffleChange(value) {
        this.setState({shuffle: value});
        if (MPDConnection.isConnected()) {
            MPDConnection.current().shuffle(value);
        }
    }

    onRepeatChange(value) {
        this.setState({repeat: value});
        if (MPDConnection.isConnected()) {
            MPDConnection.current().repeat(value);
        }
    }

    onRemoveSongAfterPlayChange(value) {
        this.setState({removeSongAfterPlay: value});
        if (MPDConnection.isConnected()) {
            MPDConnection.current().consume(value);
        }
    }

    onStopAftetSongPlayedChange(value) {
        this.setState({stopAftetSongPlayed: value});
        if (MPDConnection.isConnected()) {
            MPDConnection.current().single(value);
        }
    }

    onRandomPlaylistByTypeChange(value) {
        this.setState({randomPlaylistByType: value});
        Config.setRandomPlaylistByType(value);
    }

    onSortAlbumsByDateChange(value) {
        this.setState({sortAlbumsByDate: value});
        Config.setSortAlbumsByDate(value);
    }

    onAutoConnectChange(value) {
        this.setState({autoConnect: value});
        let server;
        if (value === true) {
            const current = MPDConnection.current();
            server = {
                name: current.name,
                host: current.host,
                port: current.port,
                pwd: current.pwd
            };
        }
        Config.setAutoConnect(value, server);
    }

    onUseDeviceVolumeChange(value) {
        this.setState({useDeviceVolume: value});
        Config.setUseDeviceVolume(value);
    }

    onUseGridViewChange(value) {
        this.setState({useGridView: value});
        Config.setUseGridView(value);
    }

    setCrossfade(value) {
        this.setState({crossfade: value});
        this.setState({crossfadeVisible: false});
        if (MPDConnection.isConnected()) {
            MPDConnection.current().crossfade(value);
        }
    }

    setReplayGain(value) {
        this.setState({replayGain: value});
        this.setState({replayGainVisible: false});
        if (MPDConnection.isConnected()) {
            MPDConnection.current().replayGainMode(value);
        }
    }

    setMaxListSize(value) {
        this.setState({maxListSize: value});
        this.setState({maxListSizeVisible: false});
        if (MPDConnection.isConnected()) {
            MPDConnection.current().setMaxListSize(value);
        }
    }

    render() {
        const styles = StyleManager.getStyles("settingsStyles");
        const replayGainValue = this.state.replayGain;
        const crossfadeValue = this.state.crossfade + " seconds";
        const maxListSize = ""+this.state.maxListSize;
        return (
            <View style={styles.container7}>
                <SettingsList backgroundColor={bgColor} underlayColor={bgColor} borderColor='#c8c7cc' defaultTitleStyle={styles.item} defaultItemSize={50}>
                    <SettingsList.Header headerStyle={styles.headerStyle}/>
                    <SettingsList.Item
                        hasNavArrow={true}
                        title='About'
                        onPress={() => this.setState({aboutVisible: true})}
                    />
                    <SettingsList.Item
                        hasNavArrow={true}
                        title='Connections'
                        onPress={() => this.props.navigation.navigate('Connections', {navigateOnConnect: false})}
                    />
                    <SettingsList.Item
                        hasNavArrow={true}
                        title='Outputs'
                        onPress={() => this.props.navigation.navigate('Outputs')}
                    />
                    <SettingsList.Item
                        hasNavArrow={true}
                        title='Update Database'
                        onPress={() => this.updateDB()}
                    />
                    <SettingsList.Item
                        hasNavArrow={true}
                        title='Album Art'
                        onPress={() => this.setState({albumartVisible: true})}
                    />
                    <SettingsList.Header headerStyle={styles.headerStyle} headerText="MPD Configuration"/>
                    <SettingsList.Item
                                hasNavArrow={false}
                                switchState={this.state.shuffle}
                                hasSwitch={true}
                                switchOnValueChange={(value) => this.onShuffleChange(value)}
                                title='Shuffle'/>
                    <SettingsList.Item
                        hasNavArrow={false}
                                switchState={this.state.repeat}
                                hasSwitch={true}
                                switchOnValueChange={(value) => this.onRepeatChange(value)}
                                title='Repeat'/>
                    <SettingsList.Item
                        hasNavArrow={false}
                                switchState={this.state.removeSongAfterPlay}
                                hasSwitch={true}
                                switchOnValueChange={(value) => this.onRemoveSongAfterPlayChange(value)}
                                title='Remove song after play'/>
                    <SettingsList.Item
                        hasNavArrow={false}
                                switchState={this.state.stopAftetSongPlayed}
                                hasSwitch={true}
                                switchOnValueChange={(value) => this.onStopAftetSongPlayedChange(value)}
                                title='Stop after song played'/>
                    <SettingsList.Item
                        hasNavArrow={true}
                                  title='Replay Gain'
                                  titleInfo={replayGainValue}
                                  titleInfoStyle={{fontFamily: 'GillSans-Italic'}}
                                  onPress={() => this.setState({replayGainVisible: true})}
                                />
                    <SettingsList.Item
                        hasNavArrow={true}
                                  title='Crossfade'
                                  titleInfo={crossfadeValue}
                                  titleInfoStyle={{fontFamily: 'GillSans-Italic'}}
                                  onPress={() => this.setState({crossfadeVisible: true})}
                                />
                    <SettingsList.Header headerStyle={styles.headerStyle} headerText="General Options"/>
                    <SettingsList.Item
                        hasNavArrow={false}
                                switchState={this.state.randomPlaylistByType}
                                hasSwitch={true}
                                switchOnValueChange={(value) => this.onRandomPlaylistByTypeChange(value)}
                                title='Random Playlist by type'/>
                    <SettingsList.Item
                        hasNavArrow={false}
                                switchState={this.state.sortAlbumsByDate}
                                hasSwitch={true}
                                switchOnValueChange={(value) => this.onSortAlbumsByDateChange(value)}
                                title='Sort Albums by date'/>
                    <SettingsList.Item
                        hasNavArrow={false}
                                switchState={this.state.autoConnect}
                                hasSwitch={true}
                                switchOnValueChange={(value) => this.onAutoConnectChange(value)}
                                title='Auto connect to last used server'/>
                    <SettingsList.Item
                        hasNavArrow={false}
                                switchState={this.state.useDeviceVolume}
                                hasSwitch={true}
                                switchOnValueChange={(value) => this.onUseDeviceVolumeChange(value)}
                                title='Link Device Volume Control to MPD Volume'/>
                    <SettingsList.Item
                        hasNavArrow={false}
                                switchState={this.state.useGridView}
                                hasSwitch={true}
                                switchOnValueChange={(value) => this.onUseGridViewChange(value)}
                                title='Use Grid View by default'/>
                    <SettingsList.Header headerStyle={styles.headerStyle} headerText="Debug Options"/>
                    <SettingsList.Item
                        hasNavArrow={true}
                        title='Debug'
                        onPress={() => this.props.navigation.navigate('Debug')}
                    />
                </SettingsList>
                <ReplayGainModal replayGain={this.state.replayGain} visible={this.state.replayGainVisible} onSet={(value) => {this.setReplayGain(value)}} onCancel={() => this.setState({replayGainVisible: false})}></ReplayGainModal>
                <CrossfadeModal value={this.state.crossfade} visible={this.state.crossfadeVisible} onSet={(value) => {this.setCrossfade(value)}} onCancel={() => this.setState({crossfadeVisible: false})}></CrossfadeModal>
                <AboutModal visible={this.state.aboutVisible} onOk={() => this.setState({aboutVisible: false})}></AboutModal>
                <AlbumArtModal visible={this.state.albumartVisible} onOk={() => this.setState({albumartVisible: false})}></AlbumArtModal>
                <MaxListSizeModal value={this.state.maxListSize} visible={this.state.maxListSizeVisible} onSet={(value) => {this.setMaxListSize(value)}} onCancel={() => this.setState({maxListSizeVisible: false})}></MaxListSizeModal>
            </View>
        );
    }
}
/*
                    <SettingsList.Item
                        hasNavArrow={false}
                        switchState={this.state.darkMode}
                        hasSwitch={true}
                        switchOnValueChange={(value) => this.onDarkModeChange(value)}
                        title='Dark Mode'/>
*/