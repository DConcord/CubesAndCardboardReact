import { useState, useEffect } from "react";

import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Spinner from "react-bootstrap/Spinner";
import Table from "react-bootstrap/Table";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import InputGroup from "react-bootstrap/InputGroup";
import ListGroup from "react-bootstrap/ListGroup";
import Image from "react-bootstrap/Image";

import Icon from "@mdi/react";
import { mdiMagnify, mdiClose } from "@mdi/js";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, fetchGameTutorialsOptions, fetchGameSearchOptions, fetchBggThumbnailOptions } from "./Queries";
import Authenticated from "../utilities/Authenticated";

import { GameSearch } from "../types/Events";
import { GameTutorial, GameTutorialTable, GameTutorialTask } from "../types/GameTutorials";

export default function GameTutorialsPage() {
  const gameTutorialsQuery = useQuery(fetchGameTutorialsOptions());

  const [managedGameTutorial, setManagedGameTutorial] = useState<GameTutorial>();
  const [managedGameTutorialTask, setManagedGameTutorialTask] = useState<GameTutorialTask>("Create");
  const [showManageGameTutorial, setShowManageGameTutorial] = useState(false);
  const handleCloseManageGameTutorial = () => setShowManageGameTutorial(false);
  type ShowManageGameTutorialProps =
    | {
        task: "Create";
      }
    | {
        managedGameTutorial: GameTutorial;
        task: "Modify";
      }
    | {
        managedGameTutorial: GameTutorial;
        task: "Delete";
      };
  const handleShowManageGameTutorial = (props: ShowManageGameTutorialProps) => {
    const { task } = props;
    if (task === "Modify" || task === "Delete") {
      const { managedGameTutorial } = props;
      setManagedGameTutorial(managedGameTutorial);
    }
    setManagedGameTutorialTask(task);
    setShowManageGameTutorial(true);
  };

  if (gameTutorialsQuery.isSuccess) {
    const tableData: GameTutorialTable = Object.entries(gameTutorialsQuery.data)
      .map(([bgg_id, tutorial_info]) => tutorial_info)
      .sort(function (a, b) {
        if (a.bgg_id < b.bgg_id) return -1;
        if (a.bgg_id > b.bgg_id) return 1;
        return 0;
      });

    return (
      <div className="margin-top-65">
        <Container fluid>
          <Row xs={1} sm={2} className="align-items-center">
            <Col xs="auto">
              <h2>Game Tutorials</h2>
              {/* <h2>{import.meta.env.VITE_PLAYERS_TITLE}</h2> */}
            </Col>
            <Authenticated group={["admin"]}>
              <Col>
                <Row style={{ justifyContent: "right" }}>
                  <Col xs="auto" style={{ textAlign: "right" }}>
                    <Button
                      size="sm"
                      id="NewTutorial"
                      variant="primary"
                      onClick={() => handleShowManageGameTutorial({ task: "Create" })}
                    >
                      New Game Tutorial
                    </Button>
                  </Col>
                </Row>
              </Col>
            </Authenticated>
          </Row>
        </Container>
        <Table responsive striped hover>
          <thead>
            <tr>
              <th></th>
              <th>Game</th>
              <th>BGG ID</th>
              <th>URL</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, index) => (
              <tr key={index}>
                <td>
                  <Button
                    size="sm"
                    variant="secondary"
                    style={{ marginRight: "5px" }}
                    onClick={() => handleShowManageGameTutorial({ task: "Modify", managedGameTutorial: row })}
                    // disabled={!["production", "test", "sandbox"].includes(import.meta.env.MODE)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleShowManageGameTutorial({ task: "Delete", managedGameTutorial: row })}
                    // disabled={!["production", "test", "sandbox"].includes(import.meta.env.MODE)}
                  >
                    <Icon path={mdiClose} size={0.85} />
                  </Button>
                </td>
                <td>{row.game}</td>
                <td>{row.bgg_id}</td>
                <td>{row.url}</td>
              </tr>
            ))}
          </tbody>
        </Table>

        <Modal show={showManageGameTutorial} onHide={handleCloseManageGameTutorial} backdrop="static" keyboard={false}>
          {managedGameTutorialTask == "Create" ? (
            <ManageGameTutorialModal close={handleCloseManageGameTutorial} task={managedGameTutorialTask} />
          ) : (
            (managedGameTutorialTask == "Modify" || managedGameTutorialTask == "Delete") && (
              <ManageGameTutorialModal
                close={handleCloseManageGameTutorial}
                task={managedGameTutorialTask}
                gameTutorial={managedGameTutorial}
              />
            )
          )}
        </Modal>
      </div>
    );
  } else {
    return (
      <div className="margin-top-65">
        <Container fluid>
          <Row>
            <Col xs="auto">
              <h2>Game Tutorials</h2>
            </Col>
            <Col style={{ textAlign: "right" }}>
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </Col>
            <Col>
              <h2>Loading...</h2>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }
}

interface ManageEventModalProps {
  close: () => void;
  task: GameTutorialTask;
  gameTutorial?: GameTutorial | null;
}
export function ManageGameTutorialModal({ close, task, gameTutorial }: ManageEventModalProps) {
  // const { tokens, signInStatus, tokensParsed } = usePasswordless();
  const gameTutorialsQuery = useQuery(fetchGameTutorialsOptions());
  const queryClient = useQueryClient();

  const [tutorialForm, setTutorialForm] = useState<GameTutorial>(
    gameTutorial
      ? gameTutorial
      : {
          bgg_id: 0,
          game: "",
          url: "",
        }
  );
  const [isValid, setIsValid] = useState(() => {
    if (task == "Create") {
      return validateTutorialForm();
    }
  });
  function validateTutorialForm() {
    return (
      !(task == "Create" && gameTutorialsQuery.data && tutorialForm.bgg_id in gameTutorialsQuery.data) &&
      tutorialForm.game !== "" &&
      tutorialForm.game !== undefined &&
      tutorialForm.bgg_id !== 0 &&
      tutorialForm.bgg_id !== undefined &&
      tutorialForm.url.startsWith("https://")
    );
  }

  const [errorMsg, setErrorMsg] = useState("");
  const deleteGameTutorialMutation = useMutation({
    mutationFn: async (bgg_id: number) => {
      const response = await apiClient.delete("gametutorial", {
        params: { bgg_id: bgg_id },
      });

      // console.log({ deleteGameTutorialMutation_response: response.data });
      queryClient.setQueryData(["gametutorials"], response.data);
    },
    onSuccess: async (data) => {
      close();
    },
    onError: (error) => {
      console.error(error);
      setErrorMsg(`Delete Tutorial entry failed`);
    },
  });
  const manageGameTutorialMutation = useMutation({
    mutationFn: async ({ body }: { body: GameTutorial }) => {
      const response = await apiClient.put("gametutorial", body);

      // console.log({ manageGameTutorialMutation_response: response.data });
      queryClient.setQueryData(["gametutorials"], response.data);
    },
    onSuccess: async (data) => {
      close();
    },
    onError: (error) => {
      setErrorMsg(`${task} Tutorial entry failed`);
      console.error(error);
    },
  });

  const [deleteNotConfirmed, setDeleteNotConfirmed] = useState(true);

  useEffect(() => {
    setIsValid(validateTutorialForm());
  }, [tutorialForm]);
  const handleInput = (e: React.BaseSyntheticEvent) => {
    if (e.target.id === "delete_tutorial" && e.target.value == "DELETE") {
      setDeleteNotConfirmed(false);
    } else if (e.target.id == "bgg_id") {
      console.log(e.target.id, e.target.value, e.target.value === "");
      if (e.target.value === "") {
        setTutorialForm({ ...tutorialForm, [e.target.id]: undefined });
      } else {
        setTutorialForm({ ...tutorialForm, [e.target.id]: parseInt(e.target.value) });
      }
    } else if (e.target.id == "url") {
      setTutorialForm({ ...tutorialForm, [e.target.id]: e.target.value.toLowerCase() });
    } else {
      setTutorialForm({ ...tutorialForm, [e.target.id]: e.target.value });
    }
  };

  const [showBggSearch, setShowBggSearch] = useState(false);
  const [bggSearchResults, setBggSearchResults] = useState<GameSearch[]>([]);
  const [bggSearchError, setBggSearchError] = useState("");
  const handleSearchBgg = async () => {
    setBggSearchResults([]);
    setBggSearchError("");
    setShowBggSearch(true);

    try {
      const data = await queryClient.fetchQuery(fetchGameSearchOptions(tutorialForm.game.toLowerCase()));
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

  function assignBggId(event: React.BaseSyntheticEvent, bgg_id: number, game: string) {
    event.preventDefault();
    setTutorialForm({ ...tutorialForm, bgg_id: bgg_id, game: game });
  }

  function handleSubmit(event: React.BaseSyntheticEvent) {
    event.preventDefault();
    if (task == "Delete") {
      deleteGameTutorialMutation.mutate(tutorialForm!.bgg_id);
    } else {
      console.log(tutorialForm);
      manageGameTutorialMutation.mutate({ body: tutorialForm });
    }
  }

  if (task == "Delete") {
    return (
      <Form onSubmit={handleSubmit}>
        <Modal.Header className="text-center">
          Are you sure you want to delete the entry for {gameTutorial!.game} ({gameTutorial!.bgg_id})?
        </Modal.Header>
        <Modal.Body className="text-center">
          Type DELETE to permanently delete entry
          <Form.Control
            type="textarea"
            id="delete_tutorial"
            aria-describedby="delete_tutorial"
            onChange={handleInput}
          />
          <Button variant="danger" type="submit" disabled={deleteNotConfirmed || deleteGameTutorialMutation.isPending}>
            {deleteGameTutorialMutation.isPending && (
              <span className="spinner-grow spinner-grow-sm text-light" role="status"></span>
            )}
            Delete
          </Button>
          <Button variant="secondary" onClick={close} disabled={deleteGameTutorialMutation.isPending}>
            Cancel
          </Button>
        </Modal.Body>
      </Form>
    );
  }
  if (gameTutorialsQuery.isSuccess) {
    return (
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="text-center">
          <Row style={{ padding: 2 }}>
            <Col med="true" style={{ minWidth: "13rem", padding: 4 }}>
              <InputGroup>
                <FloatingLabel controlId="game" label="Game">
                  <Form.Control
                    as="textarea"
                    onChange={handleInput}
                    value={tutorialForm.game}
                    disabled={["Read", "Restore"].includes(task)}
                    isInvalid={tutorialForm.game === "" || tutorialForm.game == undefined}
                  />
                </FloatingLabel>
                {task == "Create" && (
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
                  disabled={task == "Modify"}
                  onChange={handleInput}
                  value={tutorialForm.bgg_id ?? ""}
                  isInvalid={
                    tutorialForm.bgg_id == 0 ||
                    tutorialForm.bgg_id == undefined ||
                    (task == "Create" && tutorialForm.bgg_id in gameTutorialsQuery.data)
                  }
                />
              </FloatingLabel>
            </Col>
            {task == "Create" && tutorialForm.bgg_id in gameTutorialsQuery.data && (
              <div className="text-end" style={{ color: "red" }}>
                Tutorial already exists for BGG ID {tutorialForm.bgg_id}
              </div>
            )}
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
                      return (
                        <ListGroup.Item
                          action
                          onClickCapture={(event: React.BaseSyntheticEvent) => {
                            assignBggId(event, parseInt(result.id ?? 0), result.name ?? "");
                          }}
                          key={index}
                        >
                          <Row>
                            <Col style={{ textAlign: "left" }}>{`${result.name} (${result.yearpublished})`}</Col>
                            <Col xs="auto" style={{ textAlign: "right" }}>{`${result.id}`}</Col>
                            <Col xs="auto">
                              <Image
                                src={result.thumbnail}
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
            {/* <Row style={{ padding: 4 }}> */}
            <Col med="true" style={{ minWidth: "18rem", padding: 4 }}>
              <FloatingLabel controlId="url" label="Tutorial URL">
                <Form.Control
                  as="textarea"
                  onChange={handleInput}
                  value={tutorialForm.url}
                  isInvalid={
                    tutorialForm.url === "" || tutorialForm.url == undefined || !tutorialForm.url.startsWith("https://")
                  }
                />
              </FloatingLabel>

              {!(tutorialForm.url == "" || tutorialForm.url == undefined) &&
                !tutorialForm.url.startsWith("https://") && (
                  <div className="text-center" style={{ color: "red" }}>
                    URL must start with https://
                  </div>
                )}
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <span>{errorMsg}</span>
          <Button variant="primary" type="submit" disabled={manageGameTutorialMutation.isPending || !isValid}>
            {manageGameTutorialMutation.isPending && (
              <span className="spinner-grow spinner-grow-sm text-light" role="status"></span>
            )}
            {task == "Modify" ? "Update Tutorial" : "Create Tutorial"}
          </Button>
          <Button variant="secondary" onClick={close} disabled={manageGameTutorialMutation.isPending}>
            Cancel
          </Button>
        </Modal.Footer>
      </Form>
    );
  } else if (gameTutorialsQuery.isLoading) {
    return <div>Loading...</div>;
  } else {
    return <div>Error</div>;
  }
}
