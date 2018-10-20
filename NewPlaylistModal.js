import React from 'react';
import { Text, View, Modal, StyleSheet } from 'react-native';
import { FormLabel, FormInput, Button } from "react-native-elements";

export default class NewPlaylistModal extends React.Component {
    state = {
        playlistName: ""
    }

    onOk() {
        this.props.onSet(this.state.playlistName, this.props.selectedItem);
    }

    onCancel(visible) {
        this.props.onCancel();
    }

    render() {
        const visible = this.props.visible;
        const value = this.props.value;
        return (
            <Modal
                animationType="fade"
                transparent={false}
                visible={visible}
                onRequestClose={() => {
            }}>
                <View style={{marginTop: 22, flex: .6, flexDirection: 'column', justifyContent: 'space-around'}}>
                    <View style={{ flex: .3, flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                        <Text style={{fontSize: 20, fontFamily: 'GillSans-Italic'}}>Set Playlist Name</Text>
                    </View>
                    <FormLabel>Name</FormLabel>
                    <FormInput onChangeText={(playlistName) => this.setState({playlistName})} style={styles.entryField}></FormInput>
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

const styles = StyleSheet.create({
    entryField: {
        width: 150,
        height: 30,
        margin: 15,
        borderColor: '#e3e5e5',
        borderWidth: 1
    }
});
