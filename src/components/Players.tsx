import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePasswordless } from "amazon-cognito-passwordless-auth/react";
import axios from "axios";

import Icon from "@mdi/react";
import { mdiRefresh, mdiClose, mdiCheck } from "@mdi/js";

import { verifyUserAttribute, getUserAttributeVerificationCode } from "amazon-cognito-passwordless-auth/cognito-api";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import Spinner from "react-bootstrap/Spinner";
import Modal from "react-bootstrap/Modal";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import Form from "react-bootstrap/Form";
import { FormControlProps } from "react-bootstrap/FormControl";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";

import { PatternFormat } from "react-number-format";

import Authenticated, { authenticated } from "./Authenticated";
import TShoot from "./TShoot";
import { fetchPlayersApiOptions } from "./Queries";
import ConditionalWrap from "./ConditionalWrap";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function PlayersAuth() {
  const { signInStatus, tokensParsed } = usePasswordless();
  const navigate = useNavigate();
  if (["REFRESHING_SIGN_IN", "SIGNING_IN", "CHECKING"].includes(signInStatus)) {
    return (
      <>
        <Container fluid>
          <Row>
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
      </>
    );
  } else if (authenticated({ signInStatus, tokensParsed, group: ["admin"] })) {
    navigate("/players");
  } else {
    navigate("/");
  }
  return <></>;
}

export default function Players() {
  const { tokens } = usePasswordless();
  // const playersQuery = useQuery(fetchPlayersApiOptions({ tokens: tokens!, refresh: "no" }));
  const playersQuery = useQuery({
    queryKey: ["players"],
    queryFn: async (): Promise<PlayersGroups> => {
      const response = await axios.get(`https://${import.meta.env.VITE_API_URL}/api/players`, {
        headers: { Authorization: "Bearer " + tokens!.idToken },
        params: { refresh: "no" },
      });
      return response.data;
    },
    refetchOnMount: "always",
    // staleTime: 0,
    refetchInterval: 1000 * 60 * 20, // refetch every 20 min
  });
  const playersDict = playersQuery?.data?.Users ?? {};
  // const groups = playersQuery?.data?.Groups ?? [];

  const queryClient = useQueryClient();
  const playersRefreshMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.get(`https://${import.meta.env.VITE_API_URL}/api/players`, {
        headers: { Authorization: "Bearer " + tokens!.idToken },
        params: { refresh: "yes" },
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["players"], data);
    },
  });

  // Create "Manage Event" PopUp ("Modal")
  const [managedPlayer, setManagedPlayer] = useState<Player>();
  const [managedPlayerTask, setManagedPlayerTask] = useState<"Create" | "Modify">("Create");
  const [showManagePlayer, setShowManagePlayer] = useState(false);
  const handleCloseManagePlayer = () => setShowManagePlayer(false);
  interface ShowManagePlayerProps {
    managedPlayer?: typeof managedPlayer;
    task: "Create" | "Modify";
  }
  const handleShowManagePlayer = ({ managedPlayer, task }: ShowManagePlayerProps) => {
    setManagedPlayer(managedPlayer ? managedPlayer : undefined);
    setManagedPlayerTask(task);
    setShowManagePlayer(true);
  };

  const [showUserId, setShowUserId] = useState(false);
  const toggleShowUserId = () => setShowUserId(!showUserId);

  if (playersDict) {
    let tabData: PlayerTable = [];
    for (let [player_id, player] of Object.entries(playersDict)) {
      tabData.push({
        given_name: player.attrib.given_name,
        family_name: player.attrib.family_name,
        email: player.attrib.email,
        phone_number: player.attrib.phone_number,
        user_id: player_id,
        groups: player.groups,
      });
    }

    tabData.sort(function (a, b) {
      if (a.given_name < b.given_name) return -1;
      if (a.given_name > b.given_name) return 1;
      return 0;
    });

    return (
      <div className="margin-top-65">
        <Authenticated given_name={["Colten"]}>
          <TShoot playersDict={playersDict} />
        </Authenticated>
        <Container fluid>
          {/* <Row xs={1} sm={2}> */}
          <Row xs={1} sm={2} className="align-items-center">
            <Col xs="auto">
              {/* <h2>Manage Players</h2> */}
              <h2>{import.meta.env.VITE_PLAYERS_TITLE}</h2>
            </Col>
            <Col>
              <Row style={{ justifyContent: "right" }}>
                <Col xs="auto" style={{ textAlign: "right" }}>
                  <Button
                    disabled={playersRefreshMutation.isPending}
                    className="align-top"
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      playersRefreshMutation.mutate();
                    }}
                  >
                    {playersRefreshMutation.isPending && (
                      <Spinner size="sm" animation="grow" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </Spinner>
                    )}
                    Hard Refresh
                  </Button>
                </Col>
                <Col xs="auto" style={{ textAlign: "right" }}>
                  <Button size="sm" variant="secondary" onClick={toggleShowUserId}>
                    {showUserId ? "Hide User ID" : "Show User ID"}
                  </Button>
                </Col>
                <Col xs="auto" style={{ textAlign: "right" }}>
                  <ConditionalWrap
                    condition={import.meta.env.MODE !== "production"}
                    wrap={(children) => (
                      <OverlayTrigger
                        placement="bottom"
                        delay={{ show: 100, hide: 400 }}
                        overlay={<Tooltip id="NewPlayer">Players cannot be modified from Dev</Tooltip>}
                      >
                        <div>{children}</div>
                      </OverlayTrigger>
                    )}
                  >
                    <Button
                      size="sm"
                      id="NewPlayer"
                      disabled={import.meta.env.MODE !== "production"}
                      variant="primary"
                      onClick={() => handleShowManagePlayer({ task: "Create" })}
                    >
                      New Player
                    </Button>
                  </ConditionalWrap>
                </Col>
              </Row>
            </Col>
          </Row>
        </Container>
        <Table responsive striped hover>
          <thead>
            <tr>
              <th></th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Groups</th>
              <th hidden={!showUserId}>User ID</th>
            </tr>
          </thead>
          <tbody>
            {tabData.map((row, index) => (
              <tr key={index}>
                <td>
                  <ConditionalWrap
                    condition={import.meta.env.MODE !== "production"}
                    wrap={(children) => (
                      <OverlayTrigger
                        placement="right"
                        delay={{ show: 100, hide: 400 }}
                        overlay={<Tooltip id="NewPlayer">Players cannot be modified from Dev</Tooltip>}
                      >
                        <span>{children}</span>
                      </OverlayTrigger>
                    )}
                  >
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleShowManagePlayer({ task: "Modify", managedPlayer: row })}
                      disabled={import.meta.env.MODE !== "production"}
                    >
                      Edit
                    </Button>
                  </ConditionalWrap>
                </td>
                <td>{row.given_name}</td>
                <td>{row.family_name}</td>
                <td>{row.email}</td>
                <td>{row.phone_number}</td>
                <td>{row.groups.join(", ")}</td>
                <td hidden={!showUserId}>{row.user_id}</td>
              </tr>
            ))}
          </tbody>
        </Table>

        <Modal show={showManagePlayer} onHide={handleCloseManagePlayer} backdrop="static" keyboard={false}>
          <ManagePlayerModal close={handleCloseManagePlayer} task={managedPlayerTask} player={managedPlayer} />
        </Modal>
      </div>
    );
  } else {
    return (
      <div className="margin-top-65">
        <Container fluid>
          <Row>
            <Col xs="auto">
              <h2>Manage Players</h2>
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

interface ManagePlayerModalProps {
  task: "Create" | "Modify" | "ModifySelf";
  player?: Player;
  close: () => void;
}
export function ManagePlayerModal({ task, player, close }: ManagePlayerModalProps) {
  const { tokens, refreshTokens } = usePasswordless();
  const method = task === "Create" ? "POST" : "PUT";
  const [playerForm, setPlayerForm] = useState<Player>(
    player
      ? player
      : {
          groups: ["player"],
          given_name: "",
          family_name: "",
          email: "",
          phone_number: "",
        }
  );
  const [phone, setPhone] = useState(playerForm.phone_number ? playerForm.phone_number.replace("+1", "") : "");

  const playersQuery = useQuery(fetchPlayersApiOptions({ tokens: tokens!, refresh: "no" }));
  const groups = playersQuery?.data?.Groups ?? [];

  const [inputValidated, setInputValidated] = useState(false);
  const handleInput = (e: React.BaseSyntheticEvent) => {
    if (e.target.id === "phone_number") return;
    setPlayerForm({ ...playerForm, [e.target.id]: e.target.value });
    console.log(e.target.id, e.target.value);
  };
  useEffect(() => {
    if (!phone) {
      setPlayerForm({ ...playerForm, phone_number: undefined });
    } else {
      setPlayerForm({ ...playerForm, phone_number: `+1${phone}` });
    }
  }, [phone]);
  useEffect(() => {
    setInputValidated(/^\S+\@\S+\.\S+$/.test(playerForm.email) && playerForm.given_name != "");
  }, [playerForm]);

  // Handle Group Membership Checkboxes
  const [selectedGroupOptions, setSelectedGroupOptions] = useState(playerForm.groups);
  const handleOptionChange = (event: React.BaseSyntheticEvent) => {
    const optionId = event.target.value;
    const isChecked = event.target.checked;

    if (isChecked) {
      setSelectedGroupOptions([...selectedGroupOptions, optionId]);
    } else {
      setSelectedGroupOptions(selectedGroupOptions.filter((id) => id !== optionId));
    }
  };
  // when selectedGroupOptions changes, update playerForm.groups
  useEffect(() => {
    setPlayerForm({ ...playerForm, groups: selectedGroupOptions });
  }, [selectedGroupOptions]);

  const apiClient = axios.create({
    baseURL: `https://${import.meta.env.VITE_API_URL}/api`,
    headers: tokens && {
      Authorization: "Bearer " + tokens.idToken,
    },
  });

  const [errorMsg, setErrorMsg] = useState("");
  const queryClient = useQueryClient();
  const managePlayerMutation = useMutation({
    mutationFn: async ({ body, method }: { body: Player; method: string }) => {
      let url = "player";
      if (task == "ModifySelf") url = "player/self";
      const response = await apiClient({
        method: method,
        url: url,
        data: body,
      });
      return response.data;
    },
    onSuccess: async (data) => {
      if (task === "ModifySelf") {
        if (data.response && data.response.CodeDeliveryDetailsList) {
          setVerifyAttribute(true);
        } else {
          refreshTokens();
          await playersQuery.refetch();
          close();
        }
      } else {
        queryClient.setQueryData(["players"], data);
        close();
      }
    },
    onError: (error) => {
      console.error(error);
      setErrorMsg(task == "ModifySelf" ? "Modify Profile Failed" : `${task} Player Failed`);
    },
  });

  function handleSubmit(event: React.BaseSyntheticEvent) {
    event.preventDefault();
    if (task == "Create" && !playerForm.family_name) delete playerForm.family_name;
    if (task == "Create" && !playerForm.phone_number) delete playerForm.phone_number;
    console.log(playerForm, task);
    // managePlayer(playerForm, method);
    managePlayerMutation.mutate({ body: playerForm, method: method });
  }

  const [resendWaiting, setResendWaiting] = useState(false);
  async function handleResendCode() {
    setResendWaiting(true);
    try {
      await getUserAttributeVerificationCode({
        attributeName: "email",
      });
      setResendWaiting(false);
    } catch (error) {
      console.error(error);
      setResendWaiting(false);
    }
  }

  const [verifyWaiting, setVerifyWaiting] = useState(false);
  const [verifyAttribute, setVerifyAttribute] = useState(false);
  async function handleVerifySubmit(event: React.BaseSyntheticEvent) {
    event.preventDefault();
    setVerifyWaiting(true);
    try {
      const response = await verifyUserAttribute({
        attributeName: "email",
        code: event.target.code.value,
      });
      console.log(response);
      refreshTokens();
      await playersQuery.refetch();
      setVerifyWaiting(false);
      close();
    } catch (error) {
      console.error(error);
      setVerifyWaiting(false);
    }
  }
  // CodeDeliveryDetailsList

  if (verifyAttribute) {
    return (
      <Form onSubmit={handleVerifySubmit}>
        <Modal.Body className="text-center">
          <div>Enter the verification code sent to your email:</div>
          <Row>
            <Col med="true" style={{ minWidth: "18rem" }}>
              <FloatingLabel controlId="code" label="Email Verification Code" className="mb-3">
                <Form.Control placeholder="code" as="textarea" />
              </FloatingLabel>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Container fluid>
            <Row style={{ justifyContent: "right", paddingLeft: 8, paddingRight: 0 }}>
              <Col style={{ justifyContent: "left", paddingLeft: 0, paddingRight: 0 }}>
                <Button variant="secondary" onClick={handleResendCode} disabled={verifyWaiting || resendWaiting}>
                  {resendWaiting && <span className="spinner-grow spinner-grow-sm text-light" role="status"></span>}
                  Resend Code
                </Button>
              </Col>
              <Col xs="auto" style={{ paddingLeft: 4, paddingRight: 4 }}>
                {/* <Col> */}
                <Button variant="primary" type="submit" disabled={verifyWaiting || resendWaiting}>
                  {verifyWaiting && <span className="spinner-grow spinner-grow-sm text-light" role="status"></span>}
                  Send
                </Button>
              </Col>
              <Col xs="auto" style={{ paddingLeft: 4, paddingRight: 8 }}>
                <Button variant="secondary" onClick={close} disabled={verifyWaiting || resendWaiting}>
                  Cancel
                </Button>
              </Col>
            </Row>
          </Container>
        </Modal.Footer>
      </Form>
    );
  } else
    return (
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="text-center">
          <Row>
            <Col med="true" style={{ minWidth: "13rem" }}>
              <FloatingLabel controlId="given_name" label="First Name" className="mb-3">
                <Form.Control
                  autoComplete="off"
                  placeholder="first_name"
                  as="textarea"
                  onChange={handleInput}
                  defaultValue={task.startsWith("Modify") ? playerForm.given_name : ""}
                />
              </FloatingLabel>
            </Col>
            <Col med="true" style={{ minWidth: "13rem" }}>
              <FloatingLabel controlId="family_name" label="Last Name" className="mb-3">
                <Form.Control
                  autoComplete="off"
                  placeholder="last_name"
                  as="textarea"
                  onChange={handleInput}
                  defaultValue={task.startsWith("Modify") ? playerForm.family_name : ""}
                />
              </FloatingLabel>
            </Col>
            <Col med="true" style={{ minWidth: "18rem" }}>
              <FloatingLabel controlId="email" label="Email" className="mb-3">
                <Form.Control
                  autoComplete="off"
                  placeholder="email"
                  type="email"
                  as="textarea"
                  onChange={handleInput}
                  // disabled={task == "ModifySelf"}
                  defaultValue={task.startsWith("Modify") ? playerForm.email : ""}
                />
              </FloatingLabel>
            </Col>
            <Col med="true" style={{ minWidth: "18rem" }}>
              <FloatingLabel controlId="phone_number" label="Phone" className="mb-3">
                <PatternFormat
                  format="+1 (###) ###-####"
                  defaultValue={phone}
                  placeholder="phone"
                  onValueChange={(value) => setPhone(value.value)}
                  onChange={handleInput}
                  customInput={CustomFormControl}
                  valueIsNumericString={true}
                />
              </FloatingLabel>
            </Col>
            {task !== "ModifySelf" && groups && (
              <Col med="true" style={{ minWidth: "18rem" }}>
                <Form.Group controlId="chooseGroups" className="mb-3">
                  <Form.Label aria-label="Group Membership">Group Membership</Form.Label>
                  <Row xs={2} className="justify-content-center">
                    {Object.keys(groups)
                      .sort()
                      .map((group: string, index: number) => (
                        <Col key={group} style={{ minWidth: "min-content", maxWidth: "min-content" }}>
                          <Form.Check
                            key={index}
                            type="checkbox"
                            id={`option_${index}`}
                            label={group}
                            checked={playerForm.groups.includes(group)}
                            onChange={handleOptionChange}
                            value={group}
                          />
                        </Col>
                      ))}
                  </Row>
                </Form.Group>
              </Col>
            )}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Container fluid>
            <Row style={{ justifyContent: "right", paddingLeft: 8, paddingRight: 0 }}>
              {/* <Col xs="auto" style={{ textAlign: "right" }}></Col> */}
              <Col xs="auto" style={{ justifyContent: "left", paddingLeft: 0, paddingRight: 4 }}>
                <Button variant="secondary" onClick={() => refreshTokens()} disabled={managePlayerMutation.isPending}>
                  {/* Refresh */}
                  <Icon path={mdiRefresh} size={1} />
                </Button>
              </Col>
              <Col style={{ justifyContent: "left", paddingLeft: 4, paddingRight: 0 }}>
                <Button
                  variant="secondary"
                  onClick={() => setVerifyAttribute(true)}
                  disabled={managePlayerMutation.isPending}
                  style={{ height: "100%" }}
                >
                  Enter Code
                </Button>
              </Col>

              <Col xs="auto" style={{ paddingLeft: 4, paddingRight: 4 }}>
                <span>{errorMsg}</span>
              </Col>
              <Col xs="auto" style={{ paddingLeft: 4, paddingRight: 4 }}>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={managePlayerMutation.isPending || !inputValidated || import.meta.env.MODE !== "production"}
                >
                  {managePlayerMutation.isPending && (
                    <span className="spinner-grow spinner-grow-sm text-light" role="status"></span>
                  )}
                  {task == "Modify" ? (
                    "Update Player"
                  ) : task == "ModifySelf" ? (
                    <Icon path={mdiCheck} size={1} />
                  ) : (
                    "Create Player"
                  )}
                </Button>
              </Col>
              <Col xs="auto" style={{ paddingLeft: 4, paddingRight: 8 }}>
                <Button variant="secondary" onClick={close} disabled={managePlayerMutation.isPending}>
                  {/* Cancel */}
                  <Icon path={mdiClose} size={1} />
                </Button>
              </Col>
            </Row>
          </Container>
        </Modal.Footer>
      </Form>
    );
}
const CustomFormControl: React.FC<FormControlProps> = (props) => {
  return <Form.Control autoComplete="off" {...props} />;
};

// https://betterprogramming.pub/5-recipes-for-setting-default-props-in-react-typescript-b52d8b6a842c
export type PlayerNameDict = {
  [key: PlayerGet["attrib"]["given_name"]]: string;
};

export type PlayersGroups = {
  Users: PlayersDict;
  Groups: {
    [key: string]: string[];
  };
};

export type PlayersDict = {
  [key: string]: PlayerGet;
};

export type PlayerGet = {
  groups: string[];
  attrib: {
    given_name: string;
    family_name?: string;
    email: string;
    phone_number?: string;
  };
};

type PlayerTable = PlayerExisting[];

type PlayerBase = {
  given_name: string;
  family_name?: string;
  email: string;
  phone_number?: string;
  user_id: string;
  groups: PlayerGet["groups"];
  accessToken: string;
};

type PlayerCreate = Omit<PlayerBase, "user_id" | "accessToken">;

type PlayerExisting = Omit<PlayerBase, "accessToken">;

export type PlayerModifySelf = PlayerBase;

type Player = PlayerCreate | PlayerExisting | PlayerModifySelf;
