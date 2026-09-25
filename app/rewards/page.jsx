"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../src/lib/firebase";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp/FloatingWhatsApp";
import styles from "./rewards.module.css";

// Use a relative path so it automatically works on the live Hostinger domain
const API_URL = "/backend";
const STAMPS_FOR_REWARD = 3;

export default function RewardsPage() {
  const [user, setUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [stamps, setStamps] = useState(0);
  const [pendingStamp, setPendingStamp] = useState(false);
  const [rewardReady, setRewardReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [phone, setPhone] = useState("");
  const [notice, setNotice] = useState("");
  const [isScan, setIsScan] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const requestedRef = useRef(false);
  const phonePromptRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsScan(new URLSearchParams(window.location.search).has("scan"));
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncUserWithBackend(currentUser);
        await fetchUserData(currentUser.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const syncUserWithBackend = async (firebaseUser) => {
    try {
      await fetch(`${API_URL}/login.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || "",
          email: firebaseUser.email || "",
          phone: firebaseUser.phoneNumber || "",
        }),
      });
    } catch (error) {
      console.error("Error syncing user:", error);
    }
  };

  const fetchUserData = async (uid) => {
    try {
      const res = await fetch(`${API_URL}/get_user.php?uid=${uid}`);
      const data = await res.json();
      if (res.ok) {
        setDbUser(data.user);
        setStamps(data.stamps ?? 0);
        setPendingStamp(!!data.pending_stamp);
        setRewardReady(!!data.reward_ready);
        // Show phone collection modal if phone is not on file
        if (!data.user?.phone) {
          setShowPhoneModal(true);
        } else {
          setShowPhoneModal(false);
        }
      } else {
        console.error("Error fetching user data:", data.error);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
      alert("Login failed. Please try again.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setDbUser(null);
    setStamps(0);
    setPendingStamp(false);
    setRewardReady(false);
    setNotice("");
  };

  const requestStamp = useCallback(async (withPhone) => {
    if (!user) return;
    setRequesting(true);
    setNotice("");
    try {
      const res = await fetch(`${API_URL}/request_stamp.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          ...(withPhone ? { phone: withPhone } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNotice(data.error || "Could not request a stamp. Please try again.");
      }
      await fetchUserData(user.uid);
    } catch (error) {
      console.error("Error requesting stamp:", error);
      setNotice("Could not reach the server. Please try again.");
    }
    setRequesting(false);
  }, [user]);

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    const cleaned = phone.trim();
    if (!cleaned) return;
    setSavingPhone(true);
    setNotice("");
    await fetch(`${API_URL}/login.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: user.uid,
        name: user.displayName || "",
        email: user.email || "",
        phone: cleaned,
      }),
    });
    await fetchUserData(user.uid);
    setShowPhoneModal(false);
    // If the customer arrived via QR scan and hasn't requested a stamp yet, do it now
    if (isScan && !requestedRef.current) {
      requestedRef.current = true;
      await requestStamp(cleaned);
    }
    setSavingPhone(false);
  };

  // Auto-request a stamp when arriving via the billing-desk QR.
  // If the customer has no phone on file, ask for it first.
  useEffect(() => {
    if (!user || !isScan || requestedRef.current) return;
    if (pendingStamp) return;
    if (!dbUser) return;
    if (rewardReady) return;

    if (dbUser.phone) {
      // Mark as requested only when we actually fire the request
      requestedRef.current = true;
      requestStamp();
    } else {
      // Show phone prompt — do NOT set requestedRef yet,
      // so handlePhoneSubmit can call requestStamp after saving the phone.
      phonePromptRef.current = true;
      setNotice("Almost done — add your phone number so our team can stamp your card.");
    }
  }, [user, isScan, dbUser, pendingStamp, rewardReady, requestStamp]);

  // While a stamp is pending approval, poll so the card updates live.
  useEffect(() => {
    if (!user || !pendingStamp) return;
    const id = setInterval(() => fetchUserData(user.uid), 6000);
    return () => clearInterval(id);
  }, [user, pendingStamp]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span className={styles.loadingText}>Loading your rewards…</span>
        </div>
        <Footer />
        <FloatingWhatsApp />
      </>
    );
  }

  // ── Phone collection gate ─────────────────────────────────────────────────
  // Show this full-screen step right after first Google login if phone is missing.
  if (user && showPhoneModal) {
    return (
      <>
        <Navbar />
        <main className={styles.page}>
          <header className={styles.header}>
            <div className={styles.eyebrow}>Almost there!</div>
            <h1 className={styles.title}>
              One last <em>step</em>
            </h1>
            <p className={styles.subtitle}>
              Add your phone number so the team can find your account at the billing desk.
            </p>
          </header>

          <div className={styles.card}>
            <div className={styles.cardBody}>
              {/* Pre-filled details from Google */}
              <div className={styles.prefillRow}>
                <span className={styles.prefillLabel}>Name</span>
                <span className={styles.prefillValue}>{user.displayName || "—"}</span>
              </div>
              <div className={styles.prefillRow}>
                <span className={styles.prefillLabel}>Email</span>
                <span className={styles.prefillValue}>{user.email || "—"}</span>
              </div>

              <form onSubmit={handlePhoneSubmit} className={styles.phoneRow} style={{ marginTop: "1.25rem" }}>
                <input
                  type="tel"
                  placeholder="Phone number (e.g. 9876543210)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={styles.input}
                  required
                  autoFocus
                  pattern="[0-9]{10}"
                  title="Please enter a valid 10-digit phone number"
                />
                <button
                  type="submit"
                  disabled={savingPhone || phone.trim().length < 10}
                  className={styles.btnPrimary}
                >
                  {savingPhone ? "Saving…" : "Continue →"}
                </button>
              </form>

            </div>
          </div>
        </main>
        <Footer />
        <FloatingWhatsApp />
      </>
    );
  }
  // ─────────────────────────────────────────────────────────────────────────


  if (!user) {
    return (
      <>
        <Navbar />
        <main className={styles.page}>
          <header className={styles.header}>
            <div className={styles.eyebrow}>Glam &amp; Fab Members</div>
            <h1 className={styles.title}>
              Where Loyalty <em>Rewards You</em>
            </h1>
            <p className={styles.subtitle}>
              Scan the QR code at the billing desk on every visit to collect a
              stamp. Collect all three to unlock your reward!
            </p>
          </header>

          <div className={styles.loginActions}>
            <button onClick={handleGoogleLogin} className={styles.googleBtn}>
              <Image
                src="https://www.google.com/favicon.ico"
                alt="Google"
                width={18}
                height={18}
                className={styles.googleImg}
                unoptimized
              />
              Continue with Google
            </button>
            <span className={styles.loginNote}>Fast &amp; secure login</span>
            <a href="/" className={styles.backLink}>
              Back to Home
            </a>
          </div>
        </main>
        <Footer />
        <FloatingWhatsApp />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <header className={styles.header}>
          <div className={styles.eyebrow}>Glam &amp; Fab Members</div>
          <h1 className={styles.title}>
            Hi, <em>{user.displayName || "Beautiful"}</em>
          </h1>
          <p className={styles.subtitle}>Your Glam &amp; Fab Reward Card</p>
        </header>

        <div className={styles.card}>
          {/* Stamp card */}
          <div className={styles.cardHead}>
            <button onClick={handleLogout} className={styles.logout}>
              Logout
            </button>

            <div className={styles.stampRow}>
              {Array.from({ length: STAMPS_FOR_REWARD }).map((_, i) => (
                <div
                  key={i}
                  className={`${styles.stamp} ${
                    i < stamps ? styles.stampFilled : ""
                  } ${pendingStamp && i === stamps ? styles.stampPending : ""}`}
                >
                  {i < stamps ? (
                    <svg viewBox="0 0 24 24" className={styles.stampIcon} aria-hidden="true">
                      <path d="M12 1.5l3.2 6.5 7.2 1-5.2 5 1.2 7.1L12 17.9 5.6 21l1.2-7.1-5.2-5 7.2-1L12 1.5z" />
                    </svg>
                  ) : null}
                </div>
              ))}
            </div>

            <span className={styles.stampCount}>
              <span className={styles.stampCountNum}>{stamps}</span>
              <span className={styles.stampCountLabel}>
                of {STAMPS_FOR_REWARD} stamps
              </span>
            </span>
          </div>

          {/* Content */}
          <div className={styles.cardBody}>
            {isScan && !pendingStamp && !rewardReady && (
              <div className={styles.infoBanner}>
                Scan received — {requesting ? "requesting your stamp…" : "we're ready to stamp your card!"}
              </div>
            )}

            {phonePromptRef.current && !dbUser?.phone && (
              <div className={styles.phoneCard}>
                <p className={styles.phoneText}>
                  Add your phone number so our team can approve your stamp.
                </p>
                <form onSubmit={handlePhoneSubmit} className={styles.phoneRow}>
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={styles.input}
                    required
                  />
                  <button
                    type="submit"
                    disabled={savingPhone || !phone.trim()}
                    className={styles.btnPrimary}
                  >
                    {savingPhone ? "Saving…" : "Submit"}
                  </button>
                </form>
              </div>
            )}

            {pendingStamp && (
              <div className={styles.pendingBanner}>
                <div className={styles.pendingPulse} />
                <div>
                  <strong className={styles.pendingTitle}>Stamp requested!</strong>
                  <span className={styles.pendingText}>
                    Show us at the billing desk — a staff member will approve it any moment.
                  </span>
                </div>
              </div>
            )}

            {rewardReady && (
              <div className={styles.rewardBanner}>
                <div className={styles.rewardTitle}>Reward unlocked!</div>
                <p className={styles.rewardText}>
                  Show this screen at the billing desk to claim your surprise.
                </p>
              </div>
            )}

            {!pendingStamp && !rewardReady && (
              <p className={styles.hint}>
                {isScan
                  ? "Once approved, your stamp will appear here."
                  : "Scan the QR code at the billing desk on your next visit to earn a stamp."}
              </p>
            )}

            {notice && <div className={styles.notice}>{notice}</div>}
          </div>
        </div>
      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}