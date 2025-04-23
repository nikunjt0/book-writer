"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, UserPlus, UserCheck, UserX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { firestore } from "@/lib/firebaseClient";

interface Friend {
  id: string;
  name: string;
  photoURL?: string;
  status?: "online" | "offline" | "away";
  lastActive?: string;
}

interface FriendRequest {
  id: string;
  name: string;
  photoURL?: string;
  status: "pending";
}

export default function FriendsPage() {
  const { userLoggedIn, currentUser } = useAuth();
  const router = useRouter();

  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "discover">("friends");

  const userDocRef = currentUser && doc(firestore, "users", currentUser.uid);

  // redirect if not logged in
  useEffect(() => {
    if (!userLoggedIn) router.push("/signin");
  }, [userLoggedIn, router]);

  // load friends & incoming requests
  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      const snap = await getDoc(userDocRef!);
      if (!snap.exists()) return;
      const { friends: friendIds = [], requestedFriends: reqIds = [] } = snap.data();

      // fetch friend profiles
      const friendDocs = friendIds.length
        ? await Promise.all(friendIds.map((uid: string) => getDoc(doc(firestore, "users", uid))))
        : [];
      setFriends(
        friendDocs
          .filter((s) => s.exists())
          .map((s) => ({
            id: s.id,
            name: s.data().displayName,
            photoURL: s.data().photoURL,
            status: "offline",
          }))
      );

      // fetch incoming request profiles
      const reqDocs = reqIds.length
        ? await Promise.all(reqIds.map((uid: string) => getDoc(doc(firestore, "users", uid))))
        : [];
      setRequests(
        reqDocs
          .filter((s) => s.exists())
          .map((s) => ({
            id: s.id,
            name: s.data().displayName,
            photoURL: s.data().photoURL,
            status: "pending",
          }))
      );
    })();
  }, [currentUser]);

  // search users by email
  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    const usersQ = query(
      collection(firestore, "users"),
      where("email", ">=", q),
      where("email", "<=", q + "\uf8ff")
    );
    const snap = await getDocs(usersQ);
    const results: Friend[] = [];
    snap.forEach((docSnap) => {
      if (docSnap.id === currentUser?.uid) return;
      const d = docSnap.data();
      results.push({
        id: docSnap.id,
        name: d.displayName,
        photoURL: d.photoURL,
      });
    });
    setSearchResults(results);
  };

  // send a friend request
  const sendFriendRequest = async (targetUid: string) => {
    await updateDoc(doc(firestore, "users", targetUid), {
      requestedFriends: arrayUnion(currentUser!.uid),
    });
    setSearchResults((prev) => prev.filter((u) => u.id !== targetUid));
  };

  // accept incoming request
  const acceptFriendRequest = async (requesterUid: string) => {
    // add to your friends & remove from your requests
    await updateDoc(userDocRef!, {
      friends: arrayUnion(requesterUid),
      requestedFriends: arrayRemove(requesterUid),
    });
    // add yourself to their friends
    await updateDoc(doc(firestore, "users", requesterUid), {
      friends: arrayUnion(currentUser!.uid),
    });
    // update local state
    setRequests((prev) => prev.filter((r) => r.id !== requesterUid));
    setFriends((prev) => [
      ...prev,
      { id: requesterUid, name: requests.find((r) => r.id === requesterUid)!.name },
    ]);
  };

  // reject incoming request
  const rejectFriendRequest = async (requesterUid: string) => {
    await updateDoc(userDocRef!, {
      requestedFriends: arrayRemove(requesterUid),
    });
    setRequests((prev) => prev.filter((r) => r.id !== requesterUid));
  };

  if (!userLoggedIn) return null;

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto p-4">
        <Link href="/" className="inline-flex items-center text-gray-700 hover:text-gray-900 mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Home
        </Link>

        <h1 className="text-3xl font-bold mb-1">Friends</h1>
        <p className="text-gray-500 mb-6">Connect with other creators</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="mb-4">
                <TabsTrigger value="friends">My Friends</TabsTrigger>
                <TabsTrigger value="requests" className="relative">
                  Requests
                  {requests.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {requests.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="discover">Discover</TabsTrigger>
              </TabsList>

              {/* Friends Tab */}
              <TabsContent value="friends" className="space-y-4">
                {friends.length === 0 ? (
                  <div className="text-center p-8 border rounded-lg bg-gray-50">
                    <p className="text-gray-500">You don't have any friends yet.</p>
                    <Button variant="outline" className="mt-4" onClick={() => setActiveTab("discover")}>
                      Find Friends
                    </Button>
                  </div>
                ) : (
                  friends.map((f) => (
                    <div key={f.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={f.photoURL || "/placeholder.svg"} alt={f.name} />
                          <AvatarFallback>{f.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{f.name}</p>
                          <p className="text-sm text-gray-500">{f.status || "Offline"}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">Message</Button>
                    </div>
                  ))
                )}
              </TabsContent>

              {/* Requests Tab */}
              <TabsContent value="requests" className="space-y-4">
                {requests.length === 0 ? (
                  <div className="text-center p-8 border rounded-lg bg-gray-50">
                    <p className="text-gray-500">No pending friend requests.</p>
                  </div>
                ) : (
                  requests.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={r.photoURL || "/placeholder.svg"} alt={r.name} />
                          <AvatarFallback>{r.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{r.name}</p>
                          <p className="text-sm text-gray-500">Wants to connect</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => acceptFriendRequest(r.id)}
                        >
                          <UserCheck className="h-4 w-4 mr-1" /> Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => rejectFriendRequest(r.id)}
                        >
                          <UserX className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              {/* Discover Tab */}
              <TabsContent value="discover" className="space-y-4">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search for friends..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {searchQuery && (
                  <>
                    <h3 className="text-lg font-medium mb-2">Search Results</h3>
                    {searchResults.length === 0 ? (
                      <p className="text-gray-500">No users found matching "{searchQuery}"</p>
                    ) : (
                      searchResults.map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={u.photoURL || "/placeholder.svg"} alt={u.name} />
                              <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <p className="font-medium">{u.name}</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => sendFriendRequest(u.id)}>
                            <UserPlus className="h-4 w-4 mr-1" /> Add Friend
                          </Button>
                        </div>
                      ))
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Profile Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
                <CardDescription>How others see you</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={currentUser?.photoURL || ""} alt={currentUser?.displayName || "User"} />
                  <AvatarFallback className="text-2xl">
                    {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-bold">{currentUser?.displayName || "User"}</h3>
                <p className="text-gray-500">{currentUser?.email}</p>

                <div className="w-full mt-6 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Friends</span>
                    <span className="font-medium">{friends.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Pending Requests</span>
                    <span className="font-medium">{requests.length}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Edit Profile
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
