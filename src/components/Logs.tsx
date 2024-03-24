import { useState, useEffect, lazy, Suspense } from "react";
import { usePasswordless } from "amazon-cognito-passwordless-auth/react";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import Tab from "react-bootstrap/Tab";
import Table from "react-bootstrap/Table";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Nav from "react-bootstrap/Nav";
import Container from "react-bootstrap/Container";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import FloatingLabel from "react-bootstrap/FloatingLabel";

import yaml from "js-yaml";

// import { ManageEventModal } from "./EventManagement";
const ManageEventModal = lazy(() =>
  import("./EventManagement").then((module) => ({ default: module.ManageEventModal }))
);
import { ManagedEventTask } from "../types/Events";
import { GameKnightEvent, formatIsoDate } from "./Events";
import { fetchPlayersOptions } from "./Queries";

type IntervalType = "Minutes" | "Hours" | "Days" | "Weeks";
const timeInterval: { [key in IntervalType]: number } = {
  Minutes: 60 * 1000,
  Hours: 60 * 60 * 1000,
  Days: 24 * 60 * 60 * 1000,
  Weeks: 7 * 24 * 60 * 60 * 1000,
};
const timeIntervalShort: { [key in IntervalType]: string } = {
  Minutes: "m",
  Hours: "h",
  Days: "d",
  Weeks: "w",
};
export default function Logs() {
  const { signInStatus, tokensParsed, tokens } = usePasswordless();

  const playersQuery = useQuery(fetchPlayersOptions());
  const queryClient = useQueryClient();

  const [eventLog, setEventLog] = useState<EventLogType[]>([]);
  const [rsvpLog, setRsvpLog] = useState<RsvpLogType[]>([]);
  const [playerLog, setPlayerLog] = useState<LogType[]>([]);

  const [customTimeRange, setCustomTimeRange] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [startInterval, setStartInterval] = useState(1);
  const [startIntervalType, setStartIntervalType] = useState<IntervalType>("Hours");
  const [startTime, setStartTime] = useState<string>(String(Date.now() - 60 * 60 * 1000).slice(0, 10)); // 1hr ago
  const [endTime, setEndTime] = useState<string | null>(null);
  useEffect(() => {
    setStartTime(String(Date.now() - timeInterval[startIntervalType] * startInterval).slice(0, 10));
    setEndTime(null);
    console.log({
      startInterval: startInterval,
      startIntervalType: startIntervalType,
      startTime: startTime,
      endTime: endTime,
    });
  }, [startInterval, startIntervalType]);
  const logsQuery = useQuery({
    queryKey: ["logs"],
    queryFn: async (): Promise<[]> => {
      const response = await axios.get(`https://${import.meta.env.VITE_API_URL}/api/activitylogs`, {
        headers: { Authorization: "Bearer " + tokens!.idToken },
        params: {
          startTime: startTime,
          endTime: endTime,
        },
      });
      let _eventLog = [];
      let _rsvpLog = [];
      let _playerLog = [];
      for (const log of response.data.results) {
        if (log.log_type === "event") {
          _eventLog.push(log);
        } else if (log.log_type === "rsvp") {
          _rsvpLog.push(log);
        } else if (log.log_type === "player") {
          _playerLog.push(log);
        }
      }
      setEventLog(_eventLog);
      setRsvpLog(_rsvpLog);
      setPlayerLog(_playerLog);
      return response.data.results;
    },
    staleTime: Infinity,
    refetchInterval: false, // No auto-refetch
  });

  useEffect(() => {
    if (logsQuery.isSuccess) {
      let _eventLog: EventLogType[] = [];
      let _rsvpLog: RsvpLogType[] = [];
      let _playerLog: LogType[] = [];
      logsQuery.data.map((log: LogType) => {
        if (log.log_type === "event") {
          _eventLog.push(log);
        } else if (log.log_type === "rsvp") {
          _rsvpLog.push(log);
        } else if (log.log_type === "player") {
          _playerLog.push(log);
        }
      });
      setEventLog(_eventLog);
      setRsvpLog(_rsvpLog);
      setPlayerLog(_playerLog);
    }
  }, []);
  const handleShowTimeModal = () => {
    setShowTimeModal(true);
  };
  const handleCloseTimeModal = () => {
    setShowTimeModal(false);
  };
  const handleInput = (e: React.BaseSyntheticEvent) => {
    if (e.target.id == "startInterval") {
      setCustomTimeRange(false);
      if (e.target.value == "") {
        setStartInterval(0);
      } else {
        setStartInterval(parseInt(e.target.value));
      }
    } else if (e.target.id == "startTime") {
      setCustomTimeRange(true);
      if (e.target.value == "") {
        setStartTime("");
      } else {
        setStartTime(String(Date.parse(new Date(e.target.value).toString())).slice(0, 10));
      }
    } else if (e.target.id == "endTime") {
      setCustomTimeRange(true);
      if (e.target.value == "") {
        setEndTime(null);
      } else {
        setEndTime(String(Date.parse(new Date(e.target.value).toString())).slice(0, 10));
      }
    }
  };
  // useEffect(() => {
  //   console.log({ customTimeRange: customTimeRange, startTime: startTime, endTime: endTime });
  // }, [startTime, endTime]);

  return (
    <div className="margin-top-58 bg-body-tertiary">
      <Modal show={showTimeModal} onHide={handleCloseTimeModal}>
        <Tab.Container defaultActiveKey={customTimeRange ? "absolute" : "relative"} id="timeSelection">
          <Modal.Body>
            <Container fluid>
              <Nav variant="tabs" className="me-auto">
                <Nav.Link eventKey="relative">Relative</Nav.Link>
                <Nav.Link eventKey="absolute">Absolute</Nav.Link>
              </Nav>
            </Container>
            <br />
            <Tab.Content>
              <Tab.Pane eventKey="relative" title="Relative">
                <Row>
                  <div>Retrieve logs from the past:</div>
                </Row>
                <InputGroup className="mb-3">
                  <Form.Control
                    type="number"
                    id="startInterval"
                    defaultValue={startInterval}
                    onChange={handleInput}
                    // onChange={(e: React.BaseSyntheticEvent) => {
                    //   e.target.value == "" ? setStartInterval(0) : setStartInterval(parseInt(e.target.value));
                    // }}
                    aria-label="Text input with dropdown button"
                    placeholder="Duration"
                  />
                  <DropdownButton
                    variant="outline-secondary"
                    title={startIntervalType}
                    id="startIntervalType"
                    align="end"
                  >
                    {Object.keys(timeInterval).map((intervalType, index) => (
                      <Dropdown.Item
                        key={index}
                        onClick={() => {
                          setStartIntervalType(intervalType as IntervalType);
                          setCustomTimeRange(false);
                        }}
                        // onClick={handleInput}
                      >
                        {intervalType}
                      </Dropdown.Item>
                    ))}
                  </DropdownButton>
                </InputGroup>
              </Tab.Pane>
              <Tab.Pane eventKey="absolute" title="Absolute">
                <FloatingLabel controlId="startTime" label="Start Time" className="mb-1">
                  <Form.Control
                    aria-label="Select a date and time"
                    type="datetime-local"
                    onChange={handleInput}
                    value={new Date(new Date(0).setUTCSeconds(parseInt(startTime)))
                      .toLocaleString("lt")
                      .replace(" ", "T")
                      .slice(0, 16)}
                    // value={new Date().setUTCSeconds(parseInt(startTime)).toLocaleString("lt").replace(" ", "T")}
                    isInvalid={!startTime}
                  />
                </FloatingLabel>
                <FloatingLabel controlId="endTime" label="End Time" className="mb-1">
                  <Form.Control
                    aria-label="Select a date and time"
                    type="datetime-local"
                    onChange={handleInput}
                    value={
                      endTime
                        ? new Date(new Date(0).setUTCSeconds(parseInt(endTime)))
                            .toLocaleString("lt")
                            .replace(" ", "T")
                            .slice(0, 16)
                        : ""
                    }
                  />
                </FloatingLabel>
              </Tab.Pane>
            </Tab.Content>
          </Modal.Body>
        </Tab.Container>
        <Modal.Footer>
          <Button variant="primary" onClick={handleCloseTimeModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      <Tab.Container defaultActiveKey="rsvp" id="logs-tabs">
        <div
          className="bg-body-tertiary "
          style={{ position: "sticky", top: "58px", minHeight: "42px", maxHeight: "42px", overflow: "auto" }}
        >
          <Container fluid>
            <Row>
              <Col>
                <Nav variant="underline" className="me-auto">
                  <Nav.Link eventKey="rsvp">RSVPs</Nav.Link>
                  <Nav.Link eventKey="event">Events</Nav.Link>
                  {import.meta.env.MODE === "production" && <Nav.Link eventKey="player">Players</Nav.Link>}
                </Nav>
              </Col>
              <Col xs="auto" style={{ textAlign: "right", padding: "4px" }}>
                <Button
                  disabled={logsQuery.isFetching || logsQuery.isLoading}
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ["logs"] });
                    // logsQuery.refetch;
                  }}
                  size="sm"
                >
                  {(logsQuery.isFetching || logsQuery.isLoading) && (
                    <span className="spinner-grow spinner-grow-sm text-light" role="status"></span>
                  )}
                  Run
                </Button>
              </Col>
              <Col xs="auto" style={{ textAlign: "right", padding: "4px", paddingRight: "10px" }}>
                <Button size="sm" variant="primary" onClick={handleShowTimeModal}>
                  {customTimeRange ? "Custom" : `${startInterval}${timeIntervalShort[startIntervalType]}`}
                </Button>
              </Col>
            </Row>
          </Container>
        </div>
        <Tab.Content>
          <Tab.Pane eventKey="rsvp" title="RSVPs">
            {logsQuery.isLoading ? "Loading..." : null}
            {logsQuery.isError ? "Error Loading RSVP Logs!" : null}
            {logsQuery.isSuccess && <RsvpLog rsvpLog={rsvpLog} />}
          </Tab.Pane>
          <Tab.Pane eventKey="event" title="Events">
            {logsQuery.isLoading ? "Loading..." : null}
            {logsQuery.isError ? "Error Loading Event Logs!" : null}
            {logsQuery.isSuccess && <EventLog eventLog={eventLog} />}
          </Tab.Pane>
          <Tab.Pane eventKey="player" title="Players">
            {logsQuery.isLoading ? "Loading..." : null}
            {logsQuery.isError ? "Error Loading Event Logs!" : null}
            {logsQuery.isSuccess && <PlayerLog playerLog={playerLog} />}
            {/* {logsQuery.isSuccess && <pre>{JSON.stringify(playerLog, null, 2)}</pre>} */}
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
    </div>
  );
}

type LogType = {
  "@timestamp": string;
  log_type: "event" | "rsvp" | "player";
  date: string;
  action: "create" | "update" | "delete" | "modify" | "add";
  auth_sub: string;
  auth_type: "admin" | "self" | "host";
  previous: Object;
  new: Object;
  event_id: string;
  user_id: string;
  rsvp: "attending" | "not_attending";
  attrib: string;
};
type RsvpLogType = Omit<LogType, "previous" | "new" | "attrib">;
type EventLogType = Omit<LogType, "event_id" | "user_id" | "rsvp" | "attrib">;
type PlayerLogType = Omit<LogType, "date" | "previous" | "new" | "event_id" | "rsvp">;

function EventLog({ eventLog }: { eventLog: EventLogType[] }) {
  const playersQuery = useQuery(fetchPlayersOptions());
  const playersDict = playersQuery?.data?.Users ?? {};
  const players = playersQuery?.data?.Groups?.player ?? [];
  const organizers = playersQuery?.data?.Groups?.organizer ?? [];
  const hosts = playersQuery?.data?.Groups?.host ?? [];

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
  if (eventLog.length === 0) {
    return <p>No logs to display</p>;
  } else {
    return (
      <>
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
        <Table striped bordered hover>
          <thead>
            <tr style={{ position: "sticky", top: "99px" }}>
              <th>Log Time</th>
              <th>Event Date</th>
              <th>Made By</th>
              <th>Action</th>
              <th>Previous Values</th>
              <th>New Values</th>
            </tr>
          </thead>
          <tbody>
            {eventLog.map((log, index) => {
              const listKeysToNormalize = ["attending", "not_attending"];
              const stringKeysToNormalize = ["host", "organizer"];
              const actionTypesToConvert = ["update", "modify"];
              const event_prev =
                log.previous && actionTypesToConvert.includes(log.action)
                  ? Object.fromEntries(
                      Object.entries(log.previous).map(([key, value]) => {
                        if (listKeysToNormalize.includes(key)) {
                          return [key, value.map((user_id: string) => playersDict[user_id].attrib.given_name)];
                        } else if (stringKeysToNormalize.includes(key)) {
                          return [key, playersDict[value].attrib.given_name];
                        } else {
                          return [key, value];
                        }
                      })
                    )
                  : log.previous;
              const event_new =
                log.new && actionTypesToConvert.includes(log.action)
                  ? Object.fromEntries(
                      Object.entries(log.new).map(([key, value]) => {
                        if (listKeysToNormalize.includes(key)) {
                          return [key, value.map((user_id: string) => playersDict[user_id].attrib.given_name)];
                        } else if (stringKeysToNormalize.includes(key)) {
                          return [key, playersDict[value].attrib.given_name];
                        } else {
                          return [key, value];
                        }
                      })
                    )
                  : log.new;

              return (
                <tr key={index}>
                  <td>{new Date(log["@timestamp"] + " UTC").toLocaleString("lt", { timeZoneName: "short" })}</td>
                  <td>{formatIsoDate(log.date)}</td>
                  <td>{`${playersDict[log.auth_sub].attrib.given_name} (${log.auth_type})`}</td>
                  <td>{log.action}</td>
                  <td>
                    {log.previous && actionTypesToConvert.includes(log.action) ? (
                      <pre>{yaml.dump(event_prev, { indent: 2 })}</pre>
                    ) : log.action === "delete" ? (
                      <Button
                        size="sm"
                        variant="link"
                        onClick={() =>
                          handleShowManageEvent({ managedEvent: log.previous as GameKnightEvent, task: "Restore" })
                        }
                      >
                        Details
                      </Button>
                    ) : (
                      <></>
                    )}
                  </td>
                  <td>
                    {log.new && actionTypesToConvert.includes(log.action) ? (
                      <pre>{yaml.dump(event_new, { indent: 2 })}</pre>
                    ) : log.action === "create" ? (
                      <Button
                        size="sm"
                        variant="link"
                        onClick={() =>
                          handleShowManageEvent({ managedEvent: log.new as GameKnightEvent, task: "Read" })
                        }
                      >
                        Details
                      </Button>
                    ) : (
                      <></>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </>
    );
  }
}

function RsvpLog({ rsvpLog }: { rsvpLog: RsvpLogType[] }) {
  const playersQuery = useQuery(fetchPlayersOptions());
  const playersDict = playersQuery?.data?.Users ?? {};
  const rsvp_change = {
    attending: "not_attending",
    not_attending: "attending",
  };

  if (rsvpLog.length === 0) {
    return <p>No logs to display</p>;
  } else {
    return (
      // <div className="tableFixHead">
      <Table striped bordered hover>
        <thead>
          <tr style={{ position: "sticky", top: "99px" }}>
            <th>Log Time</th>
            <th>Event Date</th>
            <th>Made By</th>
            <th>Action</th>
            <th>Player</th>
            <th>Previous RSVP</th>
            <th>New RSVP</th>
          </tr>
        </thead>
        <tbody>
          {rsvpLog.map((log, index) => (
            <tr key={index}>
              <td>{new Date(log["@timestamp"] + " UTC").toLocaleString("lt", { timeZoneName: "short" })}</td>
              <td>{formatIsoDate(log.date)}</td>
              <td>{`${playersDict[log.auth_sub].attrib.given_name} (${log.auth_type})`}</td>
              <td>{log.action}</td>
              <td>{playersDict[log.user_id].attrib.given_name}</td>
              <td>{log.action == "delete" ? log.rsvp : log.action == "update" && rsvp_change[log.rsvp]}</td>
              <td>{["update", "add"].includes(log.action) && log.rsvp}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      // </div>
    );
  }
}

function PlayerLog({ playerLog }: { playerLog: PlayerLogType[] }) {
  const playersQuery = useQuery(fetchPlayersOptions());
  const playersDict = playersQuery?.data?.Users ?? {};
  const player_change = {
    attending: "not_attending",
    not_attending: "attending",
  };

  if (playerLog.length === 0) {
    return <p>No logs to display</p>;
  } else {
    return (
      // <div className="tableFixHead">
      <Table striped bordered hover>
        <thead>
          <tr style={{ position: "sticky", top: "99px" }}>
            <th>Log Time</th>
            <th>Made By</th>
            <th>Action</th>
            <th>Player</th>
            <th>Modified Attributes</th>
          </tr>
        </thead>
        <tbody>
          {playerLog.map((log, index) => (
            <tr key={index}>
              <td>{new Date(log["@timestamp"] + " UTC").toLocaleString("lt", { timeZoneName: "short" })}</td>
              <td>{`${playersDict[log.auth_sub].attrib.given_name} (${log.auth_type})`}</td>
              <td>{log.action}</td>
              <td>{playersDict[log.user_id].attrib.given_name}</td>
              <td>{log.attrib.replace("groups,", "groups:")}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      // </div>
    );
  }
}
