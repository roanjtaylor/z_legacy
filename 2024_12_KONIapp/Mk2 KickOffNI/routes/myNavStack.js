import { createStackNavigator } from "react-navigation-stack";
import { createAppContainer} from 'react-navigation';
import Welcome from '../screens/welcome';
import Register from '../screens/register';
import Login from '../screens/login';
import PlayerHome from '../screens/playerHome';

const screens = {
    Welcome: { // Top one here is default screen shown initially
        screen: Welcome,
        navigationOptions: {
            headerShown: false, // Hide "Welcome" header
            animationEnabled: false, // Disables the sliding transition between screens
        }
    },
    Register: {
        screen: Register,
        navigationOptions: {
            // title: "Register a New Account", // Decided to remove Title, looks cleaner.
            headerShown: false, // Hide "Register" header
            animationEnabled: false,
        }
    },
    Login: {
        screen: Login,
        navigationOptions: {
            // title: "Sign Into Your Account",
            headerShown: false, // Hide "Login" header
            animationEnabled: false,
        }
    },
    PlayerHome: {
        screen: PlayerHome,
        navigationOptions: {
            headerShown: false, // Hide "PlayerHome" header
        }
    }
}

const MyNavStack = createStackNavigator(screens);


export default createAppContainer(MyNavStack);