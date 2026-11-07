import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'; // React-native components used here.
import { Video } from 'expo-av';                            // Expo Video installed,
import BackgroundVideo from '../assets/WelcomeVideo.mp4';   // used to display background video.
import GreenArrow from '../assets/GreenArrow.png';     // Green Arrow for "Get Started" button.
import KONILogo from '../assets/TransparentLogo.png';       // and Logo images.
import { LinearGradient } from 'expo-linear-gradient';      // Expo linear gradient for grey background over the video.

// // SVG for scalable logo
// import * as Svg from 'react-native-svg';
// import KONILOGOSVG from '../assets/transparentLogo.svg';

export default function Welcome({ navigation }){

    const getStartedHandler = () => {
        navigation.navigate('Register');
        // navigation.push('Register');
    }

    const signInHandler = () => {
        navigation.navigate('Login');
        // navigation.push('Login');
    }

    return (
        <View style = {styles.container}>
            {/* Background video of people playing */}
            <Video
                source={BackgroundVideo}
                style={styles.backgroundVideo}
                rate={1}
                shouldPlay={true}
                isLooping={true}
                muted={true}
                resizeMode="cover"
            />

            {/* Linear gradient for background faded colour */}
            <LinearGradient
                colors={['rgba(0,0,0,0.8)', 'transparent']}
                style={styles.backgroundGradient}
            />

            {/* KickOffNI logo */}
            <Image source={KONILogo} style={styles.logo} />
            {/* <KONILOGOSVG width={48} height={48} fill="#000" /> */}

            {/* "Get Started" button */}
            <TouchableOpacity style = {styles.gsOpacity} onPress={() => getStartedHandler()}>
                <Text style = {styles.gsText}>Get Started <Image source={GreenArrow} style={styles.gArrow} /></Text>
            </TouchableOpacity>

            {/* "Sign In" button */}
            <TouchableOpacity style = {styles.siOpacity} onPress={() => signInHandler()}>
                <Text style = {styles.siText}>Sign In</Text>
            </TouchableOpacity>

        </View>
    )
}

// Stylesheet, containing all formatting instructions
const styles = StyleSheet.create({
    // Overall screen (Container)
    container: {
        flex: 1, // take up the whole screen
        justifyContent: 'flex-end', // put components at the bottom of the screen
        padding: 24,
        backgroundColor: 'white',
    },

    // Background video
    backgroundVideo: {
        height: Dimensions.get("window"),
        position: "absolute",
        top: 0,
        left: 0,
        alignItems: "stretch",
        bottom: 0,
        right: 0,
    },

    // Linear gradient
    backgroundGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: '250%',
    },

    // Logo
    logo: {
        alignSelf: 'center',
        marginBottom: 100,
        objectFit: 'fill',
        width: '40%',
        height: '30%'
    },

    // "Get Started" button
    gsOpacity: {
        padding: 15,
        backgroundColor: 'rgb(0,225,130)', // turqoise green
        borderRadius: 100,
    },
    
    gsText: {
        textAlign: 'center',
        fontSize: 24,
        fontWeight: '700',
        color: 'white',
    },

    gArrow: {
        width: 24, 
        height: 24, 
        backgroundColor: 'white',
        borderRadius: 10,
    },

    // "Sign In" button
    siOpacity: {
        marginTop: 20,
        padding: 15,
        backgroundColor: 'rgb(35, 31, 32)', // charcoal grey

        borderRadius: 100,
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: 'rgb(0,225,130)', // turqoise green
    }, 
    
    siText: {
        textAlign: 'center',
        fontSize: 24,
        color: 'rgb(0,225,130)', // turqoise green
    },

});