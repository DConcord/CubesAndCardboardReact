import { useState, useEffect } from "react";

import axios from "axios";

import Accordion from "react-bootstrap/Accordion";
import Button from "react-bootstrap/Button";
import { usePasswordless } from "amazon-cognito-passwordless-auth/react";

interface Props {
  events: never[];
}
export default function TShoot({ events }: Props) {
  const { signInStatus, tokensParsed, tokens } = usePasswordless();

  let first_name = "";
  if (signInStatus === "SIGNED_IN" && tokensParsed) {
    first_name = String(tokensParsed.idToken.given_name);
  }

  // API Client
  const apiClient = axios.create({
    baseURL: "https://myapp.dissonantconcord.com/api",
    headers: tokens && {
      Authorization: "Bearer " + tokens.idToken,
    },
  });

  const [eventsTest, setEventsTest] = useState({});
  const fetchTest = async () => {
    try {
      let response = await apiClient.delete("event", {
        params: {
          event_id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          // name: "xxxx",
          // date: "yyyy",
        },
      });

      console.log(response.data);
      setEventsTest(response.data);
    } catch (error) {
      console.log(error);
      setEventsTest(JSON.parse(JSON.stringify(error)));
    }
  };

  return (
    <Accordion>
      <Accordion.Item eventKey="token">
        <Accordion.Header>TokenInfo</Accordion.Header>
        <Accordion.Body>
          <Accordion>
            <Accordion.Item eventKey="idToken">
              <Accordion.Header>idToken</Accordion.Header>
              <Accordion.Body>
                <pre>{JSON.stringify(tokensParsed?.idToken, null, 2)}</pre>
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="accessToken">
              <Accordion.Header>accessToken</Accordion.Header>
              <Accordion.Body>
                <pre>{JSON.stringify(tokensParsed?.accessToken, null, 2)}</pre>
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
            <Accordion.Item eventKey="EVENT_JSON">
              <Accordion.Header>events.json</Accordion.Header>
              <Accordion.Body>
                {/* <Button onClick={fetchTest}>Show</Button> */}
                <pre>{JSON.stringify(events, null, 2)}</pre>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
}
