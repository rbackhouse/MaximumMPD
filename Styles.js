import { StyleSheet } from 'react-native'

const styles = StyleSheet.create({
});

const albumsStyles = StyleSheet.create({
    item: {
        fontFamily: 'GillSans-Italic',
        padding: 10
    },
    albumGridItem: {
        fontSize: 13,
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
    },
    row: {
        flex: 1,
        justifyContent: "space-around"
    },
    searchbarContainer: {
        backgroundColor: 'white'
    },
    searchbarInputContainer: {
        backgroundColor: '#EBECEC'
    },
    searchbarInput: { 
        backgroundColor: '#EBECEC'
    },
    separator: {
        height: 1,
        width: "90%",
        backgroundColor: "#CED0CE",
        marginLeft: "5%"
    },
    text: {
        fontSize: 15,
        fontFamily: 'GillSans-Italic'
    },
    paddingLeft: {
        paddingLeft: 10
    },
    albumart: {
        width: 20, 
        height: 20, 
        paddingLeft: 20, 
        paddingRight: 35, 
        resizeMode: 'contain'
    },
    noalbumart: {
        width: 55, 
        height: 55, 
        paddingLeft: 20, 
        paddingRight: 20, 
        resizeMode: 'contain'
    },
    icon: { 
        paddingLeft: 20, 
        paddingRight: 20 
    },
    container1: {flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent:'space-between', height: 65 },
    container2: { flex: 1, flexDirection: 'column', justifyContent: 'space-evenly', alignItems: 'stretch', padding: 5},
    container3: { flex: 1, flexDirection: 'column', justifyContent: 'space-evenly', alignItems: 'center', paddingTop: 5, paddingBottom: 5},
    container4: { flex: 1, justifyContent: 'flex-start', alignItems: 'stretch' },
    container5: {flex: .1, flexDirection: 'row', alignItems: 'center'},
    container6: {flex: .75},
    container7: {flex: .25},
    container8: {flex: .9, flexDirection: 'row', alignItems: 'flex-start' }
});

const appStyles = StyleSheet.create({
    connectiing: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center'
    },
    paddingRight: { paddingRight: 15 }
});

const artistsStyles = StyleSheet.create({
    item: {
        fontFamily: 'GillSans-Italic',
        padding: 10
    },
    albumItem: {
        fontFamily: 'GillSans-Italic',
        padding: 3
    },
    albumGridItem: {
        fontSize: 13,
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
    loading: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center'
    },
    backTextWhite: {
		color: '#FFF'
	},
    rowFront: {
		alignItems: 'center',
		backgroundColor: '#FFFFFF',
		justifyContent: 'center',
	},
	rowBack: {
		alignItems: 'center',
		backgroundColor: '#DDD',
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingLeft: 15,
	},
	backRightBtn: {
		alignItems: 'center',
		bottom: 0,
		justifyContent: 'center',
		position: 'absolute',
		top: 0,
		width: 75
	},
	backRightBtnLeft: {
		backgroundColor: 'grey',
		right: 75
	},
	backRightBtnRight: {
		backgroundColor: 'darkgray',
		right: 0
	},
    actionButtonText: {
        fontSize: 13,
        fontFamily: 'GillSans-Italic'
    },
    row: {
        flex: 1,
        justifyContent: "space-around"
    },
    searchbarContainer: {
        backgroundColor: 'white'
    },
    searchbarInputContainer: {
        backgroundColor: '#EBECEC'
    },
    searchbarInput: { 
        backgroundColor: '#EBECEC'
    },
    separator: {
        height: 1,
        width: "90%",
        backgroundColor: "#CED0CE",
        marginLeft: "5%"
    },
    icon: { 
        paddingLeft: 20, 
        paddingRight: 20 
    },
    text: {
        fontSize: 15,
        fontFamily: 'GillSans-Italic'
    },
    flex75: {flex: .75},
    flex25: {flex: .25},
    tabContainer: { flex: 1, justifyContent: 'flex-start', alignItems: 'stretch' },
    itemContainer: {flex: 1, flexDirection: 'row', alignItems: 'center', height: 65 },
    itemTextContainer: { flex: 1, flexDirection: 'column', justifyContent: 'space-evenly', alignItems: 'stretch', padding: 5},
    genreContainer: {flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent:'space-between'},
    paddingLeft: {paddingLeft: 10},
    selectedButtonStyle: {backgroundColor: '#3396FF'},
    selectedTextStyle: {color: 'white'},
    gridItem: { flex: 1, flexDirection: 'column', justifyContent: 'space-evenly', alignItems: 'center', paddingTop: 5, paddingBottom: 5, paddingLeft: 5, paddingRight: 5},
    iconNoAlbumArt: {width: 20, height: 20, paddingLeft: 20, paddingRight: 35, resizeMode: 'contain'},
    iconAlbumArt: {width: 55, height: 55, paddingLeft: 20, paddingRight: 20, resizeMode: 'contain'},
    iconGenre: {width: 20, height: 20, paddingLeft: 20, paddingRight: 20, resizeMode: 'contain'}
});

const connectionsStyles = StyleSheet.create({
    item: {
        fontFamily: 'GillSans-Italic',
        paddingLeft: 10
    },
    label: {
        fontSize: 17,
        fontFamily: 'GillSans-Italic',
        fontWeight: 'normal',
    },
    sectionHeader: {
        paddingTop: 2,
        paddingLeft: 10,
        paddingRight: 10,
        paddingBottom: 2,
        fontSize: 17,
        fontFamily: 'GillSans-Italic',
        fontWeight: 'bold',
        backgroundColor: 'rgba(247,247,247,1.0)',
    },
    button: {
        alignItems: 'center',
        backgroundColor: '#3396FF',
        padding: 10,
        borderRadius: 5
    },
    entryField: {
        width: 150,
        height: 30,
        margin: 15,
        borderColor: '#e3e5e5',
        borderWidth: 1
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
    },
    backTextWhite: {
		color: '#FFF'
	},
	rowFront: {
		alignItems: 'center',
		backgroundColor: '#FFFFFF',
		justifyContent: 'center',
	},
	rowBack: {
		alignItems: 'center',
		backgroundColor: '#DDD',
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingLeft: 15,
	},
	backRightBtn: {
		alignItems: 'center',
		bottom: 0,
		justifyContent: 'center',
		position: 'absolute',
		top: 0,
		width: 75
	},
	backRightBtnLeft: {
		backgroundColor: 'grey',
		right: 75
	},
	backRightBtnRight: {
		backgroundColor: 'darkgray',
		right: 0
    },
    separator: {
        height: 1,
        width: "90%",
        backgroundColor: "#CED0CE",
        marginLeft: "5%"
    },
    container1: { flex: 1, justifyContent: 'flex-start', alignItems: 'stretch' },
    container2: { flex: 1, flexDirection: 'column', justifyContent: 'space-evenly', alignItems: 'stretch', padding: 5 },
    container3: {flex: 1, flexDirection: 'row', alignItems: 'center'},
    dialog1: {marginTop: 22, flex: .8, flexDirection: 'column', justifyContent: 'space-around'},
    dialog2: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center'},
    dialog3: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },
    dialogtext: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center'},
    icon: { 
        paddingLeft: 20, 
        paddingRight: 20 
    }
});

const debugStyles = StyleSheet.create({
    textInput: {
      borderColor: '#CCCCCC',
      borderTopWidth: 1,
      borderBottomWidth: 1,
      height: 50,
      fontSize: 25,
      paddingLeft: 20,
      paddingRight: 20
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
    },
    actionButtonText: {
        fontSize: 13,
        fontFamily: 'GillSans-Italic'
    },
    separator: {
        height: 1,
        width: "90%",
        backgroundColor: "#CED0CE",
        marginLeft: "5%"
    },
    container1: { flex: 1, justifyContent: 'flex-start', alignItems: 'stretch' },
    container2: {flex: 1, flexDirection: 'row', alignItems: 'center'},
    container3: {flex: .1, flexDirection: 'row', alignItems: 'center'},
    container4: {flex: 1}
});

const filesStyles = StyleSheet.create({
    item: {
        fontFamily: 'GillSans-Italic',
        padding: 10
    },
    file: {
        fontFamily: 'GillSans-Italic',
        paddingLeft: 10,
        paddingTop: 2,
        paddingBottom: 2
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
    },
    backTextWhite: {
		color: '#FFF'
	},
    rowFront: {
		alignItems: 'center',
		backgroundColor: '#FFFFFF',
		justifyContent: 'center',
		paddingTop: 3,
		paddingBottom: 3,
	},
	rowBack: {
		alignItems: 'center',
		backgroundColor: '#DDD',
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingLeft: 15,
		paddingTop: 3,
		paddingBottom: 3,
	},
	backRightBtn: {
		alignItems: 'center',
		bottom: 0,
		justifyContent: 'center',
		position: 'absolute',
		top: 0,
		width: 75
	},
	backRightBtnLeft: {
		backgroundColor: 'grey',
		right: 75
	},
	backRightBtnRight: {
		backgroundColor: 'darkgray',
		right: 0
    },
	backLeftBtn: {
		alignItems: 'center',
		bottom: 0,
		justifyContent: 'center',
		position: 'absolute',
		top: 0,
		width: 75,
		backgroundColor: '#F08080'
    },
    separator: {
        height: 1,
        width: "90%",
        backgroundColor: "#CED0CE",
        marginLeft: "5%"
    },
    container1: { flex: 1, justifyContent: 'flex-start', alignItems: 'stretch' },
    container2: {flex: .1, flexDirection: 'row', alignItems: 'center' },
    container3: {flex: .5},
    container4: {flex: .9, flexDirection: 'row', alignItems: 'flex-start' },
    container5: {flex: 1, flexDirection: 'row', alignItems: 'center'},
    container6: { flex: 1, flexDirection: 'column', justifyContent: 'space-evenly', alignItems: 'stretch', padding: 5},
    container7: {flex: 1, flexDirection: 'row', alignItems: 'center'},
    text: {fontSize: 15,fontFamily: 'GillSans-Italic'},
    icon: { 
        paddingLeft: 20, 
        paddingRight: 20 
    },
    searchbarContainer: {
        backgroundColor: 'white'
    },
    searchbarInputContainer: {
        backgroundColor: '#EBECEC'
    },
    searchbarInput: { 
        backgroundColor: '#EBECEC'
    }
});

const newPlaylistStyles = StyleSheet.create({
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
    label: {
        fontSize: 17,
        fontFamily: 'GillSans-Italic',
        fontWeight: 'normal',
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
    separator: {
        height: 1,
        width: "90%",
        backgroundColor: "#CED0CE",
        marginLeft: "5%"
    },
    icon: { 
        paddingLeft: 20, 
        paddingRight: 20 
    },
    searchbarContainer: {
        backgroundColor: 'white'
    },
    searchbarInputContainer: {
        backgroundColor: '#EBECEC'
    },
    searchbarInput: { 
        backgroundColor: '#EBECEC'
    },
    container1: {flex: 1, flexDirection: 'row', alignItems: 'center'},
    container2: { flex: 1, flexDirection: 'column', justifyContent: 'space-evenly', alignItems: 'stretch', padding: 5},
    container3: {marginTop: 25, flex: 1, flexDirection: 'column', justifyContent: 'space-around'},
    container4: { flex: .1, justifyContent: 'flex-start', alignItems: 'stretch', marginBottom: 20 },
    container5: { flex: .5, flexDirection: 'row', justifyContent: 'center', alignItems: 'center'},
    container6: { flex: .5, flexDirection: 'row', justifyContent: 'center', alignItems: 'center'},
    container7: { flex: .1, justifyContent: 'flex-start', alignItems: 'stretch'},
    container8: { flex: .2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },
    container9: { flex: .6, justifyContent: 'flex-start', alignItems: 'stretch'},
    container10: {flex: .1, flexDirection: 'row', alignItems: 'center'},
    container11: {flex: .75},
    container12: {flex: .25},
    container13: {flex: .9, flexDirection: 'row', alignItems: 'flex-start' },
    text1: {fontSize: 20, fontFamily: 'GillSans-Italic'},
    text2: {fontSize: 16, fontFamily: 'GillSans-Italic'},
    text3: {fontSize: 15,fontFamily: 'GillSans-Italic'}
});

const outputsStyles = StyleSheet.create({
    loading: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center'
    },
    container1 : {backgroundColor:'#EFEFF4',flex:1}
});

const playlistDetailsStyles = StyleSheet.create({
    item: {
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
    },
    searchbarContainer: {
        backgroundColor: 'white'
    },
    searchbarInputContainer: {
        backgroundColor: '#EBECEC'
    },
    searchbarInput: { 
        backgroundColor: '#EBECEC'
    },
    separator: {
        height: 1,
        width: "90%",
        backgroundColor: "#CED0CE",
        marginLeft: "5%"
    },
    icon: { 
        paddingLeft: 20, 
        paddingRight: 20 
    },
    text: {
        fontSize: 15,
        fontFamily: 'GillSans-Italic'
    },
    container1: { flex: 1, justifyContent: 'flex-start', alignItems: 'stretch' },
    container2: {flex: .1, flexDirection: 'row', alignItems: 'center'},
    container3: {flex: .75},
    container4: {flex: .25},
    container5: {flex: .9, flexDirection: 'row', alignItems: 'stretch' },
    container6: {flex: 1, flexDirection: 'row', alignItems: 'center'},
    container7: { flex: 1, flexDirection: 'column', justifyContent: 'space-evenly', alignItems: 'stretch', padding: 5}
});

const playlistEditorStyles = StyleSheet.create({
    item: {
        fontFamily: 'GillSans-Italic',
        padding: 10
    },
    label: {
        fontSize: 17,
        fontFamily: 'GillSans-Italic',
        fontWeight: 'normal',
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
    },
    searchbarContainer: {
        backgroundColor: 'white'
    },
    searchbarInputContainer: {
        backgroundColor: '#EBECEC'
    },
    searchbarInput: { 
        backgroundColor: '#EBECEC'
    },
    separator: {
        height: 1,
        width: "90%",
        backgroundColor: "#CED0CE",
        marginLeft: "5%"
    },
    icon: { 
        paddingLeft: 20, 
        paddingRight: 20 
    },
    text: {
        fontSize: 15,
        fontFamily: 'GillSans-Italic'
    },
    container1: { flex: 1, justifyContent: 'flex-start', alignItems: 'stretch' },
    container2: {flex: .1, flexDirection: 'row', alignItems: 'center'},
    container3: {flex: .75},
    container4: {flex: .25},
    container5: {flex: .9, flexDirection: 'row', alignItems: 'flex-start' },
    container6: {flex: 1, flexDirection: 'row', alignItems: 'center'},
    container7: { flex: 1, flexDirection: 'column', justifyContent: 'space-evenly', alignItems: 'stretch', padding: 5},
    dialog1: {marginTop: 22, flex: .6, flexDirection: 'column', justifyContent: 'space-around'},
    dialog2: { flex: .3, flexDirection: 'row', justifyContent: 'center', alignItems: 'center'},
    dialog3: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },
    dialogtext: {fontSize: 20, fontFamily: 'GillSans-Italic'}
});

const playlistStyles = StyleSheet.create({
    item: {
        fontFamily: 'GillSans-Italic'
    },
    label: {
        fontSize: 17,
        fontFamily: 'GillSans-Italic',
        fontWeight: 'normal',
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
    },
    separator: {
        height: 1,
        width: "90%",
        backgroundColor: "#CED0CE",
        marginLeft: "5%"
    },
    icon: { 
        paddingLeft: 20, 
        paddingRight: 20 
    },
    text: {
        fontSize: 15,
        fontFamily: 'GillSans-Italic',
        paddingLeft: 10
    },
    container1: { flex: 1, justifyContent: 'flex-start', alignItems: 'flex-start' },
    container2: {flex: .05, flexDirection: 'row', alignItems: 'flex-start' },
    container3: {flex: 1, justifyContent: 'center'},
    container4: {flex: .95, flexDirection: 'row', alignItems: 'flex-start' },
    container5: {flex: 1, flexDirection: 'row', alignItems: 'center'},
    container6: { flex: 1, flexDirection: 'column', justifyContent: 'space-evenly', alignItems: 'stretch', padding: 5},
    dialog1: {marginTop: 22, flex: .6, flexDirection: 'column', justifyContent: 'space-around'},
    dialog2: { flex: .3, flexDirection: 'row', justifyContent: 'center', alignItems: 'center'},
    dialog3: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },
    dialogtext: {fontSize: 20, fontFamily: 'GillSans-Italic'}
});

const playStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    button: {
        backgroundColor: '#3396FF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowOpacity: 0.35,
        shadowOffset: {
          width: 0,
          height: 5
        },
        shadowColor: "#000",
        shadowRadius: 3,
        elevation: 5
    },
    largeButton: {
        width: 60,
        height: 60,
        borderRadius: 50,
    },
    mediumButton: {
        width: 50,
        height: 50,
        borderRadius: 35,
    },
    smallButton: {
        width: 40,
        height: 40,
        borderRadius: 30,
    },
    tabBar: {
        paddingLeft: 20,
        paddingRight: 20,
        paddingBottom: 20,
        flexDirection: 'row',
        height: 80
    },
    tabBarButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    item: {
        fontSize: 18,
        fontFamily: 'GillSans-Italic'
    },
    meniItem: {
        fontSize: 16,
        fontFamily: 'GillSans-Italic'
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
    tabcontainer1: {flex:1},
    container1: {flex: .1, width: "100%", padding: 5},
    container2: {flex: .1, width: "85%", height: 65, alignItems: 'center', justifyContent: 'center', paddingLeft: 5, paddingRight: 5},
    container3: {flex: 1, flexDirection: 'row', alignItems: 'center'},
    container4: {flex: .6, width: "60%", alignItems: 'center', justifyContent: 'center'},
    container5: {flex: .1, width: "80%", height: "15%", padding: 15, alignItems: 'center', justifyContent: 'center'},
    container6: {flex: .1, width: "85%", height: 65, alignItems: 'center', justifyContent: 'center'},
    container7: {flex: 1, flexDirection: 'row', alignItems: 'center'},
    containerStyle: {height: 25},
    selectedButtonStyle: {backgroundColor: '#3396FF'},    
    selectedTextStyle: {color: 'white'},
    paddingRight: { paddingRight: 15 },
    paddingLeft: { paddingLeft: 15 },
    paddingRightSmall: { paddingRight: 10 },
    paddingLeftSmall: { paddingLeft: 10 },
    iconMore: { paddingLeft: 1 },
    positionSlider: {width: "80%"},
    volumeSlider: {width: "85%"}
})

const searchStyles = StyleSheet.create({
    item: {
        fontFamily: 'GillSans-Italic',
        paddingLeft: 10
    },
    sectionHeader: {
        paddingTop: 2,
        paddingLeft: 10,
        paddingRight: 10,
        paddingBottom: 2,
        fontSize: 17,
        fontFamily: 'GillSans-Italic',
        fontWeight: 'bold',
        backgroundColor: 'rgba(247,247,247,1.0)',
    },
    backTextWhite: {
		color: '#FFF'
	},
    rowFront: {
		alignItems: 'center',
		backgroundColor: '#FFFFFF',
		justifyContent: 'center',
        height: 85
	},
	rowBack: {
		alignItems: 'center',
		backgroundColor: '#DDD',
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingLeft: 15,
        height: 85
	},
	backRightBtn: {
		alignItems: 'center',
		bottom: 0,
		justifyContent: 'center',
		position: 'absolute',
		top: 0,
		width: 75
	},
	backRightBtnLeft: {
		backgroundColor: 'grey',
		right: 75
	},
	backRightBtnRight: {
		backgroundColor: 'darkgray',
		right: 0
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
	backLeftBtn: {
		alignItems: 'center',
		bottom: 0,
		justifyContent: 'center',
		position: 'absolute',
		top: 0,
		width: 75,
		backgroundColor: '#F08080'
    },
    container1: { flex: 1, justifyContent: 'flex-start', alignItems: 'stretch' },
    container2: {flex: .1, flexDirection: 'row', alignItems: 'center'},
    container3: {flex: 1},
    container4: {flex: .9, flexDirection: 'row', alignItems: 'stretch' },
    container5: { flex: 1, flexDirection: 'column', justifyContent: 'space-evenly', alignItems: 'stretch', padding: 5},
    container6: {flex: 1, flexDirection: 'row', alignItems: 'center'},
    container7: {flex: 1, flexDirection: 'row', alignItems: 'center', height: 65},
    searchbarContainer: {
        backgroundColor: 'white'
    },
    searchbarInputContainer: {
        backgroundColor: '#EBECEC'
    },
    searchbarInput: { 
        backgroundColor: '#EBECEC'
    },
    separator: {
        height: 1,
        width: "90%",
        backgroundColor: "#CED0CE",
        marginLeft: "5%"
    },
    paddingLeft: {
        paddingLeft: 10
    },
    albumart: {
        width: 20, 
        height: 20, 
        paddingLeft: 20, 
        paddingRight: 35, 
        resizeMode: 'contain'
    },
    noalbumart: {
        width: 55, 
        height: 55, 
        paddingLeft: 20, 
        paddingRight: 20, 
        resizeMode: 'contain'
    },
    icon: { 
        paddingLeft: 20, 
        paddingRight: 20 
    }
});

const settingsStyles = StyleSheet.create({
    entryField: {
        width: 150,
        height: 30,
        margin: 15,
        borderColor: '#e3e5e5',
        borderWidth: 1
    },
    label: {
        fontFamily: 'GillSans-Italic',
        fontWeight: 'normal',
    },
    status: {
        fontFamily: 'GillSans-Italic',
        margin: 15
    },
    text1: {fontSize: 15,fontFamily: 'GillSans-Italic'},
    text2: {fontSize: 20, fontFamily: 'GillSans-Italic'},
    flexStart: {flex: .5, alignItems: 'flex-start'},
    flexEnd: {flex: .5, alignItems: 'flex-end'},
    flex1: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },
    flex2: {flex: .2, flexDirection: 'row', alignItems: 'stretch', justifyContent: 'flex-start'},
    flex3: { flex: .3, flexDirection: 'row', justifyContent: 'center', alignItems: 'center'},
    container1: {marginTop: 22, flex: .6, flexDirection: 'column', justifyContent: 'space-around'},
    container2: {flex: .1, flexDirection: 'row', alignItems: 'center', margin: 15},
    container3: {flex: .2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },
    container4: {flex: .2, flexDirection: 'row', alignItems: 'center', margin: 15},
    container5: {marginTop: 25, flex: 1, flexDirection: 'column', justifyContent: 'flex-start'},
    container6: {flex: .1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center'},
    container7: {backgroundColor:'#EFEFF4',flex:1},
    textInput1: {
        width: 75,
        height: 35,
        borderColor: '#e3e5e5',
        borderWidth: 1                            
    },
    textInput2: {
        width: 150,
        height: 35,
        borderColor: '#e3e5e5',
        borderWidth: 1                            
    }
});

const songsStyles = StyleSheet.create({
    item: {
        fontFamily: 'GillSans-Italic',
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
    },
    backTextWhite: {
		color: '#FFF'
	},
    rowFront: {
		alignItems: 'center',
		backgroundColor: '#FFFFFF',
		justifyContent: 'center',
        height: 85
	},
	rowBack: {
		alignItems: 'center',
		backgroundColor: '#DDD',
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingLeft: 15,
        height: 85
	},
	backRightBtn: {
		alignItems: 'center',
		bottom: 0,
		justifyContent: 'center',
		position: 'absolute',
		top: 0,
		width: 75
	},
	backRightBtnLeft: {
		backgroundColor: 'grey',
		right: 75
	},
	backRightBtnRight: {
		backgroundColor: 'darkgray',
		right: 0
    },
    container1: { 
        flex: 1, 
        justifyContent: 'flex-start', 
        alignItems: 'stretch' 
    },
    container2: {
        flex: .1, 
        flexDirection: 'row', 
        alignItems: 'center'
    },
    container3: {
        flex: .75
    },
    container4: {
        flex: .25
    },
    container5: {
        flex: .9, 
        flexDirection: 'row', 
        alignItems: 'stretch' 
    },
    separator: {
        height: 1,
        width: "90%",
        backgroundColor: "#CED0CE",
        marginLeft: "5%"
    },
    text: {
        fontSize: 15,
        fontFamily: 'GillSans-Italic'
    },
    paddingLeft: {
        paddingLeft: 10
    },
    albumart: {
        width: 20, 
        height: 20, 
        paddingLeft: 20, 
        paddingRight: 35, 
        resizeMode: 'contain'
    },
    noalbumart: {
        width: 55, 
        height: 55, 
        paddingLeft: 20, 
        paddingRight: 20, 
        resizeMode: 'contain'
    },
    container6: {
        flex: 1, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent:'space-between'
    },
    container7: { 
        flex: 1, 
        flexDirection: 'column', 
        justifyContent: 'space-evenly', 
        alignItems: 'stretch', 
        padding: 5
    },
    icon: { 
        paddingLeft: 20, 
        paddingRight: 20 
    },
    searchbarContainer: {
        backgroundColor: 'white'
    },
    searchbarInputContainer: {
        backgroundColor: '#EBECEC'
    },
    searchbarInput: { 
        backgroundColor: '#EBECEC'
    },
	backLeftBtn: {
		alignItems: 'center',
		bottom: 0,
		justifyContent: 'center',
		position: 'absolute',
		top: 0,
		width: 75,
		backgroundColor: '#F08080'
	}
});

const welcomeStyles = StyleSheet.create({
    title: {
        fontSize: 30,
        fontFamily: 'GillSans-Italic',
        padding: 10
    },
    intro: {
        fontSize: 16,
        fontFamily: 'GillSans-Italic',
        paddingLeft: 10,
        paddingRight: 10,
    },
    container1: { flex: 1, justifyContent: 'flex-start', alignItems: 'stretch' },
    container2 : {flex: .3, alignItems: 'center', justifyContent: 'center', paddingTop: 10}
});

export { 
    styles, 
    albumsStyles,
    appStyles,
    artistsStyles,
    connectionsStyles,
    debugStyles,
    filesStyles,
    newPlaylistStyles,
    outputsStyles,
    playlistDetailsStyles,
    playlistEditorStyles,
    playlistStyles,
    playStyles,
    searchStyles,
    settingsStyles,
    songsStyles,
    welcomeStyles
}; 