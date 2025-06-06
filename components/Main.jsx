import { FlatList } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PostItem } from "./Index/PostItem";
import { Screen } from "./Screen";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useCallback, useEffect } from "react";
import { supabase } from "../lib/supabase";

// const Post = [
//   {
//     nombre: "Buster Hernandez",
//     descripcion:
//       "Rocky es un amor de perrito, lleno de energía y con ganas de llenar de alegría el hogar que le dé una oportunidad. Rocky es un amor de perrito, lleno de energía y con ganas de llenar de alegría el hogar que le dé una oportunidad.",
//     logo: "https://cdn.sanity.io/images/5vm5yn1d/pro/5cb1f9400891d9da5a4926d7814bd1b89127ecba-1300x867.jpg?fm=webp&q=80",
//     media: [
//       {
//         tipo: "image",
//         fuente:
//           "https://cdn.sanity.io/images/5vm5yn1d/pro/5cb1f9400891d9da5a4926d7814bd1b89127ecba-1300x867.jpg?fm=webp&q=80",
//       },
//       {
//         tipo: "image",
//         fuente:
//           "https://images.ctfassets.net/denf86kkcx7r/76LfU7b9ixCa7W2Wj579AZ/9b80697718ff08853ad7388e08c4bfd6/shutterstock_2502183265.jpg?fm=webp&w=550",
//       },
//       {
//         tipo: "video",
//         fuente:
//           "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
//       },
//     ],
//   },
//   {
//     nombre: "Kitty Garcia",
//     descripcion:
//       "Rocky es un amor de perrito, lleno de energía y con ganas de llenar de alegría el hogar que le dé una oportunidad.",
//     logo: "https://urgenciesveterinaries.com/wp-content/uploads/2023/09/survet-gato-caida-pelo-01.jpeg",
//     media: [
//       {
//         tipo: "image",
//         fuente:
//           "https://urgenciesveterinaries.com/wp-content/uploads/2023/09/survet-gato-caida-pelo-01.jpeg",
//       },
//     ],
//   },
//   {
//     nombre: "Leo Panthera",
//     descripcion:
//       "Rocky es un amor de perrito, lleno de energía y con ganas de llenar de alegría el hogar que le dé una oportunidad.",
//     logo: "https://purina.com.pa/sites/default/files/2022-11/purina-brand-cuanto-vive-un-gato-nota_03.jpg",
//     media: [
//       {
//         tipo: "image",
//         fuente:
//           "https://purina.com.pa/sites/default/files/2022-11/purina-brand-cuanto-vive-un-gato-nota_03.jpg",
//       },
//     ],
//   },
//   {
//     nombre: "Charly Anthonio",
//     descripcion:
//       "Rocky es un amor de perrito, lleno de energía y con ganas de llenar de alegría el hogar que le dé una oportunidad.",
//     logo: "https://okdiario.com/img/2025/04/08/el-significado-de-que-tu-perro-te-chupe-los-pies-sin-parar-635x358.jpg",
//     media: [
//       {
//         tipo: "image",
//         fuente:
//           "https://okdiario.com/img/2025/04/08/el-significado-de-que-tu-perro-te-chupe-los-pies-sin-parar-635x358.jpg",
//       },
//     ],
//   },
//   {
//     nombre: "Benito Sanchez",
//     descripcion:
//       "Rocky es un amor de perrito, lleno de energía y con ganas de llenar de alegría el hogar que le dé una oportunidad.",
//     logo: "https://vitakraft.es/wp-content/uploads/2020/12/Blog_HistoriaPerros-1110x600.jpg",
//     media: [
//       {
//         tipo: "image",
//         fuente:
//           "https://vitakraft.es/wp-content/uploads/2020/12/Blog_HistoriaPerros-1110x600.jpg",
//       },
//     ],
//   },
// ];

export function Main() {
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = async () => {
    const { data, error } = await supabase.from("pet").select(`
        *,
        post (
          *,
          media (
          *
          )
        )
        
      `);

    if (error) {
      console.error("Error fetching posts:", error.message);
    } else {
      setPosts(data);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts(); // quita el timeout si no necesitas "simular carga"
    setRefreshing(false);
  }, []);

  // const [posts, setPosts] = useState(Post);

  // const handleRefresh = useCallback(() => {
  //   setRefreshing(true);

  //   setTimeout(() => {
  //     setPosts(fetchPosts);
  //     setRefreshing(false);
  //   }, 1000);
  // }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <Screen>
          <FlatList
            data={posts}
            keyExtractor={(index) => index.id}
            showsVerticalScrollIndicator={false}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            renderItem={({ item, index }) => (
              <PostItem
                data={item}
                index={index}
                onHidePost={(i) => {
                  const updated = [...posts];
                  updated.splice(i, 1);
                  setPosts(updated);
                }}
                onReportPost={(i) => {
                  alert(`Publicación reportada: ${posts[i].nombre}`);
                }}
              />
            )}
          />
        </Screen>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
