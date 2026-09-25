"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp/FloatingWhatsApp";
import styles from "../rewards.module.css";

// Use a relative path so it automatically works on the live Hostinger domain
const API_URL = "/backend";
const STAFF_PASS = process.env.NEXT_PUBLIC_STAFF_PASS || "local_dev_pass";

const timeAgo = (dateString) => {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  return new Date(dateString).toLocaleString();
};

export default function StaffPortal() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pending, setPending] = useState([]);
  const [rewardReady, setRewardReady] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("success");

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/stamp_requests.php?staff_pass=${STAFF_PASS}`);
      const data = await res.json();
      if (res.ok) {
        setPending(data.pending || []);
        setRewardReady(data.reward_ready || []);
      } else {
        setStatus(data.error || "Failed to load requests.");
        setStatusType("error");
      }
    } catch {
      setStatus("Could not reach the server.");
      setStatusType("error");
    }
    setLoading(false);
  };

  const loadAllUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`${API_URL}/all_users.php?staff_pass=${STAFF_PASS}`);
      const data = await res.json();
      if (res.ok) setAllUsers(data.users || []);
    } catch {
      // silently fail — not critical
    }
    setLoadingUsers(false);
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    loadRequests();
    loadAllUsers();

    // Poll every 2 seconds for near-instant request visibility
    const id = setInterval(loadRequests, 2000);

    // Also refresh immediately whenever the staff switches back to this tab
    const handleVisibility = () => {
      if (document.visibilityState === "visible") loadRequests();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === STAFF_PASS) {
      setIsAuthenticated(true);
      setStatus("");
    } else {
      setStatus("Invalid password.");
      setStatusType("error");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword("");
    setPending([]);
    setRewardReady([]);
    setStatus("");
  };

  const approveStamp = async (stampId) => {
    setBusyId(stampId);
    setStatus("");
    try {
      const res = await fetch(`${API_URL}/approve_stamp.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staff_pass: STAFF_PASS, stamp_id: stampId }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusType("success");
        setStatus("Stamp approved ✓");
      } else {
        setStatusType("error");
        setStatus(data.error || "Failed to approve.");
      }
    } catch {
      setStatusType("error");
      setStatus("Could not reach the server.");
    }
    await loadRequests();
    setBusyId(null);
  };

  const rejectStamp = async (stampId) => {
    setBusyId(stampId);
    setStatus("");
    try {
      const res = await fetch(`${API_URL}/reject_stamp.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staff_pass: STAFF_PASS, stamp_id: stampId }),
      });
      const data = await res.json();
      setStatusType(res.ok ? "success" : "error");
      setStatus(res.ok ? "Stamp rejected." : data.error || "Failed to reject.");
    } catch {
      setStatusType("error");
      setStatus("Could not reach the server.");
    }
    await loadRequests();
    setBusyId(null);
  };

  const redeemReward = async (uid) => {
    setBusyId(`redeem-${uid}`);
    setStatus("");
    try {
      const res = await fetch(`${API_URL}/redeem_reward.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staff_pass: STAFF_PASS, uid }),
      });
      const data = await res.json();
      setStatusType(res.ok ? "success" : "error");
      setStatus(res.ok ? "Reward redeemed ✓" : data.error || "Failed to redeem.");
    } catch {
      setStatusType("error");
      setStatus("Could not reach the server.");
    }
    await loadRequests();
    setBusyId(null);
  };

  if (!isAuthenticated) {
    return (
      <>
        <Navbar />
        <main className={styles.page}>
          <header className={styles.header}>
            <div className={styles.eyebrow}>Staff Only</div>
            <h1 className={styles.title}>
              Staff <em>Portal</em>
            </h1>
            <p className={styles.subtitle}>
              Approve stamps scanned by customers at the billing desk.
            </p>
          </header>

          <form onSubmit={handleLogin} className={styles.formCard}>
            <div className={styles.field}>
              <label htmlFor="staffPassword" className={styles.label}>
                Staff Password
              </label>
              <input
                id="staffPassword"
                type="password"
                placeholder="Enter staff password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                required
              />
              {status && (
                <div className={`${styles.statusError} ${styles.statusInline}`}>{status}</div>
              )}
            </div>
            <button type="submit" className={`${styles.btnPrimary} ${styles.btnBlock}`}>
              Login
            </button>
          </form>
        </main>
        <Footer />
        <FloatingWhatsApp />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className={`${styles.page} ${styles.staffPage}`}>
        <header className={styles.header}>
          <div className={styles.eyebrow}>Staff Only</div>
          <h1 className={styles.title}>
            Approve <em>Stamps</em>
          </h1>
          <p className={styles.subtitle}>
            Customers scan the desk QR, you approve — you&apos;ll see their name and phone here.
          </p>

          <div className={styles.staffHeaderActions}>
            <button onClick={loadRequests} className={styles.refreshBtn} disabled={loading}>
              {loading ? "Refreshing…" : "Refresh"}
            </button>
            <button onClick={handleLogout} className={styles.refreshBtn}>
              Logout
            </button>
          </div>
        </header>

        {status && (
          <div
            className={`${styles.statusBanner} ${
              statusType === "success" ? styles.statusSuccess : styles.statusError
            }`}
          >
            {status}
          </div>
        )}

        {/* Pending stamps */}
        <section className={styles.staffSection}>
          <h2 className={styles.sectionHead}>
            Pending Stamps{" "}
            {pending.length > 0 && <span className={styles.badge}>{pending.length}</span>}
          </h2>

          {pending.length === 0 ? (
            <p className={styles.empty}>No stamps waiting for approval.</p>
          ) : (
            <ul className={styles.requestList}>
              {pending.map((r) => (
                <li key={r.id} className={styles.requestItem}>
                  <div className={styles.requestInfo}>
                    <strong className={styles.customerName}>{r.name || "Guest"}</strong>
                    <span className={styles.customerPhone}>
                      <svg viewBox="0 0 24 24" className={styles.phoneIcon} aria-hidden="true">
                        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                      </svg>
                      {r.phone ? r.phone : "No phone on file"}
                    </span>
                    <span className={styles.requestMeta}>
                      {r.stamps} / 3 stamps so far · {timeAgo(r.created_at)}
                    </span>
                  </div>
                  <div className={styles.requestActions}>
                    <button
                      className={styles.approveBtn}
                      onClick={() => approveStamp(r.id)}
                      disabled={busyId === r.id}
                    >
                      {busyId === r.id ? "…" : "Approve"}
                    </button>
                    <button
                      className={styles.rejectBtn}
                      onClick={() => rejectStamp(r.id)}
                      disabled={busyId === r.id}
                    >
                      Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Reward ready */}
        <section className={styles.staffSection}>
          <h2 className={styles.sectionHead}>Rewards Ready</h2>
          {rewardReady.length === 0 ? (
            <p className={styles.empty}>No rewards ready yet.</p>
          ) : (
            <ul className={styles.requestList}>
              {rewardReady.map((r) => (
                <li key={r.id} className={styles.requestItem}>
                  <div className={styles.requestInfo}>
                    <strong className={styles.customerName}>{r.name || "Guest"}</strong>
                    <span className={styles.customerPhone}>
                      <svg viewBox="0 0 24 24" className={styles.phoneIcon} aria-hidden="true">
                        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                      </svg>
                      {r.phone ? r.phone : "No phone on file"}
                    </span>
                    <span className={styles.requestMeta}>{r.stamps} stamps — reward unlocked</span>
                  </div>
                  <div className={styles.requestActions}>
                    <button
                      className={styles.approveBtn}
                      onClick={() => redeemReward(r.id)}
                      disabled={busyId === `redeem-${r.id}`}
                    >
                      {busyId === `redeem-${r.id}` ? "…" : "Redeem"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Customer Records */}
        <section className={styles.staffSection}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h2 className={styles.sectionHead} style={{ marginBottom: 0 }}>
              Customer Records{" "}
              {allUsers.length > 0 && <span className={styles.badge}>{allUsers.length}</span>}
            </h2>
            <button onClick={loadAllUsers} className={styles.refreshBtn} disabled={loadingUsers}>
              {loadingUsers ? "Loading…" : "Refresh"}
            </button>
          </div>

          {allUsers.length === 0 ? (
            <p className={styles.empty}>No customers have signed up yet.</p>
          ) : (
            <>
              {/* Desktop: scrollable table */}
              <div className={styles.tableWrapper}>
                <table className={styles.usersTable}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th style={{ textAlign: "center" }}>Stamps</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map((u) => (
                      <tr key={u.id}>
                        <td>{u.name || "—"}</td>
                        <td className={styles.tdMuted}>{u.email || "—"}</td>
                        <td className={styles.tdMuted}>{u.phone || "—"}</td>
                        <td style={{ textAlign: "center" }}>
                          <span className={`${styles.badge} ${parseInt(u.stamps) >= 3 ? styles.badgeGold : ""}`}>
                            {u.stamps ?? 0}
                          </span>
                        </td>
                        <td className={styles.tdSubtle}>
                          {new Date(u.created_at).toLocaleDateString("en-IN", {
                            day: "2-digit", month: "short", year: "numeric"
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile: card list */}
              <div className={styles.userCardList}>
                {allUsers.map((u) => (
                  <div key={u.id} className={styles.userCard}>
                    <div className={styles.userCardInfo}>
                      <span className={styles.userCardDetail}>{u.name || "Guest"}</span>
                      <span className={styles.userCardDetail}>{u.email || "No email"}</span>
                      <span className={styles.userCardDetail}>{u.phone || "No phone"}</span>
                      <span className={styles.userCardDate}>
                        {new Date(u.created_at).toLocaleDateString("en-IN", {
                          day: "2-digit", month: "short", year: "numeric"
                        })}
                      </span>
                    </div>
                    <span className={`${styles.badge} ${parseInt(u.stamps) >= 3 ? styles.badgeGold : ""}`}>
                      {u.stamps ?? 0} {parseInt(u.stamps) >= 3 ? "★" : "stamps"}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}