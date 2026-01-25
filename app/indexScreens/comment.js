import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  Image,
  FlatList,
  RefreshControl,
  DeviceEventEmitter,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Heart, Dots, Bookmark, MessageIcon } from "../../components/Icon";
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

const FALLBACK_AVATAR =
  "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

function CommentOptionsModal({ visible, onClose, canDelete, onDelete }) {
  if (!visible) return null;
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/30 justify-end" onPress={onClose}>
        <Pressable className="bg-white rounded-t-3xl px-4" onPress={() => {}}>
          {canDelete ? (
            <Pressable
              className="py-4 border-b border-gray-100"
              onPress={() => {
                onClose?.();
                onDelete?.();
              }}
            >
              <Text className="text-center text-red-600 font-semibold text-base">
                Eliminar comentario
              </Text>
            </Pressable>
          ) : null}

          <Pressable className="py-4" onPress={onClose}>
            <Text className="text-center text-gray-600 font-semibold text-base">
              Cancelar
            </Text>
          </Pressable>

          <View className="h-4" />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function Comment() {
  const { index } = useLocalSearchParams();
  const postId = String(index);
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();

  // viewer / reacciones
  const [viewerId, setViewerId] = useState(null);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  // datos UI
  const [newComment, setNewComment] = useState("");
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showVerMas, setShowVerMas] = useState(false);
  const [comment, setComment] = useState([]);
  const [post, setPost] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // comment options
  const [commentOptionsVisible, setCommentOptionsVisible] = useState(false);
  const [selectedComment, setSelectedComment] = useState(null); // item completo

  // delete/edit permission
  const [canDeletePost, setCanDeletePost] = useState(false);
  const [canEditPost, setCanEditPost] = useState(false);

  const likeCommentRef = useRef(false);
  const likeRef = useRef(false);
  const bookmarkRef = useRef(false);

  const isEdited = useMemo(() => {
    if (!post?.updated_at || !post?.created_at) return false;
    return (
      new Date(post.updated_at).getTime() > new Date(post.created_at).getTime()
    );
  }, [post?.updated_at, post?.created_at]);

  // ---------- RESOLVER VIEWER ----------
  const resolveViewer = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;

    const { data, error } = await supabase
      .from("user")
      .select("id")
      .eq("clerk_id", user.id)
      .single();

    if (!error && data?.id) setViewerId(String(data.id));
  }, [isLoaded, isSignedIn, user?.id]);

  useEffect(() => {
    resolveViewer();
  }, [resolveViewer]);

  // ---------- FETCH POST ----------
  const fetchPost = useCallback(async () => {
    if (!postId) return;

    const { data, error } = await supabase
      .from("post")
      .select(`*, media_post(*), comment(*), pet (*, media_pet(*))`)
      .eq("id", postId)
      .single();

    if (!error && data) setPost(data);
  }, [postId]);

  // ✅ calcular permisos post
  useEffect(() => {
    if (!post || !viewerId) return;
    const isOwner = String(post.user_id) === String(viewerId);
    setCanDeletePost(isOwner);
    setCanEditPost(isOwner);
  }, [post, viewerId]);

  // Combina los comentarios + likes del viewer
  const fetchCommentWithLikes = useCallback(async () => {
    if (!postId || !viewerId) return;

    const { data: comments, error } = await supabase
      .from("comment")
      .select(`*, user(*)`)
      .eq("post_id", postId)
      .order("created_at", { ascending: false });

    if (error || !comments) return;

    const commentIds = comments.map((c) => c.id);

    const { data: myLikes } = await supabase
      .from("comment_likes")
      .select("comment_id")
      .eq("user_id", viewerId)
      .in("comment_id", commentIds);

    const likedSet = new Set(myLikes?.map((r) => r.comment_id));

    const commentsWithLiked = comments.map((c) => ({
      ...c,
      liked: likedSet.has(c.id),
    }));

    setComment(commentsWithLiked);
  }, [postId, viewerId]);

  const loadViewerReactions = useCallback(async () => {
    if (!viewerId || !postId) return;

    const { data: likeRows } = await supabase
      .from("post_likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", viewerId)
      .limit(1);
    setLiked(!!(likeRows && likeRows.length));

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

  // ✅ si vuelves de EditPost, refresca el post en Comment
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("post:updated", (payload) => {
      if (!payload?.postId) return;
      if (String(payload.postId) !== String(postId)) return;

      // update rápido en UI
      setPost((prev) =>
        prev
          ? {
              ...prev,
              description: payload.description ?? prev.description,
              updated_at: payload.updated_at ?? prev.updated_at,
            }
          : prev
      );

      // refresco real desde DB (por si cambió más)
      fetchPost();
    });

    return () => sub.remove();
  }, [postId, fetchPost]);

  // ---------- NOTIFICACIONES ----------
  const ensureNotification = async (thePostId) => {
    try {
      const recipientId = post?.user_id;
      const actorId = viewerId;
      if (!recipientId || !actorId || String(recipientId) === String(actorId))
        return;

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

  // ---------- LIKE POST ----------
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

  const handleTapLike = async () => {
    if (likeRef.current) return;
    likeRef.current = true;

    const willLike = !liked;
    const delta = willLike ? 1 : -1;

    try {
      setLiked(willLike);
      await persistLikeDelta(delta);
      await persistUserLike(willLike);

      DeviceEventEmitter.emit("post:likeChanged", {
        postId: String(postId),
        liked: willLike,
        delta,
      });

      if (willLike) ensureNotification?.(postId);
      await loadViewerReactions();
    } catch (e) {
      setLiked((prev) => !prev);
      console.error("Error actualizando like:", e?.message || e);
    } finally {
      likeRef.current = false;
    }
  };

  // ---------- BOOKMARK POST ----------
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

  const handleTapBookmark = async () => {
    if (bookmarkRef.current) return;
    bookmarkRef.current = true;

    const willBookmark = !bookmarked;

    try {
      setBookmarked(willBookmark);
      await persistUserBookmark(willBookmark);

      DeviceEventEmitter.emit("post:bookmarkChanged", {
        postId: String(postId),
        bookmarked: willBookmark,
      });

      await loadViewerReactions();
    } catch (e) {
      setBookmarked((prev) => !prev);
      console.error("Error actualizando bookmark:", e?.message || e);
    } finally {
      bookmarkRef.current = false;
    }
  };

  // ✅✅ DELETE POST (tabla post)
  const handleDeletePost = useCallback(() => {
    if (!postId || !viewerId) return;

    if (String(post?.user_id) !== String(viewerId)) return;

    Alert.alert(
      "Eliminar publicación",
      "¿Seguro que deseas eliminar esta publicación? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("post")
                .delete()
                .eq("id", postId);

              if (error) {
                console.error("Error eliminando post:", error.message);
                Alert.alert("Error", "No se pudo eliminar la publicación.");
                return;
              }

              DeviceEventEmitter.emit("post:deleted", {
                postId: String(postId),
              });

              setPostModalVisible(false);
              router.back();
            } catch (e) {
              console.error("handleDeletePost exception:", e?.message || e);
              Alert.alert(
                "Error",
                "Ocurrió un error eliminando la publicación."
              );
            }
          },
        },
      ]
    );
  }, [postId, viewerId, post?.user_id, router]);

  // ✅ NUEVO: ir a editar post
  const handleEditPost = useCallback(
    (id) => {
      if (!id) return;
      router.push({
        pathname: "indexScreens/editPost/[id]",
        params: { postId: String(id) },
      });
    },
    [router]
  );

  // ---------- COMMENTS ----------
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

  const handleAddComment = async (thePostId) => {
    if (newComment.trim() === "") return;

    const clerkId = user?.id;
    if (!clerkId) {
      Alert.alert(
        "Debes iniciar sesión",
        "Debes iniciar sesión para comentar."
      );
      return;
    }

    const { data: supaUser, error: supaErr } = await supabase
      .from("user")
      .select("id, username, profile_pic")
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
          user_id: supaUser.id,
          user: {
            id: supaUser.id,
            username: supaUser.username || "Tú",
            profile_pic: supaUser.profile_pic || FALLBACK_AVATAR,
          },
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

  const handleDeleteComment = async (commentId) => {
    if (!commentId) return;

    const prev = [...comment];
    setComment((curr) => curr.filter((c) => c.id !== commentId));

    try {
      const { error } = await supabase
        .from("comment")
        .delete()
        .eq("id", commentId);
      await persistCommentDelta(-1);

      DeviceEventEmitter.emit("post:commentChanged", {
        postId: String(postId),
        delta: -1,
      });

      if (error) throw error;
    } catch (e) {
      console.error("Error eliminando comentario:", e.message);
      setComment(prev);
      Alert.alert(
        "Error",
        "No se pudo eliminar el comentario. Intenta de nuevo."
      );
    }
  };

  const bumpCommentLikesCounter = async (commentId, delta) => {
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

      await bumpCommentLikesCounter(commentId, delta);
    } catch (e) {
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

  if (!post) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" />
        <Text className="mt-2 text-gray-500">Cargando publicación...</Text>
      </View>
    );
  }

  const ListHeader = (
    <View>
      {/* HEADER POST */}
      <View className="flex-row items-center mx-4 mt-4">
        <Pressable
          onPress={() =>
            router.push({
              pathname: "indexScreens/petProfile/[id]",
              params: { pet_id: post?.pet?.id },
            })
          }
          className="flex-row gap-2 items-center"
        >
          <Image
            className="w-10 h-10 rounded-full"
            source={{
              uri: post?.pet?.media_pet?.[0]?.source || FALLBACK_AVATAR,
            }}
          />
          <View>
            <Text className="text-gray-700 font-medium">{post?.pet?.name}</Text>
            <Text className="text-gray-400 text-sm">
              {tiempoTranscurrido(post?.created_at)}
              {isEdited ? " • Editado" : ""}
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
          onHidePost={() => {}}
          onReport={() =>
            Alert.alert(
              "Reporte",
              `Publicación reportada: ${post?.pet?.name || "Mascota"}`
            )
          }
          canDelete={canDeletePost}
          onDelete={handleDeletePost}
          // ✅ NUEVO
          canEdit={canEditPost}
          onEdit={handleEditPost}
        />
      </View>

      {/* SLIDER con doble-tap */}
      <View className="mt-2">
        <Slider images={imagesArray || []} onHandleDoubleTap={handleTapLike} />
      </View>

      {/* ACCIONES */}
      <View className="flex-row gap-4 mt-2 mx-4 items-center">
        <Pressable onPress={handleTapLike} className="flex-row items-center">
          <Heart color={liked ? "red" : "#374151"} size={24} />
        </Pressable>

        <Pressable>
          <MessageIcon color={"#374151"} size={24} />
        </Pressable>

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
        ListHeaderComponent={ListHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        renderItem={({ item }) => {
          const canDeleteThisComment =
            !!viewerId && String(item.user_id) === String(viewerId);

          return (
            <View className="px-4 py-3 border-b border-gray-100">
              <View className="flex-row items-start">
                <Pressable
                  className="flex-row gap-x-2 items-center"
                  onPress={() =>
                    router.push({
                      pathname: "indexScreens/profile/[id]",
                      params: { index: item.user?.id },
                    })
                  }
                >
                  <Image
                    className="h-7 w-7 rounded-full"
                    source={{ uri: item.user?.profile_pic || FALLBACK_AVATAR }}
                  />
                  <View>
                    <Text className="text-gray-800 font-medium">
                      {item.user?.username || "Usuario"}
                    </Text>
                    <Text className="text-gray-400 text-xs">
                      {tiempoTranscurrido(item.created_at)}
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  className="ml-auto"
                  onPress={() => {
                    setSelectedComment(item);
                    setCommentOptionsVisible(true);
                  }}
                >
                  <Dots color={"#111827"} size={18} />
                </Pressable>
              </View>

              <View className="flex-row items-center">
                <Text className="text-gray-800 mt-2">{item.content}</Text>
                <Pressable
                  onPress={() => handleLikeComment(item.id, !!item.liked)}
                  className="flex-row items-center ml-auto"
                >
                  <Heart color={item.liked ? "red" : "#374151"} size={18} />
                  <Text className="ml-2 text-gray-600 text-sm">
                    {item.likes ?? 0}
                  </Text>
                </Pressable>
              </View>

              <CommentOptionsModal
                visible={
                  commentOptionsVisible && selectedComment?.id === item.id
                }
                onClose={() => {
                  setCommentOptionsVisible(false);
                  setSelectedComment(null);
                }}
                canDelete={canDeleteThisComment}
                onDelete={() => {
                  Alert.alert(
                    "Eliminar comentario",
                    "¿Seguro que deseas eliminar este comentario?",
                    [
                      { text: "Cancelar", style: "cancel" },
                      {
                        text: "Eliminar",
                        style: "destructive",
                        onPress: () => handleDeleteComment(item.id),
                      },
                    ]
                  );
                }}
              />
            </View>
          );
        }}
      />
    </View>
  );
}
