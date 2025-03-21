import { useState, useEffect, lazy, Suspense } from "react";
// import { useNavigate } from "react-router-dom";
import { usePasswordless } from "amazon-cognito-passwordless-auth/react";

// import Icon from "@mdi/react";
// import { mdiRefresh, mdiClose, mdiCheck } from "@mdi/js";
const TransferProdPlayersModal = lazy(() => import("./TransferProdPlayers"));

import { verifyUserAttribute, getUserAttributeVerificationCode } from "amazon-cognito-passwordless-auth/cognito-api";

import Accordion from "react-bootstrap/Accordion";
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
import Alert from "react-bootstrap/Alert";

import { PatternFormat } from "react-number-format";

import Authenticated from "../utilities/Authenticated";
import { isEqual } from "lodash";

const TShoot = lazy(() => import("./TShoot"));
import {
  fetchPlayersApiOptions,
  apiClient,
  fetchPlayerEmailAlertSubscriptionsOptions,
  fetchAllEmailAlertSubscriptionsOptions,
} from "./Queries";
import ConditionalWrap from "./ConditionalWrap";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  PlayerTable,
  Player,
  PlayerExisting,
  PlayerModifySelf,
  PlayerGet,
  PlayerEmailAlertPreferences,
  emailAlertTypeReadble,
  EmailAlertType,
} from "../types/Players";

import { AxiosError } from "axios";

export default function Players() {
  const playersQuery = useQuery(fetchPlayersApiOptions({ refresh: "no" }));
  const playersDict = playersQuery?.data?.Users ?? {};

  const queryClient = useQueryClient();
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

  const allEmailAlertSubscriptionsQuery = useQuery(fetchAllEmailAlertSubscriptionsOptions());

  // Create "Manage Event" PopUp ("Modal")
  const [managedPlayer, setManagedPlayer] = useState<PlayerExisting>();
  const [managedPlayerAttrib, setManagedPlayerAttrib] = useState<PlayerGet>();
  const [managedPlayerTask, setManagedPlayerTask] = useState<"Create" | "Modify">("Create");
  const [showManagePlayer, setShowManagePlayer] = useState(false);
  const handleCloseManagePlayer = () => setShowManagePlayer(false);
  type ShowManagePlayerProps =
    | {
        task: "Create";
      }
    | {
        managedPlayer: PlayerExisting;
        task: "Modify";
      };
  const handleShowManagePlayer = (props: ShowManagePlayerProps) => {
    const { task } = props;
    if (task === "Modify") {
      const { managedPlayer } = props;
      setManagedPlayer(managedPlayer);
      setManagedPlayerAttrib(playersDict[managedPlayer.user_id]);
    }
    setManagedPlayerTask(task);
    setShowManagePlayer(true);
  };

  const [showUserId, setShowUserId] = useState(false);
  const toggleShowUserId = () => setShowUserId(!showUserId);

  const [showTransferProdPlayers, setShowTransferProdPlayers] = useState(false);
  const handleCloseTransferProdPlayers = () => setShowTransferProdPlayers(false);
  const handleShowTransferProdPlayers = () => {
    setShowTransferProdPlayers(true);
  };

  if (playersDict) {
    const tableData: PlayerTable = Object.entries(playersDict)
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
      <div className="margin-top-65">
        {/* TransferProdPlayers modal in test/sandbox environements */}
        {(import.meta.env.MODE == "test" || import.meta.env.MODE == "sandbox") && (
          <Modal
            show={showTransferProdPlayers}
            onHide={handleCloseTransferProdPlayers}
            backdrop="static"
            keyboard={false}
          >
            <Suspense fallback={<>...</>}>
              <TransferProdPlayersModal close={handleCloseTransferProdPlayers} />
            </Suspense>
          </Modal>
        )}
        <Authenticated given_name={["Colten"]}>
          <Suspense fallback={<>...</>}>
            <TShoot />
          </Suspense>
        </Authenticated>
        <Container fluid>
          <Row xs={1} sm={2} className="align-items-center">
            <Col xs="auto">
              {/* <h2>Manage Players</h2> */}
              <h2>{import.meta.env.VITE_PLAYERS_TITLE}</h2>
            </Col>
            <Authenticated group={["admin"]}>
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
                        allEmailAlertSubscriptionsQuery.refetch();
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
                      condition={!["production", "test", "sandbox"].includes(import.meta.env.MODE)}
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
                        disabled={!["production", "test", "sandbox"].includes(import.meta.env.MODE)}
                        variant="primary"
                        onClick={() => handleShowManagePlayer({ task: "Create" })}
                      >
                        New Player
                      </Button>
                    </ConditionalWrap>
                  </Col>
                  {/* Offer Transfer button to admins in test/sandbox environment */}
                  {(import.meta.env.MODE == "test" || import.meta.env.MODE == "sandbox") &&
                    import.meta.env.VITE_API_URL !== "events.cubesandcardboard.net" && (
                      <Authenticated group={["admin"]}>
                        <Col xs="auto" style={{ textAlign: "right" }}>
                          <Button size="sm" variant="secondary" onClick={handleShowTransferProdPlayers}>
                            Transfer
                          </Button>
                        </Col>
                      </Authenticated>
                    )}
                </Row>
              </Col>
            </Authenticated>
          </Row>
        </Container>
        <Table responsive striped hover>
          <thead>
            <tr>
              <Authenticated group={["admin"]}>
                <th></th>
              </Authenticated>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Email</th>
              <th>Phone</th>
              <Authenticated group={["admin", "host"]}>
                <th>Groups</th>
              </Authenticated>
              <th hidden={!showUserId}>User ID</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, index) => (
              <tr key={index}>
                <Authenticated group={["admin"]}>
                  <td>
                    <ConditionalWrap
                      condition={!["production", "test", "sandbox"].includes(import.meta.env.MODE)}
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
                        disabled={!["production", "test", "sandbox"].includes(import.meta.env.MODE)}
                      >
                        Edit
                      </Button>
                    </ConditionalWrap>
                  </td>
                </Authenticated>
                <td>{row.given_name}</td>
                <td>{row.family_name}</td>
                <td>{row.email}</td>
                <td>{row.phone_number}</td>
                <Authenticated group={["admin", "host"]}>
                  <td>{row.groups.join(", ")}</td>
                </Authenticated>
                <td hidden={!showUserId}>{row.user_id}</td>
              </tr>
            ))}
          </tbody>
        </Table>

        <Modal show={showManagePlayer} onHide={handleCloseManagePlayer} backdrop="static" keyboard={false}>
          {managedPlayerTask == "Create" ? (
            <ManagePlayerModal close={handleCloseManagePlayer} task={managedPlayerTask} />
          ) : (
            managedPlayerTask == "Modify" && (
              <ManagePlayerModal
                close={handleCloseManagePlayer}
                task={managedPlayerTask}
                playerAttrib={managedPlayerAttrib!}
                player={managedPlayer!}
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

type CreatePlayerModalProps = {
  task: "Create";
  close: () => void;
};
type ModifyPlayerModalProps = {
  task: "Modify";
  player: PlayerExisting;
  playerAttrib: PlayerGet;
  close: () => void;
};
type ModifySelfPlayerModalProps = {
  task: "ModifySelf";
  player: PlayerModifySelf;
  resetManagePlayerModal: () => void;
  close: () => void;
};
type ManagePlayerModalProps = CreatePlayerModalProps | ModifyPlayerModalProps | ModifySelfPlayerModalProps;
export function ManagePlayerModal(props: ManagePlayerModalProps) {
  const { signInStatus, tokensParsed, refreshTokens } = usePasswordless();
  const { task, close } = props;
  const method = task === "Create" ? "POST" : "PUT";
  const [playerForm, setPlayerForm] = useState<Player>(
    task === "Create"
      ? {
          groups: ["player"],
          given_name: "",
          family_name: "",
          email: "",
          phone_number: "",
        }
      : props.player
  );
  const [phone, setPhone] = useState(playerForm.phone_number ? playerForm.phone_number.replace("+1", "") : "");

  const playersQuery = useQuery(fetchPlayersApiOptions({ refresh: "no" }));
  const groups = playersQuery?.data?.Groups ?? [];

  const playerEmailAlertSubscriptionsQuery =
    task !== "Create" ? useQuery(fetchPlayerEmailAlertSubscriptionsOptions(props.player.user_id)) : undefined;

  const [alertSubs, setAlertSubs] = useState<PlayerEmailAlertPreferences>(
    playerEmailAlertSubscriptionsQuery && playerEmailAlertSubscriptionsQuery.isSuccess
      ? playerEmailAlertSubscriptionsQuery.data
      : {
          rsvp_all_debug: false,
          rsvp_all: false,
          rsvp_hosted: false,
        }
  );

  useEffect(() => {
    if (playerEmailAlertSubscriptionsQuery && playerEmailAlertSubscriptionsQuery.isSuccess) {
      setAlertSubs(playerEmailAlertSubscriptionsQuery.data);
    }
  }, [playerEmailAlertSubscriptionsQuery?.data]);

  const handleAlertsSubChange = (event: React.BaseSyntheticEvent) => {
    const alertType = event.target.value;
    const subscribed = event.target.checked;

    // Admins can only be in one of the three following subscriptions
    const adminSubs: { [key: string]: boolean } = {
      rsvp_all_debug: false,
      rsvp_all: false,
      rsvp_hosted: false,
    };
    if (alertType in adminSubs) {
      adminSubs[alertType] = subscribed;
      setAlertSubs({ ...alertSubs, ...adminSubs });
    } else {
      setAlertSubs({ ...alertSubs, [alertType]: subscribed });
    }
  };

  // Email Verification Code  Validation
  const [validCode, setValidCode] = useState(false);
  const handleVerificationInput = (e: React.BaseSyntheticEvent) => {
    setValidCode(/^\d{6}$/.test(e.target.value));
  };

  const [inputValidated, setInputValidated] = useState(false);
  const handleInput = (e: React.BaseSyntheticEvent) => {
    if (e.target.id === "phone_number") return;
    let value = e.target.value;
    if (e.target.id === "email") value = value.toLowerCase();

    setPlayerForm({ ...playerForm, [e.target.id]: value });
    console.log(e.target.id, value);
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

  // When selectedGroupOptions changes, update playerForm.groups
  useEffect(() => {
    setPlayerForm({ ...playerForm, groups: selectedGroupOptions });
  }, [selectedGroupOptions]);

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
          let promiseStatus = await Promise.allSettled([refreshTokens(), playersQuery.refetch()]);
          // console.log(promiseStatus);
          // close();
        }
      } else {
        queryClient.setQueryData(["players"], data);
        queryClient.setQueryData(["players", "api"], data);
        // close();
      }
    },
    onError: (error) => {
      console.error(error);
      setErrorMsg(task == "ModifySelf" ? "Modify Profile Failed" : `${task} Player Failed`);
    },
  });

  interface IUpdatePlayerEmailAlertSubsMutation {
    user_id: string;
    alert_subscriptions: PlayerEmailAlertPreferences;
  }
  const updatePlayerEmailAlertSubsMutation = useMutation({
    mutationFn: async ({ body }: { body: IUpdatePlayerEmailAlertSubsMutation }) => {
      const url = "alerts/player";
      try {
        const response = await apiClient({
          method: "PUT",
          url: url,
          data: body,
        });
        console.log(response);
        return { status: "success", message: response.data.result };
      } catch (err) {
        console.error(err);
        if (err instanceof AxiosError) {
          return { status: "failed", message: err.message };
        }
        return { status: "failed", message: "unknown", err: err };
      }
    },
  });
  async function handleSubmit(event: React.BaseSyntheticEvent) {
    event.preventDefault();
    if (task == "Create" && !playerForm.family_name) delete playerForm.family_name;
    if (task == "Create" && !playerForm.phone_number) delete playerForm.phone_number;
    console.log(playerForm, task);
    if (task === "Create") {
      managePlayerMutation.mutate({ body: playerForm, method: method });
      // while (managePlayerMutation.isIdle || managePlayerMutation.isPending) {}
      if (managePlayerMutation.isSuccess || managePlayerMutation.isIdle) close();
    } else {
      const awaitPromises = await Promise.allSettled([
        playerEmailAlertSubscriptionsQuery &&
          !isEqual(alertSubs, playerEmailAlertSubscriptionsQuery.data) &&
          updatePlayerEmailAlertSubsMutation.mutateAsync({
            body: { user_id: props.player.user_id, alert_subscriptions: alertSubs },
          }),
        managePlayerMutation.mutateAsync({ body: playerForm, method: method }),
      ]);
      console.log(awaitPromises);
      if (task === "ModifySelf") {
        await playerEmailAlertSubscriptionsQuery!.refetch();
      } else {
        await queryClient.refetchQueries({ queryKey: ["AllEmailAlertSubscriptions"], exact: true });
      }
      if ((!verifyAttribute && managePlayerMutation.isSuccess) || managePlayerMutation.isIdle) {
        close();
      } else {
        console.log({ verifyAttribute: verifyAttribute, managePlayerMutation: managePlayerMutation.status });
      }
    }
  }

  const [verifyWaiting, setVerifyWaiting] = useState(false);
  const [verifyAttribute, setVerifyAttribute] = useState(false);
  async function handleVerifySubmit(event: React.BaseSyntheticEvent) {
    console.log(event.target.code.value);
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

  const [areYouSure, setAreYouSure] = useState(false);

  if (verifyAttribute) {
    return (
      <Form onSubmit={handleVerifySubmit}>
        <Modal.Header>Enter the verification code sent to your email:</Modal.Header>
        <Modal.Body className="text-center">
          <Row xs={1}>
            <Col med="true" style={{ minWidth: "18rem" }}>
              <FloatingLabel controlId="code" label="Email Verification Code" className="mb-3">
                <Form.Control isValid={validCode} onInput={handleVerificationInput} placeholder="code" type="number" />
              </FloatingLabel>
            </Col>
            {areYouSure && (
              <Col>
                <Alert>
                  <div>Are you sure? You cannot sign in with your updated address until it is verified.</div>
                  <br />
                  <div>To get another code, you can try changing your email address again.</div>
                </Alert>
              </Col>
            )}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Container fluid>
            <Row style={{ justifyContent: "right", paddingLeft: 8, paddingRight: 0 }}>
              <Col xs="auto" style={{ paddingLeft: 4, paddingRight: 4 }}>
                <Button variant="primary" type="submit" disabled={verifyWaiting || !validCode}>
                  {verifyWaiting && <span className="spinner-grow spinner-grow-sm text-light" role="status"></span>}
                  Send
                </Button>
              </Col>
              <Col xs="auto" style={{ paddingLeft: 4, paddingRight: 8 }}>
                {areYouSure ? (
                  <Button variant="secondary" onClick={close} disabled={verifyWaiting}>
                    Yes, Cancel
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={() => setAreYouSure(true)} disabled={verifyWaiting}>
                    Cancel
                  </Button>
                )}
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
            <ConditionalWrap
              condition={!["production", "test", "sandbox"].includes(import.meta.env.MODE)}
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
              <>
                <Col med="true" style={{ minWidth: "13rem" }}>
                  <FloatingLabel controlId="given_name" label="First Name" className="mb-3">
                    <Form.Control
                      autoComplete="off"
                      placeholder="first_name"
                      as="textarea"
                      onChange={handleInput}
                      defaultValue={task.startsWith("Modify") ? playerForm.given_name : ""}
                      disabled={!["production", "test", "sandbox"].includes(import.meta.env.MODE)}
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
                      disabled={!["production", "test", "sandbox"].includes(import.meta.env.MODE)}
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
                      value={playerForm.email}
                      disabled={!["production", "test", "sandbox"].includes(import.meta.env.MODE)}
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
                      disabled={!["production", "test", "sandbox"].includes(import.meta.env.MODE)}
                    />
                  </FloatingLabel>
                </Col>
              </>
            </ConditionalWrap>
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
          {/* <Authenticated group={["admin", "host"]}> */}
          {(task === "Create" || props.player.groups.includes("admin") || props.player.groups.includes("host")) && (
            <>
              <hr />
              {task === "Create" ? (
                <>
                  <div>Email Alert Subscriptions</div>
                  <div>(Configure Subscriptions after Player creation)</div>
                </>
              ) : playerEmailAlertSubscriptionsQuery!.isSuccess ? (
                <Col med="true" style={{ minWidth: "18rem" }}>
                  <Form.Group controlId="emailAlertSubs" className="mb-3">
                    <Form.Label aria-label="Email Alert Subscriptions">Email Alert Subscriptions</Form.Label>
                    <Row xs={2} className="justify-content-center">
                      {Object.entries(alertSubs).map(([alertType, subscribed], index: number) => {
                        // Only admins can subscribe to rsvp_all and rsvp_all_debug
                        if (
                          // !authenticated({ signInStatus, tokensParsed, group: ["admin"] }) &&
                          !props.player.groups.includes("admin") &&
                          ["rsvp_all", "rsvp_all_debug"].includes(alertType)
                        )
                          return;

                        // Only admins or hosts can subscribe to rsvp_hosted
                        if (
                          // !authenticated({ signInStatus, tokensParsed, group: ["admin", "host"] }) &&
                          !props.player.groups.includes("admin") &&
                          !props.player.groups.includes("host") &&
                          alertType == "rsvp_hosted"
                        )
                          return;

                        return (
                          <Col key={alertType} style={{ minWidth: "max-content", maxWidth: "max-content" }}>
                            <Form.Check
                              key={index}
                              type="checkbox"
                              id={alertType}
                              label={emailAlertTypeReadble[alertType as keyof PlayerEmailAlertPreferences]}
                              checked={subscribed}
                              onChange={handleAlertsSubChange}
                              value={alertType}
                            />
                          </Col>
                        );
                      })}
                    </Row>
                  </Form.Group>
                </Col>
              ) : playerEmailAlertSubscriptionsQuery && playerEmailAlertSubscriptionsQuery.isLoading ? (
                <>
                  <div>Email Alert Subscriptions</div>
                  <div>Loading...</div>
                </>
              ) : (
                playerEmailAlertSubscriptionsQuery &&
                playerEmailAlertSubscriptionsQuery.isError && (
                  <>
                    <div>Email Alert Subscriptions</div>
                    <div>Error Fetching Alert Subscriptions</div>
                  </>
                )
              )}
            </>
          )}
          {/* </Authenticated> */}
        </Modal.Body>
        {import.meta.env.MODE == "test" && (
          <Accordion>
            <Accordion.Item eventKey="playerDebug">
              <Accordion.Header>Player Debug</Accordion.Header>
              <Accordion.Body>
                <pre>
                  {JSON.stringify(task === "Modify" && props.playerAttrib ? props.playerAttrib : playerForm, null, 2)}
                </pre>
                <pre>
                  {JSON.stringify(
                    playerEmailAlertSubscriptionsQuery
                      ? { queryState: playerEmailAlertSubscriptionsQuery.status, ...alertSubs }
                      : { queryState: !!playerEmailAlertSubscriptionsQuery, ...alertSubs },
                    null,
                    2
                  )}
                </pre>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        )}
        <Modal.Footer>
          <Container fluid>
            <Row style={{ justifyContent: "right", paddingLeft: 0, paddingRight: 0 }} className="align-items-center">
              {task === "ModifySelf" && !!props.resetManagePlayerModal && (
                <Col xs="auto" style={{ justifyContent: "left", paddingLeft: 0, paddingRight: 4 }}>
                  <Button
                    variant="secondary"
                    onClick={() => props.resetManagePlayerModal()}
                    disabled={managePlayerMutation.isPending}
                  >
                    Refresh
                  </Button>
                </Col>
              )}
              <Col style={{ justifyContent: "left", paddingLeft: 4, paddingRight: 0 }}>
                {!tokensParsed?.idToken.email_verified && (
                  <Button
                    variant="secondary"
                    onClick={() => setVerifyAttribute(true)}
                    disabled={managePlayerMutation.isPending}
                    style={{ height: "100%" }}
                  >
                    Enter Code
                  </Button>
                )}
              </Col>
              <Col xs="auto" style={{ paddingLeft: 4, paddingRight: 4 }}>
                <span style={{ color: "red" }}>{errorMsg}</span>
              </Col>
              <Col xs="auto" style={{ paddingLeft: 4, paddingRight: 4 }}>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={
                    managePlayerMutation.isPending ||
                    !inputValidated ||
                    (task !== "ModifySelf" && !["production", "test", "sandbox"].includes(import.meta.env.MODE))
                  }
                >
                  {managePlayerMutation.isPending && (
                    <span className="spinner-grow spinner-grow-sm text-light" role="status"></span>
                  )}
                  {task == "Modify" ? "Update Player" : task == "ModifySelf" ? "Update" : "Create Player"}
                </Button>
              </Col>
              <Col xs="auto" style={{ paddingLeft: 4, paddingRight: 0 }}>
                <Button variant="secondary" onClick={close} disabled={managePlayerMutation.isPending}>
                  Cancel
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
