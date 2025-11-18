import { useState, useCallback, useEffect, useRef } from "react";
import {
  FlatList,
  ActivityIndicator,
  View,
  DeviceEventEmitter,
} from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Screen } from "./Screen";
import { PostItem } from "./Index/PostItem";
import { supabase } from "../lib/supabase";
import { useUser } from "@clerk/clerk-expo";

export function Main() {
  const PAGE_SIZE = 10;

  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const cursorRef = useRef(null);
  const onEndReachedCalledDuringMomentum = useRef(false);
  const isFocused = useIsFocused();

  const { isLoaded, isSignedIn, user } = useUser();
  const [supaUser, setSupaUser] = useState(null);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState(null);

  // ---------- HELPERS ----------
  const decorateWithFlags = (rows, uid) =>
    (rows ?? []).map((p) => ({
      ...p,
      likedByMe: Array.isArray(p.post_likes)
        ? p.post_likes.some((pl) => String(pl.user_id) === String(uid))
        : false,
      bookmarkedByMe: Array.isArray(p.post_bookmarks)
        ? p.post_bookmarks.some((bm) => String(bm.user_id) === String(uid))
        : false,
    }));

  // ---------- FETCH POSTS (keyset) ----------
  const fetchPostsKeyset = useCallback(async (cursor = null) => {
    let query = supabase
      .from("post")
      .select(
        `
        *,
        pet (*, media_pet(*), user(*)),
        media_post(*),
        post_likes!left ( user_id ),
        post_bookmarks!left ( user_id )
      `
      )
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching posts:", error.message);
      return [];
    }
    return data ?? [];
  }, []);

  // ---------- FETCH USER (Supabase por clerk_id) ----------
  const fetchUser = useCallback(async () => {
    try {
      if (!isLoaded || !isSignedIn) return;
      setUserLoading(true);

      const clerkId = user.id;
      const { data, error } = await supabase
        .from("user")
        .select("*")
        .eq("clerk_id", clerkId)
        .single();

      if (error) throw error;
      setSupaUser(data);
    } catch (err) {
      console.error("Error al obtener usuario de Supabase:", err.message);
      setUserError(err);
    } finally {
      setUserLoading(false);
    }
  }, [isLoaded, isSignedIn, user]);

  // ---------- PAGINACIÓN / CARGA INICIAL ----------
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    const newPostsRaw = await fetchPostsKeyset(cursorRef.current);
    const newPosts = decorateWithFlags(newPostsRaw, supaUser?.id);

    if (newPosts.length > 0) {
      setPosts((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const merged = [...prev, ...newPosts.filter((p) => !seen.has(p.id))];
        return merged;
      });

      cursorRef.current =
        newPosts[newPosts.length - 1]?.created_at || cursorRef.current;

      setHasMore(newPosts.length === PAGE_SIZE);
    } else {
      setHasMore(false);
    }

    setLoading(false);
  }, [fetchPostsKeyset, loading, hasMore, supaUser?.id]);

  const initialLoad = useCallback(async () => {
    setLoading(true);
    cursorRef.current = null;

    const firstPageRaw = await fetchPostsKeyset(null);
    const firstPage = decorateWithFlags(firstPageRaw, supaUser?.id);

    setPosts(firstPage);
    cursorRef.current = firstPage[firstPage.length - 1]?.created_at || null;
    setHasMore(firstPage.length === PAGE_SIZE);

    setLoading(false);
  }, [fetchPostsKeyset, supaUser?.id]);

  // ---------- EFFECTS ----------
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (supaUser?.id) {
      initialLoad();
    }
  }, [supaUser?.id, initialLoad]);

  useEffect(() => {
    if (isFocused && supaUser?.id) {
      initialLoad();
    }
  }, [isFocused, supaUser?.id, initialLoad]);

  // Escuchar cambios emitidos desde otras pantallas (likes / bookmarks)
  useEffect(() => {
    const likeSub = DeviceEventEmitter.addListener(
      "post:likeChanged",
      ({ postId, liked, delta }) => {
        setPosts((prev) =>
          prev.map((p) =>
            String(p.id) === String(postId)
              ? {
                  ...p,
                  likes: Math.max(0, (p.likes ?? 0) + delta),
                  likedByMe: liked,
                }
              : p
          )
        );
      }
    );

    const bmSub = DeviceEventEmitter.addListener(
      "post:bookmarkChanged",
      ({ postId, bookmarked }) => {
        setPosts((prev) =>
          prev.map((p) =>
            String(p.id) === String(postId)
              ? { ...p, bookmarkedByMe: bookmarked }
              : p
          )
        );
      }
    );

    return () => {
      likeSub.remove();
      bmSub.remove();
    };
  }, []);

  // ---------- REFRESH ----------
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await initialLoad();
    setRefreshing(false);
  }, [initialLoad]);

  // ---------- RENDER HELPERS ----------
  const keyExtractor = useCallback((item) => String(item.id), []);

  const onHidePost = useCallback((i) => {
    setPosts((prev) => {
      const clone = prev.slice();
      clone.splice(i, 1);
      return clone;
    });
  }, []);

  const onReportPost = useCallback((i) => {
    console.log("Report post index:", i);
  }, []);

  const renderItem = useCallback(
    ({ item, index }) => (
      <PostItem
        dataPost={item}
        id={item?.pet?.id}
        index={index}
        onHidePost={onHidePost}
        onReportPost={onReportPost}
        currentUser={supaUser?.id}
        likedInitial={item.likedByMe}
        bookmarkedInitial={item.bookmarkedByMe}
      />
    ),
    [onHidePost, onReportPost, supaUser?.id]
  );

  const ListFooter = useCallback(
    () =>
      loading ? (
        <View className="py-4">
          <ActivityIndicator size="small" />
        </View>
      ) : null,
    [loading]
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1">
        <Screen>
          <FlatList
            data={posts}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            extraData={posts}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ListFooterComponent={ListFooter}
            onEndReachedThreshold={0.5}
            onMomentumScrollBegin={() => {
              onEndReachedCalledDuringMomentum.current = false;
            }}
            onEndReached={() => {
              if (!onEndReachedCalledDuringMomentum.current) {
                loadMore();
                onEndReachedCalledDuringMomentum.current = true;
              }
            }}
            initialNumToRender={8}
            maxToRenderPerBatch={8}
            updateCellsBatchingPeriod={16}
            windowSize={9}
            removeClippedSubviews
          />
        </Screen>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
