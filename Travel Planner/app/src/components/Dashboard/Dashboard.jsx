import React from "react";
import styles from "./Dashboard.module.css";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../firebase";
import { doc, deleteDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { limit, orderBy } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  // dynamic date & format
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Return name from firebase
  const user = getAuth().currentUser;
  const [userName, setUserName] = useState(user?.displayName || "User");

  const [flights, setFlights] = useState([]);
  const [recentTrips, setRecentTrips] = useState([]);
  const [bookedTripsCount, setBookedTripsCount] = useState(0);
  const [pastTripsCount, setPastTripsCount] = useState(0);
  const [aiPlansCount, setAiPlansCount] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = getAuth().currentUser;
    if (!currentUser) return;

    const q = query(
      collection(db, "savedFlights"),
      where("userId", "==", currentUser.uid),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const flightsList = snapshot.docs.map((doc) => ({
        firebaseId: doc.id,
        ...doc.data().flight,
      }));

      setFlights(flightsList);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    console.log("Flights:", flights);
  }, [flights]);

  // ==============================================================================
  // delete flight from saved flights
  const handleDeleteFlight = async (firebaseDocId) => {
    console.log("Deleting:", firebaseDocId);
    if (!firebaseDocId) {
      console.error("No Document ID provided!");
      return;
    }
    try {
      await deleteDoc(doc(db, "savedFlights", firebaseDocId));
      toast.success("Flight removed successfully 🗑️");
    } catch (error) {
      console.error("Error deleting flight: ", error);
      toast.error("Failed to remove flight");
    }
  };

  useEffect(() => {
    const currentUser = getAuth().currentUser;
    if (!currentUser) return;

    //show recent trips
    const qRecent = query(
      collection(db, "bookedTrips"),
      where("userId", "==", currentUser.uid),
    );

    const unsubscribe = onSnapshot(qRecent, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const now = new Date();

      const past = [];
      const upcoming = [];

      list.forEach((trip) => {
        const departure = trip.flightDetails?.legs?.[0]?.departure;

        if (departure && new Date(departure) < now) {
          past.push(trip);
        } else {
          upcoming.push(trip);
        }
      });

      setRecentTrips(upcoming);
      setPastTripsCount(past.length);
    });

    return () => unsubscribe();
  }, []);
  console.log(flights);
  console.log(recentTrips);

  //number of booked trips
  useEffect(() => {
    const currentUser = getAuth().currentUser;
    if (!currentUser) return;

    const q = query(
      collection(db, "bookedTrips"),
      where("userId", "==", currentUser.uid),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setBookedTripsCount(snapshot.size);
    });

    return () => unsubscribe();
  }, []);

  // number of AI plans
  useEffect(() => {
    const currentUser = getAuth().currentUser;
    if (!currentUser) return;

    const q = query(
      collection(db, "aiPlans"),
      where("userId", "==", currentUser.uid),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAiPlansCount(snapshot.size);
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      <div className="container-fluid min-vh-100 bg-light p-0">
        <div className="row g-0">
          {/* Side Bar */}
          <div className="col-4 col-md-3 col-lg-2 bg-white border-end p-3">
            <div className={styles.sidebar}>
              <div className={styles.sectionHeader}>Overview</div>

              <Link
                to="/dashboard"
                className={`${styles.sidebarLink} ${styles.activeLink}`}
              >
                <div className="d-flex align-items-center gap-2">
                  <span role="img" aria-label="dashboard">
                    📊
                  </span>
                  <span>Dashboard</span>
                </div>
              </Link>

              <Link to="/profile" className={styles.sidebarLink}>
                <div className="d-flex align-items-center gap-2">
                  <span role="img" aria-label="profile">
                    👤
                  </span>
                  <span>Profile</span>
                </div>
              </Link>

              <div className={styles.sectionHeader}>Travel</div>

              <Link to="/trips" className={styles.sidebarLink}>
                <div className="d-flex align-items-center gap-2">
                  <span role="img" aria-label="Trips">
                    ✈️
                  </span>
                  <span>BookedTrips</span>
                </div>
                <span className={styles.badgeBlue}>{bookedTripsCount}</span>
              </Link>

              <Link to="/savedflights" className={styles.sidebarLink}>
                <div className="d-flex align-items-center gap-2">
                  <span role="img" aria-label="saved">
                    💾
                  </span>
                  <span>Saved Flights</span>
                </div>
              </Link>

              <Link to="/pastTrips" className={styles.sidebarLink}>
                <div className="d-flex align-items-center gap-2">
                  <span role="img" aria-label="trips">
                    🧳
                  </span>
                  <span>Past Trips</span>
                </div>
              </Link>

              <div className={styles.sectionHeader}>Discover</div>

              <Link to="/destinations" className={styles.sidebarLink}>
                <div className="d-flex align-items-center gap-2">
                  <span role="img" aria-label="destinations">
                    🌍
                  </span>
                  <span>Destinations</span>
                </div>
              </Link>

              <Link to="/tripPlanner" className={styles.sidebarLink}>
                <div className="d-flex align-items-center gap-2">
                  <span role="img" aria-label="ai">
                    🤖
                  </span>
                  <span>AI Planner</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Main Content */}
          <div className={styles.main + " main col-8 col-md-9 col-lg-10 p-4"}>
            <div className="first d-flex justify-content-between mx-3">
              <div className="caption">
                <h2>Welcome, {userName}</h2>
                <p className="text-secondary">Here's your travel overview</p>
              </div>
              <div className="date ">
                <small
                  className="border rounded-3 bg-transparent shadow-sm py-2 px-2 text-secondary d-inline-block "
                  style={{ whiteSpace: "nowrap", borderColor: "#cbd5e1" }}
                >
                  {formattedDate}
                </small>
              </div>
            </div>

            {/* Stat Cards */}
            <div className="second m-3 ">
              <div className="row g-4">
                <div className="col-12 col-sm-6 col-md-4">
                  <div
                    className={`card rounded-4 shadow-sm h-100 p-3 ${styles.statCard}`}
                  >
                    <div className="mb-2 fs-5">✈️</div>

                    <h3>{flights.length}</h3>
                    <p className="text-secondary ">Saved Flights</p>
                  </div>
                </div>
                <div className="col-12 col-sm-6 col-md-4">
                  <div
                    className={`card rounded-4 shadow-sm h-100 p-3 ${styles.statCard}`}
                  >
                    <div className="mb-2 fs-5">🧳</div>
                    <h3>{pastTripsCount}</h3>
                    <p className="text-secondary ">Past trips</p>
                  </div>
                </div>
                <div className="col-12 col-sm-6 col-md-4">
                  <div
                    className={`card rounded-4 shadow-sm h-100 p-3 ${styles.statCard}`}
                  >
                    <div className="mb-2 fs-5">🤖</div>
                    <h3>{aiPlansCount}</h3>
                    <p className="text-secondary ">AI Plans Generated</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="third m-3">
              <div className="row g-4">
                <div className="col-12 col-lg-7">
                  <div className={styles.flightCard + " card shadow-sm mb-4 "}>
                    <div
                      className={`cardHeader d-flex justify-content-between align-items-center p-2 ${styles.cardHeader}`}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <span role="img" aria-label="airplane" className="fs-7">
                          ✈️
                        </span>
                        <h5 className={styles.cardTitle + " fw-bold mb-0"}>
                          Saved Flights
                        </h5>
                      </div>
                      <Link to="/savedflights" className={styles.viewAllLink}>
                        View all <span className="fs-6">→</span>
                      </Link>
                    </div>

                    <div
                      className={`card-body p-4 bg-white ${styles.cardBody}`}
                    >
                      {flights.length === 0 ? (
                        <p className="text-muted text-center my-4">
                          No saved flights found.
                        </p>
                      ) : (
                        flights.map((flight) => {
                          const leg = flight?.legs?.[0];

                          return (
                            <div
                              key={flight.firebaseId}
                              className={styles.flightRow}
                            >
                              <div className="d-flex align-items-center gap-3">
                                <div>
                                  <div className={styles.flightRoute}>
                                    {leg?.origin?.city} →{" "}
                                    {leg?.destination?.city}
                                  </div>

                                  <div>
                                    <small
                                      className="text-muted"
                                      style={{ fontSize: "11px" }}
                                    >
                                      {leg?.origin?.displayCode} →{" "}
                                      {leg?.destination?.displayCode}
                                    </small>
                                  </div>

                                  <small className="text-secondary">
                                    {leg?.carriers?.marketing?.[0]?.name} •{" "}
                                    {leg?.stopCount === 0
                                      ? "Nonstop"
                                      : `${leg?.stopCount} stop`}{" "}
                                    • {Math.floor(leg?.durationInMinutes / 60)}h{" "}
                                    {leg?.durationInMinutes % 60}m
                                  </small>
                                </div>
                              </div>

                              <div className="d-flex align-items-center gap-3">
                                <span className={styles.flightPrice}>
                                  {flight?.price?.formatted}
                                </span>

                                <button
                                  onClick={() =>
                                    handleDeleteFlight(flight.firebaseId)
                                  }
                                  className={styles.deleteBtn}
                                >
                                  <i className="fa-solid fa-trash-can"></i>
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent Trips */}
                <div className="col-12 col-lg-5">
                  <div className={`card shadow-sm ${styles.tripCard}`}>
                    <div
                      className={`d-flex align-items-center justify-content-between p-2 ${styles.cardHeader}`}
                    >
                      <div className="d-flex align-items-center">
                        <span role="img" aria-label="luggage" className="fs-7">
                          🧳
                        </span>
                        <h5 className={styles.cardTitle}>Recent Trips</h5>
                      </div>
                      <Link to="/trips" className={styles.viewAllLink}>
                        View all <span>→</span>
                      </Link>
                    </div>

                    <div className={styles.cardBody}>
                      {recentTrips.length === 0 ? (
                        <p
                          className="text-muted text-center my-4"
                          style={{ fontSize: "14px" }}
                        >
                          No recent trips found.
                        </p>
                      ) : (
                        recentTrips.slice(0, 3).map((trip) => {
                          const tripData = trip.flightDetails;
                          const leg = tripData?.legs?.[0];

                          const departureTime = leg?.departure;
                          let displayDate = "Flexible";

                          if (departureTime) {
                            const dateObj = new Date(departureTime);
                            displayDate = dateObj.toLocaleDateString("en-US", {
                              day: "numeric",
                              month: "short",
                            });
                          }

                          return (
                            <div key={trip.id} className={styles.tripRow}>
                              <div className="d-flex align-items-center gap-2">
                                <span
                                  className={styles.dot}
                                  style={{ backgroundColor: "#3b82f6" }}
                                ></span>
                                <div>
                                  <div className={styles.tripRoute}>
                                    {leg?.destination?.city ||
                                      tripData?.title ||
                                      "Unknown Destination"}
                                  </div>

                                  <small
                                    className="text-secondary"
                                    style={{ fontSize: "12px" }}
                                  >
                                    {leg?.origin?.displayCode || "---"} →{" "}
                                    {leg?.destination?.displayCode || "---"}
                                  </small>
                                </div>
                              </div>

                              <span className={styles.tripDate}>
                                {displayDate}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className={`card shadow-sm ${styles.actionCard}`}>
                    <div className={styles.actionHeader}>
                      <span role="img" aria-label="thunder" className="fs-7">
                        ⚡️
                      </span>
                      <h5 className={styles.cardTitle}>Quick Actions</h5>
                    </div>
                  </div>
                  <div className={styles.actionBody}>
                    <div className="row g-3">
                      <div className="col-6">
                        <button
                          className={styles.actionBtn}
                          onClick={() => navigate("/flights")}
                        >
                          🔍 Search flights
                        </button>
                      </div>
                      <div className="col-6">
                        <button
                          className={styles.actionBtn}
                          onClick={() => navigate("/tripPlanner")}
                        >
                          🤖 Plan a trip
                        </button>
                      </div>
                      <div className="col-6">
                        <button
                          className={styles.actionBtn}
                          onClick={() => navigate("/destinations")}
                        >
                          🌍 Destinations
                        </button>
                      </div>
                      <div className="col-6">
                        <button
                          className={styles.actionBtn}
                          onClick={() => navigate("/profile")}
                        >
                          👤 Edit profile
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
