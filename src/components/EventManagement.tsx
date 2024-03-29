import { useState, useEffect } from "react";

import { AxiosError } from "axios";

import Alert from "react-bootstrap/Alert";
import Accordion from "react-bootstrap/Accordion";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import Feedback from "react-bootstrap/Feedback";
import InputGroup from "react-bootstrap/InputGroup";
import ListGroup from "react-bootstrap/ListGroup";
import Image from "react-bootstrap/Image";
import Container from "react-bootstrap/Container";

import Icon from "@mdi/react";
import { mdiMagnify, mdiClose, mdiPlus } from "@mdi/js";

import { usePasswordless } from "amazon-cognito-passwordless-auth/react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchEventsApiOptions,
  fetchEventsOptions,
  apiClient,
  fetchBggThumbnailOptions,
  fetchGameSearchOptions,
} from "./Queries";
import { authenticated } from "../utilities/Authenticated";

import { formatIsoDate } from "../utilities";
import { tbd_pics, GameSearch } from "../types/Events";
import { PlayerNameDict, PlayersDict } from "../types/Players";
import { ManagedEventTask, GameKnightEvent, ExistingGameKnightEvent, EventDict } from "../types/Events";

interface DeleteEventModalProps {
  close: () => void;
  gameKnightEvent: GameKnightEvent;
}
export function DeleteEventModal({ close, gameKnightEvent }: DeleteEventModalProps) {
  const { tokens } = usePasswordless();
  const eventsQuery = tokens ? useQuery(fetchEventsApiOptions()) : useQuery(fetchEventsOptions());

  const [notConfirmed, setNotConfirmed] = useState(true);
  function handleInput(event: React.BaseSyntheticEvent) {
    if (event.target.value == "DELETE") setNotConfirmed(false);
  }

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
  const eventsQuery = tokens ? useQuery(fetchEventsApiOptions()) : useQuery(fetchEventsOptions());

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
      return validateEventForm();
    }
  });
  function validateEventForm() {
    return (
      hosts.includes(eventForm.host) &&
      eventForm.date !== today_6p_local &&
      !(eventForm.game === "" || eventForm.game == undefined) &&
      !(eventForm.game !== "TBD" && (eventForm.bgg_id == 0 || eventForm.bgg_id == undefined))
    );
  }
  useEffect(() => {
    setIsValid(validateEventForm());
  }, [eventForm]);
  const eventsQuery = tokens ? useQuery(fetchEventsApiOptions()) : useQuery(fetchEventsOptions());
  const handleInput = (e: React.BaseSyntheticEvent) => {
    if (e.target.id == "bgg_id" || e.target.id == "total_spots") {
      console.log(e.target.id, e.target.value, e.target.value === "");
      if (e.target.value === "") {
        setEventForm({ ...eventForm, [e.target.id]: undefined });
      } else {
        setEventForm({ ...eventForm, [e.target.id]: parseInt(e.target.value) });
      }
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

      const response = await apiClient({
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

  const queryClient = useQueryClient();
  const [showBggSearch, setShowBggSearch] = useState(false);
  const [bggSearchResults, setBggSearchResults] = useState<GameSearch[]>([]);
  const [bggSearchError, setBggSearchError] = useState("");
  const handleSearchBgg = async () => {
    setBggSearchResults([]);
    setBggSearchError("");
    setShowBggSearch(true);

    try {
      const data = await queryClient.fetchQuery(fetchGameSearchOptions(eventForm.game.toLowerCase()));
      try {
        for (let result of data.slice(0, 5)) {
          const _thumb = await queryClient.fetchQuery(fetchBggThumbnailOptions(parseInt(result.id)));
          result.thumbnail = _thumb;
        }
      } catch (error) {
        console.log(error);
      }
      setBggSearchResults(data.slice(0, 5));
    } catch (error) {
      setBggSearchError("BGG Search Failed");
      console.log(error);
    }
  };

  function assignBggId(event: React.BaseSyntheticEvent, bgg_id: number) {
    event.preventDefault();
    setEventForm({ ...eventForm, bgg_id: bgg_id });
  }

  function handleSubmit(event: React.BaseSyntheticEvent) {
    event.preventDefault();
    console.log(eventForm);
    manageEventMutation.mutate({ body: eventForm, method: method });
  }

  const pastEvent = Date.parse(eventForm.date) <= Date.parse(new Date().toString());
  const [validFinalScore, setValidFinalScore] = useState(false);
  const [finalScorePlayers, setFinalScorePlayers] = useState<string[]>([]);
  const [finalScore, setFinalScore] = useState(() => {
    if (eventForm.finalScore) return eventForm.finalScore;
    else return initFinalScore();
  });
  function initFinalScore() {
    return eventForm.attending.map((player, index: number) => ({ place: index + 1, player: player, score: "" }));
  }
  const findArrayDuplicates = (arr: string[]) => arr.filter((item, index) => arr.indexOf(item) !== index);
  function clearFinalScore() {
    setFinalScore(initFinalScore());
    setEventForm({ ...eventForm, finalScore: undefined });
    // setEventForm({ ...eventForm, finalScore: undefined });
  }
  useEffect(() => {
    if (finalScore) {
      const _rankings = finalScore.map(({ place }) => place);
      const _players = finalScore.map(({ player }) => player);
      const _scores = finalScore.map(({ score }) => score);
      const _duplicates = findArrayDuplicates(_players);
      const _validRankings = _rankings.map((place) => place > 0);
      const _validPlayers = _players.map((player) => !!playersDict[player]);
      const _validScores = _scores.map((score) => score !== "");
      // console.log({
      //   _players: _players,
      //   _duplicates: _duplicates,
      //   _validPlayers: _validPlayers,
      //   every_validPlayers: _validPlayers.every(Boolean),
      // });
      setFinalScorePlayers(_players);
      setValidFinalScore(
        _duplicates.length == 0 &&
          _validRankings.every(Boolean) &&
          _validPlayers.every(Boolean) &&
          _validScores.every(Boolean)
      );
    }
    // console.log(finalScorePlayers, findArrayDuplicates(finalScorePlayers));
  }, [finalScore]);

  const onChangeTableInput = (e: React.BaseSyntheticEvent, index: number) => {
    const { id, value } = e.target;
    const editData = finalScore.map((item, _index) => (_index === index && id ? { ...item, [id]: value } : item));
    setFinalScore(editData);
  };
  const [refresh, setRefresh] = useState(0);
  const sortFinalScore = (e: React.BaseSyntheticEvent) => {
    setFinalScore(finalScore.sort((a, b) => a.place - b.place));
    setRefresh(refresh + 1);
  };
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
        <Row style={{ padding: 4 }}>
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
            <InputGroup>
              <FloatingLabel controlId="game" label="Game">
                <Form.Control
                  as="textarea"
                  onChange={handleInput}
                  defaultValue={task == "Create" ? "TBD" : eventForm.game}
                  disabled={["Read", "Restore"].includes(task)}
                  isInvalid={eventForm.game === "" || eventForm.game == undefined}
                />
              </FloatingLabel>
              {["Read", "Restore"].includes(task) == false && eventForm.game !== "" && eventForm.game !== "TBD" && (
                <Button variant="outline-secondary" id="button-addon1" onClick={handleSearchBgg}>
                  <Icon path={mdiMagnify} size={1} />
                  <div style={{ fontSize: ".75rem" }}>BGG</div>
                </Button>
              )}
            </InputGroup>
          </Col>
          <Col med="true" style={{ minWidth: "8rem", maxWidth: "8rem", padding: 4 }}>
            <FloatingLabel controlId="bgg_id" label="BGG ID" className="mb-1">
              <Form.Control
                type="number"
                disabled={eventForm.game == "TBD" || ["Read", "Restore"].includes(task)}
                onChange={handleInput}
                value={eventForm.bgg_id ?? ""}
                isInvalid={eventForm.game !== "TBD" && (eventForm.bgg_id == 0 || eventForm.bgg_id == undefined)}
              />
            </FloatingLabel>
          </Col>

          {showBggSearch && (
            <div>
              {bggSearchError != "" ? (
                bggSearchError
              ) : bggSearchResults.length == 0 ? (
                "Searching..."
              ) : (
                <ListGroup>
                  <ListGroup.Item>
                    <Container fluid>
                      <Row>
                        <Col style={{ textAlign: "left", width: "100%", transform: `scale(0.85)` }}>
                          Game Name (Year)
                        </Col>
                        <Col xs="auto" style={{ textAlign: "right", transform: `scale(0.85)` }}>
                          BGG ID
                        </Col>
                        <Col xs="auto" style={{ transform: `scale(0.85)` }}>
                          Thumbnail
                        </Col>
                      </Row>
                    </Container>
                  </ListGroup.Item>
                  {bggSearchResults.map((result: GameSearch, index: number) => {
                    // const thumb = bggThumbnails[index];
                    return (
                      <ListGroup.Item
                        action
                        onClickCapture={(event: React.BaseSyntheticEvent) =>
                          assignBggId(event, parseInt(result.id ?? 0))
                        }
                        key={index}
                      >
                        <Row>
                          <Col style={{ textAlign: "left" }}>{`${result.name} (${result.yearpublished})`}</Col>
                          <Col xs="auto" style={{ textAlign: "right" }}>{`${result.id}`}</Col>
                          <Col xs="auto">
                            <Image
                              src={result.thumbnail}
                              // alt="No Thumbnail"
                              rounded
                              style={{
                                width: "4rem",
                                height: "4rem",
                                objectFit: "contain",
                              }}
                            />
                          </Col>
                        </Row>
                      </ListGroup.Item>
                    );
                  })}
                </ListGroup>
              )}
            </div>
          )}
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
          <hr />
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
          <hr />
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
          <hr />
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
        {pastEvent && (
          <>
            <hr></hr>
            <div>Final Scores</div>
            <table>
              <thead>
                <tr>
                  <th style={{ width: "17%" }}>Place</th>
                  <th style={{ width: "36%" }}>Player</th>
                  <th>Score</th>
                  {eventForm.attending.length !== finalScore.length && <th></th>}
                </tr>
              </thead>
              <tbody>
                {finalScore.map(({ place, player, score }, index) => (
                  // <Form>
                  <tr key={index}>
                    <td style={{ maxWidth: "min-content" }}>
                      <Form.Control
                        id="place"
                        value={place == 0 ? "" : place}
                        type="number"
                        onChange={(e: React.BaseSyntheticEvent) => onChangeTableInput(e, index)}
                        onBlur={sortFinalScore}
                        // onBlur={() => setFinalScore(finalScore.sort((a, b) => a.place - b.place))}
                        placeholder="Place"
                        className="no-validate-badge"
                        isValid={
                          eventForm.finalScore &&
                          eventForm.finalScore[index] &&
                          eventForm.finalScore[index].place === place &&
                          !["Read", "Restore"].includes(task)
                        }
                        isInvalid={place == 0}
                        disabled={["Read", "Restore"].includes(task)}
                      />
                    </td>
                    <td>
                      <Form.Select
                        id="player"
                        aria-label="Choose Player"
                        onChange={(e: React.BaseSyntheticEvent) => onChangeTableInput(e, index)}
                        value={player ? player : "default"}
                        className="no-validate-badge"
                        isValid={
                          eventForm.finalScore &&
                          eventForm.finalScore[index] &&
                          eventForm.finalScore[index].player === player &&
                          !["Read", "Restore"].includes(task)
                        }
                        isInvalid={!playersDict[player] || findArrayDuplicates(finalScorePlayers).includes(player)}
                        disabled={["Read", "Restore"].includes(task)}
                      >
                        <option hidden disabled value="default">
                          Player
                        </option>
                        {eventForm.attending.map((player_id: string, index: number) => (
                          <option key={index} value={player_id}>
                            {playersDict[player_id].attrib.given_name}
                          </option>
                        ))}
                      </Form.Select>
                    </td>
                    <td>
                      <Form.Control
                        id="score"
                        type="text"
                        value={score}
                        onChange={(e: React.BaseSyntheticEvent) => onChangeTableInput(e, index)}
                        placeholder="Score"
                        className="no-validate-badge"
                        isValid={
                          eventForm.finalScore &&
                          eventForm.finalScore[index] &&
                          eventForm.finalScore[index].score === score &&
                          !["Read", "Restore"].includes(task)
                        }
                        isInvalid={score == ""}
                        disabled={["Read", "Restore"].includes(task)}
                      />
                    </td>
                    {eventForm.attending.length !== finalScore.length && !["Read", "Restore"].includes(task) && (
                      <td>
                        <Button
                          className="link-no-blue"
                          style={{ padding: "1px" }}
                          variant="link"
                          onClick={() => {
                            setFinalScore(finalScore.filter((row, _index) => _index !== index));
                          }}
                          disabled={eventForm.attending.length > finalScore.length}
                        >
                          <Icon path={mdiClose} size={1} />
                        </Button>
                      </td>
                    )}
                  </tr>
                  // </Form>
                ))}
                <tr>
                  <td />
                  <td />
                  <td />
                  {eventForm.attending.length !== finalScore.length && !["Read", "Restore"].includes(task) && (
                    <td>
                      <Button
                        className="link-no-blue"
                        style={{ padding: "1px" }}
                        variant="link"
                        onClick={() => {
                          setFinalScore([...finalScore, { place: eventForm.attending.length, player: "", score: "" }]);
                          // eventForm.attending.length
                        }}
                        disabled={eventForm.attending.length < finalScore.length}
                      >
                        <Icon path={mdiPlus} size={1} />
                      </Button>
                    </td>
                  )}
                </tr>
              </tbody>
            </table>

            {!["Read", "Restore"].includes(task) && (
              <Container fluid>
                <Row>
                  <Col style={{ textAlign: "right", padding: "4px" }}>
                    <Button
                      disabled={!validFinalScore || JSON.stringify(finalScore) == JSON.stringify(eventForm.finalScore)}
                      variant={
                        JSON.stringify(finalScore) == JSON.stringify(eventForm.finalScore)
                          ? "outline-success"
                          : "primary"
                      }
                      onClick={() => {
                        setEventForm({ ...eventForm, finalScore: finalScore.length == 0 ? undefined : finalScore });
                      }}
                    >
                      Save Scores
                    </Button>
                  </Col>
                  <Col xs="auto" style={{ textAlign: "right", padding: "4px" }}>
                    <Button variant="danger" onClick={clearFinalScore}>
                      Clear Table
                    </Button>
                  </Col>
                </Row>
              </Container>
            )}
          </>
        )}
      </Modal.Body>
      {(import.meta.env.MODE !== "production" || ["Read", "Restore"].includes(task)) && (
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

  const eventsQuery = tokens ? useQuery(fetchEventsApiOptions()) : useQuery(fetchEventsOptions());

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
