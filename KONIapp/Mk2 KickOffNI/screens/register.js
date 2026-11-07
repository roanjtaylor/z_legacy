import React from 'react';
import { View, Text, Image, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import GreenArrow from '../assets/GreenArrow.png'; // Import image showing the Green Arrow.
// import UsernameLogo from '../assets/usernameLogo.png'; // Add input field logos in future.
import GoogleIcon from '../assets/GoogleIcon.png';      // Import images
import AppleIcon from '../assets/AppleIcon.png';        // for the alternative
import FacebookIcon from '../assets/FacebookIcon.png';  // sign-up options.

export default function Register({ navigation }){
    
    const [username, setUsername] = React.useState('');
    const [password1, setPassword1] = React.useState('');
    const [password2, setPassword2] = React.useState('');

    const registerHandler = () => {
        Alert.alert('Success!', 'Account successfully registered, now please login with these details.', [
            {text: 'OK', onPress: () => loginHandler()},
          ]);
    }

    const loginHandler = () => {
        navigation.goBack(); // Pops Register screen off stack
        navigation.navigate('Login'); // Pushes Login screen onto stack
    }

    return (
        <View style = {styles.container}>
            {/* Screen Title */}
            <Text style={styles.headingText}>
                Create an account
            </Text>

            {/* Input fields for Registration */}
            <TextInput style={styles.inputFields} onChangeText={setUsername} value={username} placeholder="> Username or Email" placeholderTextColor= '#7D7678' />
            <TextInput style={styles.inputFields} onChangeText={setPassword1} value={password1} placeholder="> Password" placeholderTextColor= '#7D7678' secureTextEntry={true} />
            <TextInput style={styles.inputFields} onChangeText={setPassword2} value={password2} placeholder="> Confirm Password" placeholderTextColor= '#7D7678' secureTextEntry={true} />

            {/* Media sign up options */}
            <Text style={styles.mediaText}>Or Sign Up with one of the following:</Text>
            <View style={{justifyContent: 'center', flexDirection: 'row'}}>
                <TouchableOpacity style={styles.mediaTouchable}><Image source={GoogleIcon} style={styles.mediaImage} /></TouchableOpacity>
                <TouchableOpacity style={styles.mediaTouchable}><Image source={AppleIcon} style={styles.mediaImage} /></TouchableOpacity>
                <TouchableOpacity style={styles.mediaTouchable}><Image source={FacebookIcon} style={styles.mediaImage} /></TouchableOpacity>
            </View>

            {/* "Create Account" button */}
            <TouchableOpacity style = {styles.caOpacity} onPress={() => registerHandler()}>
                <Text style = {styles.caText}>Create Account <Image source={GreenArrow} style={styles.gArrow} /></Text>
            </TouchableOpacity>

            {/* Button to access Login page */}
            <TouchableOpacity style = {styles.loginOpacity} onPress={() => loginHandler()}>
                <Text style = {styles.loginText}>Already have an account?</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1, // take up the whole screen
        padding: 10,
        backgroundColor: 'rgb(35, 31, 32)', // charcoal grey
    },

    // Headline texts
    headingText: {
        fontSize: 32,
        fontWeight: '700',
        color: 'rgb(0,225,130)', // turqoise green
        textAlign: 'center',
        marginTop: 40
    },

    // Input fields
    inputFields: {
        height: 40,
        margin: 20,
        borderRadius: 10,
        padding: 30,
        backgroundColor: '#413C3D', // Lighter gray

        fontSize: 18,   // Font size of text within input field
        color: 'white'  // Colour of INPUTTED text

    },

    // Media options
    mediaText: {
        marginTop: 20,
        textAlign: 'center',
        color: 'cyan',
        fontSize: 18,
    },

    mediaTouchable: {
        margin: 10,         // Have blank gap between adjacent components.
        marginLeft: 20,     // Override horizontal margins here to increase spacing.
        marginRight: 20,
        padding: 10,        // Extend grey background
        backgroundColor: '#413C3D', // Lighter gray
        borderRadius: 100,
    },

    mediaImage: {
        alignSelf: 'center',
        width: 40, // Image dimensions
        height: 40,
    },

    // "Create Account" button
    caOpacity: {
        marginTop: 20,
        padding: 15,
        backgroundColor: 'rgb(0,225,130)', // turqoise green
        borderRadius: 100,
    },
    
    caText: {
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

    // "Already have an account?" button
    loginOpacity: {
        marginTop: 20,
        padding: 0,
    },
    
    loginText: {
        textAlign: 'center',
        fontSize: 18,
        color: 'rgb(0,225,130)', // turqoise green
    },
});