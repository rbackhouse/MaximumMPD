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
import { HeaderBackButton } from 'react-navigation';
import { Button } from 'react-native-elements'
import ActionButton from 'react-native-action-button';

import MPDConnection from './MPDConnection';
import Base64 from './Base64';

export default class FilesScreen extends React.Component {
    static navigationOptions = ({ navigation }) => {
        const showBackbutton = navigation.getParam('showBackbutton', false);
        let ret = {
            title: 'Files'
        }
        if (showBackbutton) {
            ret.headerLeft = <HeaderBackButton onPress={navigation.getParam('backlinkHandler')}/>;
        }
        return ret;
    };

    constructor(props) {
        super(props);
        this.state = {
          files: [],
          dirs: [],
          loading: false
        };
    }

    componentDidMount() {
        if (!MPDConnection.isConnected()) {
            this.props.navigation.navigate('Settings');
            this.props.navigation.navigate('Connections');
        }

        this.props.navigation.setParams({ backlinkHandler: this.backlinkHandler });
        this.load();

        this.onConnect = MPDConnection.getEventEmitter().addListener(
            "OnConnect",
            () => {
                this.load();
            }
        );
        this.onDisconnect = MPDConnection.getEventEmitter().addListener(
            "OnDisconnect",
            () => {
                console.log("OnDisconnect");
                this.setState({files: [], dirs: []});
                this.props.navigation.popToTop();
            }
        );
        this.didBlurSubscription = this.props.navigation.addListener(
            'didBlur',
            payload => {
                /*
                this.setState({files: [], dirs: []});
                this.props.navigation.popToTop();
                */
            }
        );
        this.didFocusSubscription = this.props.navigation.addListener(
            'didFocus',
            payload => {
                //this.load();
            }
        );
    }

    componentWillUnmount() {
        this.onConnect.remove();
        this.onDisconnect.remove();
        this.didBlurSubscription.remove();
        this.didFocusSubscription.remove();
    }

    backlinkHandler = () => {
        if (this.state.dirs.length > 0) {
            this.state.dirs.pop();
            this.load();
        }
    }

    addAll() {
        let path = "";
        this.state.dirs.forEach(function(dir) {
            path += Base64.atob(dir);
            path += "/";
        });
        this.setState({loading: true});
        MPDConnection.current().addDirectoryToPlayList(
            decodeURIComponent(path),
            () => {
                this.setState({loading: false});
            },
            (err) => {
                this.setState({loading: false});
                console.log(err);
                Alert.alert(
                    "MPD Error",
                    "Error : "+err
                );
            }
        );
    }

    onPress(item) {
        if (item.dir) {
            this.load(item.b64dir);
            this.state.dirs.push(item.b64dir);
        } else {
            let path = "";

            this.state.dirs.forEach((dir) => {
				path += Base64.atob(dir);
				path += "/";
			});
			path += Base64.atob(item.b64file);
            this.setState({loading: true});

            MPDConnection.current().addSongToPlayList(
                decodeURIComponent(path),
                () => {
                    this.setState({loading: false});
                },
                (err) => {
                    this.setState({loading: false});
                    console.log(err);
                    Alert.alert(
                        "MPD Error",
                        "Error : "+err
                    );
                }
            );
        }
    }

    load(uri) {
        let path = "";
		this.state.dirs.forEach((dir) => {
			path += Base64.atob(dir);
			path += "/";
		});
		if (uri) {
			path += Base64.atob(uri);
		}
        this.setState({loading: true});
        MPDConnection.current().listFiles(
            path,
            (files) => {
                this.setState({loading: false});
                this.setState({files: [...files.files, ...files.dirs]});
                if (this.state.dirs.length < 1) {
                    this.props.navigation.setParams({ showBackbutton: false });
                } else {
                    this.props.navigation.setParams({ showBackbutton: true });
                }
            },
            (err) => {
                this.setState({loading: false});
                console.log(err);
                Alert.alert(
                    "MPD Error",
                    "Error : "+err
                );
            }
        );
    }

    search = (text) => {
        let files = this.state.files.filter((value) => {
            if (value.file) {
                return value.file.indexOf(text) > -1;
            } else {
                return value.dir.indexOf(text) > -1;
            }
        });
        this.setState({files:files});
    };

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
                    {item.file && <Icon name="ios-musical-notes" size={20} color="black" style={{ paddingLeft: 20, paddingRight: 20 }}/>}
                    {item.dir && <Icon name="ios-folder" size={20} color="black" style={{ paddingLeft: 20, paddingRight: 20 }}/>}
                    <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-evenly', alignItems: 'stretch', padding: 5}}>
                        {item.file && <Text style={styles.item}>{item.file}</Text>}
                        {item.dir && <Text style={styles.item}>{item.dir}</Text>}
                    </View>
                    {item.file && <Icon name="ios-add" size={20} color="black" style={{ paddingLeft: 20, paddingRight: 20 }}/>}
                    {item.dir && <Icon name="ios-more" size={20} color="black" style={{ paddingLeft: 20, paddingRight: 20 }}/>}
                </View>
            </TouchableOpacity>
        );
    }

    render() {
        let showAddAll = false;
        let dirCount = 0;
        let fileCount = 0;

        this.state.files.forEach((f) => {
            if (f.file) {
                fileCount++;
                showAddAll = true;
            } else {
                dirCount++;
            }
        });

        return (
            <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'stretch' }}>
                <View style={{flex: .1, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{flex: 1, justifyContent: 'center'}}>
                        <Text style={{fontSize: 15,fontFamily: 'GillSans-Italic', paddingLeft: 10}}>
                            Directories : {dirCount} Files: {fileCount}
                        </Text>
                    </View>
                </View>
                <FlatList
                    data={this.state.files}
                    renderItem={this.renderItem}
                    renderSectionHeader={({section}) => <Text style={styles.sectionHeader}>{section.title}</Text>}
                    keyExtractor={item => item.b64file || item.b64dir}
                    ItemSeparatorComponent={this.renderSeparator}
                />
                {this.state.loading &&
                    <View style={styles.loading}>
                        <ActivityIndicator size="large" color="#0000ff"/>
                    </View>
                }
                {showAddAll && <ActionButton buttonColor="rgba(231,76,60,1)">
                    <ActionButton.Item buttonColor='#3498db' title="Add to Queue" size={40} textStyle={styles.actionButtonText} onPress={() => {this.addAll();}}>
                        <FAIcon name="plus-square" size={15} color="#e6e6e6" />
                    </ActionButton.Item>
                </ActionButton>}
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
