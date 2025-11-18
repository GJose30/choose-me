import { Text, View, Image, Pressable } from "react-native";
import { Dots, Heart, MessageIcon, Bookmark } from "../Icon";
import { useState, useRef, useEffect, useCallback } from "react";
import { PostModal } from "./PostModal";
import { useRouter } from "expo-router";
import { Slider } from "./Slider";
import { supabase } from "../../lib/supabase";
import { DeviceEventEmitter } from "react-native";

// Función auxiliar para mostrar el tiempo transcurrido
function tiempoTranscurrido(fechaISO) {
  const fecha = new Date(fechaISO);
  const ahora = new Date();
  const segundos = Math.floor((ahora - fecha) / 1000);

  const minutos = Math.floor(segundos / 60);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);

  if (segundos < 60) return "Hace unos segundos";
  if (minutos < 60) return `Hace ${minutos} minuto${minutos > 1 ? "s" : ""}`;
  if (horas < 24) return `Hace ${horas} hora${horas > 1 ? "s" : ""}`;
  return `Hace ${dias} día${dias > 1 ? "s" : ""}`;
}

export function PostItem({
  dataPost,
  id,
  index,
  onHidePost,
  onReportPost,
  currentUser,
  likedInitial,
  bookmarkedInitial,
}) {
  const router = useRouter();
  const [postModalVisible, setPostModalVisible] = useState(false);

  // Estados de interacción
  const [liked, setLiked] = useState(!!likedInitial);
  const [likesCount, setLikesCount] = useState(dataPost.likes ?? 0);
  const [bookmarked, setBookmarked] = useState(!!bookmarkedInitial);
  const [commentsCount, setCommentsCount] = useState(dataPost.comments ?? 0);
  const [expanded, setExpanded] = useState(false);
  const [showVerMas, setShowVerMas] = useState(false);

  // Refs para evitar múltiples llamadas simultáneas
  const updatingRef = useRef(false);
  const bookmarkingRef = useRef(false);

  // ---------- NOTIFICACIONES ----------
  const ensureNotification = async (thePostId) => {
    try {
      const recipientId = dataPost?.user_id; // dueño del post
      const actorId = currentUser;

      if (!recipientId || !actorId) return;

      // ¿ya existe?
      const { data: existing, error: selErr } = await supabase
        .from("notification")
        .select("id")
        .eq("user_id", recipientId)
        .eq("post_id", thePostId)
        .eq("notification_type", "like")
        .limit(1);

      if (selErr) return;
      if (existing?.length) return;

      await supabase.from("notification").insert([
        {
          user_id: recipientId,
          post_id: thePostId,
          notification_type: "like",
          message: "Tu mascota ha recibido un like",
          is_read: false,
        },
      ]);
    } catch (e) {
      console.error("Fallo ensureNotification:", e.message);
    }
  };

  // ---------- LIKE ----------
  const handleTapLike = async () => {
    if (updatingRef.current) return;
    updatingRef.current = true;

    const willLike = !liked;
    const delta = willLike ? 1 : -1;

    try {
      setLiked(willLike);
      setLikesCount((prev) => Math.max(0, prev + delta));

      await persistLikeDelta(delta);
      await persistUserLike(willLike);

      // Notificar a Main (opcional, si lo usas)
      DeviceEventEmitter.emit("post:likeChanged", {
        postId: String(dataPost.id),
        liked: willLike,
        delta,
      });

      if (willLike) ensureNotification?.(dataPost.id);
    } catch (e) {
      setLiked((prev) => !prev);
      setLikesCount((prev) => Math.max(0, prev - delta));
      console.error("Error actualizando like:", e?.message || e);
    } finally {
      updatingRef.current = false;
    }
  };

  const persistLikeDelta = async (delta) => {
    const { data, error } = await supabase
      .from("post")
      .select("likes")
      .eq("id", dataPost.id)
      .single();
    if (error) throw error;

    const newLikes = Math.max((data?.likes ?? 0) + delta, 0);
    const { error: upErr } = await supabase
      .from("post")
      .update({ likes: newLikes })
      .eq("id", dataPost.id);
    if (upErr) throw upErr;

    return newLikes;
  };

  const persistUserLike = async (willLike) => {
    const postId = dataPost.id;
    const userId = currentUser;
    if (!userId) throw new Error("currentUser no definido");

    if (willLike) {
      const { error } = await supabase
        .from("post_likes")
        .insert({ post_id: postId, user_id: userId });

      if (error) {
        const msg = (error.message || JSON.stringify(error)).toLowerCase();
        if (
          msg.includes("duplicate key") ||
          msg.includes("unique") ||
          msg.includes("already exists") ||
          msg.includes("conflict")
        )
          return;
        throw error;
      }
    } else {
      const { error } = await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);
      if (error) throw error;
    }
  };

  // ---------- BOOKMARK ----------
  const handleTapBookmark = async () => {
    if (bookmarkingRef.current) return;
    bookmarkingRef.current = true;

    const willBookmark = !bookmarked;

    try {
      setBookmarked(willBookmark);
      await persistUserBookmark(willBookmark);

      DeviceEventEmitter.emit("post:bookmarkChanged", {
        postId: String(dataPost.id),
        bookmarked: willBookmark,
      });
    } catch (e) {
      setBookmarked((prev) => !prev);
      console.error("Error actualizando bookmark:", e?.message || e);
    } finally {
      bookmarkingRef.current = false;
    }
  };

  const persistUserBookmark = async (willBookmark) => {
    const postId = dataPost.id;
    const userId = currentUser;
    if (!userId) throw new Error("currentUser no definido");

    if (willBookmark) {
      const { error } = await supabase
        .from("post_bookmarks")
        .insert({ post_id: postId, user_id: userId });

      if (error) {
        const msg = (error.message || JSON.stringify(error)).toLowerCase();
        if (
          msg.includes("duplicate key") ||
          msg.includes("unique") ||
          msg.includes("already exists") ||
          msg.includes("conflict")
        )
          return;
        throw error;
      }
    } else {
      const { error } = await supabase
        .from("post_bookmarks")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);
      if (error) throw error;
    }
  };

  // ---------- EFECTOS (sincronización) ----------
  // Sincroniza liked/bookmarked si cambian los initial props
  useEffect(() => {
    setLiked(!!likedInitial);
  }, [likedInitial]);

  useEffect(() => {
    setBookmarked(!!bookmarkedInitial);
  }, [bookmarkedInitial]);

  // Asegura valores base si llegan undefined
  useEffect(() => {
    setLikesCount(dataPost.likes ?? 0);
    setCommentsCount(dataPost.comments ?? 0);
  }, [dataPost.id, dataPost.likes, dataPost.comments]);

  // (A) Realtime Supabase — escucha cambios en post.comments del post actual
  useEffect(() => {
    if (!dataPost?.id) return;

    const channel = supabase
      .channel(`post-comments-${dataPost.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "post",
          filter: `id=eq.${dataPost.id}`,
        },
        (payload) => {
          const newVal = payload?.new?.comments;
          if (typeof newVal === "number") {
            setCommentsCount(newVal);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dataPost?.id]);

  // (B) Evento local — actualiza al instante cuando Comment emite cambios
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      "post:commentChanged",
      ({ postId, delta, newCount }) => {
        if (String(postId) !== String(dataPost?.id)) return;
        setCommentsCount((prev) =>
          typeof newCount === "number"
            ? newCount
            : Math.max(0, (prev ?? 0) + (delta ?? 0))
        );
      }
    );
    return () => sub.remove();
  }, [dataPost?.id]);

  // ---------- UI ----------
  const onTextLayout = (e) => {
    setShowVerMas(e.nativeEvent.lines.length > 2);
  };

  const imagesArray = Array.isArray(dataPost.media_post)
    ? dataPost.media_post.map((item) => ({
        type: item.type,
        source: item.source,
      }))
    : [];

  return (
    <View className="my-4">
      {/* HEADER DEL POST */}
      <View className="flex-row items-center mx-4">
        <Pressable
          className="flex-row gap-2 items-center"
          onPress={() =>
            router.push({
              pathname: "indexScreens/petProfile/[id]",
              params: {
                pet_id: id,
              },
            })
          }
        >
          <Image
            className="w-10 h-10 rounded-full"
            source={{ uri: `${dataPost.pet.logo}` }}
          />
          <View>
            <Text className="text-gray-700 font-medium">
              {dataPost.pet.name}
            </Text>
            <Text className="text-gray-400 text-sm">
              {tiempoTranscurrido(dataPost.created_at)}
            </Text>
          </View>
        </Pressable>

        <Pressable
          className="ml-auto"
          onPress={() => setPostModalVisible(true)}
        >
          <Dots color="black" size={22} />
        </Pressable>

        <PostModal
          visible={postModalVisible}
          onClose={() => setPostModalVisible(false)}
          selectedPostIndex={index}
          onSave={handleTapBookmark}
          onHidePost={onHidePost}
          onReport={onReportPost}
        />
      </View>

      {/* SLIDER */}
      <View className="mt-2">
        <Slider
          images={imagesArray}
          onHandleDoubleTap={() => handleTapLike()}
        />
      </View>

      {/* ACCIONES */}
      <View className="flex-row gap-3 mt-2 mx-4">
        {/* LIKE */}
        <Pressable
          onPress={handleTapLike}
          className="flex-row gap-1 items-center"
        >
          <Heart color={liked ? "red" : "#374151"} size={24} />
          <Text className="text-gray-600 font-medium text-lg">
            {likesCount}
          </Text>
        </Pressable>

        {/* COMENTARIOS */}
        <Pressable
          className="flex-row gap-2 items-center"
          onPress={() =>
            router.push({
              pathname: "indexScreens/comment",
              params: { index: dataPost.id }, // 👈 solo el id del post
            })
          }
        >
          <MessageIcon color="#374151" size={24} />
          <Text className="text-gray-600 font-medium text-lg">
            {commentsCount}
          </Text>
        </Pressable>

        {/* BOOKMARK */}
        <Pressable onPress={handleTapBookmark} className="ml-auto">
          <Bookmark color={bookmarked ? "orange" : "#374151"} size={24} />
        </Pressable>
      </View>

      {/* DESCRIPCIÓN */}
      <Pressable onPress={() => setExpanded(!expanded)} className="mt-2 mx-4">
        <Text
          numberOfLines={expanded ? undefined : 2}
          onTextLayout={onTextLayout}
          className="text-gray-800"
        >
          {dataPost.description}
        </Text>
        {showVerMas && (
          <Text className="text-gray-500 font-light">
            {expanded ? "Ver menos" : "Ver más..."}
          </Text>
        )}
      </Pressable>
    </View>
  );
}
