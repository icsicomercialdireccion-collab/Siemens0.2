// (tabs)/_layout.jsx
import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '../contexts/AutContext';

const TabsLayout = () =>{

  const { user, loading, } = useAuth();
  
  if (!user) return <Redirect href={"/(auth)/login"}/>

return (
<Tabs screenOptions={{ headerShown: false }}>
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
  
</Tabs>
)
}

export default TabsLayout;