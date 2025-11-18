import { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import SearchBar from "../../components/Index/SearchBar";
import { supabase } from "../../lib/supabase";

// Helpers UI
const SectionHeader = ({ title }) => (
  <View
    style={{
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: "#f8fafc",
    }}
  >
    <Text style={{ fontSize: 12, color: "#64748b", fontWeight: "600" }}>
      {title}
    </Text>
  </View>
);

export default function SearchScreen() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [users, setUsers] = useState([]); // { id, username, avatar_url }
  const [pets, setPets] = useState([]); // { pet_id, name, location, media_pet:[{source}] }

  const debouncedQuery = useDebounce(query, 350);

  // ===== Fetchers =====
  const fetchUsers = useCallback(async (text) => {
    if (!text) {
      setUsers([]);
      return;
    }
    const { data, error } = await supabase
      .from("user")
      .select("id, username, profile_pic")
      .ilike("username", `%${text}%`)
      .limit(20);
    if (!error) setUsers(data || []);
  }, []);

  const fetchPets = useCallback(async (text) => {
    if (!text) {
      setPets([]);
      return;
    }
    // Si tu PK fuera "id" en vez de "pet_id", no afecta aquíf
    const { data, error } = await supabase
      .from("pet")
      .select("id, name, location, media_pet(source)")
      .ilike("name", `%${text}%`)
      .limit(20);
    if (!error) setPets(data || []);
  }, []);

  const loadAll = useCallback(
    async (text) => {
      const term = (text ?? "").trim();
      setLoading(true);
      try {
        await Promise.all([fetchUsers(term), fetchPets(term)]);
      } finally {
        setLoading(false);
      }
    },
    [fetchUsers, fetchPets]
  );

  // Debounced search
  useEffect(() => {
    loadAll(debouncedQuery);
  }, [debouncedQuery, loadAll]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadAll(debouncedQuery);
    } finally {
      setRefreshing(false);
    }
  }, [debouncedQuery, loadAll]);

  // ===== Lists with sections =====
  const sections = useMemo(() => {
    const out = [];
    if (users.length)
      out.push(
        { type: "header", title: "Usuarios" },
        ...users.map((u) => ({ type: "user", ...u }))
      );
    if (pets.length)
      out.push(
        { type: "header", title: "Mascotas" },
        ...pets.map((p) => ({ type: "pet", ...p }))
      );
    return out;
  }, [users, pets]);

  const keyExtractor = (item, idx) => {
    if (item.type === "header") return `header-${item.title}-${idx}`;
    if (item.type === "user") return `user-${item.id}`;
    if (item.type === "pet") return `pet-${item.pet_id}`;
    return `row-${idx}`;
  };

  const renderItem = ({ item }) => {
    if (item.type === "header") {
      return <SectionHeader title={item.title} />;
    }

    if (item.type === "user") {
      const avatar =
        item.profile_pic || `https://i.pravatar.cc/150?u=${item.id}`;
      return (
        <Pressable
          onPress={() =>
            router.push({
              pathname: "indexScreens/profile/[id]",
              params: { index: item.id },
            })
          }
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 16,
            borderBottomWidth: 1,
            borderColor: "#eee",
            backgroundColor: "#fff",
          }}
        >
          <Image
            source={{ uri: avatar }}
            style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: "bold", fontSize: 16 }}>
              {item.username}
            </Text>
            <Text style={{ color: "#888", fontSize: 12 }}>Ver perfil</Text>
          </View>
          <View
            style={{
              backgroundColor: "#FE9B5C",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
            }}
          >
            <Text style={{ color: "white", fontWeight: "bold", fontSize: 12 }}>
              Ver
            </Text>
          </View>
        </Pressable>
      );
    }

    if (item.type === "pet") {
      const cover = item?.media_pet?.[0]?.source;
      return (
        <Pressable
          onPress={() =>
            router.push({
              pathname: "indexScreens/petProfile/[id]",
              params: { pet_id: String(item.id) }, // 👈 solo pet_id
            })
          }
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 16,
            borderBottomWidth: 1,
            borderColor: "#eee",
            backgroundColor: "#fff",
          }}
        >
          {cover ? (
            <Image
              source={{ uri: cover }}
              style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                marginRight: 12,
              }}
            />
          ) : (
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                marginRight: 12,
                backgroundColor: "#e5e7eb",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#6b7280", fontSize: 10 }}>Sin foto</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: "bold", fontSize: 16 }}>
              {item.name}
            </Text>
            <Text style={{ color: "#888", fontSize: 12 }}>
              {item.location || "Ver perfil de mascota"}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: "#FE9B5C",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
            }}
          >
            <Text style={{ color: "white", fontWeight: "bold", fontSize: 12 }}>
              Ver
            </Text>
          </View>
        </Pressable>
      );
    }

    return null;
  };

  const showEmptyState =
    !loading &&
    (query.trim().length === 0 || (users.length === 0 && pets.length === 0));

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: "white" },
          headerTitle: () => (
            <View style={{ marginLeft: -25, flex: 1 }}>
              <SearchBar
                onSearch={(text) => setQuery(text)}
                onClear={() => setQuery("")}
              />
            </View>
          ),
        }}
      />

      {loading && (
        <View style={{ paddingVertical: 20 }}>
          <ActivityIndicator />
        </View>
      )}

      {showEmptyState ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <Text style={{ color: "#6b7280" }}>
            {query.trim().length === 0
              ? "Busca usuarios o mascotas por nombre"
              : "No se encontraron resultados"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FE9B5C"
            />
          }
        />
      )}
    </View>
  );
}

/* === Hook de debounce simple === */
function useDebounce(value, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}
