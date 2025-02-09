import { useState } from "react";

import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import Table from "react-bootstrap/Table";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, fetchEventsApi } from "./Queries";

import { formatIsoDate } from "../utilities";
import { ExistingGameKnightEvent } from "../types/Events";
import { PlayersGroups, PlayersDict } from "../types/Players";

import { queryOptions } from "@tanstack/react-query";
import { AxiosError } from "axios";

///// Events /////
export function fetchProdEventsApiOptions(refetchInterval = 1000 * 60 * 10) {
  return queryOptions({
    queryKey: ["prod_events"],
    queryFn: () => fetchEventsApi({ tableType: "prod" }),
    refetchInterval: refetchInterval,
  });
}

interface TransferProdEventsModalProps {
  close: () => void;
}
export default function TransferProdEventsModal({ close }: TransferProdEventsModalProps) {
  const [showEventId, setShowEventId] = useState(false);
  const toggleShowEventId = () => setShowEventId(!showEventId);

  const prodEventsQuery = useQuery(fetchProdEventsApiOptions());
  const prodEventDict = prodEventsQuery?.data
    ? Object.fromEntries(prodEventsQuery?.data?.map((event) => [event.event_id, event]))
    : {};

  const devEventsQuery = useQuery({
    queryKey: ["events", "all"],
    queryFn: () => fetchEventsApi({ dateGte: "all" }),
    staleTime: 1000 * 60 * 60 * 6, // stale after 6 h
    refetchInterval: 1000 * 60 * 60 * 6,
  });
  const devEventDict = devEventsQuery?.data
    ? Object.fromEntries(devEventsQuery?.data?.map((event) => [event.event_id, event]))
    : {};

  const queryClient = useQueryClient();
  const playersQuery: PlayersGroups | undefined = queryClient.getQueryData(["players"]);
  const playersDict = playersQuery?.Users ?? {};
  const playersPrevSubDict: { [key: string]: string } =
    playersQuery &&
    Object.fromEntries(
      Object.entries(playersQuery.Users)
        .filter(([player_id, info]) => info.attrib["custom:prev_sub"])
        .map(([player_id, info]) => [info.attrib["custom:prev_sub"], player_id])
    );

  const [updatePlayerSub, setUpdatePlayerSub] = useState(
    playersPrevSubDict && Object.keys(playersPrevSubDict).length > 0 ? true : false
  );

  // Handle Transfer Event Checkboxes
  const [selectedTransferOptions, setSelectedTransferOptions] = useState<string[]>([]);
  const handleOptionChange = (event: React.BaseSyntheticEvent) => {
    const event_id = event.target.value;
    const isChecked = event.target.checked;

    if (isChecked) {
      setSelectedTransferOptions([...selectedTransferOptions, event_id]);
    } else {
      setSelectedTransferOptions(selectedTransferOptions.filter((id) => id !== event_id));
    }
  };

  interface IResults {
    [key: string]: { status: string; message: string; event_id: string };
  }
  const [waiting, setWaiting] = useState(false);
  const [results, setResults] = useState<IResults>({});
  const transferEventMutation = useMutation({
    mutationFn: async ({ method, body }: { method: "POST" | "PUT"; body: ExistingGameKnightEvent }) => {
      // return apiClient({ url: "event", method: method, data: { body: body } });
      try {
        const response = await apiClient({ url: "event", method: method, data: body });
        return { status: "success", message: response.statusText, event_id: body.event_id };
      } catch (err) {
        if (err instanceof AxiosError) {
          return { status: "failed", message: err.message, event_id: body.event_id };
        }
        return { status: "failed", message: "unknown", event_id: body.event_id };
      }
    },
  });
  // interface ExistingGameKnightEventX extends ExistingGameKnightEvent {
  //   [key: string]: any; // Index signature
  // }
  // <T extends object, U extends keyof T>
  function updatePrevSubEvents<T extends ExistingGameKnightEvent>(
    event: T,
    playersDict: PlayersDict,
    playersPrevSubDict: { [key: string]: string }
  ) {
    // const skipKeys: (keyof ExistingGameKnightEvent)[] = [
    const skipKeys = [
      "event_id",
      "event_type",
      "date",
      "format",
      "open_rsvp_eligibility",
      "game",
      "bgg_id",
      "total_spots",
      "tbd_pic",
      "migrated",
      "status",
    ];

    for (const [k, v] of Object.entries(event)) {
      if (skipKeys.includes(k)) continue;

      if (k === "finalScore") {
        for (const score of v) {
          if (score.player in playersPrevSubDict && !(score.player in playersDict)) {
            score.player = playersPrevSubDict[score.player];
          }
        }
      } else if (Array.isArray(v)) {
        const newSet = new Set(v);
        for (const playerId of newSet) {
          if (playerId in playersPrevSubDict && !(playerId in playersDict)) {
            newSet.delete(playerId);
            newSet.add(playersPrevSubDict[playerId]);
          }
        }
        (event[k as keyof T] as string[]) = Array.from(newSet);
      } else if (typeof v === "string") {
        if (v in playersPrevSubDict && !(v in playersDict)) {
          (event[k as keyof T] as string) = playersPrevSubDict[v];
        }
      } else {
        throw new Error(`Unhandled type ${typeof v} for ${k}: ${v}`);
      }
    }
    return event;
  }

  async function handleSubmit(event: React.BaseSyntheticEvent) {
    setWaiting(true);
    setResults({});
    event.preventDefault();

    const transferMutationsSettled = await Promise.allSettled(
      selectedTransferOptions.map((event_id) => {
        if (updatePlayerSub && Object.keys(playersPrevSubDict).length > 0) {
          prodEventDict[event_id] = updatePrevSubEvents(prodEventDict[event_id], playersDict, playersPrevSubDict);
        }
        const body: ExistingGameKnightEvent = { ...prodEventDict[event_id] };
        const method = event_id in devEventDict ? "PUT" : "POST";
        return transferEventMutation.mutateAsync({ method: method, body: body });
      })
    );
    // console.log(transferMutationsSettled);

    const isFulfilled = <T,>(p: PromiseSettledResult<T>): p is PromiseFulfilledResult<T> => p.status === "fulfilled";
    const isRejected = <T,>(p: PromiseSettledResult<T>): p is PromiseRejectedResult => p.status === "rejected";
    const fulfilledResults = transferMutationsSettled.filter(isFulfilled).map((p) => p.value);
    const _results = Object.fromEntries(fulfilledResults.map((result) => [result.event_id, result]));
    setResults(_results);
    setWaiting(false);

    const mutateSuccess = fulfilledResults.map((result) => result.status === "success");
    const mutateFailed = fulfilledResults.map((result) => result.status === "failed");
    console.log({ mutateSuccess: mutateSuccess.every(Boolean), mutateFailed: mutateFailed.every(Boolean) });
    if (!mutateFailed.every(Boolean)) queryClient.refetchQueries({ queryKey: ["events"] });
    if (mutateSuccess.every(Boolean)) close();
  }

  if (prodEventsQuery.isLoading) return <Modal.Body>Loading Prod Events</Modal.Body>;
  if (prodEventsQuery.isError) return <Modal.Body>Error Loading Prod Events</Modal.Body>;
  if (devEventsQuery.isLoading) return <Modal.Body>Loading {import.meta.env.VITE_ENV_TITLE} Events</Modal.Body>;
  if (devEventsQuery.isError) return <Modal.Body>Error Loading {import.meta.env.VITE_ENV_TITLE} Events</Modal.Body>;
  if (prodEventsQuery.isSuccess && devEventsQuery.isSuccess) {
    return (
      <Form onSubmit={handleSubmit}>
        <Modal.Header className="text-center">
          Transfer selected events to the {import.meta.env.VITE_ENV_TITLE} DB:
        </Modal.Header>
        <Modal.Body className="text-center">
          <Row xs={1} style={{ justifyContent: "right", padding: 4 }}>
            <Col
              className="middle"
              xs="auto"
              style={{
                textAlign: "right",
                padding: ".5rem",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Form.Check
                type="checkbox"
                id={`option_updatePlayerSub`}
                checked={updatePlayerSub}
                onChange={() => setUpdatePlayerSub(!updatePlayerSub)}
                label={"Foreign Player ID"}
              />
            </Col>
            <Col xs="auto" style={{ textAlign: "right", padding: ".5rem" }}>
              <Button size="sm" variant="secondary" onClick={toggleShowEventId}>
                {showEventId ? "Hide Event ID" : "Show Event ID"}
              </Button>
            </Col>
            <Col>
              <Table responsive striped hover>
                <thead>
                  <tr>
                    <th></th>
                    <th>Date</th>
                    <th>Game</th>
                    <th>Format</th>
                    <th>Existing</th>
                    {Object.keys(results).length > 0 && <th>Result</th>}
                    {showEventId && <th>Event ID</th>}
                  </tr>
                </thead>
                <tbody>
                  {prodEventsQuery.data.map((event: ExistingGameKnightEvent, index: number) => (
                    <tr key={event.event_id}>
                      <td>
                        <Form.Check
                          key={index}
                          type="checkbox"
                          id={`option_${index}`}
                          // label={`${formatIsoDate(event.date)} (${event.event_id})`}
                          checked={selectedTransferOptions.includes(event.event_id)}
                          onChange={handleOptionChange}
                          value={event.event_id}
                        />
                      </td>
                      <td>{formatIsoDate(event.date)}</td>
                      <td>{event.game}</td>
                      <td>{event.format}</td>
                      <td>{JSON.stringify(!!devEventDict[event.event_id])}</td>
                      {Object.keys(results).length > 0 && (
                        <td>{!!results[event.event_id] ? results[event.event_id].status : undefined}</td>
                      )}
                      {showEventId && <td>{event.event_id}</td>}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Row xs={1} style={{ justifyContent: "right", padding: 4 }}>
            {/* {Object.keys(results).length > 0 && (
              <Col style={{ textAlign: "right", padding: 4 }}>
                <span>{JSON.stringify(results)}</span>
              </Col>
            )} */}
            <Col style={{ textAlign: "right", padding: 4 }}>
              <pre>{JSON.stringify(selectedTransferOptions, null, 2)}</pre>
            </Col>
            <Col style={{ textAlign: "right", padding: 4 }}>
              <Row style={{ justifyContent: "right" }}>
                <Col xs="auto" style={{ textAlign: "right", padding: 4 }}>
                  <Button variant="danger" type="submit" disabled={waiting}>
                    {waiting && <span className="spinner-grow spinner-grow-sm text-light" role="status"></span>}
                    Transfer
                  </Button>
                </Col>
                <Col xs="auto" style={{ textAlign: "right", padding: 4 }}>
                  <Button variant="secondary" onClick={close} disabled={waiting}>
                    Cancel
                  </Button>
                </Col>
              </Row>
            </Col>
          </Row>
        </Modal.Footer>
      </Form>
    );
  }
  return (
    <div>
      <p>Loading Prod Events...</p>
    </div>
  );
}
