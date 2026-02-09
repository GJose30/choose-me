import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useUser } from "@clerk/clerk-expo";

const STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

function StatusPill({ status }) {
  const label =
    status === STATUS.PENDING
      ? "Pendiente"
      : status === STATUS.APPROVED
        ? "Aprobada"
        : "Rechazada";

  const cls =
    status === STATUS.PENDING
      ? "bg-orange-100 text-orange-700 border-orange-200"
      : status === STATUS.APPROVED
        ? "bg-green-100 text-green-700 border-green-200"
        : "bg-red-100 text-red-700 border-red-200";

  return (
    <View className={`px-3 py-1 rounded-full border ${cls}`}>
      <Text className="text-xs font-semibold">{label}</Text>
    </View>
  );
}

function FilterButton({ label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-4 py-2 rounded-full border ${
        active ? "bg-[#FE9B5C] border-[#FE9B5C]" : "bg-white border-gray-200"
      }`}
    >
      <Text
        className={`text-sm font-semibold ${
          active ? "text-white" : "text-gray-700"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function RequestCard({ item, onOpen, onApprove, onReject }) {
  return (
    <Pressable
      className="bg-white border border-gray-200 rounded-2xl p-4 mb-3"
      onPress={() => onOpen(item)}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text
            className="text-base font-semibold text-gray-800"
            numberOfLines={1}
          >
            {item?.pet?.name
              ? `Solicitud por ${item.pet.name}`
              : "Solicitud de adopción"}
          </Text>

          <Text className="text-sm text-gray-600 mt-1" numberOfLines={1}>
            {item?.requester?.username
              ? `De: @${item.requester.username}`
              : "De: Usuario"}
          </Text>

          {!!item?.message && (
            <Text className="text-sm text-gray-700 mt-2" numberOfLines={2}>
              {item.message}
            </Text>
          )}

          <Text className="text-xs text-gray-400 mt-2">
            {item?.created_at ? new Date(item.created_at).toLocaleString() : ""}
          </Text>
        </View>

        <StatusPill status={item?.status} />
      </View>

      {item?.status === STATUS.PENDING ? (
        <View className="flex-row gap-2 mt-4">
          <Pressable
            className="flex-1 bg-[#FE9B5C] py-3 rounded-full items-center"
            onPress={() => onApprove(item)}
          >
            <Text className="text-white font-semibold">Aprobar</Text>
          </Pressable>

          <Pressable
            className="flex-1 bg-gray-100 py-3 rounded-full items-center"
            onPress={() => onReject(item)}
          >
            <Text className="text-gray-700 font-semibold">Rechazar</Text>
          </Pressable>
        </View>
      ) : null}
    </Pressable>
  );
}

export default function AdoptionRequestsScreen() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();

  const [userRow, setUserRow] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("PENDING");
  const [fatalError, setFatalError] = useState(null);

  // ✅ Ahora sí: calculado después de userRow, y tolerante
  const isFoundation =
    String(userRow?.account_type || "").toUpperCase() === "FOUNDATION";

  const fetchUserRow = useCallback(async () => {
    if (!isLoaded || !isSignedIn || !user?.id) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("user")
      .select("*")
      .eq("clerk_id", user.id)
      .single();

    if (error) {
      console.error("fetchUserRow:", error.message);
      setFatalError("No se pudo cargar tu perfil.");
      setUserRow(null);
      setLoading(false);
      return;
    }

    setUserRow(data);
    setFatalError(null);
    setLoading(false);
  }, [isLoaded, isSignedIn, user?.id]);

  const fetchRequests = useCallback(async () => {
    if (!userRow?.id) return;

    // Solo fundación
    if (String(userRow.account_type || "").toUpperCase() !== "FOUNDATION") {
      setRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    let query = supabase
      .from("adoption_request")
      .select(
        "id,status,message,created_at,pet:pet_id(id,name),requester:requester_user_id(id,username,profile_pic)",
      )
      .eq("owner_user_id", userRow.id)
      .order("created_at", { ascending: false });

    if (filter !== "ALL") query = query.eq("status", filter);

    const { data, error } = await query;

    if (error) {
      console.error("fetchRequests:", error.message);
      setFatalError(error.message);
      setRequests([]);
      setLoading(false);
      return;
    }

    setFatalError(null);
    setRequests(data || []);
    setLoading(false);
  }, [userRow?.id, userRow?.account_type, filter]);

  // ✅ cargar perfil una vez (cuando el login esté listo)
  useEffect(() => {
    fetchUserRow();
  }, [fetchUserRow]);

  // ✅ fetch requests cuando userRow ya existe o cambia filtro
  useEffect(() => {
    if (!userRow?.id) return;
    fetchRequests();
  }, [userRow?.id, filter, fetchRequests]);

  // ✅ si quieres log del userRow real, hazlo aquí:
  useEffect(() => {
    if (userRow) console.log("USER ROW:", userRow);
  }, [userRow]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchRequests();
    } finally {
      setRefreshing(false);
    }
  }, [fetchRequests]);

  const updateRequestStatus = useCallback(async (requestId, newStatus) => {
    const { error } = await supabase
      .from("adoption_request")
      .update({ status: newStatus })
      .eq("id", requestId);

    if (error) {
      console.error("updateRequestStatus:", error.message);
      Alert.alert("Error", "No se pudo actualizar la solicitud.");
      return false;
    }
    return true;
  }, []);

  const onApprove = useCallback(
    async (item) => {
      Alert.alert("Aprobar", "¿Deseas aprobar esta solicitud?", [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Aprobar",
          onPress: async () => {
            const ok = await updateRequestStatus(item.id, STATUS.APPROVED);
            if (ok) await fetchRequests();
          },
        },
      ]);
    },
    [updateRequestStatus, fetchRequests],
  );

  const onReject = useCallback(
    async (item) => {
      Alert.alert("Rechazar", "¿Deseas rechazar esta solicitud?", [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Rechazar",
          style: "destructive",
          onPress: async () => {
            const ok = await updateRequestStatus(item.id, STATUS.REJECTED);
            if (ok) await fetchRequests();
          },
        },
      ]);
    },
    [updateRequestStatus, fetchRequests],
  );

  const onOpen = useCallback((item) => {
    Alert.alert(
      "Detalle",
      `Mascota: ${item?.pet?.name || "-"}\nDe: @${item?.requester?.username || "-"}\nEstado: ${item?.status || "-"}`,
    );
  }, []);

  const headerTitle = useMemo(() => {
    return isFoundation ? "Solicitudes de adopción" : "Solicitudes";
  }, [isFoundation]);

  // ✅ Guard clave: si aún no hay userRow, no muestres "no fundación"
  if (!isLoaded || !isSignedIn || !userRow) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (fatalError) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-gray-700 font-semibold text-lg text-center">
          Ocurrió un error
        </Text>
        <Text className="text-gray-500 text-center mt-2">{fatalError}</Text>

        <Pressable
          className="mt-5 bg-[#FE9B5C] px-5 py-3 rounded-full"
          onPress={() => fetchRequests()}
        >
          <Text className="text-white font-semibold">Reintentar</Text>
        </Pressable>

        <Pressable
          className="mt-3 bg-gray-100 px-5 py-3 rounded-full"
          onPress={() => router.back()}
        >
          <Text className="text-gray-700 font-semibold">Volver</Text>
        </Pressable>
      </View>
    );
  }

  if (!isFoundation) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-gray-700 font-semibold text-lg text-center">
          Esta sección es solo para fundaciones.
        </Text>
        <Text className="text-gray-500 text-center mt-2">
          Tu cuenta no está marcada como fundación.
        </Text>
        <Pressable
          className="mt-5 bg-gray-100 px-5 py-3 rounded-full"
          onPress={() => router.back()}
        >
          <Text className="text-gray-700 font-semibold">Volver</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen
        options={{
          headerTitle,
          headerShadowVisible: false,
        }}
      />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <View className="flex-1">
          {/* Filtros */}
          <View className="px-4 pt-4 pb-2">
            <View className="flex-row gap-2 flex-wrap">
              <FilterButton
                label="Pendientes"
                active={filter === "PENDING"}
                onPress={() => setFilter("PENDING")}
              />
              <FilterButton
                label="Aprobadas"
                active={filter === "APPROVED"}
                onPress={() => setFilter("APPROVED")}
              />
              <FilterButton
                label="Rechazadas"
                active={filter === "REJECTED"}
                onPress={() => setFilter("REJECTED")}
              />
              <FilterButton
                label="Todas"
                active={filter === "ALL"}
                onPress={() => setFilter("ALL")}
              />
            </View>
          </View>

          {/* Lista */}
          <FlatList
            data={requests}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <RequestCard
                item={item}
                onOpen={onOpen}
                onApprove={onApprove}
                onReject={onReject}
              />
            )}
            contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#FE9B5C"
              />
            }
            ListEmptyComponent={
              <View className="items-center justify-center py-20">
                <Text className="text-gray-500">
                  {filter === "PENDING"
                    ? "No tienes solicitudes pendientes."
                    : "No hay solicitudes para mostrar."}
                </Text>
              </View>
            }
          />
        </View>
      )}
    </View>
  );
}
