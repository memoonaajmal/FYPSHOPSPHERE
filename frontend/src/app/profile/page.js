"use client";

import { useEffect, useState } from "react";
import { auth } from "../../../firebase/config";
import {
  signOut,
  onAuthStateChanged,
  updatePassword,
  verifyBeforeUpdateEmail,
  updateEmail, 
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendEmailVerification
} from "firebase/auth";
import { useRouter } from "next/navigation";

import styles from "../../styles/Profile.module.css";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [editField, setEditField] = useState(null);
  const [fieldValue, setFieldValue] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");

  const router = useRouter();
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

  // ✅ Fetch user profile
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/");
        setAuthChecked(true);
        return;
      }

      setUser(currentUser);
      const token = await currentUser.getIdToken();

      const res = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
      } else {
        // Sync if missing
        await fetch(`${BASE_URL}/api/auth/sync`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: "user" }),
        });

        const r2 = await fetch(`${BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (r2.ok) {
          setProfile((await r2.json()).user);
        }
      }

      setAuthChecked(true);
    });
    return () => unsub();
  }, [router, BASE_URL]);

  if (!authChecked || !user) return null;

  // ✅ Update profile field
  const updateProfileField = async (updates) => {
    const token = await auth.currentUser.getIdToken();
    const res = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const data = await res.json();
      setProfile(data.user);
      setEditField(null);
    } else {
      alert("Failed to update profile.");
    }
  };

  const handleSave = async () => {
    if (!editField) return;
    await updateProfileField({ [editField]: fieldValue });
  };

  const handleEdit = (field, currentValue) => {
    setEditField(field);
    setFieldValue(currentValue || "");
  };

  const maskEmail = (e) => {
    if (!e) return "Not Set";
    const [local, domain] = e.split("@");
    if (!domain) return e;
    const shown =
      local.length <= 2
        ? local[0] + "*"
        : local.slice(0, 2) + "*".repeat(Math.max(0, local.length - 2));
    return shown + "@" + domain;
  };

  // ✅ Handle Change Password (in-built Firebase)
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword) {
      alert("Please fill in both fields.");
      return;
    }

    try {
      setIsChangingPassword(true);

      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );

      // Reauthenticate user before password update
      await reauthenticateWithCredential(user, credential);

      await updatePassword(user, newPassword);
      alert("Password changed successfully!");

      // Clear inputs
      setCurrentPassword("");
      setNewPassword("");
      setIsChangingPassword(false);
    } catch (err) {
      console.error(err);
      if (err.code === "auth/wrong-password") {
        alert("Incorrect current password.");
      } else if (err.code === "auth/weak-password") {
        alert("Password should be at least 6 characters.");
      } else {
        alert("Failed to change password. Please try again.");
      }
      setIsChangingPassword(false);
    }
  };

// Replace your current handleChangeEmail function with this:

const handleChangeEmail = async (e) => {
  e.preventDefault();

  if (!newEmail || !emailPassword) {
    alert("Please fill in both fields.");
    return;
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(newEmail)) {
    alert("Please enter a valid email address.");
    return;
  }

  // Check if new email is same as current
  if (newEmail.toLowerCase() === user.email.toLowerCase()) {
    alert("The new email is the same as your current email.");
    return;
  }

  try {
    // Step 1: Reauthenticate with current password
    const credential = EmailAuthProvider.credential(user.email, emailPassword);
    await reauthenticateWithCredential(user, credential);

    // Step 2: Use verifyBeforeUpdateEmail (more secure approach)
    // This sends verification email to new address before changing
    await verifyBeforeUpdateEmail(user, newEmail);
    
    alert(
      "Verification email sent! Please check your new email address (" + 
      newEmail + 
      ") and click the verification link to complete the email change. " +
      "Check your spam folder if you don't see it."
    );

    // Clear form
    setNewEmail("");
    setEmailPassword("");
    setIsChangingEmail(false);

  } catch (err) {
    console.error("Email change error:", err);
    
    // Detailed error handling
    switch (err.code) {
      case "auth/requires-recent-login":
        alert(
          "For security reasons, please log out and log back in, then try changing your email again."
        );
        break;
      
      case "auth/email-already-in-use":
        alert("This email address is already registered to another account.");
        break;
      
      case "auth/invalid-email":
        alert("The email address format is invalid.");
        break;
      
      case "auth/wrong-password":
      case "auth/invalid-credential":
        alert("Incorrect password. Please try again.");
        break;
      
      case "auth/operation-not-allowed":
        // If verifyBeforeUpdateEmail doesn't work, suggest alternative
        alert(
          "Email verification is required. Please ensure:\n\n" +
          "1. Your current email is verified\n" +
          "2. You're logged in recently (try logging out and back in)\n" +
          "3. Email/Password provider is enabled in Firebase Console\n\n" +
          "If the issue persists, please contact support."
        );
        break;
      
      case "auth/too-many-requests":
        alert("Too many attempts. Please wait a few minutes and try again.");
        break;

      case "auth/unverified-email":
        alert(
          "Your current email is not verified. Please verify your current email first, then try changing it."
        );
        break;
      
      default:
        alert(
          `Error changing email: ${err.message || err.code}\n\n` +
          "Please try:\n" +
          "1. Logging out and back in\n" +
          "2. Verifying your current email\n" +
          "3. Contacting support if the issue persists"
        );
    }
  }
};


  return (
    <div className={styles.profileContainer}>
      <h1>Account Information</h1>
      <div className={styles.profileCard}>
        {/* ✅ Full Name row */}
        <div className={styles.row}>
          <div className={styles.label}>Full Name</div>
          <div className={styles.valueArea}>
            {editField === "fullName" ? (
              <div className={styles.editArea}>
                <input
                  type="text"
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  className={styles.input}
                />
                <div className={styles.editButtons}>
                  <button onClick={handleSave} className={styles.saveBtn}>
                    Save
                  </button>
                  <button
                    onClick={() => setEditField(null)}
                    className={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={styles.rowValue}
                onClick={() => handleEdit("fullName", profile?.fullName)}
              >
                {profile?.fullName || user.displayName || "Not Set"}
              </div>
            )}
          </div>
        </div>

        {/* ✅ Other editable fields */}
        {["gender", "birthday", "phone"].map((field) => (
          <div key={field} className={styles.row}>
            <div className={styles.label}>
              {field.charAt(0).toUpperCase() + field.slice(1)}
            </div>
            <div className={styles.valueArea}>
              {editField === field ? (
                <div className={styles.editArea}>
                  {field === "gender" ? (
                    <select
                      value={fieldValue}
                      onChange={(e) => setFieldValue(e.target.value)}
                      className={styles.select}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <input
                      type={field === "birthday" ? "date" : "text"}
                      value={fieldValue}
                      onChange={(e) => setFieldValue(e.target.value)}
                      className={styles.input}
                    />
                  )}
                  <div className={styles.editButtons}>
                    <button onClick={handleSave} className={styles.saveBtn}>
                      Save
                    </button>
                    <button
                      onClick={() => setEditField(null)}
                      className={styles.cancelBtn}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={styles.rowValue}
                  onClick={() => handleEdit(field, profile?.[field])}
                >
                  {field === "birthday"
                    ? profile?.birthday
                      ? new Date(profile.birthday).toLocaleDateString()
                      : "Not Set"
                    : profile?.[field] || "Not Set"}
                </div>
              )}
            </div>
          </div>
        ))}


        {/* 🔹 Change Password Collapsible Section */}
        <div className={styles.passwordSection}>
          <div
            className={styles.passwordHeader}
            onClick={() => setIsChangingPassword((prev) => !prev)}
          >
            <span>Change Password</span>

          </div>

          {isChangingPassword && (
            <form
              onSubmit={handleChangePassword}
              className={`${styles.passwordForm} ${styles.passwordFormVisible}`}
            >
              <input
                type="password"
                placeholder="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={styles.input}
              />
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={styles.input}
              />
              <div className={styles.passwordButtons}>
                <button
                  type="submit"
                  disabled={!currentPassword || !newPassword}
                  className={styles.saveBtn}
                >
                  Update Password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setCurrentPassword("");
                    setNewPassword("");
                  }}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>



        

        {/* 🔹 Change Email Collapsible Section */}
        <div className={styles.passwordSection}>
          <div
            className={styles.passwordHeader}
            onClick={() => setIsChangingEmail((prev) => !prev)}
          >
            <span>Change Email</span>
          </div>

          {isChangingEmail && (
            <form
              onSubmit={handleChangeEmail}
              className={`${styles.passwordForm} ${styles.passwordFormVisible}`}
            >
              <input
                type="email"
                placeholder="New Email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className={styles.input}
              />
              <input
                type="password"
                placeholder="Current Password"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                className={styles.input}
              />
              <div className={styles.passwordButtons}>
                <button
                  type="submit"
                  disabled={!newEmail || !emailPassword}
                  className={styles.saveBtn}
                >
                  Update Email
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingEmail(false);
                    setNewEmail("");
                    setEmailPassword("");
                  }}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>


        <div className={styles.buttonGroup}>
          <button onClick={() => router.push("/orders")}>My Orders</button>
          <button
            onClick={() =>
              signOut(auth).then(() => {
                router.push("/");
              })
            }
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
