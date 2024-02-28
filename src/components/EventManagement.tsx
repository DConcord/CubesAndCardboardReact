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

import { usePasswordless } from "amazon-cognito-passwordless-auth/react";

import { GameKnightEvent, player_pool, formatIsoDate } from "./Events";
import TShoot from "./TShoot";

interface DeleteEventModalProps {
  close: () => void;
  refreshEvents: () => void;
  gameKnightEvent: GameKnightEvent;
}
export function DeleteEventModal({
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
export function ManageEventModal({
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
