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
import { View, Text, TextInput, FlatList, Alert, ActivityIndicator} from 'react-native';
import ActionButton from 'react-native-action-button';
import FAIcon from 'react-native-vector-icons/FontAwesome';

import MPDConnection from './MPDConnection';
import { styles as common, debugStyles as styles } from './Styles';

export default class DebugScreen extends React.Component {
    static navigationOptions = {
        title: 'Debug'
    };

    state = {
        debug: [],
        cmd: "",
        laoding: false
    }

    componentDidMount() {
        this.onConnect = MPDConnection.getEventEmitter().addListener(
            "OnConnect",
            () => {
            }
        );

        this.onDisconnect = MPDConnection.getEventEmitter().addListener(
            "OnDisconnect",
            () => {
                this.setState({debug: []});
            }
        );
    }

    componentWillUnmount() {
        this.onConnect.remove();
        this.onDisconnect.remove();
    }

    onRun() {
        if (this.state.cmd !== "") {
            console.log(this.state.cmd);
            this.setState({loading: true});
            let cmd = this.state.cmd;
            cmd = cmd.replace(/./g, (char) => {
                const charCode = char.charCodeAt(0);
                let newChar;
                charCode === 8220 || charCode === 8221 ? newChar = '"' : newChar = char;
                return newChar;
            });
            MPDConnection.current().runCommandWithDebug(cmd)
            .then((results) => {
                this.setState({loading: false});
                let debug = [];
                results.forEach((result, index) => {
                    debug.push({key: ""+(++index), debug: result})
                });
                this.setState({debug: debug});
            })
            .catch((err) => {
                this.setState({loading: false});
                Alert.alert(
                    "MPD Error",
                    "Error : "+err
                );
            });
        }
    }

    onClear() {
        this.setState({debug: [], cmd:""});
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
            <View style={common.container3}>
                <Text style={styles.item}>{item.debug}</Text>
            </View>
        );
    };

    render() {
        return (
            <View style={common.container1}>
                <View style={styles.container3}>
                    <View style={styles.container4}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="MPD Command"
                      onChangeText={(cmd) => this.setState({cmd})}
                      value={this.state.cmd}
                      autoCapitalize="none"
                    />
                    </View>
                </View>
                <FlatList
                    data={this.state.debug}
                    renderItem={this.renderItem}
                    renderSectionHeader={({section}) => <Text style={common.sectionHeader}>{section.title}</Text>}
                    keyExtractor={item => item.key}
                    ItemSeparatorComponent={this.renderSeparator}
                />
                {this.state.loading &&
                    <View style={common.loading}>
                        <ActivityIndicator size="large" color="#0000ff"/>
                    </View>
                }
                <ActionButton buttonColor="rgba(231,76,60,1)" hideShadow={true}>
                    <ActionButton.Item buttonColor='#3498db' title="Run" size={40} textStyle={common.actionButtonText} onPress={() => {this.onRun();}}>
                        <FAIcon name="plus-square" size={15} color="#e6e6e6" />
                    </ActionButton.Item>
                    <ActionButton.Item buttonColor='#1abc9c' title="Clear" size={40} textStyle={common.actionButtonText} onPress={() => {this.onClear();}}>
                        <FAIcon name="eraser" size={15} color="#e6e6e6" />
                    </ActionButton.Item>
                </ActionButton>
            </View>
        );
    }
}
