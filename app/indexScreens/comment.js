import { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  Image,
  FlatList,
  RefreshControl,
  DeviceEventEmitter,
} from "react-native";
import { Heart, Dots, Bookmark, MessageIcon } from "../../components/Icon";
import { MessageOptions } from "../../components/Index/MessageOptions";
import { Slider } from "../../components/Index/Slider";
import { PostModal } from "../../components/Index/PostModal";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useUser } from "@clerk/clerk-expo";

// util
function tiempoTranscurrido(fechaISO) {
  if (!fechaISO) return "";
  const fecha = new Date(fechaISO);
  const ahora = new Date();
  const segundos = Math.floor((ahora.getTime() - fecha.getTime()) / 1000);
  const minutos = Math.floor(segundos / 60);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);
  if (segundos < 60) return "Hace unos segundos";
  if (minutos < 60) return `Hace ${minutos} minuto${minutos > 1 ? "s" : ""}`;
  if (horas < 24) return `Hace ${horas} hora${horas > 1 ? "s" : ""}`;
  return `Hace ${dias} día${dias > 1 ? "s" : ""}`;
}

export default function Comment() {
  const { index } = useLocalSearchParams(); // ← solo usamos index
  const postId = String(index);
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();

  // viewer / reacciones
  const [viewerId, setViewerId] = useState(null);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  // datos UI
  const [newComment, setNewComment] = useState("");
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showVerMas, setShowVerMas] = useState(false);
  const [comment, setComment] = useState([]);
  const [post, setPost] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState(null);
  const likeCommentRef = useRef(false);

  // refs anti-doble toque
  const likeRef = useRef(false);
  const bookmarkRef = useRef(false);

  // ---------- RESOLVER VIEWER ----------
  const resolveViewer = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;
    const { data, error } = await supabase
      .from("user")
      .select("id")
      .eq("clerk_id", user.id)
      .single();
    if (!error && data?.id) setViewerId(data.id);
  }, [isLoaded, isSignedIn, user?.id]);

  useEffect(() => {
    resolveViewer();
  }, [resolveViewer]);

  // ---------- FETCHES ----------
  const fetchPost = useCallback(async () => {
    const { data, error } = await supabase
      .from("post")
      .select(`*, media_post(*), comment(*), pet(*)`)
      .eq("id", postId)
      .single();
    if (!error && data) setPost(data);
  }, [postId]);

  // Combina los comentarios + likes del viewer
  const fetchCommentWithLikes = useCallback(async () => {
    if (!postId || !viewerId) return;

    // 1️⃣ Traer todos los comentarios del post
    const { data: comments, error } = await supabase
      .from("comment")
      .select(`*, user(*)`)
      .eq("post_id", postId)
      .order("created_at", { ascending: false });

    if (error || !comments) return;

    // 2️⃣ Obtener los ids de los comentarios
    const commentIds = comments.map((c) => c.id);

    // 3️⃣ Traer los likes del usuario actual en esos comentarios
    const { data: myLikes } = await supabase
      .from("comment_likes")
      .select("comment_id")
      .eq("user_id", viewerId)
      .in("comment_id", commentIds);

    // 4️⃣ Crear un Set para búsquedas rápidas
    const likedSet = new Set(myLikes?.map((r) => r.comment_id));

    // 5️⃣ Combinar resultados
    const commentsWithLiked = comments.map((c) => ({
      ...c,
      liked: likedSet.has(c.id),
    }));

    // 6️⃣ Guardar en estado
    setComment(commentsWithLiked);
  }, [postId, viewerId]);

  const loadViewerReactions = useCallback(async () => {
    if (!viewerId || !postId) return;
    // like
    const { data: likeRows } = await supabase
      .from("post_likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", viewerId)
      .limit(1);
    setLiked(!!(likeRows && likeRows.length));
    // bookmark
    const { data: bmRows } = await supabase
      .from("post_bookmarks")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", viewerId)
      .limit(1);
    setBookmarked(!!(bmRows && bmRows.length));
  }, [viewerId, postId]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchPost(),
        fetchCommentWithLikes(),
        loadViewerReactions(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchPost, fetchCommentWithLikes, loadViewerReactions]);

  useEffect(() => {
    handleRefresh();
  }, [postId, viewerId, handleRefresh]);

  // extra: si el viewer aparece luego (por auth), revalida reacciones
  useEffect(() => {
    if (viewerId && postId) {
      loadViewerReactions();
    }
  }, [viewerId, postId, loadViewerReactions]);

  // ---------- NOTIFICACIONES ----------
  const ensureNotification = async (thePostId) => {
    try {
      const recipientId = post?.user_id; // dueño del post
      const actorId = viewerId;
      if (!recipientId || !actorId || recipientId === actorId) return;

      const { data: existing, error: selErr } = await supabase
        .from("notification")
        .select("id")
        .eq("user_id", recipientId)
        .eq("post_id", thePostId)
        .eq("notification_type", "like")
        .limit(1);

      if (selErr) {
        console.error("Error consultando notificación:", selErr.message);
        return;
      }
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

  // ---------- LIKE POST ----------
  const handleTapLike = async () => {
    if (likeRef.current) return;
    likeRef.current = true;

    const willLike = !liked;
    const delta = willLike ? 1 : -1;

    try {
      setLiked(willLike); // optimista

      await persistLikeDelta(delta);
      await persistUserLike(willLike);

      DeviceEventEmitter.emit("post:likeChanged", {
        postId: String(postId),
        liked: willLike,
        delta,
      });

      if (willLike) ensureNotification?.(postId);

      // 🔄 revalidar estado desde BD para que el icono coincida siempre
      await loadViewerReactions();
    } catch (e) {
      setLiked((prev) => !prev);
      console.error("Error actualizando like:", e?.message || e);
    } finally {
      likeRef.current = false;
    }
  };

  const persistLikeDelta = async (delta) => {
    const { data, error } = await supabase
      .from("post")
      .select("likes")
      .eq("id", postId)
      .single();
    if (error) throw error;

    const newLikes = Math.max((data?.likes ?? 0) + delta, 0);
    const { error: upErr } = await supabase
      .from("post")
      .update({ likes: newLikes })
      .eq("id", postId);
    if (upErr) throw upErr;

    return newLikes;
  };

  const persistUserLike = async (willLike) => {
    if (!viewerId) throw new Error("viewerId no definido");

    if (willLike) {
      const { error } = await supabase
        .from("post_likes")
        .insert({ post_id: postId, user_id: viewerId });
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
        .eq("user_id", viewerId);
      if (error) throw error;
    }
  };

  // ---------- BOOKMARK POST ----------
  const handleTapBookmark = async () => {
    if (bookmarkRef.current) return;
    bookmarkRef.current = true;

    const willBookmark = !bookmarked;

    try {
      setBookmarked(willBookmark); // optimista
      await persistUserBookmark(willBookmark);

      DeviceEventEmitter.emit("post:bookmarkChanged", {
        postId: String(postId),
        bookmarked: willBookmark,
      });

      // 🔄 revalidar estado desde BD
      await loadViewerReactions();
    } catch (e) {
      setBookmarked((prev) => !prev);
      console.error("Error actualizando bookmark:", e?.message || e);
    } finally {
      bookmarkRef.current = false;
    }
  };

  const persistUserBookmark = async (willBookmark) => {
    if (!viewerId) throw new Error("viewerId no definido");

    if (willBookmark) {
      const { error } = await supabase
        .from("post_bookmarks")
        .insert({ post_id: postId, user_id: viewerId });
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
        .eq("user_id", viewerId);
      if (error) throw error;
    }
  };

  // ---------- COMMENTS ----------
  const handleAddComment = async (thePostId) => {
    if (newComment.trim() === "") return;

    const clerkId = user?.id;
    if (!clerkId) {
      alert("Debes iniciar sesión para comentar.");
      return;
    }

    const { data: supaUser, error: supaErr } = await supabase
      .from("user")
      .select("id, username")
      .eq("clerk_id", clerkId)
      .single();
    if (supaErr || !supaUser) return;

    const { data: inserted, error } = await supabase
      .from("comment")
      .insert([
        {
          content: newComment.trim(),
          post_id: thePostId,
          user_id: supaUser.id,
          likes: 0,
        },
      ])
      .select("id, created_at")
      .single();

    await persistCommentDelta(1);

    DeviceEventEmitter.emit("post:commentChanged", {
      postId: String(thePostId),
      delta: 1,
    });

    if (!error && inserted) {
      setComment((prev) => [
        {
          id: inserted.id,
          user: { username: supaUser.username || "Tú" },
          content: newComment.trim(),
          created_at: inserted.created_at,
          liked: false,
          likes: 0,
        },
        ...prev,
      ]);
      setNewComment("");
    }
  };

  const handleDeleteComment = async (id) => {
    if (!id) return;
    const prev = [...comment];
    setComment((curr) => curr.filter((c) => c.id !== id));
    try {
      const { error } = await supabase.from("comment").delete().eq("id", id);
      await persistCommentDelta(-1);

      DeviceEventEmitter.emit("post:commentChanged", {
        postId: String(postId),
        delta: -1,
      });

      if (error) throw error;
    } catch (e) {
      console.error("Error eliminando comentario:", e.message);
      setComment(prev);
      alert("No se pudo eliminar el comentario. Intenta de nuevo.");
    }
  };

  const persistCommentDelta = async (delta) => {
    const { data, error } = await supabase
      .from("post")
      .select("comments")
      .eq("id", postId)
      .single();
    if (error) throw error;

    const newCount = Math.max((data?.comments ?? 0) + delta, 0);
    const { error: upErr } = await supabase
      .from("post")
      .update({ comments: newCount })
      .eq("id", postId);
    if (upErr) throw upErr;

    return newCount;
  };

  const bumpCommentLikesCounter = async (commentId, delta) => {
    // lee el valor actual
    const { data, error } = await supabase
      .from("comment")
      .select("likes")
      .eq("id", commentId)
      .single();
    if (error) throw error;

    const newLikes = Math.max(0, (data?.likes ?? 0) + delta);

    const { error: upErr } = await supabase
      .from("comment")
      .update({ likes: newLikes })
      .eq("id", commentId);
    if (upErr) throw upErr;

    return newLikes;
  };

  const handleLikeComment = async (commentId, wasLiked) => {
    if (likeCommentRef.current) return;
    likeCommentRef.current = true;

    try {
      const delta = wasLiked ? -1 : +1;

      // UI optimista
      setComment((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                liked: !wasLiked,
                likes: Math.max(0, (c.likes ?? 0) + delta),
              }
            : c
        )
      );

      if (!wasLiked) {
        const { error } = await supabase
          .from("comment_likes")
          .insert({ comment_id: commentId, user_id: viewerId });
        if (error) {
          const msg = (error.message || JSON.stringify(error)).toLowerCase();
          if (!msg.includes("duplicate") && !msg.includes("unique")) {
            throw error;
          }
        }
      } else {
        const { error } = await supabase
          .from("comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", viewerId);
        if (error) throw error;
      }

      // 👇 ACTUALIZA el contador real en BD
      await bumpCommentLikesCounter(commentId, delta);
    } catch (e) {
      // Revertir UI si algo falla
      setComment((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                liked: wasLiked,
                likes: Math.max(0, (c.likes ?? 0) + (wasLiked ? 1 : -1)),
              }
            : c
        )
      );
      console.error("Error toggling comment like:", e.message || e);
    } finally {
      likeCommentRef.current = false;
    }
  };

  // ---------- UI ----------
  const imagesArray =
    Array.isArray(post?.media_post) &&
    post.media_post.map((m) => ({ type: m.type, source: m.source }));

  const onTextLayout = (e) => setShowVerMas(e.nativeEvent.lines.length > 2);
  const keyExtractor = useCallback((item) => String(item.id), []);

  const ListHeader = (
    <View>
      {/* HEADER POST */}
      <View className="flex-row items-center mx-4 mt-4">
        <Pressable
          onPress={() =>
            router.push({
              pathname: "indexScreens/petProfile/[id]",
              params: {
                pet_id: post?.pet?.id,
              },
            })
          }
          className="flex-row gap-2 items-center"
        >
          <Image
            className="w-10 h-10 rounded-full"
            source={{ uri: post?.pet?.logo }}
          />
          <View>
            <Text className="text-gray-700 font-medium">{post?.pet?.name}</Text>
            <Text className="text-gray-400 text-sm">
              {tiempoTranscurrido(post?.created_at)}
            </Text>
          </View>
        </Pressable>

        <Pressable
          className="ml-auto"
          onPress={() => setPostModalVisible(true)}
        >
          <Dots color={"black"} size={22} />
        </Pressable>

        <PostModal
          visible={postModalVisible}
          onClose={() => setPostModalVisible(false)}
          selectedPostIndex={postId}
          onSave={handleTapBookmark}
          onReport={() =>
            alert(`Publicación reportada: ${post?.pet?.name || "Mascota"}`)
          }
        />
      </View>

      {/* SLIDER con doble-tap */}
      <View className="mt-2">
        <Slider images={imagesArray || []} onHandleDoubleTap={handleTapLike} />
      </View>

      {/* ACCIONES */}
      <View className="flex-row gap-4 mt-2 mx-4 items-center">
        <Pressable onPress={handleTapLike} className="flex-row items-center">
          {/* Si tus iconos soportan 'filled', pásalo así: <Heart filled={liked} ... /> */}
          <Heart color={liked ? "red" : "#374151"} size={24} />
        </Pressable>

        <Pressable>
          <MessageIcon color={"#374151"} size={24} />
        </Pressable>

        <Pressable onPress={handleTapBookmark} className="ml-auto">
          {/* Igual para bookmark: <Bookmark filled={bookmarked} ... /> si está disponible */}
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
          {post?.description}
        </Text>
        {showVerMas && (
          <Text className="text-gray-500">
            {expanded ? "Ver menos" : "Ver más..."}
          </Text>
        )}
      </Pressable>

      <View className="border-t border-gray-200 mx-4 my-4" />

      {/* AGREGAR COMENTARIO */}
      <View className="flex-row items-center mb-3 px-4">
        <TextInput
          placeholder="Agregar un comentario..."
          value={newComment}
          onChangeText={setNewComment}
          className="flex-1 text-base px-3 py-2 bg-gray-100 rounded-full mr-2"
        />
        <Pressable onPress={() => handleAddComment(postId)}>
          <Text className="text-blue-600 font-semibold">Enviar</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: "white" },
          headerTitle: "Comentarios",
        }}
      />
      <FlatList
        data={comment}
        keyExtractor={keyExtractor}
        renderItem={({ item, index }) => (
          <View className="px-4">
            <Pressable
              className="flex-row gap-x-1"
              onPress={() =>
                router.push({
                  pathname: "indexScreens/profile/[id]",
                  params: { index: item.user?.id },
                })
              }
            >
              <Image
                className="h-5 w-5 rounded-full"
                source={{ uri: item.user?.profile_pic }}
              />
              <Text className="text-gray-800 font-medium">
                {item.user?.username}
              </Text>
            </Pressable>
            <Pressable
              onLongPress={() => {
                setSelectedIndex(index);
                setOptionsVisible(true);
                setSelectedCommentId(item.id);
              }}
            >
              <View className="flex-row items-center mb-2">
                <View className="pb-1">
                  <Text className="text-gray-600">{item.content}</Text>
                  <Text className="text-gray-400 text-sm">
                    {tiempoTranscurrido(item.created_at)}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleLikeComment(item.id, item.liked)}
                  className="ml-auto flex-row items-center"
                >
                  <Heart size={18} color={item.liked ? "red" : "#374151"} />
                  <Text className="text-gray-600 ml-1">{item.likes}</Text>
                </Pressable>
              </View>
            </Pressable>
          </View>
        )}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={
          <MessageOptions
            visible={optionsVisible}
            onClose={() => setOptionsVisible(false)}
            selectedCommentIndex={selectedIndex}
            selectedCommentId={selectedCommentId}
            onDelete={(id) => handleDeleteComment(id)}
            onReport={(id) => {
              const u =
                comment.find((c) => c.id === id)?.user?.username ||
                "desconocido";
              alert(`Comentario reportado: ${u}`);
            }}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#ff8b44"
          />
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}
