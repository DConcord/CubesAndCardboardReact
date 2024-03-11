import { useState, useEffect } from "react";

import axios from "axios";

import Accordion from "react-bootstrap/Accordion";
import Button from "react-bootstrap/Button";
import { usePasswordless } from "amazon-cognito-passwordless-auth/react";
import { AccordionBody } from "react-bootstrap";
import { PlayersDict } from "./Players";

interface Props {
  events?: never[];
  playersDict: PlayersDict;
  players?: string[];
  organizers?: string[];
  hosts?: string[];
}
export default function TShoot({ events, playersDict, players, organizers, hosts }: Props) {
  const { signInStatus, tokensParsed, tokens } = usePasswordless();
  const data_types = {
    events: events,
    playersDict: playersDict,
    players: players,
    organizers: organizers,
    hosts: hosts,
  };

  let first_name = "";
  if (signInStatus === "SIGNED_IN" && tokensParsed) {
    first_name = String(tokensParsed.idToken.given_name);
  }

  // API Client
  const apiClient = axios.create({
    baseURL: `https://${import.meta.env.VITE_API_URL}/api`,
    // headers: tokens && {
    //   Authorization: "Bearer " + tokens.idToken,
    // },
  });

  const [eventsTest, setEventsTest] = useState({});
  const fetchTest = async () => {
    try {
      let base_url = `https://${import.meta.env.VITE_API_URL}/api`;
      let response = await axios.get(`${base_url}/players`, {
        headers: tokens && {
          Authorization: "Bearer " + tokens.idToken,
        },
        params: {
          refresh: "yes",
        },
      });

      console.log(response.data);
      setEventsTest(response.data);
    } catch (error) {
      console.log(error);
      setEventsTest(JSON.parse(JSON.stringify(error)));
    }
  };

  if (signInStatus === "SIGNED_IN" && tokensParsed) {
    return (
      <Accordion>
        <Accordion.Item eventKey="token">
          <Accordion.Header>TokenInfo</Accordion.Header>
          <Accordion.Body>
            {"signInStatus: " + signInStatus}
            <Accordion>
              <Accordion.Item eventKey="idToken">
                <Accordion.Header>idToken</Accordion.Header>
                <Accordion.Body>
                  <pre>{JSON.stringify(tokensParsed.idToken, null, 2)}</pre>
                </Accordion.Body>
              </Accordion.Item>
              <Accordion.Item eventKey="accessToken">
                <Accordion.Header>accessToken</Accordion.Header>
                <Accordion.Body>
                  <pre>{JSON.stringify(tokensParsed.accessToken, null, 2)}</pre>
                </Accordion.Body>
              </Accordion.Item>
              <Accordion.Item eventKey="raw">
                <Accordion.Header>raw</Accordion.Header>
                <Accordion.Body>
                  <pre>{JSON.stringify(tokens, null, 2)}</pre>
                </Accordion.Body>
              </Accordion.Item>
              <Accordion.Item eventKey="API">
                <Accordion.Header>API Get</Accordion.Header>
                <Accordion.Body>
                  <Button onClick={fetchTest}>Test</Button>
                  <pre>{JSON.stringify(eventsTest, null, 2)}</pre>
                </Accordion.Body>
              </Accordion.Item>
              {Object.keys(data_types).map((type, index) => (
                <Accordion.Item key={type} eventKey={type}>
                  <Accordion.Header>{type}</Accordion.Header>
                  <Accordion.Body>
                    <pre>{JSON.stringify(data_types[type as keyof typeof data_types], null, 2)}</pre>
                  </Accordion.Body>
                </Accordion.Item>
              ))}
              {/* <Accordion.Item eventKey="Vite_Vars">
              <Accordion.Header>Vite Vars</Accordion.Header>
              <AccordionBody>
                <div>import.meta.env.DEV: {import.meta.env.DEV}</div>
                <div>import.meta.env.PROD: {import.meta.env.PROD}</div>
                <div>import.meta.env.VITE_API_URL: {import.meta.env.VITE_API_URL}</div>
                <div>import.meta.env.MODE: {import.meta.env.MODE}</div>
                <div>typeof import.meta.env.MODE: {typeof import.meta.env.MODE}</div>
                <div>import.meta.env.VITE_EVENTS_TITLE: {import.meta.env.VITE_EVENTS_TITLE}</div>
              </AccordionBody>
            </Accordion.Item> */}
            </Accordion>
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
    );
  } else {
    return <></>;
  }
}
