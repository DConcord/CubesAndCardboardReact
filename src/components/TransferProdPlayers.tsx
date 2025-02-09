import { useEffect, useState } from "react";

import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import Table from "react-bootstrap/Table";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, fetchPlayersApi, fetchPlayersApiOptions } from "./Queries";
import { PlayerTable } from "../types/Players";

import { queryOptions } from "@tanstack/react-query";
import { AxiosError } from "axios";

///// Players /////
export function fetchProdPlayersApiOptions(refetchInterval = 1000 * 60 * 10) {
  return queryOptions({
    queryKey: ["prod_players"],
    queryFn: () => fetchPlayersApi({ refresh: "yes", user_pool: "prod" }),
    refetchInterval: refetchInterval,
  });
}

interface TransferProdPlayersModalProps {
  close: () => void;
}
export default function TransferProdPlayersModal({ close }: TransferProdPlayersModalProps) {
  const [transferError, setTransferError] = useState<string>("");

  const prodPlayersQuery = useQuery(fetchProdPlayersApiOptions());
  const prodPlayersDict = prodPlayersQuery?.data?.Users ?? {};

  const playersRefreshMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.get(`/players`, {
        params: { refresh: "yes" },
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["players"], data);
      queryClient.setQueryData(["players", "api"], data);
    },
  });
  const devPlayersQuery = useQuery(fetchPlayersApiOptions({ refresh: "no" }));
  // const devPlayersDict = devPlayersQuery?.data?.Users ?? {};

  const queryClient = useQueryClient();

  // Handle Transfer Player Checkboxes
  const [selectedTransferOptions, setSelectedTransferOptions] = useState<string[]>([]);
  useEffect(() => {
    if (prodPlayersQuery.isSuccess)
      setSelectedTransferOptions(Object.entries(prodPlayersDict).map(([player_id, player]) => player_id));
  }, [prodPlayersDict]);
  const handleOptionChange = (event: React.BaseSyntheticEvent) => {
    const player_id = event.target.value;
    const isChecked = event.target.checked;

    if (isChecked) {
      setSelectedTransferOptions([...selectedTransferOptions, player_id]);
    } else {
      setSelectedTransferOptions(selectedTransferOptions.filter((id) => id !== player_id));
    }
  };

  interface IResults {
    [key: string]: { status: string; message: string; player_id: string };
  }
  const [waiting, setWaiting] = useState(false);
  // const [results, setResults] = useState<IResults>({});
  const [results, setResults] = useState<string>();
  const transferPlayerMutation = useMutation({
    mutationFn: async ({ body }: { body: string[] }) => {
      // return apiClient({ url: "event", method: method, data: { body: body } });
      try {
        const response = await apiClient({ url: "players/import", method: "POST", data: body });
        // const response = await apiClient({ url: "event", method: "PUT", data: body });
        console.log(response);

        queryClient.setQueryData(["players"], response.data);
        queryClient.setQueryData(["players", "api"], response.data);
        return response.data;
      } catch (err) {
        if (err instanceof AxiosError) {
          console.error("AxiosError.message:", err.message);
          setTransferError(err.message);
        } else {
          console.error("Unknown Error:", err);
        }
        throw err;
      }
    },
    onError: (error, variables, context) => {
      console.error("I caught the error?", error);
      setWaiting(false);
    },
    onSuccess: (data, variables, context) => {
      setWaiting(false);
      close();
    },
  });

  // async function handleSubmit(event: React.BaseSyntheticEvent) {}
  async function handleSubmit(event: React.BaseSyntheticEvent) {
    setWaiting(true);
    setResults("");
    event.preventDefault();

    transferPlayerMutation.mutate({ body: selectedTransferOptions });
    // console.log(transferPlayerMutation.status, transferPlayerMutation.isSuccess, transferPlayerMutation.isError);
    // if (transferPlayerMutation.isIdle) await new Promise((resolve) => setTimeout(resolve, 100));
    // console.log(transferPlayerMutation.status, transferPlayerMutation.isSuccess, transferPlayerMutation.isError);
    // while (transferPlayerMutation.isPending) {
    //   await new Promise((resolve) => setTimeout(resolve, 100));
    // }
    // if (transferPlayerMutation.isSuccess) {
    //   playersRefreshMutation.mutate();
    //   setWaiting(false);
    //   close();
    // }
    // setWaiting(false);
  }

  if (prodPlayersQuery.isLoading) return <Modal.Body>Loading Prod Players</Modal.Body>;
  if (prodPlayersQuery.isError) return <Modal.Body>Error Loading Prod Players</Modal.Body>;
  if (devPlayersQuery.isLoading) return <Modal.Body>Loading Dev Players</Modal.Body>;
  if (devPlayersQuery.isError) return <Modal.Body>Error Loading Dev Players</Modal.Body>;
  if (prodPlayersQuery.isSuccess && devPlayersQuery.isSuccess) {
    const tableData: PlayerTable = Object.entries(prodPlayersDict)
      .map(([player_id, player]) => ({
        given_name: player.attrib.given_name,
        family_name: player.attrib.family_name,
        email: player.attrib.email,
        phone_number: player.attrib.phone_number,
        user_id: player_id,
        groups: player.groups,
      }))
      .sort(function (a, b) {
        if (a.given_name < b.given_name) return -1;
        if (a.given_name > b.given_name) return 1;
        return 0;
      });
    return (
      <>
        {transferError && (
          <Alert variant="danger" onClose={() => setTransferError("")} dismissible>
            <Alert.Heading>Transfer Players Failed</Alert.Heading>
            <p>{transferError}</p>
          </Alert>
        )}
        <Form onSubmit={handleSubmit}>
          <Modal.Header className="text-center">Transfer selected players to the Dev UserPool:</Modal.Header>
          <Modal.Body className="text-center">
            <Row xs={1} style={{ justifyContent: "right", padding: 4 }}>
              <Col xs="auto" style={{ textAlign: "right", padding: ".5rem" }}>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setSelectedTransferOptions(Object.entries(prodPlayersDict).map(([player_id, player]) => player_id))
                  }
                >
                  Select All
                </Button>
              </Col>
              <Col xs="auto" style={{ textAlign: "right", padding: ".5rem" }}>
                <Button size="sm" variant="secondary" onClick={() => setSelectedTransferOptions([])}>
                  Clear All
                </Button>
              </Col>
              <Col>
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th></th>
                      <th>First Name</th>
                      <th>Last Name</th>
                      <th>Groups</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((row, index) => (
                      <tr key={index}>
                        <td>
                          <Form.Check
                            key={index}
                            type="checkbox"
                            id={`option_${index}`}
                            // label={`${formatIsoDate(event.date)} (${event.event_id})`}
                            checked={selectedTransferOptions.includes(row.user_id)}
                            onChange={handleOptionChange}
                            value={row.user_id}
                          />
                        </td>
                        <td>{row.given_name}</td>
                        <td>{row.family_name}</td>
                        <td>{row.groups.join(", ")}</td>
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
                {results && <pre>{JSON.stringify(results)}</pre>}
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
          {transferError && (
            <Alert variant="danger" onClose={() => setTransferError("")} dismissible>
              <Alert.Heading>Transfer Players Failed</Alert.Heading>
              <p>{transferError}</p>
            </Alert>
          )}
        </Form>
      </>
    );
  }
  return (
    <div>
      <p>Loading Prod Players...</p>
    </div>
  );
}
