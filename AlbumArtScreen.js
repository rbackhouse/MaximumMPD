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
import { View, Text, Alert, ActivityIndicator, FlatList, ScrollView, Modal, TouchableOpacity, ActionSheetIOS, Platform } from 'react-native';
import { SearchBar, Input, Button } from "@rneui/themed";

import Icon from 'react-native-vector-icons/Ionicons';
import SettingsList from 'react-native-settings-list';
import ActionButton from 'react-native-action-button';
import FAIcon from 'react-native-vector-icons/FontAwesome';
import { ActionSheetCustom as ActionSheet } from 'react-native-actionsheet'

import AlbumArt from './AlbumArt';
import MPDConnection from './MPDConnection';
import { StyleManager, bgColor } from './Styles';
import UPnPManager from './UPnPManager';

class MissingModal extends React.Component {
    state = {
        loading: false,
        searchValue: "",
        missing: [],
        fullset: []
    }

    load() {
        this.setState({loading: true});
        AlbumArt.getMissing()
        .then((missing) => {
            missing.forEach((a, index) => {
                a.key = ""+(index+1);
            });
            this.setState({missing: missing, fullset: missing, loading: false});
        });
    }

    onOk() {
        this.props.onOk();
    }

    search = (text) => {
        if (text.length > 0) {
            let filtered = this.state.fullset.filter((item) => {
                return item.name.toLowerCase().indexOf(text.toLowerCase()) > -1;
            });
            this.setState({missing: filtered, searchValue: text});
        } else {
            this.setState({missing: this.state.fullset, searchValue: text});
        }
    }

    onPress(item) {
        this.setState({loading: true});
        AlbumArt.reloadAlbumArt(item.name, item.artist)
        .then(()=> {
            Alert.alert(
                "Album Art reload succeded",
                item.name+" "+item.artist
            );    

            this.setState({loading: false});
            this.load();
        })
        .catch((err) => {
            Alert.alert(
                "Album Art reload Failed",
                "Error : "+err
            );    
        });
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
        const styles = StyleManager.getStyles("albumArtStyles");
        const common = StyleManager.getStyles("styles");
        return (
            <TouchableOpacity onPress={this.onPress.bind(this, item)}>
            <View style={common.container3}>
                <Icon name="ios-alert" size={20} style={common.icon}/>
                <View style={common.container4}>
                    <Text numberOfLines={1} style={styles.item}>{item.artist}</Text>
                    <Text numberOfLines={1} style={styles.item}>{item.name}</Text>
                </View>
                <Icon name="ios-refresh" size={20} style={common.icon}/>
            </View>
            </TouchableOpacity>
        );
    };

    render() {
        const styles = StyleManager.getStyles("albumArtStyles");
        const common = StyleManager.getStyles("styles");
        const visible = this.props.visible;
        return (
            <Modal
                animationType="fade"
                transparent={true}
                visible={visible}
                onShow={() => {this.load();}}
            >
                <View style={styles.container3}>
                    <View style={styles.flex1}>
                        <View style={styles.container4}>
                            <Text style={styles.title}>Missing Album Art</Text>
                        </View>    
                    </View>

                    <View style={styles.flex2}>
                        <View style={styles.container5}>
                            <View style={common.flex75}>
                                <SearchBar
                                    round
                                    clearIcon
                                    lightTheme
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
                                <Text style={styles.text1}>
                                    Total : {this.state.missing.length}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.container6}>
                            <FlatList
                                data={this.state.missing}
                                renderItem={this.renderItem}
                                renderSectionHeader={({section}) => <Text style={common.sectionHeader}>{section.title}</Text>}
                                ItemSeparatorComponent={this.renderSeparator}
                            />
                        </View>
                    </View>

                    <View style={styles.flex1}>
                        <Button
                            onPress={() => {this.onOk();}}
                            title="Ok"
                            icon={{name: 'check',  size: 15, type: 'font-awesome'}}
                            raised={true}
                            type="outline"
                        />
                    </View>
                </View>
            </Modal>
        );
    }
}

class SelectUPnPModal extends React.Component {
    state = {
        loading: false,
        upnpServers: []
    }

    componentDidMount() {
        this.onUPnPServerDiscover = UPnPManager.addListener(
            "OnServerDiscover",
            (server) => {
                this.state.upnpServers = this.state.upnpServers.filter((s) => {
                    return !(s.udn === server.udn);
                });
                if (server.action === "find") {
                    server.key = server.udn;
                    this.state.upnpServers.push(server);
                }
                this.setState({upnpServers: this.state.upnpServers});
            }
        );
    }

    componentWillUnmount() {
        this.onUPnPServerDiscover.remove();
    }

    load() {
        let upnpServers = UPnPManager.getServers();
        upnpServers.forEach((u) => {
            u.key = u.udn;
        });
        this.setState({upnpServers: upnpServers});
    }

    onCancel() {
        this.props.onCancel();
    }

    onPress(item) {
        this.props.onSelect(item);
    }

    onRescan() {
        this.setState({upnpServers: [], loading: true});
        UPnPManager.rescan();
        this.setState({upnpServers: [], loading: false});
        this.load();
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
        const styles = StyleManager.getStyles("albumArtStyles");
        const common = StyleManager.getStyles("styles");
        return (
            <TouchableOpacity onPress={this.onPress.bind(this, item)}>
            <View style={common.container3}>
                <Icon name="ios-link" size={20} style={common.icon}/>
                <View style={common.container4}>
                    <Text numberOfLines={1} style={styles.item}>{item.name}</Text>
                </View>
            </View>
            </TouchableOpacity>
        );
    };

    render() {
        const styles = StyleManager.getStyles("albumArtStyles");
        const common = StyleManager.getStyles("styles");
        const visible = this.props.visible;
        return (
            <Modal
                animationType="fade"
                transparent={true}
                visible={visible}
                onShow={() => {this.load();}}
            >
                <View style={styles.container3}>
                    <View style={styles.flex1}>
                        <View style={styles.container4}>
                            <Text style={styles.title}>Select a UPnP Server</Text>
                        </View>    
                    </View>

                    <View style={styles.flex2}>
                        <View style={styles.container6}>
                            <FlatList
                                data={this.state.upnpServers}
                                renderItem={this.renderItem}
                                renderSectionHeader={({section}) => <Text style={common.sectionHeader}>{section.title}</Text>}
                                ItemSeparatorComponent={this.renderSeparator}
                            />
                        </View>
                    </View>

                    <View style={styles.flex1}>
                        <Button
                            onPress={() => {this.onRescan();}}
                            title="Rescan"
                            icon={{name: 'ios-refresh',  size: 20, type: 'ionicon', color: 'black'}}
                            raised={true}
                            type="outline"
                        />
                        <Button
                            onPress={() => {this.onCancel();}}
                            title="Cancel"
                            icon={{name: 'times-circle',  size: 15, type: 'font-awesome', color: 'black'}}
                            raised={true}
                            type="outline"
                        />
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

export default class AlbumArtScreen extends React.Component {
    static navigationOptions = {
        title: 'Album Art'
    };
    state = {
        status: 'Idle',
        count: '',
        port: 8080,
        host: "",
        urlPrefix: "",
        filename: "",
        upnpServer: {name:"", udn: ""},
        serverType: "MPD",
        missingVisible: false,
        upnpListVisible: false,
        binarylimit: '8k',
        searchForImageFile: false,
        useAsURL: false
    };

    componentDidMount() {
        this.onAlbumArtStart = AlbumArt.getEventEmitter().addListener(
            "OnAlbumArtStart",
            (album) => {
                this.setState({count: ""+AlbumArt.getQueueSize(), status:"Downloading "+album.name});
            }
        );
        this.OnAlbumArtStatus = AlbumArt.getEventEmitter().addListener(
            "OnAlbumArtStatus",
            (status) => {
                this.setState({status: status.album.artist+" : "+status.album.name+" Size: "+status.size+"k "+status.percentageDowloaded+"% downloaded"});
            }
        );
        this.onAlbumArtEnd = AlbumArt.getEventEmitter().addListener(
            "OnAlbumArtEnd",
            (album) => {
                this.setState({count: ""+AlbumArt.getQueueSize(), status: ""});
            }
        );
        this.onAlbumArtError = AlbumArt.getEventEmitter().addListener(
            "OnAlbumArtError",
            (details) => {
                if (details.showAlert) {
                    Alert.alert(
                        "Album Art Failed",
                        "Error : "+details.err.message
                    );    
                }
                this.setState({count: ""+AlbumArt.getQueueSize(), status:"Failed downloading "+details.album.name+" : "+details.err});
            }
        );
        this.onAlbumArtComplete = AlbumArt.getEventEmitter().addListener(
            "OnAlbumArtComplete",
            (details) => {
                this.setState({status: "Complete", count: ""+AlbumArt.getQueueSize()});
            }
        );
        AlbumArt.getOptions()
        .then((options) => {
            let host = MPDConnection.current().host;
            if (options.http && options.http.host !== "") {
                host = options.http.host;
            }
            let limit = '8k';
            if (options.mpd) {
                switch (options.mpd.binarylimit) {
                    case 8192:
                        limit = '8k';
                        break;
                    case 16384:
                        limit = '16k';
                        break;
                    case 32768:
                        limit = '32k';
                        break;
                    case 65536:
                        limit = '64k';
                        break;
                    case 131072:
                        limit = '128k';
                        break;
                    case 262144:
                        limit = '256k';
                        break;
                    case 524288:
                        limit = '512k';
                        break;
                }
            }

            this.setState({
                albumart: options.enabled, 
                port: options.http.port, 
                urlPrefix: options.http.urlPrefix, 
                filename: options.http.fileName,
                host: host,
                serverType: options.type,
                upnpServer: options.upnp,
                binarylimit: limit,
                searchForImageFile: options.http.searchForImageFile,
                useAsURL: options.http.useAsURL
            });
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

    onPortChange(value) {
        let port = parseInt(value);
        if (!isNaN(port)) {
            this.setState({port: port});
            AlbumArt.setHTTPPort(port);
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

    onHostChange(value) {
        this.setState({host: value});
        AlbumArt.setHTTPHost(value);
    }

    onChangeType() {
        if (Platform.OS === 'ios') {
            let serverTypes = ['MPD', 'HTTP', 'UPnP', 'Cancel'];
            let serverTypesCancelIdx = 3;
            if (MPDConnection.current().version > 21) {
                serverTypes = ['MPD', 'HTTP', 'UPnP', 'MPD Embedded', 'Cancel'];
                serverTypesCancelIdx = 4;
            }
    
            ActionSheetIOS.showActionSheetWithOptions({
                options: serverTypes,
                title: "Server Type",
                cancelButtonIndex: serverTypesCancelIdx
            }, (idx) => {
                this.setServerType(idx);
            });
        } else {
            this.ActionSheet.show();            
        }
    }

    onChangeBinaryLimit() {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions({
                options: ['8k', '16k', '32k', '64k', '128k', '256k', '512k', 'Cancel'],
                title: "Binary Limit",
                cancelButtonIndex: 7
            }, (idx) => {
                this.setBinaryLimit(idx);
            });
        } else {
            this.LimitActionSheet.show();            
        }
    }

    onSearchForImageFileChange(value) {
        this.setState({searchForImageFile: value});
        AlbumArt.setHTTPSearchForImageFile(value);
    }

    onUseAsURLChange(value) {
        this.setState({useAsURL: value});
        AlbumArt.setHTTPUseAsURL(value);
    }

    setServerType(idx) {
        let type = this.state.serverType;
        switch (idx) {
            case 0:
                type = "MPD";
                break;
            case 1:
                type = "HTTP";
                break;
            case 2:
                this.setState({upnpListVisible: true})
                type = "UPnP";
                break;
            case 3:
                if (MPDConnection.current().version > 21) {
                    type = "MPD Embedded";
                }
                break;
        }
        this.setState({serverType: type});
        AlbumArt.setType(type)
}

    setUPnPServer(upnpServer) {
        this.setState({upnpListVisible: false, upnpServer: upnpServer});
        AlbumArt.setUPnPServer({name: upnpServer.name, udn: upnpServer.udn});
    }

    setBinaryLimit(idx) {
        let limit = 8192;
        let label = "8k";
        switch (idx) {
            case 0:
                limit = 8192;
                label = '8k';
                break;
            case 1:
                limit = 16384;
                label = '16k';
                break;
            case 2:
                limit = 32768;
                label = '32k';
                break;
            case 3:
                limit = 65536;
                label = '64k';
                break;
            case 4:
                limit = 131072;
                label = '128k';
                break;
            case 5:
                limit = 262144;
                label = '256k';
                break;
            case 6:
                limit = 524288;
                label = '512k';
                break;
        }
        if (idx !== 7) {
            this.setState({binarylimit: label});
            AlbumArt.setBinaryLimit(limit);
        }
    }

    retryMissing() {
        AlbumArt.retryMissing();
    }

    render() {
        const styles = StyleManager.getStyles("albumArtStyles");
        const common = StyleManager.getStyles("styles");
        const port = ""+this.state.port;
        const queueText = "Queue : "+this.state.count;
        const statusText = "Status : "+this.state.status;
        const filename = this.state.filename === "" ? "cover.png" : this.state.filename;
        let url = "http://"+this.state.host+":"+port+this.state.urlPrefix+"/[MPD Album Path]/";
        if (this.state.searchForImageFile) {
            url += "[search result]";
        } else {
            url += filename;
        }
        let showBinaryLimit = false;
        let serverTypes = ['MPD', 'HTTP', 'UPnP', 'Cancel'];
        let serverTypesCancelIdx = 3;
        if (MPDConnection.current().version > 21) {
            serverTypes = ['MPD', 'HTTP', 'UPnP', 'MPD Embedded', 'Cancel'];
            serverTypesCancelIdx = 4;
            showBinaryLimit = this.state.serverType === "MPD" || this.state.serverType === "MPD Embedded";
        }
        const showFilenamePrompt = this.state.serverType === "HTTP" && !this.state.searchForImageFile;
        const showUseAsURL = this.state.serverType === "HTTP" && this.state.searchForImageFile;
        return (
            <View style={styles.container}>
                <ScrollView style={styles.scrollview}>
                    <View style={styles.container2}>
                        <SettingsList backgroundColor={bgColor} underlayColor={bgColor} borderColor='#c8c7cc' defaultTitleStyle={styles.settingsItem} defaultItemSize={50}>
                            <SettingsList.Item
                                hasNavArrow={false}
                                switchState={this.state.albumart}
                                hasSwitch={true}
                                switchOnValueChange={(value) => this.onAlbumArtChange(value)}
                                title='Enable'/>
                            <SettingsList.Item
                                hasNavArrow={true}
                                title='Server Type'
                                titleInfo={this.state.serverType}
                                titleInfoStyle={{fontFamily: 'GillSans-Italic'}}
                                onPress={() => this.onChangeType()}
                            />
                            {showBinaryLimit &&                            
                            <SettingsList.Item
                                hasNavArrow={true}
                                title='Binary Limit'
                                titleInfo={this.state.binarylimit}
                                titleInfoStyle={{fontFamily: 'GillSans-Italic'}}
                                onPress={() => this.onChangeBinaryLimit()}
                            />
                            }
                        </SettingsList>
                    </View>
                    {this.state.serverType === "HTTP" &&
                    <View style={styles.container1}>
                        <Input placeholder="HTTP Host" 
                            label="HTTP Host"
                            value={this.state.host}
                            autoCapitalize="none" 
                            onChangeText={(host) => {
                                this.onHostChange(host)
                            }} 
                            style={styles.entryField} 
                            inputStyle={styles.label} 
                            labelStyle={styles.label}/>
                    </View>
                    }
                    {this.state.serverType === "HTTP" &&
                    <View style={styles.container1}>
                        <Input placeholder="HTTP Port" 
                            label="HTTP Port"
                            value={port}
                            autoCapitalize="none" 
                            onChangeText={(port) => {
                                this.onPortChange(port)
                            }} 
                            style={styles.entryField} 
                            inputStyle={styles.label} 
                            labelStyle={styles.label}/>
                    </View>
                    }
                    {this.state.serverType === "HTTP" &&
                    <View style={styles.container1}>
                        <Input placeholder="HTTP URL Prefix" 
                            label="HTTP URL Prefix" 
                            value={this.state.urlPrefix}
                            autoCapitalize="none"
                            onChangeText={(urlPrefix) => this.onURLPrefixChange(urlPrefix)}
                            style={styles.entryField} 
                            inputStyle={styles.label} 
                            labelStyle={styles.label}/>
                    </View>
                    }
                    {this.state.serverType === "HTTP" &&                    
                    <View style={styles.container2}>
                        <SettingsList backgroundColor={bgColor} underlayColor={bgColor} borderColor='#ffffff' defaultTitleStyle={styles.settingsItem} defaultItemSize={50}>
                            <SettingsList.Item
                                hasNavArrow={false}
                                switchState={this.state.searchForImageFile}
                                hasSwitch={true}
                                switchOnValueChange={(value) => this.onSearchForImageFileChange(value)}
                                title='Search for Image File'/>
                        </SettingsList>                        
                    </View>
                    }
                    {showUseAsURL &&                    
                    <View style={styles.container2}>
                        <SettingsList backgroundColor={bgColor} underlayColor={bgColor} borderColor='#ffffff' defaultTitleStyle={styles.settingsItem} defaultItemSize={50}>
                            <SettingsList.Item
                                hasNavArrow={false}
                                switchState={this.state.useAsURL}
                                hasSwitch={true}
                                switchOnValueChange={(value) => this.onUseAsURLChange(value)}
                                title='Use as URL'/>
                        </SettingsList>                        
                    </View>
                    }
                    {showFilenamePrompt &&                    
                    <View style={styles.container1}>
                        <Input placeholder="Album Art Filename" 
                            label="Album Art Filename" 
                            value={this.state.filename}
                            autoCapitalize="none"
                            onChangeText={(filename) => this.onFilenameChange(filename)}
                            style={styles.entryField} 
                            inputStyle={styles.label} 
                            labelStyle={styles.label}/>
                    </View>
                    }
                    {this.state.serverType === "HTTP" &&
                    <View style={styles.container1}>
                        <ScrollView bounces={true} horizontal={true}> 
                            <Text numberOfLines={1} ellipsizeMode='tail' style={styles.status}>URL Template:  {url}</Text>
                        </ScrollView>     
                    </View>
                    }
                    {this.state.serverType === "UPnP" &&
                    <View style={styles.container1}>
                        <Text numberOfLines={1} ellipsizeMode='tail' style={styles.status}>UPnP Server: {this.state.upnpServer.name}</Text>
                    </View>
                    }
                    <View style={styles.container1}>
                        <Text numberOfLines={1} ellipsizeMode='tail' style={styles.status}>{queueText}</Text>
                    </View>
                    <View style={styles.container1}>
                        <Text numberOfLines={1} ellipsizeMode='middle' style={styles.status}>{statusText}</Text>
                    </View>
                </ScrollView>
                {this.state.loading &&
                        <View style={common.loading}>
                            <ActivityIndicator size="large" color="#0000ff"/>
                        </View>
                    }
                <MissingModal visible={this.state.missingVisible} onOk={() => this.setState({missingVisible: false})}></MissingModal>
                <SelectUPnPModal visible={this.state.upnpListVisible} onCancel={() => this.setState({upnpListVisible: false})} onSelect={(upnpServer) => this.setUPnPServer(upnpServer)}></SelectUPnPModal>
                {Platform.OS === 'android' &&
                    <ActionSheet
                        ref={o => this.ActionSheet = o}
                        title={<Text style={{color: '#000', fontSize: 18}}>Server Type</Text>}
                        options={serverTypes}
                        cancelButtonIndex={serverTypesCancelIdx}
                        onPress={(idx) => { 
                            this.setServerType(idx);
                        }}
                    />
                }
                {Platform.OS === 'android' &&
                    <ActionSheet
                        ref={o => this.LimitActionSheet = o}
                        title={<Text style={{color: '#000', fontSize: 18}}>Server Type</Text>}
                        options={['8k', '16k', '32k', '64k', '128k', '256k', '512k', 'Cancel']}
                        cancelButtonIndex={7}
                        onPress={(idx) => { 
                            this.setBinaryLimit(idx);
                        }}
                    />
                }
                <ActionButton buttonColor="rgba(231,76,60,1)" hideShadow={true}>
                    <ActionButton.Item buttonColor='#1abc9c' title="Clear" size={40} textStyle={common.actionButtonText} onPress={() => {this.clearAlbumArt();}}>
                        <FAIcon name="eraser" size={15} color="#e6e6e6" />
                    </ActionButton.Item>
                    <ActionButton.Item buttonColor='#3498db' title="Missing" size={40} textStyle={common.actionButtonText} onPress={() => this.setState({missingVisible: true})}>
                        <FAIcon name="exclamation-circle" size={15} color="#e6e6e6" />
                    </ActionButton.Item>
                    <ActionButton.Item buttonColor='#9b59b6' title="Retry" size={40} textStyle={common.actionButtonText} onPress={() => {this.retryMissing();}}>
                        <FAIcon name="exclamation-circle" size={15} color="#e6e6e6" />
                    </ActionButton.Item>
                </ActionButton>
            </View>
        );
    }
}
