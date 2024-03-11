import { useState, useEffect } from "react";

import axios from "axios";

import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";

import { usePasswordless } from "amazon-cognito-passwordless-auth/react";

import { GameKnightEvent, ExistingGameKnightEvent, EventDict, formatIsoDate } from "./Events";
import { PlayerNameDict, PlayersDict } from "./Players";

interface DeleteEventModalProps {
  close: () => void;
  refreshEvents: (use_api: boolean) => void;
  gameKnightEvent: GameKnightEvent;
}
export function DeleteEventModal({ close, refreshEvents, gameKnightEvent }: DeleteEventModalProps) {
  const { tokens } = usePasswordless();
  const [notConfirmed, setNotConfirmed] = useState(true);

  function handleInput(event: React.BaseSyntheticEvent) {
    if (event.target.value == "DELETE") setNotConfirmed(false);
  }

  const [waiting, setWaiting] = useState(false);

  const apiClient = axios.create({
    baseURL: `https://${import.meta.env.VITE_API_URL}/api`,
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
        headers: tokens && {
          Authorization: "Bearer " + tokens.idToken,
        },
      });
      console.log(response.data);
      setWaiting(false);
      refreshEvents(true);
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
        Are you sure you want to delete {formatIsoDate(gameKnightEvent.date)} event?
      </Modal.Header>
      <Modal.Body className="text-center">
        Type DELETE to permanently delete event
        <Form.Control type="textarea" id="delete_event" aria-describedby="delete_event" onChange={handleInput} />
        <Button variant="danger" type="submit" disabled={notConfirmed || waiting}>
          {waiting && <span className="spinner-grow spinner-grow-sm text-light" role="status"></span>}
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

interface TransferDevEventsModalProps {
  close: () => void;
  events: ExistingGameKnightEvent[];
  refreshEvents: (use_api: boolean) => void;
}
export function TransferDevEventsModal({ close, events, refreshEvents }: TransferDevEventsModalProps) {
  const { tokens } = usePasswordless();

  let eventDict: EventDict = {};
  for (let event of events) {
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
  async function handleSubmit(event: React.BaseSyntheticEvent) {
    setWaiting(true);
    event.preventDefault();
    for (let event_id of selectedTransferOptions) {
      const body = eventDict[event_id];

      try {
        const response = await apiClient({
          method: "POST",
          url: "event",
          data: body,
        });
        console.log(response.data);
      } catch (error) {
        console.error(error);
        setErrorMsg(`Transfer Events failed`);
        // setWaiting(false);
      }
    }
    setWaiting(false);
    refreshEvents(true);
    if (errorMsg == "") close();
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Modal.Header className="text-center">
        {/* Are you sure you want to  {formatIsoDate(gameKnightEvent.date)} event? */}
        Transfer selected events to the Dev DB:
      </Modal.Header>
      <Modal.Body className="text-center">
        {/* <Col med="true" style={{ minWidth: "18rem" }}> */}
        <Form.Group controlId="chooseNotAttendingPlayers" className="mb-3">
          {events.map((event: ExistingGameKnightEvent, index: number) => (
            <Row key={index} style={{ minWidth: "min-content", maxWidth: "min-content" }}>
              <Form.Check
                // style={{ marginLeft: "10%" }}
                key={index}
                type="checkbox"
                id={`option_${index}`}
                label={`${event.date} (${event.event_id})`}
                checked={selectedTransferOptions.includes(event.event_id)}
                // {selectedNotAttendingOptions.includes(player)}
                onChange={handleOptionChange}
                value={event.event_id}
              />
            </Row>
          ))}
        </Form.Group>
        {/* </Col> */}
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

export type ManagedEventTask = "Clone" | "Create" | "Modify" | "Migrate";
interface ManageEventModalProps {
  playersDict: PlayersDict;
  players: string[];
  organizers: string[];
  hosts: string[];
  close: () => void;
  refreshEvents: (use_api: boolean) => void;
  task: ManagedEventTask;
  gameKnightEvent?: GameKnightEvent | null;
  events: GameKnightEvent[];
}
export function ManageEventModal({
  playersDict,
  players,
  organizers,
  hosts,
  close,
  refreshEvents,
  task,
  gameKnightEvent,
  events,
}: ManageEventModalProps) {
  const method = ["Create", "Clone"].includes(task) ? "POST" : ["Modify", "Migrate"].includes(task) ? "PUT" : "";
  const { tokens } = usePasswordless();
  const [eventForm, setEventForm] = useState<GameKnightEvent>(
    gameKnightEvent
      ? gameKnightEvent
      : {
          event_id: undefined,
          event_type: "GameKnight",
          date: "",
          host: "",
          organizer: "",
          format: "Open",
          game: "TBD",
          bgg_id: undefined,
          total_spots: undefined,
          attending: [],
          not_attending: [],
          player_pool: players,
          organizer_pool: organizers,
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

  let playerNameDict: PlayerNameDict = {};
  for (let [player_id, player] of Object.entries(playersDict)) {
    playerNameDict[player["attrib"]["given_name"]] = player_id;
  }
  // console.log(playerNameDict);

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
  useEffect(() => {
    setEventForm({ ...eventForm, attending: selectedAttendingOptions, not_attending: selectedNotAttendingOptions });
  }, [selectedAttendingOptions, selectedNotAttendingOptions]);

  const [waiting, setWaiting] = useState(false);
  const apiClient = axios.create({
    baseURL: `https://${import.meta.env.VITE_API_URL}/api`,
    headers: tokens && {
      Authorization: "Bearer " + tokens.idToken,
    },
  });

  const [errorMsg, setErrorMsg] = useState("");
  // const [timeDiff, setTimeDiff] = useState(0);
  const createEvent = async (body: GameKnightEvent, method: string) => {
    setWaiting(true);
    // const start = Date.parse(new Date().toISOString());
    if (task == "Clone") delete body.event_id;
    if (body.total_spots == null) body.total_spots = undefined;
    if (body.bgg_id == null) body.bgg_id = undefined;
    // if (!body.event_type) body.event_type = "GameKnight";
    if (body.game == "TBD" && eventForm && eventForm.tbd_pic && task !== "Clone") {
      body.tbd_pic = eventForm.tbd_pic;
    } else if (body.game == "TBD" && (!body.tbd_pic || body.tbd_pic != "")) {
      let active_tbd_pics: string[] = []; // as GameKnightEvent[];
      for (let game_event of events) {
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
    try {
      const response = await apiClient({
        method: method,
        url: "event",
        data: body,
      });

      console.log(response.data);
      refreshEvents(true);
      setWaiting(false);
      // const current_time = Date.parse(new Date().toISOString());
      // setTimeDiff(current_time - start);
      close();
    } catch (error) {
      console.error(error);
      setErrorMsg(`${task === "Clone" ? "Create" : task} Event Failed`);
      setWaiting(false);
      // const current_time = Date.parse(new Date().toISOString());
      // setTimeDiff(current_time - start);
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
                defaultValue={task == "Modify" || task == "Clone" ? eventForm.host : "default"}
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
          </Col>
          <Col med="true" style={{ minWidth: "8rem", maxWidth: "11rem" }}>
            <FloatingLabel controlId="date" label="Date">
              <Form.Control
                type="date"
                onChange={handleInput}
                defaultValue={task == "Modify" || task == "Clone" ? eventForm.date : ""}
              />
            </FloatingLabel>
          </Col>

          <Col med="true" style={{ minWidth: "13rem" }}>
            <FloatingLabel controlId="game" label="Game" className="mb-3">
              <Form.Control
                as="textarea"
                onChange={handleInput}
                defaultValue={task == "Modify" || task == "Clone" ? eventForm.game : "TBD"}
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
                defaultValue={(task == "Modify" || task == "Clone") && eventForm.bgg_id ? eventForm.bgg_id : undefined}
              />
            </FloatingLabel>
          </Col>
          <Col med="true" style={{ minWidth: "13rem" }}>
            <FloatingLabel controlId="format" label="Format" className="mb-3">
              <Form.Select
                aria-label="Choose Format"
                onChange={handleInput}
                defaultValue={task == "Modify" || task == "Clone" ? eventForm.format : "default"}
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
          </Col>
          <Col med="true" style={{ minWidth: "8rem", maxWidth: "8rem" }}>
            <FloatingLabel controlId="total_spots" label="Total Spots" className="mb-3">
              <Form.Control
                disabled={eventForm.format == "Open"}
                onChange={handleInput}
                defaultValue={
                  (task == "Modify" || task == "Clone") && eventForm.total_spots ? eventForm.total_spots : undefined
                }
              />
            </FloatingLabel>
          </Col>
          <Col med="true" style={{ minWidth: "18rem" }}>
            <Form.Group controlId="chooseAttendingPlayers" className="mb-3">
              <Form.Label aria-label="Choose Attending Players">
                Choose Attending Players{task == "Create" && " (after event is created)"}
              </Form.Label>
              <Row>
                {players.map((player_id: string, index: number) => (
                  <Col key={player_id} style={{ minWidth: "min-content" }}>
                    <Form.Check
                      // style={{ marginLeft: "10%" }}
                      key={index}
                      type="checkbox"
                      id={`option_${index}`}
                      label={playersDict[player_id].attrib.given_name}
                      checked={selectedAttendingOptions.includes(player_id)}
                      disabled={
                        task == "Create" ||
                        (!eventForm.player_pool.includes(player_id) &&
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
            <Form.Group controlId="chooseNotAttendingPlayers" className="mb-3">
              <Form.Label aria-label="Choose Not Attending Players">Choose Not Attending Players</Form.Label>
              <Row>
                {players.map((player_id: string, index: number) => (
                  <Col key={index} style={{ minWidth: "min-content" }}>
                    <Form.Check
                      // style={{ marginLeft: "10%" }}
                      key={index}
                      type="checkbox"
                      id={`option_${index}`}
                      label={playersDict[player_id].attrib.given_name}
                      checked={selectedNotAttendingOptions.includes(player_id)}
                      onChange={handleNAOptionChange}
                      value={player_id}
                    />
                  </Col>
                ))}
              </Row>
            </Form.Group>
          </Col>
          <Col med="true" style={{ minWidth: "13rem" }}>
            <FloatingLabel controlId="organizer" label="Organizer" className="mb-3">
              <Form.Select
                aria-label="Choose Organizer (manually for now)"
                onChange={handleInput}
                defaultValue={
                  task == "Modify" || task == "Clone"
                    ? eventForm.organizer == ""
                      ? "default"
                      : eventForm.organizer
                    : "default"
                }
                disabled={task == "Create"}
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
        </Row>
      </Modal.Body>
      <Modal.Footer>
        {/* <pre>{timeDiff}</pre> */}
        {/* <pre>{JSON.stringify(eventForm, null, 4)}</pre> */}
        {/* <pre>{JSON.stringify(selectedAttendingOptions, null, 4)}</pre> */}
        {/* <pre>{JSON.stringify(selectedNotAttendingOptions, null, 4)}</pre> */}
        <span>{errorMsg}</span>
        <Button variant="primary" type="submit" disabled={waiting}>
          {waiting && <span className="spinner-grow spinner-grow-sm text-light" role="status"></span>}
          {task == "Modify" ? "Update Event" : task == "Migrate" ? "Migrate Event" : "Create Event"}
        </Button>
        <Button variant="secondary" onClick={close} disabled={waiting}>
          Cancel
        </Button>
      </Modal.Footer>
    </Form>
  );
}

interface RsvpFooterProps {
  event: GameKnightEvent;
  index: number;
  refreshEvents: (use_api: boolean) => void;
}
export function RsvpFooter({ event, index, refreshEvents }: RsvpFooterProps) {
  const { signInStatus, tokensParsed, tokens } = usePasswordless();
  const apiClient = axios.create({
    baseURL: `https://${import.meta.env.VITE_API_URL}/api`,
    headers: tokens && {
      Authorization: "Bearer " + tokens.idToken,
    },
  });

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
      send({ params: body, method: "DELETE" });
    } else {
      const body = {
        event_id: event.event_id,
        user_id: player_id,
        rsvp: "attending",
      };
      send({ body: body, method: "POST" });
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
      send({ params: body, method: "DELETE" });
      // send(body, "DELETE");
    } else {
      const body = {
        event_id: event.event_id,
        user_id: player_id,
        rsvp: "not_attending",
      };
      send({ body: body, method: "POST" });
    }
  };

  interface SendProps {
    body?: Object | null;
    params?: Object | null;
    method: string;
  }
  const send = async ({ body = null, params = null, method }: SendProps) => {
    const response = await apiClient({
      headers: tokens && {
        Authorization: "Bearer " + tokens.idToken,
      },
      params: params,
      method: method,
      url: "event/rsvp",
      data: body,
    });
    console.log(response.data);
    refreshEvents(true);
    setYesWaiting(false);
    setNoWaiting(false);
  };
  try {
    if (
      !event.player_pool.includes(player_id) &&
      !(event.organizer_pool.includes(player_id) && event.organizer == "")
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
    console.log(event);
    return <></>;
  }
  return (
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
                !(event.organizer_pool.includes(player_id) && event.organizer == ""))
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
                !(event.organizer_pool.includes(player_id) && event.organizer == ""))
            }
          >
            {noWaiting ? <span className="spinner-grow spinner-grow-sm " role="status"></span> : "No"}
          </Button>
        </ButtonGroup>
      </Col>
    </Row>
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
