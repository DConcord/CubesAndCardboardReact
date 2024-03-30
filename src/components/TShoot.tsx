import { useState, useEffect } from "react";

import axios from "axios";

import Accordion from "react-bootstrap/Accordion";
import Button from "react-bootstrap/Button";
import { usePasswordless } from "amazon-cognito-passwordless-auth/react";
import { PlayersDict } from "../types/Players";

import { apiClient, fetchBggThumbnailOptions } from "./Queries";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { fetchEventsOptions, fetchEventsApiOptions, fetchPlayersOptions } from "./Queries";

export default function TShoot() {
  const { signInStatus, tokensParsed, tokens } = usePasswordless();

  const eventsQuery = tokens ? useQuery(fetchEventsApiOptions()) : useQuery(fetchEventsOptions());
  const playersQuery = useQuery(fetchPlayersOptions());
  const playersDict = playersQuery?.data?.Users ?? {};
  const players = playersQuery?.data?.Groups?.player ?? [];
  const organizers = playersQuery?.data?.Groups?.organizer ?? [];
  const hosts = playersQuery?.data?.Groups?.host ?? [];

  const data_types = {
    events: eventsQuery.data,
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
  // const apiClient = axios.create({
  //   baseURL: `https://${import.meta.env.VITE_API_URL}/api`,
  // });

  const queryClient = useQueryClient();

  // const playersQuery = useQuery(fetchBggThumbnailOptions(143741));
  const [eventsTest, setEventsTest] = useState({});
  const fetchTest = async () => {
    try {
      const data = await queryClient.fetchQuery(fetchBggThumbnailOptions(143741));
      setEventsTest(data);
    } catch (error) {
      console.log(error);
    }

    // try {
    //   let response = await apiClient.get(`/gamesearch`, {
    //     params: {
    //       game: "Bang!",
    //     },
    //   });

    //   console.log(response.data);
    //   setEventsTest(response.data);
    // } catch (error) {
    //   console.log(error);
    //   setEventsTest(JSON.parse(JSON.stringify(error)));
    // }
  };

  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  if (import.meta.env.VITE_SHOW_TSHOOT !== "True") {
    return <></>;
  }
  if (signInStatus === "SIGNED_IN" && tokensParsed) {
    return (
      <Accordion>
        <Accordion.Item eventKey="token">
          <Accordion.Header>TokenInfo</Accordion.Header>
          <Accordion.Body>
            <div>{"signInStatus: " + signInStatus}</div>
            <div>{"Window Width: " + width}</div>
            <div>{"Mode: " + import.meta.env.MODE}</div>
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
