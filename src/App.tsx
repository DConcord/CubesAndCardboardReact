import { useState, useEffect } from "react";

import axios from "axios";

import Accordion from "react-bootstrap/Accordion";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";

import NavigationBar from "./components/NavigationBar";
import { usePasswordless } from "amazon-cognito-passwordless-auth/react";
import { mdiVariable } from "@mdi/js";
// import { usePasswordless } from "./components/DemoContext";
// import NavigationBar from "./components/DemoNavigationBar";

// Temp static placeholder
const player_pool = [
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
export default function App() {
  const { signInStatus, tokensParsed, tokens } = usePasswordless();

  let first_name = "";
  if (signInStatus === "SIGNED_IN" && tokensParsed) {
    first_name = String(tokensParsed.idToken.given_name);
  }

  const eventsClient = axios.create({
    baseURL: "https://myapp.dissonantconcord.com",
  });

  const [events, setEvents] = useState([]);
  const [playerPool, setPlayerPool] = useState<string[]>([]);
  // GET with Axios
  const fetchEvents = async () => {
    let response;
    if (tokensParsed) {
      // If Authenticated, pull events from the API
      response = await apiClient.get("events", {});
    } else {
      // Otherwise pull from the public events.json
      response = await eventsClient.get("events.json");
    }
    setEvents(response.data);
    console.log(response.data);
    setPlayerPool(player_pool);
  };
  useEffect(() => {
    fetchEvents();
  }, [tokens]);

  // API Client
  const apiClient = axios.create({
    baseURL: "https://myapp.dissonantconcord.com/api",
    headers: tokens && {
      Authorization: "Bearer " + tokens.idToken,
    },
  });

  const [deleteEvent, setDeleteEvent] = useState<GameKnightEvent>();
  const [showDeleteEvent, setShowDeleteEvent] = useState(false);
  const handleCloseDeleteEvent = () => setShowDeleteEvent(false);
  const handleShowDeleteEvent = ({
    deleteEvent,
  }: {
    deleteEvent: GameKnightEvent;
  }) => {
    setDeleteEvent(deleteEvent);
    setShowDeleteEvent(true);
  };

  const [managedEvent, setManagedEvent] = useState<GameKnightEvent | null>(
    null
  );
  const [managedEventTask, setManagedEventTask] = useState("");

  // Create "Manage Event" PopUp ("Modal")
  const [showManageEvent, setShowManageEvent] = useState(false);
  const handleCloseManageEvent = () => setShowManageEvent(false);
  interface ShowManageEventProps {
    managedEvent?: GameKnightEvent;
    task: "Modify" | "Create" | "Clone";
  }
  const handleShowManageEvent = ({
    managedEvent,
    task,
  }: ShowManageEventProps) => {
    setManagedEvent(managedEvent ? managedEvent : null);
    setManagedEventTask(task);
    setShowManageEvent(true);
  };

  // GET with Axios
  const [eventsTest, setEventsTest] = useState({});
  const fetchTest = async () => {
    try {
      let response = await apiClient.delete("event", {
        params: {
          event_id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          // name: "xxxx",
          // date: "yyyy",
        },
      });

      console.log(response.data);
      setEventsTest(response.data);
    } catch (error) {
      console.log(error);
      setEventsTest(JSON.parse(JSON.stringify(error)));
    }
  };

  return (
    <>
      <NavigationBar />
      {signInStatus === "SIGNED_IN" && tokensParsed && (
        <>
          <Button
            variant="primary"
            onClick={() =>
              handleShowManageEvent({
                task: "Create",
              })
            }
          >
            Create Event
          </Button>
          <Modal
            show={showManageEvent}
            onHide={handleCloseManageEvent}
            backdrop="static"
            keyboard={false}
          >
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
            <DeleteEventModal
              close={handleCloseDeleteEvent}
              gameKnightEvent={deleteEvent!}
              refreshEvents={fetchEvents}
            />
          </Modal>
          {first_name == "Colten" && (
            <Accordion>
              <Accordion.Item eventKey="token">
                <Accordion.Header>TokenInfo</Accordion.Header>
                <Accordion.Body>
                  <Accordion>
                    <Accordion.Item eventKey="idToken">
                      <Accordion.Header>idToken</Accordion.Header>
                      <Accordion.Body>
                        <pre>
                          {JSON.stringify(tokensParsed.idToken, null, 2)}
                        </pre>
                      </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey="accessToken">
                      <Accordion.Header>accessToken</Accordion.Header>
                      <Accordion.Body>
                        <pre>
                          {JSON.stringify(tokensParsed.accessToken, null, 2)}
                        </pre>
                      </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey="raw">
                      <Accordion.Header>raw</Accordion.Header>
                      <Accordion.Body>
                        <pre>{JSON.stringify(tokens, null, 2)}</pre>
                      </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey="API">
                      <Accordion.Header>API Get</Accordion.Header>
                      <Accordion.Body>
                        <Button onClick={fetchTest}>Test</Button>
                        <pre>{JSON.stringify(eventsTest, null, 2)}</pre>
                      </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey="EVENT_JSON">
                      <Accordion.Header>events.json</Accordion.Header>
                      <Accordion.Body>
                        {/* <Button onClick={fetchTest}>Show</Button> */}
                        <pre>{JSON.stringify(events, null, 2)}</pre>
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          )}
        </>
      )}
      <Container fluid>
        <Row
          xs={1}
          sm={2}
          md={2}
          lg={3}
          xl={4}
          xxl={4}
          className="g-4 justify-content-center"
        >
          {/* {events.map((event: Record<string, any>, index) => { */}
          {events.map((event: GameKnightEvent, index) => {
            const spots_available =
              event.format == "Open"
                ? null
                : event.total_spots! - event.registered.length;
            const date_obj = new Date(event.date);
            const event_date = formatIsoDate(event.date);
            return (
              <Col key={index}>
                <Card style={{ minWidth: "18rem", maxWidth: "35rem" }}>
                  {event.bgg_id && event.bgg_id > 0 ? (
                    // <Card.Img variant="top" src={"/" + event.bgg_id + ".png"} />
                    <Card.Img
                      variant="top"
                      src={`https://myapp.dissonantconcord.com/${event.bgg_id}.png`}
                    />
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
                                  ? "Open event! Let " +
                                    event.host +
                                    " know if you can make it"
                                  : spots_available + " spots remaining"}
                              </Tooltip>
                            }
                          >
                            <Button size="sm" variant="secondary" key={index}>
                              {event.format == "Open"
                                ? "Open Event"
                                : event.format}
                              <Badge
                                bg={
                                  spots_available && spots_available > 2
                                    ? "primary"
                                    : "danger"
                                }
                                key={index}
                              >
                                {spots_available}
                              </Badge>
                            </Button>
                          </OverlayTrigger>
                        </Col>
                      </Row>
                    </Card.Title>
                    <Card.Subtitle className="mb-2 text-muted">
                      <Row>
                        <Col className="d-flex justify-content-start">
                          {event.game}
                        </Col>
                        <Col className="d-flex justify-content-end gap-1">
                          {signInStatus === "SIGNED_IN" && tokensParsed && (
                            <OverlayTrigger
                              placement="left"
                              delay={{ show: 250, hide: 400 }}
                              overlay={
                                <Tooltip id="button-tooltip">
                                  DEMO! will allow signed in player to manage
                                  RSVP for this event
                                </Tooltip>
                              }
                            >
                              <Button variant="secondary" size="sm" key={index}>
                                {event.registered.includes(first_name) ? (
                                  <div>Unregister</div>
                                ) : (
                                  <div>Register</div>
                                )}
                              </Button>
                            </OverlayTrigger>
                          )}
                        </Col>
                      </Row>
                    </Card.Subtitle>
                    <Card.Text as="div">
                      <div>Host: {event.host}</div>
                      {event.format != "Open" && (
                        <div>Total Spots: {event.total_spots}</div>
                      )}
                      <div>
                        Registered Players: {event.registered.join(", ")}
                      </div>
                    </Card.Text>
                  </Card.Body>
                  {}
                  {signInStatus === "SIGNED_IN" && tokensParsed && (
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
                  )}
                </Card>
              </Col>
            );
          })}
        </Row>
      </Container>
    </>
  );
}

interface DeleteEventModalProps {
  close: () => void;
  refreshEvents: () => void;
  gameKnightEvent: GameKnightEvent;
}
function DeleteEventModal({
  close,
  refreshEvents,
  gameKnightEvent,
}: DeleteEventModalProps) {
  const { tokens } = usePasswordless();
  const [notConfirmed, setNotConfirmed] = useState(true);

  function handleInput(event: React.BaseSyntheticEvent) {
    if (event.target.value == "DELETE") setNotConfirmed(false);
  }

  const [waiting, setWaiting] = useState(false);
  const apiClient = axios.create({
    baseURL: "https://myapp.dissonantconcord.com/api",
    headers: tokens && {
      Authorization: "Bearer " + tokens.idToken,
    },
  });

  const [errorMsg, setErrorMsg] = useState("");
  async function handleSubmit(event: React.BaseSyntheticEvent) {
    setWaiting(true);
    event.preventDefault();
    try {
      const response = await apiClient.delete("event", {
        params: { event_id: gameKnightEvent.event_id },
      });
      console.log(response.data);
      setWaiting(false);
      refreshEvents();
      close();
    } catch (error) {
      console.error(error);
      setErrorMsg(`Delete Event failed`);
      setWaiting(false);
    }
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Modal.Header className="text-center">
        Are you sure you want to delete {formatIsoDate(gameKnightEvent.date)}{" "}
        event?
      </Modal.Header>
      <Modal.Body className="text-center">
        Type DELETE to permanently delete event
        {/* <Form.Control
          as="textarea"
          onChange={handleInput}
          defaultValue={
            task == "Modify" || task == "Clone" ? eventForm.game : "TBD"
          }
          // onChange={(e) => setGame(e.target.value)}
        /> */}
        <Form.Control
          type="textarea"
          id="delete_event"
          aria-describedby="delete_event"
          onChange={handleInput}
        />
        <Button
          variant="danger"
          type="submit"
          disabled={notConfirmed || waiting}
        >
          {waiting && (
            <span
              className="spinner-grow spinner-grow-sm text-light"
              role="status"
            ></span>
          )}
          Delete
        </Button>
        <Button variant="secondary" onClick={close} disabled={waiting}>
          Cancel
        </Button>
      </Modal.Body>
      {/* <Modal.F ooter className="text-center">
        {gameKnightEvent.event_id}
      </Modal.Footer> */}
    </Form>
  );
}

interface ManageEventModalProps {
  playerPool: string[];
  close: () => void;
  refreshEvents: () => void;
  task: string;
  gameKnightEvent?: GameKnightEvent | null;
}
function ManageEventModal({
  playerPool,
  close,
  refreshEvents,
  task,
  gameKnightEvent,
}: ManageEventModalProps) {
  const method =
    task == "Create" || task == "Clone"
      ? "POST"
      : task == "Modify"
      ? "PUT"
      : "";
  const { tokens } = usePasswordless();
  const [eventForm, setEventForm] = useState<GameKnightEvent>(
    gameKnightEvent
      ? gameKnightEvent
      : {
          event_id: undefined,
          event_type: "GameKnight",
          date: "",
          host: "",
          format: "Open",
          game: "TBD",
          bgg_id: undefined,
          total_spots: undefined,
          registered: [],
        }
  );
  const handleInput = (e: React.BaseSyntheticEvent) => {
    if (e.target.id == "bgg_id" || e.target.id == "total_spots") {
      setEventForm({ ...eventForm, [e.target.id]: parseInt(e.target.value) });
    } else {
      setEventForm({ ...eventForm, [e.target.id]: e.target.value });
    }
    console.log(e.target);
  };
  // return <span>{JSON.stringify(eventForm)}</span>;

  // Handle Player Checkboxes
  const [selectedOptions, setSelectedOptions] = useState(eventForm.registered);
  const handleOptionChange = (event: React.BaseSyntheticEvent) => {
    const optionId = event.target.value;
    const isChecked = event.target.checked;

    if (isChecked) {
      setSelectedOptions([...selectedOptions, optionId]);
    } else {
      setSelectedOptions(selectedOptions.filter((id) => id !== optionId));
    }
    // setEventForm({ ...eventForm, registered: selectedOptions });
  };

  // when selectedOptions changes, update eventForm.registered
  useEffect(() => {
    setEventForm({ ...eventForm, registered: selectedOptions });
  }, [selectedOptions]);

  const [waiting, setWaiting] = useState(false);
  const apiClient = axios.create({
    baseURL: "https://myapp.dissonantconcord.com/api",
    headers: tokens && {
      Authorization: "Bearer " + tokens.idToken,
    },
  });

  const [errorMsg, setErrorMsg] = useState("");
  const createEvent = async (body: GameKnightEvent, method: string) => {
    setWaiting(true);
    if (task == "Clone") delete body.event_id;
    if (body.total_spots == null) body.total_spots = undefined;
    if (body.bgg_id == null) body.bgg_id = undefined;
    if (!body.event_type) body.event_type = "GameKnight";
    try {
      const response = await apiClient({
        method: method,
        url: "event",
        data: body,
      });

      console.log(response.data);
      refreshEvents();
      setWaiting(false);
      close();
    } catch (error) {
      console.error(error);
      setErrorMsg(`${task === "Clone" ? "Create" : task} Event failed`);
      setWaiting(false);
    }
  };

  function handleSubmit(event: React.BaseSyntheticEvent) {
    event.preventDefault();
    console.log(eventForm);
    createEvent(eventForm, method);
  }
  return (
    <Form onSubmit={handleSubmit}>
      <Modal.Body className="text-center">
        <Row>
          <Col med="true" style={{ minWidth: "13rem" }}>
            <FloatingLabel controlId="host" label="Host" className="mb-3">
              <Form.Select
                aria-label="Choose Host"
                onChange={handleInput}
                defaultValue={
                  task == "Modify" || task == "Clone"
                    ? eventForm.host
                    : "default"
                }
              >
                <option hidden disabled value="default">
                  {" "}
                  -- choose a host --{" "}
                </option>
                {playerPool.map((player: string, index: number) => (
                  <option key={index} value={player}>
                    {player}
                  </option>
                ))}
              </Form.Select>
            </FloatingLabel>
          </Col>
          <Col med="true" style={{ minWidth: "8rem", maxWidth: "11rem" }}>
            <FloatingLabel controlId="date" label="Date">
              <Form.Control
                type="date"
                onChange={handleInput}
                defaultValue={
                  task == "Modify" || task == "Clone" ? eventForm.date : ""
                }
              />
            </FloatingLabel>
          </Col>

          <Col med="true" style={{ minWidth: "13rem" }}>
            <FloatingLabel controlId="game" label="Game" className="mb-3">
              <Form.Control
                as="textarea"
                onChange={handleInput}
                defaultValue={
                  task == "Modify" || task == "Clone" ? eventForm.game : "TBD"
                }
                // onChange={(e) => setGame(e.target.value)}
              />
            </FloatingLabel>
          </Col>
          <Col med="true" style={{ minWidth: "8rem", maxWidth: "8rem" }}>
            <FloatingLabel controlId="bgg_id" label="BGG ID" className="mb-3">
              <Form.Control
                type="number"
                disabled={eventForm.game == "TBD"}
                onChange={handleInput}
                defaultValue={
                  (task == "Modify" || task == "Clone") && eventForm.bgg_id
                    ? eventForm.bgg_id
                    : undefined
                }
              />
            </FloatingLabel>
          </Col>
          <Col med="true" style={{ minWidth: "13rem" }}>
            <FloatingLabel controlId="format" label="Format" className="mb-3">
              <Form.Select
                aria-label="Choose Format"
                onChange={handleInput}
                defaultValue={
                  task == "Modify" || task == "Clone"
                    ? eventForm.format
                    : "default"
                }
              >
                <option hidden disabled value="default">
                  {" "}
                  -- choose the format --{" "}
                </option>
                <option value="Open">Open</option>
                <option value="Reserved">Reserved</option>
              </Form.Select>
            </FloatingLabel>
          </Col>
          <Col med="true" style={{ minWidth: "8rem", maxWidth: "8rem" }}>
            <FloatingLabel
              controlId="total_spots"
              label="Total Spots"
              className="mb-3"
            >
              <Form.Control
                disabled={eventForm.format == "Open"}
                onChange={handleInput}
                defaultValue={
                  (task == "Modify" || task == "Clone") && eventForm.total_spots
                    ? eventForm.total_spots
                    : undefined
                }
              />
            </FloatingLabel>
          </Col>
          <Col med="true" style={{ minWidth: "18rem" }}>
            {/* {playerPool && <MultiSelect players={playerPool} />} */}

            <Form.Group controlId="choosePlayers" className="mb-3">
              <Form.Label aria-label="Choose Players">
                Choose Players
              </Form.Label>
              <Row>
                {playerPool.map((player: string, index: number) => (
                  <Col key={index} style={{ minWidth: "min-content" }}>
                    <Form.Check
                      // style={{ marginLeft: "10%" }}
                      key={index}
                      type="checkbox"
                      id={`option_${index}`}
                      label={player}
                      checked={selectedOptions.includes(player)}
                      onChange={handleOptionChange}
                      value={player}
                    />
                  </Col>
                ))}
              </Row>
            </Form.Group>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <span>{errorMsg}</span>
        <Button variant="primary" type="submit" disabled={waiting}>
          {waiting && (
            <span
              className="spinner-grow spinner-grow-sm text-light"
              role="status"
            ></span>
          )}
          {task == "Modify" ? "Update Event" : "Create Event"}
        </Button>
        <Button variant="secondary" onClick={close} disabled={waiting}>
          Cancel
        </Button>
      </Modal.Footer>
    </Form>
  );
}

function formatIsoDate(isoString: string) {
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

type GameKnightEvent = {
  event_id?: string;
  event_type?: string;
  date: string;
  host: string;
  format: string;
  game: string;
  bgg_id?: number;
  total_spots?: number;
  registered: string[];
  player_pool?: string[];
};
