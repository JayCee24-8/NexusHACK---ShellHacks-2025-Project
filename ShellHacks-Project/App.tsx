import React, { useState, useEffect, useMemo, useCallback } from "react";
import type { User, Match, Team, AppNotification, MyTeamInfo } from "./types";
import * as authService from "./services/authService";
import * as teamService from "./services/teamService";
import * as requestService from "./services/requestService";
import Header from "./components/Header";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import Profile from "./components/Profile";
import TeamChat from "./components/TeamChat";
import ProjectIdeaGenerator from "./components/ProjectIdeaGenerator";
import { TEAM_SIZE_LIMIT } from "./constants";
import { LoadingSpinner } from "./components/LoadingSpinner";

type View =
  | "auth"
  | "dashboard"
  | "profile"
  | "teamChat"
  | "projectIdeaGenerator";

type ConfirmationModalState = {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  isAlert?: boolean;
  confirmButtonClass?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [myTeamInfo, setMyTeamInfo] = useState<MyTeamInfo | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [view, setView] = useState<View>("dashboard");

  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appIsLoading, setAppIsLoading] = useState(true);

  const [confirmationModal, setConfirmationModal] =
    useState<ConfirmationModalState>({
      isOpen: false,
      title: "",
      message: "",
      onConfirm: () => {},
      isAlert: false,
    });

  const fetchData = useCallback(async () => {
    try {
      const [sessionUser, users, teamInfo, pendingNotifications] =
        await Promise.all([
          authService.getCurrentUserSession(),
          authService.getAllUsers(),
          teamService.getMyTeam().catch(() => null),
          requestService.getPendingNotifications(),
        ]);

      setCurrentUser(sessionUser);
      setAllUsers(users);
      setMyTeamInfo(teamInfo);
      setNotifications(pendingNotifications);
    } catch (err) {
      // Any error here (especially 401 from session check) means the user is not authenticated.
      setCurrentUser(null);
      setMyTeamInfo(null);
      setNotifications([]);
      setAllUsers([]);
      setView("auth");
    }
  }, []);

  // Effect for initial data load
  useEffect(() => {
    const initialLoad = async () => {
      await fetchData();
      setAppIsLoading(false);
    };
    initialLoad();
  }, [fetchData]);

  // Effect for polling to get real-time updates
  useEffect(() => {
    if (currentUser) {
      const intervalId = setInterval(fetchData, 5000); // Poll every 5 seconds
      return () => clearInterval(intervalId); // Cleanup on logout or unmount
    }
  }, [currentUser, fetchData]);

  const currentUserTeam = useMemo(() => myTeamInfo?.team || null, [myTeamInfo]);

  const myTeamMembers = useMemo(() => {
    if (!currentUserTeam) return [];
    const memberIds = new Set(currentUserTeam.memberIds);
    return allUsers.filter((user) => memberIds.has(user.id));
  }, [currentUserTeam, allUsers]);

  const handleLoginSuccess = async (user: User) => {
    setCurrentUser(user);
    setView("dashboard");
    setAppIsLoading(true);
    await fetchData();
    setAppIsLoading(false);
  };

  const handleLogout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      setCurrentUser(null);
      setMyTeamInfo(null);
      setNotifications([]);
      setAllUsers([]);
      setView("auth");
    }
  }, []);

  const handleUserUpdate = async (user: User) => {
    setCurrentUser(user);
    await fetchData();
  };

  const availableUsers = useMemo(() => {
    if (!currentUser) return [];
    return allUsers.filter((user) => user.id !== currentUser.id);
  }, [currentUser, allUsers]);

  const handleCreateTeam = async (teamName: string) => {
    if (!currentUser) return;
    try {
      await teamService.createTeam(teamName);
      await fetchData();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDeleteTeam = async () => {
    if (!currentUserTeam || myTeamInfo?.role !== "LEADER") return;
    setConfirmationModal({
      isOpen: true,
      title: "Delete Team?",
      message:
        "Are you sure you want to delete your team? This action is permanent and cannot be undone.",
      onConfirm: async () => {
        try {
          await teamService.deleteTeam(currentUserTeam.id);
          await fetchData();
        } catch (err) {
          setError((err as Error).message);
        }
        setConfirmationModal((prevState) => ({ ...prevState, isOpen: false }));
      },
    });
  };

  const handleRemoveMember = async (userId: string) => {
    if (
      !currentUserTeam ||
      myTeamInfo?.role !== "LEADER" ||
      userId === currentUser?.id
    )
      return;
    try {
      await teamService.removeMember(currentUserTeam.id, userId);
      await fetchData();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleLeaveTeam = async () => {
    if (!currentUser || !currentUserTeam || myTeamInfo?.role === "LEADER")
      return;
    try {
      await teamService.leaveTeam(currentUserTeam.id);
      await fetchData();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleInvite = async (userToInvite: User) => {
    if (!currentUserTeam || !currentUser || myTeamInfo?.role !== "LEADER")
      return;
    try {
      await requestService.inviteUser(currentUserTeam.id, userToInvite.id);
      await fetchData();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleRequestToJoin = async (targetUser: User) => {
    if (!targetUser.team || !currentUser) return;
    try {
      await requestService.requestToJoinTeam(targetUser.team.id);
      await fetchData();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDeclineRequest = async (notificationId: string) => {
    try {
      await requestService.declineNotification(notificationId);
      await fetchData();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleAcceptRequest = async (
    notification: AppNotification,
    force = false
  ) => {
    try {
      await requestService.acceptNotification(notification.id, force);
      await fetchData();
    } catch (err) {
      const apiError = err as any;
      if (apiError.code === "HAS_TEAM_CONFIRM_REQUIRED") {
        setConfirmationModal({
          isOpen: true,
          title: "Join New Team?",
          message:
            "Are you sure you want to join this team? As you are the leader of your current team, it will be permanently deleted.",
          onConfirm: () => {
            handleAcceptRequest(notification, true);
            setConfirmationModal((prevState) => ({
              ...prevState,
              isOpen: false,
            }));
          },
          isAlert: false,
          confirmButtonText: "Yes, Join Team",
          cancelButtonText: "No",
          confirmButtonClass: "bg-fiu-blue hover:bg-fiu-gold",
        });
      } else {
        setError(apiError.message);
      }
    }
  };

  const renderView = () => {
    if (appIsLoading) {
      return (
        <div className="flex justify-center items-center h-[60vh]">
          <LoadingSpinner className="w-16 h-16" />
        </div>
      );
    }

    if (!currentUser || view === "auth") {
      return <Auth onLoginSuccess={handleLoginSuccess} />;
    }
    switch (view) {
      case "dashboard":
        return (
          <Dashboard
            currentUser={currentUser}
            myTeamInfo={myTeamInfo}
            myTeamMembers={myTeamMembers}
            availableUsers={availableUsers}
            notifications={notifications}
            matches={matches}
            setMatches={setMatches}
            isLoadingMatches={isLoadingMatches}
            setIsLoadingMatches={setIsLoadingMatches}
            handleInvite={handleInvite}
            handleRequestToJoin={handleRequestToJoin}
            handleRemoveMember={handleRemoveMember}
            handleLeaveTeam={handleLeaveTeam}
            handleDeleteTeam={handleDeleteTeam}
            handleCreateTeam={handleCreateTeam}
            error={error}
            setError={setError}
          />
        );
      case "profile":
        return (
          <Profile
            user={currentUser}
            onUserUpdate={handleUserUpdate}
            onLogout={handleLogout}
          />
        );
      case "teamChat":
        return (
          <TeamChat
            myTeamMembers={myTeamMembers}
            currentUser={currentUser}
            currentUserTeam={currentUserTeam}
          />
        );
      case "projectIdeaGenerator":
        return <ProjectIdeaGenerator />;
      default:
        return <Auth onLoginSuccess={handleLoginSuccess} />;
    }
  };

  return (
    <div className="min-h-screen bg-shell-bg font-sans">
      <Header
        currentUser={currentUser}
        setView={setView}
        pendingNotifications={notifications}
        onAcceptRequest={handleAcceptRequest}
        onDeclineRequest={handleDeclineRequest}
      />
      <main className="container mx-auto p-4 md:p-8">{renderView()}</main>
      <footer className="text-center py-4 text-shell-text-secondary text-sm">
        <p>Built for ShellHacks @ FIU</p>
      </footer>
      {confirmationModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-shell-card rounded-lg p-8 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-shell-text mb-4">
              {confirmationModal.title}
            </h3>
            <p className="text-shell-text-secondary mb-6">
              {confirmationModal.message}
            </p>
            <div className="flex justify-end space-x-4">
              {!confirmationModal.isAlert && (
                <button
                  onClick={() =>
                    setConfirmationModal((prevState) => ({
                      ...prevState,
                      isOpen: false,
                    }))
                  }
                  className="px-4 py-2 rounded-md text-shell-text-secondary hover:bg-shell-bg transition-colors"
                >
                  {confirmationModal.cancelButtonText || "Cancel"}
                </button>
              )}
              <button
                onClick={confirmationModal.onConfirm}
                className={`px-4 py-2 rounded-md text-white transition-colors ${
                  confirmationModal.confirmButtonClass ||
                  (confirmationModal.isAlert
                    ? "bg-fiu-blue hover:bg-fiu-gold"
                    : "bg-red-600 hover:bg-red-700")
                }`}
              >
                {confirmationModal.confirmButtonText ||
                  (confirmationModal.isAlert ? "OK" : "Confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
