import { useState, useEffect } from "react";
import { usePasswordless } from "amazon-cognito-passwordless-auth/react";
import axios from "axios";

// import Accordion from "react-bootstrap/Accordion";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Card from "react-bootstrap/Card";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Modal from "react-bootstrap/Modal";

import TShoot from "./TShoot";
import { ManageEventModal, DeleteEventModal } from "./EventManagement";
import Authenticated from "./Authenticated";

export default function UpcomingEvents() {
  const { signInStatus, tokensParsed, tokens } = usePasswordless();

  let first_name = "";
  if (signInStatus === "SIGNED_IN" && tokensParsed) {
    first_name = String(tokensParsed.idToken.given_name);
  }

  // API Client
  const apiClient = axios.create({
    baseURL: "https://myapp.dissonantconcord.com/api",
    headers: tokens && {
      Authorization: "Bearer " + tokens.idToken,
    },
  });

  const [events, setEvents] = useState([]);
  const [playerPool, setPlayerPool] = useState<string[]>([]);
  const fetchEvents = async () => {
    let response;
    if (tokensParsed) {
      // If Authenticated, pull events from the API
      response = await apiClient.get("events", {});
    } else {
      // Otherwise pull from the public events.json
      response = await axios.get("https://myapp.dissonantconcord.com/events.json");
    }
    setEvents(response.data);
    console.log(response.data);
    setPlayerPool(player_pool);
  };
  useEffect(() => {
    fetchEvents();
  }, [tokens]);

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
  const [managedEventTask, setManagedEventTask] = useState("");
  const [showManageEvent, setShowManageEvent] = useState(false);
  const handleCloseManageEvent = () => setShowManageEvent(false);
  interface ShowManageEventProps {
    managedEvent?: GameKnightEvent;
    task: "Modify" | "Create" | "Clone";
  }
  const handleShowManageEvent = ({ managedEvent, task }: ShowManageEventProps) => {
    setManagedEvent(managedEvent ? managedEvent : null);
    setManagedEventTask(task);
    setShowManageEvent(true);
  };

  return (
    <>
      <Container fluid>
        <Row>
          <Col>
            <h2>Upcoming Events</h2>
          </Col>
          <Authenticated group={["admin"]}>
            {/* <Authenticated given_name={["Colten", "Luke"]}> */}
            <Col style={{ textAlign: "right" }}>
              <Button variant="primary" onClick={() => handleShowManageEvent({ task: "Create" })}>
                Create Event
              </Button>
            </Col>
          </Authenticated>
        </Row>
      </Container>
      <Authenticated>
        <Modal show={showManageEvent} onHide={handleCloseManageEvent} backdrop="static" keyboard={false}>
          <ManageEventModal
            playerPool={playerPool}
            close={handleCloseManageEvent}
            task={managedEventTask}
            gameKnightEvent={managedEvent}
            refreshEvents={fetchEvents}
          />
        </Modal>
        <Modal
          show={showDeleteEvent}
          onHide={handleCloseDeleteEvent}
          // backdrop="static"
          // keyboard={false}
        >
          <DeleteEventModal close={handleCloseDeleteEvent} gameKnightEvent={deleteEvent!} refreshEvents={fetchEvents} />
        </Modal>
        <Authenticated given_name={["Colten"]}>
          <TShoot events={events} />
        </Authenticated>
      </Authenticated>

      {/* GameKnight Event Cards */}
      <Container fluid>
        <Row xs={1} sm={2} md={2} lg={3} xl={4} xxl={4} className="g-4 justify-content-center">
          {events.map((event: GameKnightEvent, index) => {
            const spots_available = event.format == "Open" ? null : event.total_spots! - event.registered.length;
            const date_obj = new Date(event.date);
            const event_date = formatIsoDate(event.date);
            return (
              <Col key={index}>
                <Card style={{ minWidth: "18rem", maxWidth: "35rem" }}>
                  {event.bgg_id && event.bgg_id > 0 ? (
                    <Card.Img variant="top" src={`https://myapp.dissonantconcord.com/${event.bgg_id}.png`} />
                  ) : (
                    <Card.Img variant="top" src="/Game_TBD.png" />
                  )}
                  <Card.Body>
                    <Card.Title key={index}>
                      <Row>
                        <Col className="d-flex justify-content-start">
                          {event_date}
                          {/* {event.date} */}
                        </Col>
                        <Col className="d-flex justify-content-end gap-1">
                          <OverlayTrigger
                            placement="left"
                            delay={{ show: 250, hide: 400 }}
                            overlay={
                              <Tooltip id="button-tooltip">
                                {event.format == "Open"
                                  ? "Open event! Let " + event.host + " know if you can make it"
                                  : spots_available + " spots remaining"}
                              </Tooltip>
                            }
                          >
                            <Button size="sm" variant="secondary" key={index}>
                              {event.format == "Open" ? "Open Event" : event.format}
                              <Badge bg={spots_available && spots_available > 2 ? "primary" : "danger"} key={index}>
                                {spots_available}
                              </Badge>
                            </Button>
                          </OverlayTrigger>
                        </Col>
                      </Row>
                    </Card.Title>
                    <Card.Subtitle className="mb-2 text-muted">
                      <Row>
                        <Col className="d-flex align-items-center justify-content-start">{event.game}</Col>
                        <Authenticated group={["player"]}>
                          <Col className="d-flex align-items-center justify-content-end">RSVP:</Col>
                          <Col className="d-flex align-items-center justify-content-end ">
                            <ButtonGroup key={index} aria-label="RSVP">
                              {/* <RsvpOverlay> */}
                              <Button
                                size="sm"
                                key={"yes" + index}
                                variant={event.registered.includes(first_name) ? "success" : "outline-secondary"}
                              >
                                Yes
                              </Button>
                              {/* </RsvpOverlay>

                              <RsvpOverlay> */}
                              <Button
                                size="sm"
                                key={"no" + index}
                                variant={event.not_attending.includes(first_name) ? "secondary" : "outline-secondary"}
                              >
                                No
                              </Button>
                              {/* </RsvpOverlay> */}
                            </ButtonGroup>
                            {/* </OverlayTrigger> */}
                          </Col>
                        </Authenticated>
                      </Row>
                    </Card.Subtitle>
                    <Card.Text as="div">
                      <div>Host: {event.host}</div>
                      {event.format != "Open" && <div>Total Spots: {event.total_spots}</div>}
                      <div>
                        Attending: {event.registered.join(", ")}
                        {event.format == "Open" && <div>Not Attending: {event.not_attending}</div>}
                      </div>
                    </Card.Text>
                  </Card.Body>
                  {/* <Authenticated given_name={["Colten", "Luke"]}> */}
                  <Authenticated group={["admin"]}>
                    <Card.Footer>
                      <Row key={"Row" + index}>
                        <Col className="d-flex justify-content-end gap-2">
                          <Button
                            size="sm"
                            key={"Modify" + index}
                            variant="primary"
                            onClick={() =>
                              handleShowManageEvent({
                                managedEvent: event,
                                task: "Modify",
                              })
                            }
                          >
                            Modify
                          </Button>
                          <Button
                            size="sm"
                            key={"Delete" + index}
                            variant="danger"
                            onClick={() =>
                              handleShowDeleteEvent({
                                deleteEvent: event,
                              })
                            }
                          >
                            Delete
                          </Button>
                          <Button
                            size="sm"
                            key={"Clone" + index}
                            variant="secondary"
                            onClick={() =>
                              handleShowManageEvent({
                                managedEvent: event,
                                task: "Clone",
                              })
                            }
                          >
                            Clone
                          </Button>
                        </Col>
                      </Row>
                    </Card.Footer>
                  </Authenticated>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Container>
    </>
  );
}

interface RsvpOverlayProps {
  children: React.ReactNode;
}
function RsvpOverlay({ children }: RsvpOverlayProps) {
  return (
    <OverlayTrigger
      placement="bottom"
      delay={{ show: 250, hide: 400 }}
      overlay={<Tooltip id="button-tooltip">DEMO! You Coming?!</Tooltip>}
    >
      <span>{children}</span>
    </OverlayTrigger>
  );
}

export type GameKnightEvent = {
  event_id?: string;
  event_type?: string;
  date: string;
  host: string;
  format: string;
  game: string;
  bgg_id?: number;
  total_spots?: number;
  registered: string[];
  not_attending: string[];
  player_pool?: string[];
};

// Temp static placeholder
export const player_pool = [
  "Luke",
  "Eric",
  "Colten",
  "Frank",
  "Wynn",
  "Scott",
  "Tim",
  "Kevin",
  "Agustin",
  "Steve",
  "Brett",
  "Jake",
  "Garrett",
  "Robert",
];

export function formatIsoDate(isoString: string) {
  const months = {
    "01": "Jan",
    "02": "Feb",
    "03": "Mar",
    "04": "Apr",
    "05": "May",
    "06": "Jun",
    "07": "Jul",
    "08": "Aug",
    "09": "Sep",
    "10": "Oct",
    "11": "Nov",
    "12": "Dec",
  };
  const date = isoString.split("-");
  return `${months[date[1] as keyof typeof months]} ${date[2]}, ${date[0]}`;
}
