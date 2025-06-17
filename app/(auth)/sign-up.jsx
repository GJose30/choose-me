import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native'
import { useSignUp } from '@clerk/clerk-expo'
import { useRouter, Link } from 'expo-router'
import { supabase } from '../../lib/supabase'

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [pendingVerification, setPendingVerification] = useState(false)
  const [code, setCode] = useState('')

  // Guardar usuario en Supabase (con clerk_id)
  const saveUserToSupabase = async (clerkId, email, username) => {
    console.log('Voy a guardar en Supabase:', { clerkId, email, username })
    const { error } = await supabase.from('user').upsert([
      {
        clerk_id: clerkId,
        email,
        username,
        created_at: new Date().toISOString(),
      }
    ])
    if (error) {
      Alert.alert('Error', 'No se pudo guardar el usuario en Supabase')
      console.error('Supabase error:', error)
    }
  }

  // Registro inicial con Clerk
  const onSignUpPress = async () => {
    if (!isLoaded) return
    try {
      await signUp.create({ emailAddress: email, username, password })
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setPendingVerification(true)
    } catch (err) {
      Alert.alert('Error', err.errors?.[0]?.message || 'Error al registrarse')
    }
  }

  // Verificar el código de email
  const onVerifyPress = async () => {
    if (!isLoaded) return
    try {
      const result = await signUp.attemptEmailAddressVerification({ code })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        // OBTIENE EL CLERK ID SEGURO Y GUARDA EN SUPABASE
        const clerkId = signUp.user?.id || result?.createdUserId || ''
        console.log('Clerk ID obtenido:', clerkId, 'signUp.user:', signUp.user, 'result:', result)
        
        if (!clerkId) {
          Alert.alert('Error', 'No se pudo obtener el ID del usuario de Clerk.')
          return
        }
        await saveUserToSupabase(
          clerkId,
          email,
          username
        )
        router.replace('/')
      } else {
        Alert.alert('Info', 'Completa todos los pasos del registro')
      }
    } catch (err) {
      Alert.alert('Error', err.errors?.[0]?.message || 'Error de verificación')
    }
  }

  if (pendingVerification) {
    return (
      <View style={{ padding: 20 }}>
        <Text>Verifica tu email</Text>
        <TextInput
          value={code}
          placeholder="Código de verificación"
          onChangeText={setCode}
          keyboardType="number-pad"
          style={{ borderWidth: 1, marginBottom: 16 }}
        />
        <TouchableOpacity onPress={onVerifyPress}>
          <Text>Verificar</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 12 }}>Registrarse</Text>
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, marginBottom: 12, padding: 8 }}
      />
      <TextInput
        placeholder="Username"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
        style={{ borderWidth: 1, marginBottom: 12, padding: 8 }}
      />
      <TextInput
        placeholder="Contraseña"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
        style={{ borderWidth: 1, marginBottom: 12, padding: 8 }}
      />
      <TouchableOpacity onPress={onSignUpPress}>
        <Text>Registrarse</Text>
      </TouchableOpacity>
      <View style={{ flexDirection: 'row', marginTop: 8 }}>
        <Text>¿Ya tienes cuenta? </Text>
        <Link href="/sign-in">
          <Text style={{ color: 'blue' }}>Inicia sesión</Text>
        </Link>
      </View>
    </View>
  )
}
