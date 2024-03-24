import { useState, useEffect } from "react";

import axios, { AxiosError } from "axios";

import Accordion from "react-bootstrap/Accordion";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import Feedback from "react-bootstrap/Feedback";

import { usePasswordless } from "amazon-cognito-passwordless-auth/react";

import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchEventsApiOptions, fetchEventsOptions } from "./Queries";
import { authenticated } from "./Authenticated";

import { GameKnightEvent, ExistingGameKnightEvent, EventDict, formatIsoDate } from "./Events";
import { PlayerNameDict, PlayersDict } from "./Players";
import { Alert } from "react-bootstrap";

interface DeleteEventModalProps {
  close: () => void;
  gameKnightEvent: GameKnightEvent;
}
export function DeleteEventModal({ close, gameKnightEvent }: DeleteEventModalProps) {
  const { tokens } = usePasswordless();
  const eventsQuery = tokens ? useQuery(fetchEventsApiOptions(tokens)) : useQuery(fetchEventsOptions());

  const [notConfirmed, setNotConfirmed] = useState(true);
  function handleInput(event: React.BaseSyntheticEvent) {
    if (event.target.value == "DELETE") setNotConfirmed(false);
  }

  const apiClient = axios.create({
    baseURL: `https://${import.meta.env.VITE_API_URL}/api`,
    headers: tokens && {
      Authorization: "Bearer " + tokens.idToken,
    },
  });

  const [errorMsg, setErrorMsg] = useState("");
  const deleteEventMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete("event", {
        params: { event_id: gameKnightEvent.event_id },
      });
    },
    onSuccess: async (data) => {
      console.log(data);
      await eventsQuery.refetch();
      close();
    },
    onError: (error) => {
      console.error(error);
      setErrorMsg(`Delete Event failed`);
    },
  });

  async function handleSubmit(event: React.BaseSyntheticEvent) {
    event.preventDefault();
    deleteEventMutation.mutate();
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Modal.Header className="text-center">
        Are you sure you want to delete {formatIsoDate(gameKnightEvent.date)} event?
      </Modal.Header>
      <Modal.Body className="text-center">
        Type DELETE to permanently delete event
        <Form.Control type="textarea" id="delete_event" aria-describedby="delete_event" onChange={handleInput} />
        <Button variant="danger" type="submit" disabled={notConfirmed || deleteEventMutation.isPending}>
          {deleteEventMutation.isPending && (
            <span className="spinner-grow spinner-grow-sm text-light" role="status"></span>
          )}
          Delete
        </Button>
        <Button variant="secondary" onClick={close} disabled={deleteEventMutation.isPending}>
          Cancel
        </Button>
      </Modal.Body>
    </Form>
  );
}

interface TransferDevEventsModalProps {
  close: () => void;
}
export function TransferDevEventsModal({ close }: TransferDevEventsModalProps) {
  const { tokens } = usePasswordless();
  const eventsQuery = tokens ? useQuery(fetchEventsApiOptions(tokens)) : useQuery(fetchEventsOptions());

  let eventDict: EventDict = {};
  for (let event of eventsQuery.data as ExistingGameKnightEvent[]) {
    eventDict[event["event_id"]] = event;
  }

  // Handle Transfer Event Checkboxes
  const [selectedTransferOptions, setSelectedTransferOptions] = useState<string[]>(Object.keys(eventDict));
  const handleOptionChange = (event: React.BaseSyntheticEvent) => {
    const event_id = event.target.value;
    const isChecked = event.target.checked;

    if (isChecked) {
      setSelectedTransferOptions([...selectedTransferOptions, event_id]);
    } else {
      setSelectedTransferOptions(selectedTransferOptions.filter((id) => id !== event_id));
    }
  };

  const apiClient = axios.create({
    baseURL: `https://${import.meta.env.VITE_API_URL}/api`,
    headers: tokens && {
      Authorization: "Bearer " + tokens.idToken,
    },
  });
  const [waiting, setWaiting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const transferEventMutation = useMutation({
    mutationFn: async (body: ExistingGameKnightEvent) => {
      await apiClient.post("event", {
        body: body,
      });
    },
    onSuccess: async (data) => {
      console.log(data);
    },
    onError: (error) => {
      console.error(error);
      setErrorMsg(`Transfer Events failed`);
    },
  });

  async function handleSubmit(event: React.BaseSyntheticEvent) {
    setWaiting(true);
    event.preventDefault();
    for (let event_id of selectedTransferOptions) {
      const body = eventDict[event_id];
      transferEventMutation.mutate(body);
    }

    await eventsQuery.refetch();
    close();
    setWaiting(false);
    if (errorMsg == "") close();
  }
  if (eventsQuery.isSuccess) {
    return (
      <Form onSubmit={handleSubmit}>
        <Modal.Header className="text-center">Transfer selected events to the Dev DB:</Modal.Header>
        <Modal.Body className="text-center">
          <Form.Group controlId="chooseNotAttendingPlayers" className="mb-1">
            {eventsQuery.data.map((event: ExistingGameKnightEvent, index: number) => (
              <Row key={index} style={{ minWidth: "min-content", maxWidth: "min-content" }}>
                <Form.Check
                  key={index}
                  type="checkbox"
                  id={`option_${index}`}
                  label={`${event.date} (${event.event_id})`}
                  checked={selectedTransferOptions.includes(event.event_id)}
                  onChange={handleOptionChange}
                  value={event.event_id}
                />
              </Row>
            ))}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <span>{errorMsg}</span>
          <pre>{JSON.stringify(selectedTransferOptions, null, 2)}</pre>
          <Button variant="danger" type="submit" disabled={waiting}>
            {waiting && <span className="spinner-grow spinner-grow-sm text-light" role="status"></span>}
            Transfer
          </Button>
          <Button variant="secondary" onClick={close} disabled={waiting}>
            Cancel
          </Button>
        </Modal.Footer>
      </Form>
    );
  }
  return (
    <div>
      <p>Loading...</p>
    </div>
  );
}

export type ManagedEventTask = "Clone" | "Create" | "Modify" | "Migrate" | "Read" | "Restore";
interface ManageEventModalProps {
  playersDict: PlayersDict;
  players: string[];
  organizers: string[];
  hosts: string[];
  close: () => void;
  task: ManagedEventTask;
  gameKnightEvent?: GameKnightEvent | null;
}
export function ManageEventModal({
  playersDict,
  players,
  organizers,
  hosts,
  close,
  task,
  gameKnightEvent,
}: ManageEventModalProps) {
  const method = ["Create", "Clone", "Restore"].includes(task)
    ? "POST"
    : ["Modify", "Migrate"].includes(task)
    ? "PUT"
    : "";
  const { tokens, signInStatus, tokensParsed } = usePasswordless();
  const today_6p_local = new Date(new Date().setHours(18, 0, 0, 0)).toLocaleString("lt").replace(" ", "T") + "DEFAULT";
  const [eventForm, setEventForm] = useState<GameKnightEvent>(
    gameKnightEvent
      ? gameKnightEvent
      : {
          event_id: undefined,
          event_type: "GameKnight",
          date: today_6p_local,
          host: "",
          organizer: "",
          format: "Open",
          game: "TBD",
          bgg_id: undefined,
          total_spots: undefined,
          attending: [],
          not_attending: [],
          player_pool: [],
          organizer_pool: organizers,
        }
  );
  const [isValid, setIsValid] = useState(() => {
    if (task == "Create") {
      return (
        hosts.includes(eventForm.host) &&
        eventForm.date !== today_6p_local &&
        !(eventForm.game === "" || eventForm.game == undefined)
      );
    }
  });
  useEffect(() => {
    setIsValid(
      hosts.includes(eventForm.host) &&
        eventForm.date !== today_6p_local &&
        !(eventForm.game === "" || eventForm.game == undefined)
    );
  }, [eventForm]);
  const eventsQuery = tokens ? useQuery(fetchEventsApiOptions(tokens)) : useQuery(fetchEventsOptions());
  const handleInput = (e: React.BaseSyntheticEvent) => {
    if (e.target.id == "bgg_id" || e.target.id == "total_spots") {
      console.log(e.target.id, e.target.value, e.target.value === "");
      setEventForm({ ...eventForm, [e.target.id]: parseInt(e.target.value) });
    } else {
      setEventForm({ ...eventForm, [e.target.id]: e.target.value });
    }
    // console.log(e.target);
  };

  let playerNameDict: PlayerNameDict = {};
  for (let [player_id, player] of Object.entries(playersDict)) {
    playerNameDict[player["attrib"]["given_name"]] = player_id;
  }
  // console.log(playerNameDict);

  // Handle Private Player Pool Checkboxes
  const [selectedPrivatePlayerPool, setSelectedPrivatePlayerPool] = useState(eventForm.player_pool);
  const handlePrivatePlayerPoolChange = (event: React.BaseSyntheticEvent) => {
    const optionId = event.target.value;
    const isChecked = event.target.checked;

    if (isChecked) {
      setSelectedPrivatePlayerPool([...selectedPrivatePlayerPool, optionId]);
    } else {
      setSelectedPrivatePlayerPool(selectedPrivatePlayerPool.filter((id) => id !== optionId));
    }
  };

  // Handle Player Attending Checkboxes
  const [selectedAttendingOptions, setSelectedAttendingOptions] = useState(eventForm.attending);
  const handleOptionChange = (event: React.BaseSyntheticEvent) => {
    const optionId = event.target.value;
    const isChecked = event.target.checked;
    if (isChecked) {
      setSelectedAttendingOptions([...selectedAttendingOptions, optionId]);
      // Remove from not_attending:
      setSelectedNotAttendingOptions(selectedNotAttendingOptions.filter((id) => id !== optionId));
    } else {
      setSelectedAttendingOptions(selectedAttendingOptions.filter((id) => id !== optionId));
    }
  };

  // Handle Player Not Attending Checkboxes
  const [selectedNotAttendingOptions, setSelectedNotAttendingOptions] = useState(eventForm.not_attending);
  const handleNAOptionChange = (event: React.BaseSyntheticEvent) => {
    const optionId = event.target.value;
    const isChecked = event.target.checked;
    if (isChecked) {
      setSelectedNotAttendingOptions([...selectedNotAttendingOptions, optionId]);
      // Remove from attending:
      setSelectedAttendingOptions(selectedAttendingOptions.filter((id) => id !== optionId));
    } else {
      setSelectedNotAttendingOptions(selectedNotAttendingOptions.filter((id) => id !== optionId));
    }
  };

  // when selectedAttendingOptions changes, update eventForm.attending
  // when selectedNotAttendingOptions changes, update eventForm.not_attending
  // when selectedPrivatePlayerPool changes and format is "Private": update player_pool
  useEffect(() => {
    if (eventForm.format == "Private") {
      setEventForm({
        ...eventForm,
        attending: selectedAttendingOptions,
        not_attending: selectedNotAttendingOptions,
        player_pool: selectedPrivatePlayerPool,
      });
    } else {
      setEventForm({ ...eventForm, attending: selectedAttendingOptions, not_attending: selectedNotAttendingOptions });
    }
  }, [selectedAttendingOptions, selectedNotAttendingOptions, selectedPrivatePlayerPool]);

  const apiClient = axios.create({
    baseURL: `https://${import.meta.env.VITE_API_URL}/api`,
    headers: tokens && {
      Authorization: "Bearer " + tokens.idToken,
    },
  });
  const isAdmin = authenticated({ signInStatus, tokensParsed, group: ["admin"] });

  const [errorMsg, setErrorMsg] = useState("");
  const manageEventMutation = useMutation({
    mutationFn: async ({ body, method }: { body: GameKnightEvent; method: string }) => {
      // const start = Date.parse(new Date().toISOString());
      if (task == "Clone") delete body.event_id;
      if (body.total_spots == null) body.total_spots = undefined;
      if (body.bgg_id == null) body.bgg_id = undefined;
      if (body.game == "TBD" && eventForm && eventForm.tbd_pic && task !== "Clone") {
        body.tbd_pic = eventForm.tbd_pic;
      } else if (body.game == "TBD" && (!body.tbd_pic || body.tbd_pic != "")) {
        let active_tbd_pics: string[] = []; // as GameKnightEvent[];
        for (let game_event of eventsQuery.data! as GameKnightEvent[]) {
          if (game_event.game == "TBD" && game_event.tbd_pic && game_event.tbd_pic != "") {
            active_tbd_pics.push(game_event.tbd_pic);
          }
        }
        let available_tbd_pics = tbd_pics.filter((n) => !active_tbd_pics.includes(n));
        body.tbd_pic = available_tbd_pics[~~(Math.random() * available_tbd_pics.length)];
      } else if (body.game !== "TBD" && body.tbd_pic) body.tbd_pic = "";

      if (task == "Migrate") {
        let new_attending = [];
        for (let name of body.attending) {
          if (name in playerNameDict) new_attending.push(playerNameDict[name]);
        }
        console.log({ attending: body.attending, new_attending: new_attending });
        body.attending = new_attending;

        let new_not_attending = [];
        for (let name of body.not_attending) {
          if (name in playerNameDict) new_not_attending.push(playerNameDict[name]);
        }
        console.log({ not_attending: body.not_attending, new_not_attending: new_not_attending });
        body.not_attending = new_not_attending;

        console.log({ host: body.host, new_host: playerNameDict[body.host] });
        body.host = playerNameDict[body.host];

        if (body.organizer && body.organizer != undefined) {
          console.log({ organizer: body.organizer, new_organizer: playerNameDict[body.organizer] });
          body.organizer = playerNameDict[body.organizer];
        }
        body.migrated = true;
        console.log(body);
      }

      await apiClient({
        method: method,
        url: "event",
        data: body,
      });
    },
    onSuccess: async (data) => {
      console.log(data);
      await eventsQuery.refetch();
      close();
    },
    onError: (error) => {
      setErrorMsg(`${task === "Clone" ? "Create" : task} Event Failed`);
      console.error(error);
    },
  });

  function handleSubmit(event: React.BaseSyntheticEvent) {
    event.preventDefault();
    console.log(eventForm);
    manageEventMutation.mutate({ body: eventForm, method: method });
  }
  return (
    <Form onSubmit={handleSubmit}>
      <Modal.Body className="text-center">
        <Row style={{ padding: 4 }}>
          <Col med="true" style={{ minWidth: "13rem", padding: 4 }}>
            <FloatingLabel controlId="date" label="Date" className="mb-1">
              <Form.Control
                aria-label="Select a date and time"
                type="datetime-local"
                onChange={handleInput}
                defaultValue={eventForm.date.slice(0, 16)}
                disabled={!isAdmin || ["Read", "Restore"].includes(task)}
                isInvalid={eventForm.date === today_6p_local}
              />
            </FloatingLabel>
          </Col>
          <Col med="true" style={{ minWidth: "9rem", maxWidth: "9rem", padding: 4 }}>
            <FloatingLabel controlId="status" label="Status" className="mb-1">
              <Form.Select
                aria-label="Status"
                onChange={handleInput}
                defaultValue={eventForm.status ? eventForm.status : "Normal"}
                disabled={!isAdmin || ["Read", "Restore"].includes(task)}
              >
                <option value="Normal">Normal</option>
                <option value="Cancelled">Cancelled</option>
              </Form.Select>
            </FloatingLabel>
          </Col>
        </Row>
        <Row style={{ padding: 2 }}>
          <Col med="true" style={{ minWidth: "18rem", padding: 4 }}>
            <Form.Group>
              <FloatingLabel controlId="host" label="Host" className="mb-1">
                <Form.Select
                  aria-label="Choose Host"
                  onChange={handleInput}
                  defaultValue={task == "Create" ? "default" : eventForm.host}
                  disabled={!isAdmin || ["Read", "Restore"].includes(task)}
                  isInvalid={!hosts.includes(eventForm.host)}
                >
                  <option hidden disabled value="default">
                    {" "}
                    -- choose a host --{" "}
                  </option>
                  {hosts.map((player_id: string, index: number) => (
                    <option key={index} value={player_id}>
                      {playersDict[player_id].attrib.given_name}
                    </option>
                  ))}
                </Form.Select>
              </FloatingLabel>
              <Feedback type="invalid">Please choose a host.</Feedback>
            </Form.Group>
          </Col>
        </Row>
        <Row style={{ padding: 2 }}>
          <Col med="true" style={{ minWidth: "13rem", padding: 4 }}>
            <FloatingLabel controlId="game" label="Game" className="mb-1">
              <Form.Control
                as="textarea"
                onChange={handleInput}
                defaultValue={task == "Create" ? "TBD" : eventForm.game}
                disabled={["Read", "Restore"].includes(task)}
                isInvalid={eventForm.game === "" || eventForm.game == undefined}
              />
            </FloatingLabel>
          </Col>
          <Col med="true" style={{ minWidth: "8rem", maxWidth: "8rem", padding: 4 }}>
            <FloatingLabel controlId="bgg_id" label="BGG ID" className="mb-1">
              <Form.Control
                type="number"
                disabled={eventForm.game == "TBD" || ["Read", "Restore"].includes(task)}
                onChange={handleInput}
                defaultValue={task == "Create" || !eventForm.bgg_id ? undefined : eventForm.bgg_id}
              />
            </FloatingLabel>
          </Col>
          <Col med="true" style={{ minWidth: "13rem", padding: 4 }}>
            <Form.Group>
              <FloatingLabel controlId="format" label="Format" className="mb-1">
                <Form.Select
                  aria-label="Choose Format"
                  onChange={handleInput}
                  defaultValue={task == "Create" ? "default" : eventForm.format}
                  disabled={!isAdmin || ["Read", "Restore"].includes(task)}
                  isInvalid={!["Open", "Reserved", "Private"].includes(eventForm.format)}
                >
                  <option hidden disabled value="default">
                    {" "}
                    -- choose the format --{" "}
                  </option>
                  <option value="Open">Open</option>
                  <option value="Reserved">Reserved</option>
                  <option value="Private">Private</option>
                </Form.Select>
              </FloatingLabel>
            </Form.Group>
          </Col>
          <Col med="true" style={{ minWidth: "8rem", maxWidth: "8rem", padding: 4 }}>
            <FloatingLabel controlId="total_spots" label="Total Spots" className="mb-1">
              <Form.Control
                disabled={eventForm.format == "Open" || ["Read", "Restore"].includes(task)}
                onChange={handleInput}
                defaultValue={task == "Create" || !eventForm.total_spots ? undefined : eventForm.total_spots}
              />
            </FloatingLabel>
          </Col>
          {eventForm.format == "Private" && (
            <Col med="true" style={{ minWidth: "18rem" }}>
              <Form.Group controlId="choosePrivatePlayerPool" className="mb-1">
                <Form.Label aria-label="Choose Private Player Pool">Choose Private Player Pool</Form.Label>
                <Row>
                  {players.map((player_id: string, index: number) => (
                    <Col key={player_id} style={{ minWidth: "min-content" }}>
                      <Form.Check
                        // style={{ marginLeft: "10%" }}
                        key={index}
                        type="checkbox"
                        id={`option_${index}`}
                        label={playersDict[player_id].attrib.given_name}
                        checked={selectedPrivatePlayerPool.includes(player_id)}
                        onChange={handlePrivatePlayerPoolChange}
                        disabled={["Read", "Restore"].includes(task)}
                        value={player_id}
                      />
                    </Col>
                  ))}
                </Row>
              </Form.Group>
            </Col>
          )}
          <Col med="true" style={{ minWidth: "18rem" }}>
            <Form.Group controlId="chooseAttendingPlayers" className="mb-1">
              <Form.Label aria-label="Choose Attending Players">
                Choose Attending Players
                {task == "Create" && eventForm.format == "Reserved" && " (after event is created)"}
              </Form.Label>
              <Row>
                {!(task == "Create" && eventForm.format == "Reserved") &&
                  players.map((player_id: string, index: number) => (
                    <Col key={player_id} style={{ minWidth: "min-content" }}>
                      <Form.Check
                        // style={{ marginLeft: "10%" }}
                        key={index}
                        type="checkbox"
                        id={`option_${index}`}
                        label={playersDict[player_id].attrib.given_name}
                        checked={selectedAttendingOptions.includes(player_id)}
                        disabled={
                          ["Read", "Restore"].includes(task) ||
                          (task == "Create" && eventForm.format == "Reserved") ||
                          (eventForm.format == "Private" && !eventForm.player_pool.includes(player_id)) ||
                          (eventForm.format !== "Open" &&
                            !eventForm.player_pool.includes(player_id) &&
                            !(eventForm.organizer_pool.includes(player_id) && eventForm.organizer == ""))
                        }
                        onChange={handleOptionChange}
                        value={player_id}
                      />
                    </Col>
                  ))}
              </Row>
            </Form.Group>
          </Col>
          <Col med="true" style={{ minWidth: "18rem" }}>
            <Form.Group controlId="chooseNotAttendingPlayers" className="mb-1">
              <Form.Label aria-label="Choose Not Attending Players">Choose Not Attending Players</Form.Label>
              <Row>
                {players.map((player_id: string, index: number) => (
                  <Col key={index} style={{ minWidth: "min-content" }}>
                    <Form.Check
                      key={index}
                      type="checkbox"
                      id={`option_${index}`}
                      label={playersDict[player_id].attrib.given_name}
                      checked={selectedNotAttendingOptions.includes(player_id)}
                      onChange={handleNAOptionChange}
                      disabled={["Read", "Restore"].includes(task)}
                      value={player_id}
                    />
                  </Col>
                ))}
              </Row>
            </Form.Group>
          </Col>

          {isAdmin && (
            <Col med="true" style={{ minWidth: "18rem" }}>
              <FloatingLabel controlId="organizer" label="Organizer" className="mb-1">
                <Form.Select
                  aria-label="Choose Organizer"
                  onChange={handleInput}
                  defaultValue={
                    task == "Modify" || task == "Clone"
                      ? eventForm.organizer == ""
                        ? "default"
                        : eventForm.organizer
                      : "default"
                  }
                  disabled={["Create", "Read", "Restore"].includes(task)}
                >
                  <option hidden disabled value="default">
                    {" "}
                    -- manually choose/override the organizer --{" "}
                  </option>
                  {organizers.map((player_id: string, index: number) => (
                    <option key={index} value={player_id}>
                      {playersDict[player_id].attrib.given_name}
                    </option>
                  ))}
                </Form.Select>
              </FloatingLabel>
            </Col>
          )}
        </Row>
      </Modal.Body>
      {(import.meta.env.MODE == "development" || ["Read", "Restore"].includes(task)) && (
        <Accordion>
          <Accordion.Item eventKey="eventDebug">
            <Accordion.Header>Event Debug</Accordion.Header>
            <Accordion.Body>
              <pre>{JSON.stringify(eventForm, null, 2)}</pre>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      )}
      <Modal.Footer>
        {/* <pre>{timeDiff}</pre> */}
        {/* <pre>{JSON.stringify(selectedAttendingOptions, null, 4)}</pre> */}
        {/* <pre>{JSON.stringify(selectedNotAttendingOptions, null, 4)}</pre> */}
        <span>{errorMsg}</span>
        {/* || ["Read", "Restore"].includes(task) */}
        {task !== "Read" && (
          <Button
            variant={task == "Restore" ? "danger" : "primary"}
            type="submit"
            disabled={manageEventMutation.isPending || !isValid}
          >
            {manageEventMutation.isPending && (
              <span className="spinner-grow spinner-grow-sm text-light" role="status"></span>
            )}
            {task == "Modify"
              ? "Update Event"
              : task == "Migrate"
              ? "Migrate Event"
              : task == "Restore"
              ? "Restore Event"
              : "Create Event"}
          </Button>
        )}
        <Button variant="secondary" onClick={close} disabled={manageEventMutation.isPending}>
          Cancel
        </Button>
      </Modal.Footer>
    </Form>
  );
}

interface RsvpFooterProps {
  event: GameKnightEvent;
  index: number;
}
export function RsvpFooter({ event, index }: RsvpFooterProps) {
  const { signInStatus, tokensParsed, tokens } = usePasswordless();
  const apiClient = axios.create({
    baseURL: `https://${import.meta.env.VITE_API_URL}/api`,
    headers: tokens && {
      Authorization: "Bearer " + tokens.idToken,
    },
  });

  const eventsQuery = tokens ? useQuery(fetchEventsApiOptions(tokens)) : useQuery(fetchEventsOptions());

  let player_id = "";
  if (signInStatus === "SIGNED_IN" && tokensParsed) {
    player_id = String(tokensParsed.idToken.sub);
  }

  const [yesWaiting, setYesWaiting] = useState(false);
  const [noWaiting, setNoWaiting] = useState(false);
  const handleYes = () => {
    setYesWaiting(true);
    if (event.attending.includes(player_id)) {
      const body = {
        event_id: event.event_id,
        user_id: player_id,
        rsvp: "attending",
      };
      eventRsvpMutation.mutate({ params: body, method: "DELETE" });
    } else {
      const body = {
        event_id: event.event_id,
        user_id: player_id,
        rsvp: "attending",
      };
      eventRsvpMutation.mutate({ body: body, method: "POST" });
    }
  };
  const handleNo = () => {
    setNoWaiting(true);
    if (event.not_attending.includes(player_id)) {
      const body = {
        event_id: event.event_id,
        user_id: player_id,
        rsvp: "not_attending",
      };
      eventRsvpMutation.mutate({ params: body, method: "DELETE" });
    } else {
      const body = {
        event_id: event.event_id,
        user_id: player_id,
        rsvp: "not_attending",
      };
      eventRsvpMutation.mutate({ body: body, method: "POST" });
    }
  };

  const [rsvpError, setRsvpError] = useState("");
  interface eventRsvpProps {
    body?: Object | null;
    params?: Object | null;
    method: string;
  }
  const eventRsvpMutation = useMutation({
    mutationFn: async ({ body = null, params = null, method }: eventRsvpProps) => {
      await apiClient({
        headers: tokens && {
          Authorization: "Bearer " + tokens.idToken,
        },
        params: params,
        method: method,
        url: "event/rsvp",
        data: body,
      });
    },
    onSuccess: async (data) => {
      console.log(data);
      await eventsQuery.refetch();
      setYesWaiting(false);
      setNoWaiting(false);
    },
    onError: async (error: AxiosError) => {
      console.error(error);
      if (error.response) {
        setRsvpError(`${error.message}\n${JSON.stringify(error.response.data).replaceAll(/["{}]/g, "")}`);
      } else {
        setRsvpError(error.message);
      }

      setYesWaiting(false);
      setNoWaiting(false);
    },
  });
  try {
    if (
      event.format != "Private" &&
      !event.player_pool.includes(player_id) &&
      !(event.organizer_pool && event.organizer_pool.includes(player_id) && event.organizer == "")
    ) {
      return (
        <Row>
          <Col className="d-flex align-items-center">
            You have a previous RSVP, but all remaining slots will open at midnight the Sunday prior to the event!
          </Col>
        </Row>
      );
    }
  } catch (error) {
    console.error(error);
    console.error(event);
    return <></>;
  }
  return (
    <>
      {rsvpError && (
        <Alert variant="danger" onClose={() => setRsvpError("")} dismissible>
          <Alert.Heading>RSVP Update Failed</Alert.Heading>
          <p>{rsvpError}</p>
        </Alert>
      )}
      <Row>
        <Col className="d-flex align-items-center justify-content-start">Can you make it?:</Col>
        <Col xs="auto" className="d-flex align-items-center justify-content-end ">
          <ButtonGroup key={index} aria-label="RSVP">
            <Button
              onClick={handleYes}
              key={"yes" + index}
              variant={event.attending.includes(player_id) ? "success" : "outline-secondary"}
              disabled={
                noWaiting ||
                yesWaiting ||
                (!event.player_pool.includes(player_id) &&
                  !(event.organizer_pool && event.organizer_pool.includes(player_id) && event.organizer == ""))
              }
            >
              {yesWaiting ? <span className="spinner-grow spinner-grow-sm" role="status"></span> : "Yes"}
            </Button>
            <Button
              onClick={handleNo}
              key={"no" + index}
              variant={event.not_attending.includes(player_id) ? "secondary" : "outline-secondary"}
              disabled={
                noWaiting ||
                yesWaiting ||
                (!event.player_pool.includes(player_id) &&
                  !(event.organizer_pool && event.organizer_pool.includes(player_id) && event.organizer == ""))
              }
            >
              {noWaiting ? <span className="spinner-grow spinner-grow-sm " role="status"></span> : "No"}
            </Button>
          </ButtonGroup>
        </Col>
      </Row>
    </>
  );
}

export const tbd_pics = [
  "Game_TBD_17.jpeg",
  "Game_TBD_24.jpeg",
  "Game_TBD_23.jpeg",
  "Game_TBD_22.jpeg",
  "Game_TBD_21.jpeg",
  "Game_TBD_20.jpeg",
  "Game_TBD_19.jpeg",
  "Game_TBD_18.jpeg",
  "Game_TBD_27.jpeg",
  "Game_TBD_26.jpeg",
  "Game_TBD_28.jpeg",
  "Game_TBD_29.jpeg",
  "Game_TBD_30.jpeg",
  "Game_TBD_31.jpeg",
  "Game_TBD_32.jpeg",
  "Game_TBD_34.jpeg",
  "Game_TBD_33.jpeg",
];
