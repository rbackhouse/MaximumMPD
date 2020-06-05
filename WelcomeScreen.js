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
import { View, Text, Appearance } from 'react-native';
import ConnectionsScreen from './ConnectionsScreen';
import { StyleManager } from './Styles';

export default class WelcomeScreen extends React.Component {
    state = {
        loading: false
    }

    componentDidMount() {
        this.onApperance = Appearance.addChangeListener(({ colorScheme }) => {
            this.setState({loading: this.state.loading});
        });
    }

    componentWillUnmount() {
        if (this.onApperance) {
            this.onApperance.remove();
        }
    }

    render() {
        const styles = StyleManager.getStyles("welcomeStyles");
        const common = StyleManager.getStyles("styles");
        return (
            <View style={common.container1}>
                <View style={styles.container2}>
                    <Text style={styles.title}>Maximum MPD</Text>
                    <Text style={styles.intro}>Connect by swiping left on either a Discovered or Configured MPD server.
                    Use the bottom right button to add a new Server</Text>
                </View>
                <ConnectionsScreen navigation={this.props.navigation}/>
            </View>
        );
    }
}
