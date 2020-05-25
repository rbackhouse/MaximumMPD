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
import { View, Alert, ActivityIndicator } from 'react-native';
import SettingsList from 'react-native-settings-list';
import MPDConnection from './MPDConnection';
import { styles as common, outputsStyles as styles } from './Styles';

export default class OutputsScreen extends React.Component {
    static navigationOptions = {
        title: 'Outputs'
    };

    state = {
        outputs: [],
        laoding: false
    }

    componentDidMount() {
        this.onConnect = MPDConnection.getEventEmitter().addListener(
            "OnConnect",
            () => {
                this.getOutputs();
            }
        );

        this.onDisconnect = MPDConnection.getEventEmitter().addListener(
            "OnDisconnect",
            () => {
                this.setState({outputs: []});
            }
        );

        if (MPDConnection.isConnected()) {
            this.getOutputs();
        }
    }

    componentWillUnmount() {
        this.onConnect.remove();
        this.onDisconnect.remove();
    }

    getOutputs() {
        this.setState({loading: true});

        MPDConnection.current().getOutputs()
        .then((outputs) => {
            outputs.forEach((output) => {
                output.key = output.id;
            });
            this.setState({outputs: outputs, loading: false});
        })
        .catch((err) => {
            this.setState({loading: false});
            Alert.alert(
                "MPD Error",
                "Error : "+err
            );
        });
    }

    onOutputChange(value, id) {
        this.setState({loading: true});

        if (value === true) {
            MPDConnection.current().enableOutput(id)
            .then(() => {
                this.setState({loading: false});
                this.getOutputs();
            })
            .catch((err) => {
                this.setState({loading: false});
                Alert.alert(
                    "MPD Error",
                    "Error : "+err
                );
            });
        } else {
            MPDConnection.current().disableOutput(id)
            .then(() => {
                this.setState({loading: false});
                this.getOutputs();
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

    render() {
        const outputs = this.state.outputs.map((output) => 
            <SettingsList.Item
                        hasNavArrow={false}
                        switchState={output.enabled}
                        hasSwitch={true}
                        switchOnValueChange={(value) => this.onOutputChange(value, output.id)}
                        title={output.name}/>
        );
        return (
            <View style={styles.container1}>
                <SettingsList borderColor='#c8c7cc' defaultItemSize={50}>
                    <SettingsList.Header headerStyle={{marginTop:15}} headerText="Outputs"/>
                    {outputs}
                </SettingsList>
                {this.state.loading &&
                    <View style={common.loading}>
                        <ActivityIndicator size="large" color="#0000ff"/>
                    </View>
                }
            </View>
        );
    }
}
