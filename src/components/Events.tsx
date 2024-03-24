import { useState, useEffect, lazy, Suspense } from "react";
import { usePasswordless } from "amazon-cognito-passwordless-auth/react";
import axios from "axios";

import Accordion from "react-bootstrap/Accordion";
// import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
// import ButtonGroup from "react-bootstrap/ButtonGroup";
import Card from "react-bootstrap/Card";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Modal from "react-bootstrap/Modal";

import "../assets/fonts/TopSecret.ttf";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { fetchEventsOptions, fetchEventsApiOptions, fetchPlayersOptions } from "./Queries";

import TShoot from "./TShoot";
// import { ManageEventModal, DeleteEventModal, TransferDevEventsModal, RsvpFooter } from "./EventManagement";

const ManageEventModal = lazy(() =>
  import("./EventManagement").then((module) => ({ default: module.ManageEventModal }))
);
const DeleteEventModal = lazy(() =>
  import("./EventManagement").then((module) => ({ default: module.DeleteEventModal }))
);
const TransferDevEventsModal = lazy(() =>
  import("./EventManagement").then((module) => ({ default: module.TransferDevEventsModal }))
);
const RsvpFooter = lazy(() => import("./EventManagement").then((module) => ({ default: module.RsvpFooter })));

import { ManagedEventTask } from "../types/Events";
import Authenticated, { authenticated } from "./Authenticated";

export default function UpcomingEvents() {
  const { signInStatus, tokensParsed, tokens } = usePasswordless();
  const [showAdmin, setShowAdmin] = useState(() => {
    // getting stored value
    const saved = localStorage.getItem("showAdmin");
    if (saved === null) return true;
    return JSON.parse(saved);
  });
  const isAdmin = authenticated({ signInStatus, tokensParsed, group: ["admin"] });

  useEffect(() => {
    localStorage.setItem("showAdmin", JSON.stringify(showAdmin));
  }, [showAdmin]);

  const eventsQuery = tokens ? useQuery(fetchEventsApiOptions(tokens)) : useQuery(fetchEventsOptions());
  const playersQuery = useQuery(fetchPlayersOptions());
  // const playersQuery =
  //   authenticated({ signInStatus, tokensParsed, group: ["admin"] }) && tokens
  //     ? useQuery(fetchPlayersApiOptions({ tokens: tokens, refresh: "no" }))
  //     : useQuery(fetchPlayersOptions());
  const playersDict = playersQuery?.data?.Users ?? {};
  const players = playersQuery?.data?.Groups?.player ?? [];
  const organizers = playersQuery?.data?.Groups?.organizer ?? [];
  const hosts = playersQuery?.data?.Groups?.host ?? [];

  // Create "Delete Event" PopUp ("Modal")
  const [deleteEvent, setDeleteEvent] = useState<GameKnightEvent>();
  const [showDeleteEvent, setShowDeleteEvent] = useState(false);
  const handleCloseDeleteEvent = () => setShowDeleteEvent(false);
  const handleShowDeleteEvent = ({ deleteEvent }: { deleteEvent: GameKnightEvent }) => {
    setDeleteEvent(deleteEvent);
    setShowDeleteEvent(true);
  };

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

  const [showTransferDevEvents, setShowTransferDevEvents] = useState(false);
  const handleCloseTransferDevEvents = () => setShowTransferDevEvents(false);
  const handleShowTransferDevEvents = () => {
    setShowTransferDevEvents(true);
  };

  const queryClient = useQueryClient();
  // const playersRefreshMutation = useMutation({
  //   mutationFn: async () => {
  //     const response = await axios.get(`https://${import.meta.env.VITE_API_URL}/api/players`, {
  //       headers: { Authorization: "Bearer " + tokens!.idToken },
  //       params: { refresh: "no" },
  //     });
  //     return response.data;
  //   },
  //   onSuccess: (data) => {
  //     queryClient.setQueryData(["players"], data);
  //   },
  // });
  const eventsApiRefreshMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.get(`https://${import.meta.env.VITE_API_URL}/api/events`, {
        headers: { Authorization: "Bearer " + tokens!.idToken },
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["events"], data);
    },
  });

  useEffect(() => {
    // if (authenticated({ signInStatus, tokensParsed, group: ["admin"] })) {
    //   playersRefreshMutation.mutate();
    // }
    if (authenticated({ signInStatus, tokensParsed })) {
      eventsApiRefreshMutation.mutate();
    }
    if (!authenticated({ signInStatus, tokensParsed, group: ["admin"] })) setShowAdmin(true);
  }, [tokens]);

  if (playersQuery.isSuccess && eventsQuery.isSuccess && signInStatus !== "CHECKING") {
    const user_id = tokensParsed ? tokensParsed.idToken.sub : "";
    return (
      <div className="margin-top-65">
        <Container fluid>
          <Row xs={1} sm={2} className="align-items-center">
            <Col>
              {/* <h2>Upcoming Events</h2> */}
              <h2>{import.meta.env.VITE_EVENTS_TITLE}</h2>
            </Col>

            <Authenticated group={["admin"]}>
              <Col>
                <Row style={{ justifyContent: "right", padding: 4 }} className="align-items-center">
                  {showAdmin &&
                    import.meta.env.MODE == "development" &&
                    import.meta.env.VITE_API_URL == "eventsdev.dissonantconcord.com" && (
                      <>
                        <Col xs="auto" style={{ textAlign: "right", padding: 4 }}>
                          <Button size="sm" variant="secondary" onClick={handleShowTransferDevEvents}>
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
                </Row>
              </Col>
            </Authenticated>
          </Row>
        </Container>
        <Authenticated>
          <Modal show={showManageEvent} onHide={handleCloseManageEvent} backdrop="static" keyboard={false}>
            <Suspense fallback={<>...</>}>
              <ManageEventModal
                playersDict={playersDict}
                players={players}
                organizers={organizers}
                hosts={hosts}
                close={handleCloseManageEvent}
                task={managedEventTask}
                gameKnightEvent={managedEvent}
              />
            </Suspense>
          </Modal>
          <Modal show={showDeleteEvent} onHide={handleCloseDeleteEvent}>
            <Suspense fallback={<>...</>}>
              <DeleteEventModal close={handleCloseDeleteEvent} gameKnightEvent={deleteEvent!} />
            </Suspense>
          </Modal>
          <Modal show={showTransferDevEvents} onHide={handleCloseTransferDevEvents} backdrop="static" keyboard={false}>
            <Suspense fallback={<>...</>}>
              <TransferDevEventsModal close={handleCloseTransferDevEvents} />
            </Suspense>
          </Modal>
          <Authenticated given_name={["Colten", "Joe"]}>
            <TShoot
              events={eventsQuery.data}
              playersDict={playersDict}
              players={players}
              organizers={organizers}
              hosts={hosts}
            />
          </Authenticated>
        </Authenticated>

        <Container fluid>
          <Row xs={1} sm={2} md={2} lg={3} xl={4} xxl={4} className="g-4 justify-content-center">
            {eventsQuery.data.map((event: GameKnightEvent, index) => {
              if (event.format == "Private" && signInStatus !== "SIGNED_IN") {
                return null; // skip
              } else if (
                event.format == "Private" &&
                signInStatus === "SIGNED_IN" &&
                tokensParsed &&
                event.player_pool.includes(user_id) == false &&
                !authenticated({ signInStatus, tokensParsed, group: ["admin"] })
              ) {
                return null; // skip
              }
              const spots_available = event.format == "Open" ? null : event.total_spots! - event.attending.length;
              const event_date = formatIsoDate(event.date);

              var attending_names: string[] = [];
              var not_attending_names: string[] = [];

              const futureEvent = Date.parse(event.date) >= Date.parse(new Date().toString());
              if (playersDict) {
                try {
                  attending_names = event.attending.map((player_id) => playersDict[player_id].attrib.given_name);
                  not_attending_names = event.not_attending.map(
                    (player_id) => playersDict[player_id].attrib.given_name
                  );
                } catch (error) {
                  console.error(event);
                  console.error(playersDict);
                  throw error;
                }
                return (
                  <Col key={index}>
                    <Card style={{ minWidth: "20rem", maxWidth: "40rem", height: "100%" }}>
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
                        ) : (
                          <></>
                        )}
                      </a>
                      <Card.Body>
                        <Card.Title key={index}>
                          <Row>
                            <Col className="d-flex justify-content-start">{event_date}</Col>
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
                        <Card.Text as="div">
                          <div>Host: {playersDict[event.host].attrib.given_name}</div>
                          {event.format != "Open" && (
                            <>
                              <div>Max Players: {event.total_spots}</div>
                            </>
                          )}
                          <div>
                            {futureEvent ? "Attending:" : "Attended:"} {attending_names.join(", ")}
                            {futureEvent && event.format == "Open" && (
                              <div>Not Attending: {not_attending_names.join(", ")}</div>
                            )}
                          </div>
                        </Card.Text>
                      </Card.Body>
                      {!futureEvent && import.meta.env.MODE == "development" && (
                        <Accordion
                          className={showAdmin && tokens && isAdmin ? "accordion-card-middle" : "accordion-card-bottom"}
                        >
                          <Accordion.Item eventKey="scores">
                            <Accordion.Header>Final Scores</Accordion.Header>
                            <Accordion.Body>Coming Soon!</Accordion.Body>
                          </Accordion.Item>
                        </Accordion>
                      )}
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
                      <Authenticated>
                        {(showAdmin && authenticated({ signInStatus, tokensParsed, group: ["admin"] })) ||
                        (tokensParsed && user_id == event.host) ? (
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
                                    onClick={() => handleShowDeleteEvent({ deleteEvent: event })}
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
      </div>
    );
  } else {
    if (playersQuery.isLoading || eventsQuery.isLoading) {
      // console.log({ playersQuery: playersQuery.status, eventsQuery: eventsQuery.status, signInStatus: signInStatus });
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
    // console.log({ playersQuery: playersQuery.status, eventsQuery: eventsQuery.status, signInStatus: signInStatus });
    return <div className="margin-top-65">Loading...</div>;
  }
}

export interface EventDict {
  [key: ExistingGameKnightEvent["event_id"]]: ExistingGameKnightEvent;
}

export interface ExistingGameKnightEvent extends GameKnightEvent {
  event_id: string;
}
export type GameKnightEvent = {
  event_id?: string;
  event_type: string;
  date: string;
  host: string;
  organizer: string;
  format: "Open" | "Reserved" | "Private";
  game: string;
  bgg_id?: number;
  total_spots?: number;
  registered?: string[];
  attending: string[];
  not_attending: string[];
  player_pool: string[];
  organizer_pool: string[];
  tbd_pic?: string;
  migrated?: boolean;
  status?: "Normal" | "Cancelled";
};

export function formatIsoDate(isoString: string) {
  return new Date(isoString).toLocaleDateString("en-US", {
    // weekday: 'long',
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "America/Denver",
  });
  // const months = {
  //   "01": "Jan",
  //   "02": "Feb",
  //   "03": "Mar",
  //   "04": "Apr",
  //   "05": "May",
  //   "06": "Jun",
  //   "07": "Jul",
  //   "08": "Aug",
  //   "09": "Sep",
  //   "10": "Oct",
  //   "11": "Nov",
  //   "12": "Dec",
  // };
  // const date = isoString.split("-");
  // return `${months[date[1] as keyof typeof months]} ${date[2]}, ${date[0]}`;
}
