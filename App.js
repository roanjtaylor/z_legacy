// Libraries for Stack Navigator
import { NavigationContainer } from "@react-navigation/native"; // identify navigator
import { createNativeStackNavigator } from "@react-navigation/native-stack"; // create stack

// Screens for Stack Navigator
import Welcome from "./screens/prelogin/welcome";
import Register from "./screens/prelogin/register";
import TandCs from "./screens/prelogin/t&cs";
import Login from "./screens/prelogin/login";
import Discover from "./screens/user/discover";
import PayHandler from "./components/payHandler";
import AdminTest from "./screens/admin/create";

const Stack = createNativeStackNavigator();

// Start point for the app, defines the stack navigator.
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Welcome"
          component={Welcome}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Register"
          component={Register}
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="TandCs"
          component={TandCs}
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="Login"
          component={Login}
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="User"
          component={Discover}
          options={{
            headerShown: false,
            // presentation: "modal",
          }}
        />
        <Stack.Screen
          name="PayHandler"
          component={PayHandler}
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="Admin"
          component={AdminTest}
          options={{
            headerShown: false,
            // presentation: "modal",
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
