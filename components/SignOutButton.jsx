import React from 'react'
import { TouchableOpacity, Text, Alert } from 'react-native'
import { useClerk } from '@clerk/clerk-expo'
import { useRouter } from 'expo-router'

export default function SignOutButton({ redirectTo = '/(auth)/sign-in' }) {
  const { signOut } = useClerk()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut()
      router.replace(redirectTo)
    } catch (error) {
      Alert.alert('Error', 'No se pudo cerrar la sesión.')
    }
  }

  return (
    <TouchableOpacity onPress={handleSignOut} style={{
      backgroundColor: '#FF8B41',
      padding: 12,
      borderRadius: 20,
      alignSelf: 'center',
      marginTop: 16
    }}>
      <Text style={{ color: 'white', fontWeight: 'bold' }}>Cerrar sesión</Text>
    </TouchableOpacity>
  )
}
