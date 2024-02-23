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

import NavigationBar from "./components/NavigationBar";
import { usePasswordless } from "amazon-cognito-passwordless-auth/react";
// import { usePasswordless } from "./components/DemoContext";
// import NavigationBar from "./components/DemoNavigationBar";

const eventsClient = axios.create({
  baseURL: "https://myapp.dissonantconcord.com",
});

export default function App() {
  const { signInStatus, tokensParsed, tokens } = usePasswordless();

  let first_name = "";
  if (signInStatus === "SIGNED_IN" && tokensParsed) {
    first_name = String(tokensParsed.idToken.given_name);
  }

  const [events, setEvents] = useState([]);
  // GET with Axios
  useEffect(() => {
    const fetchEvents = async () => {
      let response = await eventsClient.get("events.json");
      setEvents(response.data);
    };
    fetchEvents();
  }, []);

  return (
    <>
      <NavigationBar />
      <Container fluid>
        <Row
          xs={1}
          sm={2}
          md={2}
          lg={3}
          xl={4}
          xxl={4}
          className="g-4 justify-content-center"
        >
          {events.map((event: Record<string, any>, index) => (
            <Col key={index}>
              <Card style={{ minWidth: "18rem", maxWidth: "35rem" }}>
                {event.format == "Reserved" && event.bgg_id ? (
                  <Card.Img variant="top" src={"/" + event.bgg_id + ".png"} />
                ) : (
                  <Card.Img variant="top" src="/Game_TBD.png" />
                )}
                <Card.Body>
                  <Card.Title key={index}>
                    <Row>
                      <Col className="d-flex justify-content-start">
                        {event.date}
                      </Col>
                      <Col className="d-flex justify-content-end gap-1">
                        <OverlayTrigger
                          placement="left"
                          delay={{ show: 250, hide: 400 }}
                          overlay={
                            <Tooltip id="button-tooltip">
                              {event.format == "Open"
                                ? "Open event! Let " +
                                  event.host +
                                  " know if you can make it"
                                : event.spots_available + " spots remaining"}
                            </Tooltip>
                          }
                        >
                          <Button size="sm" variant="secondary" key={index}>
                            {event.format == "Open"
                              ? "Open Event"
                              : event.format}
                            <Badge
                              bg={
                                event.spots_available &&
                                event.spots_available > 2
                                  ? "primary"
                                  : "danger"
                              }
                              key={index}
                            >
                              {event.spots_available}
                            </Badge>
                          </Button>
                        </OverlayTrigger>
                      </Col>
                    </Row>
                  </Card.Title>
                  <Card.Subtitle className="mb-2 text-muted">
                    <Row>
                      <Col className="d-flex justify-content-start">
                        {event.game}
                      </Col>
                      <Col className="d-flex justify-content-end gap-1">
                        {signInStatus === "SIGNED_IN" && tokensParsed && (
                          <OverlayTrigger
                            placement="left"
                            delay={{ show: 250, hide: 400 }}
                            overlay={
                              <Tooltip id="button-tooltip">
                                DEMO! will allow signed in player to manage RSVP
                                for this event
                              </Tooltip>
                            }
                          >
                            <Button variant="secondary" size="sm" key={index}>
                              {/* {first_name} */}
                              {event.registered.includes(first_name) ? (
                                <div>Unregister</div>
                              ) : (
                                <div>Register</div>
                              )}
                            </Button>
                          </OverlayTrigger>
                        )}
                      </Col>
                    </Row>
                  </Card.Subtitle>
                  <Card.Text>
                    <div>Host: {event.host}</div>
                    {event.format != "Open" && (
                      <>
                        <div>Total Spots: {event.total_spots}</div>
                        {/* <div>Spots Available: {event.spots_available}</div> */}
                      </>
                    )}
                    <div>Registered Players: {event.registered.join(", ")}</div>
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </>
  );
}
