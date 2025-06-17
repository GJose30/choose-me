import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native'
import { useSignIn, useClerk } from '@clerk/clerk-expo'
import { useRouter, Link } from 'expo-router'

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const { signOut } = useClerk()
  const router = useRouter()
  const [identifier, setIdentifier] = useState('') // username o email
  const [password, setPassword] = useState('')

  const onSignInPress = async () => {
    if (!isLoaded) return
    try {
      await signOut() // Siempre intenta cerrar sesión previa (no falla si no había sesión)
    } catch (e) {}
    try {
      const result = await signIn.create({
        identifier, // username o email
        password,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        // Solo redirige, la lógica de Supabase va en la pantalla protegida
        router.replace('/(tabs)')
      } else {
        Alert.alert('Atención', 'Debes completar el proceso de login.')
      }
    } catch (err) {
      Alert.alert('Error', err.errors?.[0]?.message || 'Error al iniciar sesión')
    }
  }

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 12 }}>Iniciar sesión</Text>
      <TextInput
        placeholder="Email o username"
        autoCapitalize="none"
        value={identifier}
        onChangeText={setIdentifier}
        style={{ borderWidth: 1, marginBottom: 12, padding: 8 }}
      />
      <TextInput
        placeholder="Contraseña"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
        style={{ borderWidth: 1, marginBottom: 12, padding: 8 }}
      />
      <TouchableOpacity onPress={onSignInPress}>
        <Text>Iniciar sesión</Text>
      </TouchableOpacity>
      <View style={{ flexDirection: 'row', marginTop: 8 }}>
        <Link href="/sign-up">
          <Text style={{ color: 'blue' }}>Registrarse</Text>
        </Link>
      </View>
    </View>
  )
}
