// (tabs)/_layout.jsx
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { useAuth } from '../contexts/AutContext';

const TabsLayoutAdmin = () =>{

    const { user, loading, userData } = useAuth();
    console.log("🔍 UserData:", userData);
    console.log("🎭 Role:", userData?.role);
    console.log("Is Admin?:", userData?.role === 'admin');
    
    return (
        <Tabs screenOptions={{ 
            headerShown: false,
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.textLight,
            tabBarStyle: {
                backgroundColor: COLORS.white,
                borderTopColor: COLORS.border,
                borderTopWidth: 1,
                paddingBottom: 8,
                paddingTop: 8,
                height: 80
            },
            tabBarLabelStyle:{
                fontSize: 12,
                fontWeight: "600"
            }
        }}>
        <Tabs.Screen
            name='perfil'
            options={{
            title:"Perfil",
            tabBarIcon: ({color, size}) => <Ionicons name="person" size={size} color={color}/>
            }}
        />
        <Tabs.Screen
            name='home'
            options={{
            title:"Inventarios",
            tabBarIcon: ({color, size}) => <Ionicons name="file-tray" size={size} color={color}/>
            }}
        />
        <Tabs.Screen
            name="admin"
            options={{
            title: "Administrador",
            tabBarIcon: ({ color, size }) => <Ionicons name="server" size={size} color={color} />
            }}
        />
    
        </Tabs>
    )
}

export default TabsLayoutAdmin;