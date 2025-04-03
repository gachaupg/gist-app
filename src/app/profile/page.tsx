"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, githubTokenSchema } from "@/lib/validations";
import Link from "next/link";

type ProfileFormValues = {
  name: string;
  bio: string;
  location: string;
  avatar: string;
};

type GithubTokenFormValues = {
  token: string;
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      bio: "",
      location: "",
      avatar: "",
    },
  });

  // GitHub token form
  const {
    register: registerToken,
    handleSubmit: handleSubmitToken,
    formState: { errors: tokenErrors },
  } = useForm<GithubTokenFormValues>({
    resolver: zodResolver(githubTokenSchema),
    defaultValues: {
      token: "",
    },
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (status === "authenticated" && session?.user?.id) {
        try {
          const response = await fetch(`/api/user/${session.user.id}`);

          if (!response.ok) {
            throw new Error("Failed to fetch user data");
          }

          const data = await response.json();
          setUserData(data);

          // Populate form with user data
          resetProfile({
            name: data.name || "",
            bio: data.bio || "",
            location: data.location || "",
            avatar: data.avatar || "",
          });
        } catch (err) {
          console.error("Error fetching user data:", err);
          setError("Failed to load profile data. Please try again.");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserData();
  }, [status, session, resetProfile]);

  // Handle profile update
  const onProfileSubmit = async (data: ProfileFormValues) => {
    if (!session?.user?.id) return;

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/user/${session.user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      const updatedUser = await response.json();
      setUserData(updatedUser);
      setSuccess("Profile updated successfully");
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError(err.message || "An error occurred while updating your profile");
    } finally {
      setLoading(false);
    }
  };

  // Handle GitHub token update
  const onTokenSubmit = async (data: GithubTokenFormValues) => {
    if (!session?.user?.id) return;

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/user/${session.user.id}/token`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ githubToken: data.token }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update GitHub token");
      }

      setSuccess("GitHub token updated successfully");
    } catch (err: any) {
      console.error("Error updating GitHub token:", err);
      setError(
        err.message || "An error occurred while updating your GitHub token"
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!session?.user?.id) return;

    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/user/${session.user.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete account");
      }

      // Sign out and redirect to home page
      router.push("/api/auth/signout");
    } catch (err: any) {
      console.error("Error deleting account:", err);
      setError(err.message || "An error occurred while deleting your account");
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Profile Settings
      </h1>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-700 rounded">
          {success}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Personal Information
          </h2>
          <form
            onSubmit={handleSubmitProfile(onProfileSubmit)}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="name"
                className="block mb-1 text-sm font-medium text-gray-700"
              >
                Full Name
              </label>
              <input
                id="name"
                type="text"
                className={`w-full p-2 border rounded-md ${
                  profileErrors.name ? "border-red-500" : "border-gray-300"
                }`}
                {...registerProfile("name")}
              />
              {profileErrors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {profileErrors.name.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="bio"
                className="block mb-1 text-sm font-medium text-gray-700"
              >
                Bio
              </label>
              <textarea
                id="bio"
                rows={3}
                className={`w-full p-2 border rounded-md ${
                  profileErrors.bio ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Tell us about yourself"
                {...registerProfile("bio")}
              ></textarea>
              {profileErrors.bio && (
                <p className="mt-1 text-sm text-red-600">
                  {profileErrors.bio.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="location"
                className="block mb-1 text-sm font-medium text-gray-700"
              >
                Location
              </label>
              <textarea
                id="location"
                rows={4}
                className={`w-full p-2 border rounded-md ${
                  profileErrors.location ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Where are you located?"
                {...registerProfile("location")}
                disabled={loading}
              ></textarea>
              {profileErrors.location && (
                <p className="mt-1 text-sm text-red-600">
                  {profileErrors.location.message}
                </p>
              )}
              {userData?.location && (
                <Link
                  href="/profile/map"
                  className="mt-2 text-indigo-600 hover:text-indigo-800 flex items-center text-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  View on Map
                </Link>
              )}
            </div>

            <div>
              <label
                htmlFor="avatar"
                className="block mb-1 text-sm font-medium text-gray-700"
              >
                Avatar URL
              </label>
              <input
                id="avatar"
                type="text"
                className={`w-full p-2 border rounded-md ${
                  profileErrors.avatar ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="https://example.com/avatar.jpg"
                {...registerProfile("avatar")}
              />
              {profileErrors.avatar && (
                <p className="mt-1 text-sm text-red-600">
                  {profileErrors.avatar.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            GitHub Integration
          </h2>
          <p className="text-gray-600 mb-4">
            Add your GitHub Personal Access Token to manage your gists. The
            token needs the 'gist' scope to create, read, update, and delete
            your gists.
          </p>
          <form
            onSubmit={handleSubmitToken(onTokenSubmit)}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="token"
                className="block mb-1 text-sm font-medium text-gray-700"
              >
                GitHub Personal Access Token
              </label>
              <input
                id="token"
                type="password"
                className={`w-full p-2 border rounded-md ${
                  tokenErrors.token ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="ghp_xxxxxxxxxxxxxxxx"
                {...registerToken("token")}
              />
              {tokenErrors.token && (
                <p className="mt-1 text-sm text-red-600">
                  {tokenErrors.token.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Token"}
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-t border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-red-600">
            Danger Zone
          </h2>
          <p className="text-gray-600 mb-4">
            Once you delete your account, there is no going back. Please be
            certain.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Delete Account
            </button>
          ) : (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="font-medium text-red-700 mb-4">
                Are you sure you want to delete your account? This action cannot
                be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? "Deleting..." : "Yes, Delete My Account"}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
