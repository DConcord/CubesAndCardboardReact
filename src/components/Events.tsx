import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { usePasswordless } from "amazon-cognito-passwordless-auth/react";

import Accordion from "react-bootstrap/Accordion";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Modal from "react-bootstrap/Modal";

import { formatIsoDate, humanTime_ms } from "../utilities";
import "../assets/fonts/TopSecret.ttf";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { fetchEventsOptions, fetchEventsApiOptions, fetchPlayersOptions, fetchEventsApi } from "./Queries";

const TShoot = lazy(() => import("./TShoot"));
const ManageEventModal = lazy(() => import("./EventManagement"));
const TransferProdEventsModal = lazy(() => import("./TransferProdEvents"));
const RsvpFooter = lazy(() => import("./EventManagement").then((module) => ({ default: module.RsvpFooter })));

import { ManagedEventTask, GameKnightEvent } from "../types/Events";
import { PlayersGroups } from "../types/Players";

import Authenticated, { authenticated } from "../utilities/Authenticated";
import { Table } from "react-bootstrap";

export default function UpcomingEvents() {
  const { signInStatus, tokensParsed, tokens } = usePasswordless();
  const [showAdmin, setShowAdmin] = useState<boolean>(() => {
    // getting stored value
    const saved = localStorage.getItem("showAdmin");
    if (saved === null) return true;
    return JSON.parse(saved);
  });

  useEffect(() => {
    localStorage.setItem("showAdmin", JSON.stringify(showAdmin));
  }, [showAdmin]);

  const [showPrevEvents, setShowPrevEvents] = useState(false);

  const eventsQuery =
    tokens && signInStatus == "SIGNED_IN" ? useQuery(fetchEventsApiOptions()) : useQuery(fetchEventsOptions());
  const playersQuery = useQuery(fetchPlayersOptions());
  const queryClient = useQueryClient();

  const earlyRefreshRef = useRef(Infinity);
  useEffect(() => {
    const now = Date.now();
    const tenMinutesInMs = 10 * 60 * 1000;
    const nextSundayMidnight = new Date(
      new Date().setDate(new Date().getDate() + ((7 - new Date().getDay()) % 7))
    ).setHours(0, 0, 0, 0);
    const msUntilNextSundayMidnight = nextSundayMidnight - now;
    const nextSundayMidnightWithinTenMin = msUntilNextSundayMidnight <= tenMinutesInMs;

    const eventEarlyRefresh = eventsQuery.data
      ? eventsQuery.data
          .filter((event) => {
            const timeDiff = Date.parse(event.date) - Date.now();
            return timeDiff <= tenMinutesInMs && timeDiff >= 0;
          })
          .map((event) => Date.parse(event.date)) // - Date.now())
      : [];
    // console.log({ eventEarlyRefresh: eventEarlyRefresh });
    earlyRefreshRef.current = Math.min(
      nextSundayMidnightWithinTenMin ? nextSundayMidnight : Infinity,
      ...(eventEarlyRefresh ?? Infinity)
    );
    if (earlyRefreshRef.current == Infinity) return;
    // console.log({
    //   earlyRefresh: new Date(earlyRefreshRef.current).toLocaleTimeString("en-US"),
    //   nextSundayMidnight: new Date(nextSundayMidnight).toLocaleTimeString("en-US"),
    //   now: new Date().toLocaleTimeString("en-US"),
    // });
    // setEarlyRefresh(_earlyRefresh);

    const refetchEarly = setInterval(() => {
      const earlyRefresh = earlyRefreshRef.current;
      // console.log({
      //   "refresh time": new Date(earlyRefresh).toLocaleTimeString("en-US"),
      //   "time until refresh": humanTime_ms(earlyRefresh - Date.now()),
      // });
      if (earlyRefresh < Date.now()) {
        queryClient.invalidateQueries({ queryKey: ["events"] });
      }
      if (earlyRefresh + 70000 < Date.now()) {
        // console.log("End Refetch");
        earlyRefreshRef.current = Infinity;
        clearInterval(refetchEarly);
        return;
      }
    }, 5000);
    console.log("refetch2");
    // queryClient.invalidateQueries({ queryKey: ["events"] });
    // eventsQuery.refetch();

    return () => clearInterval(refetchEarly);
  }, [eventsQuery.data]);

  // Create "Manage Event" PopUp ("Modal")
  const [managedEvent, setManagedEvent] = useState<GameKnightEvent | null>(null);
  const [managedEventTask, setManagedEventTask] = useState<ManagedEventTask>("Clone");
  const [showManageEvent, setShowManageEvent] = useState(false);
  const handleCloseManageEvent = () => setShowManageEvent(false);
  interface ShowManageEventProps {
    managedEvent?: GameKnightEvent;
    task: ManagedEventTask;
  }
  const handleShowManageEvent = ({ managedEvent, task }: ShowManageEventProps) => {
    setManagedEvent(managedEvent ? managedEvent : null);
    setManagedEventTask(task);
    setShowManageEvent(true);
  };

  const [showTransferProdEvents, setShowTransferProdEvents] = useState(false);
  const handleCloseTransferProdEvents = () => setShowTransferProdEvents(false);
  const handleShowTransferProdEvents = () => {
    setShowTransferProdEvents(true);
  };

  const eventsApiRefreshMutation = useMutation({
    mutationFn: () => fetchEventsApi({}),
    onSuccess: (data) => {
      queryClient.setQueryData(["events"], data);
    },
  });

  useEffect(() => {
    if (authenticated({ signInStatus, tokensParsed })) {
      eventsApiRefreshMutation.mutate();
    }
    if (!authenticated({ signInStatus, tokensParsed, group: ["admin"] })) setShowAdmin(true);
  }, [tokens]);

  if (playersQuery.isSuccess && eventsQuery.isSuccess && signInStatus !== "CHECKING") {
    return (
      <div className="margin-top-65">
        <Container fluid>
          <Row xs={1} sm={1} md={2} className="align-items-center">
            <Col>
              {/* <h2>Upcoming Events</h2> */}
              <h2>{import.meta.env.VITE_EVENTS_TITLE}</h2>
            </Col>

            <Authenticated>
              <Col>
                <Row style={{ justifyContent: "right", padding: 4 }} className="align-items-center">
                  <Col xs="auto" style={{ textAlign: "right", padding: 4 }}>
                    <Button size="sm" variant="primary" onClick={() => setShowPrevEvents(!showPrevEvents)}>
                      {!showPrevEvents ? "Previous Events" : "Hide Prev Events"}
                    </Button>
                  </Col>
                  <Authenticated group={["admin"]}>
                    {showAdmin &&
                      import.meta.env.MODE == "test" &&
                      import.meta.env.VITE_API_URL == "eventsdev.dissonantconcord.com" && (
                        <>
                          <Col xs="auto" style={{ textAlign: "right", padding: 4 }}>
                            <Button size="sm" variant="secondary" onClick={handleShowTransferProdEvents}>
                              Transfer
                            </Button>
                          </Col>
                        </>
                      )}
                    {showAdmin && (
                      <Col xs="auto" style={{ textAlign: "right", padding: 4 }}>
                        <Button size="sm" variant="primary" onClick={() => handleShowManageEvent({ task: "Create" })}>
                          Create Event
                        </Button>
                      </Col>
                    )}
                    <Col xs="auto" style={{ textAlign: "right", padding: 4 }}>
                      <Button size="sm" variant="primary" onClick={() => setShowAdmin(!showAdmin)}>
                        {showAdmin ? "Hide Admin" : "Show Admin"}
                      </Button>
                    </Col>
                  </Authenticated>
                </Row>
              </Col>
            </Authenticated>
          </Row>
        </Container>
        <Authenticated>
          <Authenticated given_name={["Colten", "Joe"]}>
            <Suspense fallback={<>...</>}>
              <TShoot />
            </Suspense>
          </Authenticated>
          {showPrevEvents && <PreviousEvents showAdmin={showAdmin} />}
          <Modal show={showManageEvent} onHide={handleCloseManageEvent} backdrop="static" keyboard={false}>
            <Suspense fallback={<>...</>}>
              <ManageEventModal close={handleCloseManageEvent} task={managedEventTask} gameKnightEvent={managedEvent} />
            </Suspense>
          </Modal>
          {import.meta.env.MODE == "test" && (
            <Modal
              show={showTransferProdEvents}
              onHide={handleCloseTransferProdEvents}
              backdrop="static"
              keyboard={false}
            >
              <Suspense fallback={<>...</>}>
                <TransferProdEventsModal close={handleCloseTransferProdEvents} />
              </Suspense>
            </Modal>
          )}
        </Authenticated>
        <EventCards events={eventsQuery.data} showAdmin={showAdmin} />
      </div>
    );
  } else {
    if (playersQuery.isLoading || eventsQuery.isLoading) {
      if (eventsQuery.isLoading) return <div className="margin-top-65">Loading Events...</div>;
      if (playersQuery.isLoading) return <div className="margin-top-65">Loading Players...</div>;
      return <div className="margin-top-65">Loading...</div>;
    }

    if (playersQuery.isError || eventsQuery.isError) {
      console.error(playersQuery.error);
      console.error(eventsQuery.error);
      return (
        <div className="margin-top-65">
          {eventsQuery.isError && <div>Error Retreiving Events</div>}
          {playersQuery.isError && <div>Error Retreiving Players</div>}
          <div>Please Refresh</div>
        </div>
      );
    }
    return <div className="margin-top-65">Loading...</div>;
  }
}

export function PreviousEvents({ showAdmin }: { showAdmin: boolean }) {
  const { tokensParsed } = usePasswordless();
  const eventsQuery = useQuery({
    queryKey: ["events", "all", "14d"],
    queryFn: () => fetchEventsApi({ dateGte: "all", dateLte: "14d" }),
    staleTime: 1000 * 60 * 60 * 6, // stale after 6 h
    refetchInterval: 1000 * 60 * 60 * 6,
  });
  if (eventsQuery.isLoading) return <div>Loading Previous Events...</div>;
  if (eventsQuery.isError) return <div>Error Retreiving Events</div>;
  if (eventsQuery.isSuccess && tokensParsed) {
    const years = new Set(eventsQuery.data.map((event: GameKnightEvent) => event.date.slice(0, 4)));
    return (
      <Accordion defaultActiveKey={[...years].slice(-1)} style={{ paddingBottom: ".5rem" }}>
        {[...years].map((year: string) => (
          <Accordion.Item key={year + "_item"} eventKey={year}>
            <Accordion.Header key={year + "_header"}>{year} Events</Accordion.Header>
            <Accordion.Body key={year + "_body"}>
              <EventCards
                events={eventsQuery.data.filter((event: GameKnightEvent) => event.date.startsWith(year))}
                showAdmin={showAdmin}
              />
            </Accordion.Body>
          </Accordion.Item>
        ))}
      </Accordion>
    );
  } else {
    return <div>Loading...</div>;
  }
}

interface EventCardsProps {
  events: GameKnightEvent[];
  showAdmin: boolean;
}
function EventCards({ events, showAdmin }: EventCardsProps) {
  const { signInStatus, tokensParsed, tokens } = usePasswordless();
  const user_id = tokensParsed ? tokensParsed.idToken.sub : "";
  const isAdmin = authenticated({ signInStatus, tokensParsed, group: ["admin"] });

  const queryClient = useQueryClient();
  const playersQuery: PlayersGroups | undefined = queryClient.getQueryData(["players"]);
  const playersDict = playersQuery?.Users ?? {};

  // Create "Manage Event" PopUp ("Modal")
  const [managedEvent, setManagedEvent] = useState<GameKnightEvent | null>(null);
  const [managedEventTask, setManagedEventTask] = useState<ManagedEventTask>("Clone");
  const [showManageEvent, setShowManageEvent] = useState(false);
  const handleCloseManageEvent = () => setShowManageEvent(false);
  interface ShowManageEventProps {
    managedEvent?: GameKnightEvent;
    task: ManagedEventTask;
  }
  const handleShowManageEvent = ({ managedEvent, task }: ShowManageEventProps) => {
    setManagedEvent(managedEvent ? managedEvent : null);
    setManagedEventTask(task);
    setShowManageEvent(true);
  };

  return (
    <>
      <Authenticated>
        <Modal show={showManageEvent} onHide={handleCloseManageEvent} backdrop="static" keyboard={false}>
          <Suspense fallback={<>...</>}>
            <ManageEventModal close={handleCloseManageEvent} task={managedEventTask} gameKnightEvent={managedEvent} />
          </Suspense>
        </Modal>
      </Authenticated>
      <Container fluid>
        <Row xs={1} sm={1} md={2} lg={2} xl={3} xxl={4} className="g-4 justify-content-center">
          {events.map((event: GameKnightEvent, index) => {
            if (event.format == "Private" && signInStatus !== "SIGNED_IN") {
              return null; // skip
            } else if (
              event.format == "Private" &&
              signInStatus === "SIGNED_IN" &&
              tokensParsed &&
              event.player_pool.includes(user_id) == false &&
              !isAdmin
            ) {
              return null; // skip
            }
            const spots_available = event.format == "Open" ? null : event.total_spots! - event.attending.length;
            const event_date = formatIsoDate(event.date);

            var attending_names: string[] = [];
            var not_attending_names: string[] = [];

            const futureEvent = Date.parse(event.date) >= Date.parse(new Date().toString());
            if (playersDict) {
              if (event.host && event.host in playersDict && event.attending.includes(event.host))
                attending_names.push(`${playersDict[event.host].attrib.given_name} (H)`);
              if (event.organizer && event.organizer in playersDict && event.attending.includes(event.organizer))
                attending_names.push(`${playersDict[event.organizer].attrib.given_name} (O)`);
              try {
                attending_names.push(
                  ...event.attending
                    .map((player_id) => {
                      if (event.organizer && event.organizer == player_id) return "";
                      if (event.host && event.host == player_id) return "";
                      return playersDict[player_id]?.attrib.given_name || "unknown";
                    })
                    .filter((player) => player != "")
                    .sort()
                );
                not_attending_names = event.not_attending.map(
                  (player_id) => playersDict[player_id]?.attrib.given_name || "unknown"
                );
              } catch (error) {
                console.error(event);
                console.error(playersDict);
                throw error;
              }
              return (
                <Col className="d-flex justify-content-center" key={index}>
                  <Card style={{ minWidth: "20rem", maxWidth: "35rem", height: "100%" }}>
                    <a className="position-relative">
                      {event.bgg_id && event.bgg_id > 0 ? (
                        <Card.Img variant="top" src={`https://${import.meta.env.VITE_API_URL}/${event.bgg_id}.png`} />
                      ) : (
                        <Card.Img variant="top" src={"/" + event.tbd_pic} />
                      )}
                      {event.status && event.status == "Cancelled" ? (
                        <Card.ImgOverlay>
                          <Card.Title className="topsecret" style={{ color: "red" }}>
                            {"[Cancelled]"}
                          </Card.Title>
                        </Card.ImgOverlay>
                      ) : !futureEvent ? (
                        <Card.ImgOverlay>
                          <Card.Title className="topsecret" style={{ color: "green" }}>
                            {"[Complete]"}
                          </Card.Title>
                        </Card.ImgOverlay>
                      ) : event.format == "Placeholder" ? (
                        <Card.ImgOverlay>
                          <Card.Title className="topsecret" style={{ color: "orange" }}>
                            {"[TBD]"}
                          </Card.Title>
                        </Card.ImgOverlay>
                      ) : (
                        <></>
                      )}
                    </a>
                    <Card.Body>
                      <Card.Title key={index}>
                        <Row>
                          <Col style={{ minWidth: "max-content" }} className="d-flex justify-content-start">
                            {event_date}
                          </Col>
                          <Col className="d-flex justify-content-end gap-1">
                            <OverlayTrigger
                              placement="left"
                              delay={{ show: 250, hide: 400 }}
                              overlay={
                                <Tooltip id="button-tooltip">
                                  {!futureEvent && event.format == "Open"
                                    ? "Open Event"
                                    : event.format == "Open"
                                    ? "Open event! Let " +
                                      playersDict[event.host].attrib.given_name +
                                      " know if you can make it"
                                    : !futureEvent
                                    ? spots_available + " spot(s) unfilled"
                                    : spots_available + " spot(s) remaining"}
                                </Tooltip>
                              }
                            >
                              <span key={index}>
                                {event.format == "Open"
                                  ? "Open Event"
                                  : !futureEvent && event.format == "Reserved"
                                  ? "Reserved"
                                  : event.format == "Reserved" && spots_available! >= 1
                                  ? "Spots: " + spots_available
                                  : event.format == "Reserved" && spots_available! < 1
                                  ? "Full"
                                  : event.format == "Placeholder"
                                  ? ""
                                  : event.format}
                              </span>
                            </OverlayTrigger>
                          </Col>
                        </Row>
                      </Card.Title>
                      <Card.Subtitle className="mb-2 text-muted">
                        <Row>
                          <Col className="d-flex align-items-center justify-content-start">
                            {event.bgg_id && event.bgg_id > 0 && event.game !== "TBD" ? (
                              <a
                                className="link-no-blue"
                                href={`https://boardgamegeek.com/boardgameexpansion/${event.bgg_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {event.game}
                              </a>
                            ) : (
                              event.game
                            )}
                          </Col>
                        </Row>
                      </Card.Subtitle>
                      {event.format == "Placeholder" ? (
                        <Card.Text as="div">
                          <Container fluid>
                            <Row className="align-items-center" style={{ paddingTop: "2rem" }}>
                              <Col className="d-flex align-items-center justify-content-center h5">
                                Details Coming Soon!
                              </Col>
                            </Row>
                          </Container>
                        </Card.Text>
                      ) : (
                        <Card.Text as="div">
                          <div>Host: {playersDict[event.host].attrib.given_name}</div>
                          {event.format != "Open" && (
                            <>
                              <div>Max Players: {event.total_spots}</div>
                            </>
                          )}
                          <div>
                            {futureEvent
                              ? "Attending: "
                              : event.status && event.status == "Cancelled"
                              ? "Registered: "
                              : "Attended: "}
                            {attending_names.join(", ")}
                            {futureEvent && event.format == "Open" && (
                              <div>Not Attending: {not_attending_names.join(", ")}</div>
                            )}
                          </div>
                        </Card.Text>
                      )}
                    </Card.Body>
                    {!futureEvent && event.finalScore && (
                      <Accordion
                        className={showAdmin && tokens && isAdmin ? "accordion-card-middle" : "accordion-card-bottom"}
                      >
                        <Accordion.Item eventKey="scores">
                          <Accordion.Header>Final Scores</Accordion.Header>
                          <Accordion.Body>
                            <Table>
                              <thead>
                                <tr>
                                  <th style={{ width: "17%" }}>Place</th>
                                  <th style={{ width: "36%" }}>Player</th>
                                  <th>Score</th>
                                </tr>
                              </thead>
                              <tbody>
                                {event.finalScore.map(({ place, player, score }, index) => (
                                  <tr key={index}>
                                    <td style={{ maxWidth: "min-content" }}>{place}</td>
                                    <td>{playersDict[player]?.attrib.given_name ?? "Unknown"}</td>
                                    <td>{score}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </Accordion.Body>
                        </Accordion.Item>
                      </Accordion>
                    )}
                    {event.format !== "Placeholder" && (
                      <Authenticated group={["player"]}>
                        {tokensParsed &&
                          futureEvent &&
                          event.host !== user_id &&
                          !(
                            event.format == "Reserved" &&
                            spots_available! < 1 &&
                            !event.attending.includes(user_id)
                          ) && (
                            <Card.Footer>
                              <RsvpFooter event={event} index={index} />
                            </Card.Footer>
                          )}
                      </Authenticated>
                    )}
                    <Authenticated>
                      {(showAdmin && isAdmin) || (tokensParsed && !isAdmin && user_id == event.host) ? (
                        <Card.Footer>
                          <Row key={"Row" + index}>
                            <Col className="d-flex justify-content-end gap-2">
                              <Button
                                size="sm"
                                key={"Modify" + index}
                                variant="primary"
                                onClick={() => handleShowManageEvent({ managedEvent: event, task: "Modify" })}
                              >
                                Modify
                              </Button>
                              <Authenticated group={["admin"]}>
                                <Button
                                  size="sm"
                                  key={"Delete" + index}
                                  variant="danger"
                                  onClick={() => handleShowManageEvent({ managedEvent: event, task: "Delete" })}
                                >
                                  Delete
                                </Button>
                              </Authenticated>
                              <Authenticated group={["admin"]}>
                                <Button
                                  size="sm"
                                  key={"Clone" + index}
                                  variant="secondary"
                                  onClick={() => handleShowManageEvent({ managedEvent: event, task: "Clone" })}
                                >
                                  Clone
                                </Button>
                              </Authenticated>
                            </Col>
                          </Row>
                        </Card.Footer>
                      ) : (
                        <></>
                      )}
                    </Authenticated>
                  </Card>
                </Col>
              );
            }
          })}
        </Row>
      </Container>
    </>
  );
}
