"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../src/lib/firebase";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp/FloatingWhatsApp";
import styles from "./rewards.module.css";

// Relative path works on the live Hostinger domain. For local development
// with the PHP backend on XAMPP/Apache (a different port than the Next dev
// server), set NEXT_PUBLIC_API_URL in .env.local (e.g. http://localhost/backend).
const API_URL = process.env.NEXT_PUBLIC_API_URL || "/backend";
const STAMPS_FOR_REWARD = 3;
// TODO: replace with the salon's real Google review link (Maps Place ID URL).
const GOOGLE_REVIEW_URL =
  process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL ||
  "https://www.google.com/maps/search/?api=1&query=Glam+and+Fab+Salon+Adoor";

// Scratch-off overlay: gold cover the user wipes with a finger/mouse.
// Calls onScratched() once ~45% is cleared. Purely cosmetic — the reward
// is assigned server-side; this only triggers the reveal API call.
function ScratchCover({ onScratched }) {
  const canvasRef = useRef(null);
  const doneRef = useRef(false);
  const cellsRef = useRef(new Set());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const w = parent.clientWidth || 300;
    const h = 170;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#c9a96e");
    grad.addColorStop(0.5, "#e8cf9a");
    grad.addColorStop(1, "#a8843f");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Soft diagonal shine band for a brushed-metal feel
    const shine = ctx.createLinearGradient(0, 0, w, 0);
    shine.addColorStop(0, "rgba(255,255,255,0)");
    shine.addColorStop(0.5, "rgba(255,250,225,0.22)");
    shine.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = shine;
    ctx.fillRect(w * 0.2, 0, w * 0.2, h);

    // Scattered sparkles so the cover reads as a prize card
    ctx.fillStyle = "rgba(255,243,205,0.55)";
    ctx.font = "10px Jost, sans-serif";
    [
      [0.12, 0.2], [0.86, 0.16], [0.2, 0.82], [0.88, 0.78],
      [0.5, 0.1], [0.72, 0.9], [0.3, 0.36], [0.66, 0.62],
    ].forEach(([sx, sy]) => ctx.fillText("✦", sx * w, sy * h));

    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(20,14,8,0.6)";
    ctx.font = "500 10px Jost, sans-serif";
    ctx.fillText("G L A M  &  F A B  ·  S U R P R I S E", w / 2, h / 2 - 40);
    ctx.fillStyle = "rgba(20,14,8,0.75)";
    ctx.font = "600 13px Jost, sans-serif";
    ctx.fillText("SCRATCH HERE  ✦", w / 2, h / 2 - 6);
    ctx.font = "300 11px Jost, sans-serif";
    ctx.fillText("use your finger or mouse", w / 2, h / 2 + 16);

    const COLS = 10;
    const ROWS = 6;
    const erase = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      const cx = Math.min(COLS - 1, Math.max(0, Math.floor((x / rect.width) * COLS)));
      const cy = Math.min(ROWS - 1, Math.max(0, Math.floor((y / rect.height) * ROWS)));
      cellsRef.current.add(`${cx}:${cy}`);
      if (!doneRef.current && cellsRef.current.size / (COLS * ROWS) > 0.45) {
        doneRef.current = true;
        onScratched();
      }
    };
    let drawing = false;
    const down = (e) => {
      drawing = true;
      erase(e.clientX, e.clientY);
    };
    const move = (e) => {
      if (drawing) erase(e.clientX, e.clientY);
    };
    const up = () => {
      drawing = false;
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [onScratched]);

  return <canvas ref={canvasRef} className={styles.scratchCanvas} />;
}

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
  const [scratchCard, setScratchCard] = useState(null);
  const [revealing, setRevealing] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [claimingCard, setClaimingCard] = useState(false);
  const [reviewAvailable, setReviewAvailable] = useState(false);
  const [claimingReview, setClaimingReview] = useState(false);
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
        setScratchCard(data.scratch_card || null);
        setReviewAvailable(!!data.review_stamp_available);
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
    setScratchCard(null);
    setReviewAvailable(false);
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

  // Reveal the scratch card. The reward was fixed server-side at issue
  // time; this just flips issued -> revealed and returns the label.
  const revealScratch = useCallback(async () => {
    if (!user || !scratchCard || revealing) return;
    if (scratchCard.status === "revealed") return;
    setRevealing(true);
    try {
      const res = await fetch(`${API_URL}/reveal_scratch.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid, card_id: scratchCard.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setScratchCard((c) => (c ? { ...c, status: "revealed", reward_label: data.reward } : c));
        // Celebrate immediately — the reward label is now known.
        setShowRewardModal(true);
      } else {
        setNotice(data.error || "Could not reveal the card. Please try again.");
      }
    } catch {
      setNotice("Could not reach the server. Please try again.");
    }
    setRevealing(false);
  }, [user, scratchCard, revealing]);

  // Backfill for stamps earned before the scratch feature launched.
  const claimScratchCard = async () => {
    if (!user) return;
    setClaimingCard(true);
    try {
      const res = await fetch(`${API_URL}/claim_scratch.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid }),
      });
      const data = await res.json();
      if (!res.ok) setNotice(data.error || "Could not issue the card.");
      await fetchUserData(user.uid);
    } catch {
      setNotice("Could not reach the server. Please try again.");
    }
    setClaimingCard(false);
  };

  // Google-review bonus: opens the review page, then queues a one-time
  // pending stamp for staff verification.
  const claimReviewStamp = async () => {
    if (!user) return;
    window.open(GOOGLE_REVIEW_URL, "_blank", "noopener,noreferrer");
    setClaimingReview(true);
    try {
      const res = await fetch(`${API_URL}/request_review_stamp.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNotice(data.error || "Could not request the bonus stamp.");
      } else {
        setNotice("Review page opened! After posting, show it at the billing desk — your bonus stamp is queued for approval.");
      }
      await fetchUserData(user.uid);
    } catch {
      setNotice("Could not reach the server. Please try again.");
    }
    setClaimingReview(false);
  };

  const handlePhoneSubmit = async (e) => {    e.preventDefault();
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

            {rewardReady && !scratchCard && (
              <div className={styles.rewardBanner}>
                <div className={styles.rewardTitle}>Reward unlocked!</div>
                <p className={styles.rewardText}>
                  You&apos;ve earned all 3 stamps. Generate your scratch card to reveal your surprise.
                </p>
                <button
                  onClick={claimScratchCard}
                  disabled={claimingCard}
                  className={styles.btnPrimary}
                  style={{ marginTop: "18px" }}
                >
                  {claimingCard ? "Issuing…" : "Get my scratch card →"}
                </button>
              </div>
            )}

            {rewardReady && scratchCard && scratchCard.status === "issued" && (
              <div className={styles.scratchWrap}>
                <div className={styles.rewardTitle}>Scratch your card!</div>
                <p className={styles.rewardText}>
                  Wipe the gold cover to reveal your surprise reward.
                </p>
                <div className={styles.scratchArea}>
                  <div className={styles.scratchHidden}>
                    <span className={styles.scratchHiddenMark}>?</span>
                    <span className={styles.scratchHiddenCaption}>your surprise</span>
                  </div>
                  <ScratchCover onScratched={revealScratch} />
                </div>
                <button
                  onClick={revealScratch}
                  disabled={revealing}
                  className={styles.scratchFallback}
                >
                  {revealing ? "Revealing…" : "Can’t scratch? Tap to reveal instead"}
                </button>
              </div>
            )}

            {rewardReady && scratchCard && scratchCard.status === "revealed" && (
              <div className={styles.rewardBanner}>
                <div className={styles.rewardTitle}>You won: {scratchCard.reward_label}!</div>
                <p className={styles.rewardText}>
                  Show this screen at the billing desk to claim it. Valid for 30 days.
                </p>
              </div>
            )}

            {/* Google-review bonus stamp (one per user, staff-verified) */}
            {reviewAvailable && !pendingStamp && !rewardReady && (
              <div className={styles.reviewCard}>
                <p className={styles.phoneText}>
                  <strong>Bonus stamp:</strong> leave us a Google review and earn an extra stamp toward your reward.
                </p>
                <button
                  onClick={claimReviewStamp}
                  disabled={claimingReview}
                  className={styles.btnPrimary}
                >
                  {claimingReview ? "Saving…" : "Review us on Google →"}
                </button>
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

      {/* ── Reward celebration popup ────────────────────────────────
          Shown right after a successful scratch reveal. The reward was
          decided server-side at issue time; this just presents it. */}
      {showRewardModal && scratchCard?.status === "revealed" && (
        <div
          className={styles.rewardOverlay}
          onClick={() => setShowRewardModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="You won a reward"
        >
          <div className={styles.rewardModal} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.rewardModalClose}
              onClick={() => setShowRewardModal(false)}
              aria-label="Close"
            >
              ×
            </button>

            <div className={styles.confettiWrap} aria-hidden="true">
              {Array.from({ length: 18 }).map((_, i) => (
                <span
                  key={i}
                  className={styles.confetti}
                  style={{
                    left: `${(i * 53 + 5) % 100}%`,
                    animationDelay: `${(i % 6) * 0.22}s`,
                    background: ["var(--gold-light)", "var(--gold)", "#f7edd2"][i % 3],
                    borderRadius: i % 2 ? "50%" : "1px",
                  }}
                />
              ))}
            </div>

            <div className={styles.rewardModalBadge}>✦</div>
            <div className={styles.rewardModalEyebrow}>Congratulations, you won</div>
            <div className={styles.rewardModalPrize}>{scratchCard.reward_label}</div>
            <p className={styles.rewardModalNote}>
              Show this screen at the billing desk to claim it. Valid for 30 days.
            </p>
            <button onClick={() => setShowRewardModal(false)} className={styles.btnPrimary}>
              Done
            </button>
          </div>
        </div>
      )}
      {/* ──────────────────────────────────────────────────────────── */}

      <Footer />
      <FloatingWhatsApp />
    </>
  );
}