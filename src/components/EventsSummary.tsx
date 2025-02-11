import { useState } from "react";

import Modal from "react-bootstrap/Modal";

import { usePasswordless } from "amazon-cognito-passwordless-auth/react";
import { useQuery } from "@tanstack/react-query";
import { fetchPlayersOptions } from "./Queries";
import yaml from "js-yaml";

import { ExistingGameKnightEvent } from "../types/Events";

interface EventsSummaryModalProps {
  close: () => void;
  gameKnightEvents: ExistingGameKnightEvent[];
  year: string;
}
export default function EventsSummaryModal({ close, gameKnightEvents, year }: EventsSummaryModalProps) {
  const playersQuery = useQuery(fetchPlayersOptions());
  const playersDict = playersQuery?.data?.Users ?? {};

  const formatChoices = new Set(gameKnightEvents.map((gameKnightEvent) => gameKnightEvent["format"]));
  const privateIsPresent = formatChoices.has("Private");

  const [showPrivate, setShowPrivate] = useState(true);
  const [showThursdayOnly, setShowThursdayOnly] = useState(false);
  const [includeGamesCount, setIncludeGamesCount] = useState(true);

  const gameKnightEventsFiltered = gameKnightEvents.filter((gameKnightEvent) => {
    if (gameKnightEvent["status"] == "Cancelled") {
      return false;
    }
    if (showThursdayOnly) {
      return new Date(gameKnightEvent["date"]).getDay() == 4;
    }
    if (gameKnightEvent["format"] == "Private") {
      return showPrivate;
    }
    return true;
  });

  interface gameKnightEventsSummaryProps {
    Events: number;
    Games: { [key: string]: number } | string[];
    Hosts: { [key: string]: number };
    Attendees: { [key: string]: number };
  }
  let gameKnightEventsSummary: gameKnightEventsSummaryProps = {
    Events: gameKnightEventsFiltered.length,
    Games: includeGamesCount ? {} : [],
    Hosts: {},
    Attendees: {},
  };
  for (let gameKnightEvent of gameKnightEventsFiltered) {
    if (gameKnightEventsSummary["Games"] instanceof Array) {
      if (!gameKnightEventsSummary["Games"].includes(gameKnightEvent["game"])) {
        gameKnightEventsSummary["Games"].push(gameKnightEvent["game"]);
      }
    } else {
      if (gameKnightEvent["game"] in gameKnightEventsSummary["Games"] == false) {
        gameKnightEventsSummary["Games"][gameKnightEvent["game"]] = 0;
      }
      gameKnightEventsSummary["Games"][gameKnightEvent["game"]] += 1;
    }

    for (let attendee of gameKnightEvent["attending"]) {
      if ((playersDict[attendee]?.attrib.given_name || `UNKNOWN`) in gameKnightEventsSummary["Attendees"] == false) {
        gameKnightEventsSummary["Attendees"][playersDict[attendee]?.attrib?.given_name || `UNKNOWN: ${attendee}`] = 0;
      }
      gameKnightEventsSummary["Attendees"][playersDict[attendee]?.attrib?.given_name || `UNKNOWN: ${attendee}`] += 1;
    }

    if (playersDict[gameKnightEvent["host"]].attrib.given_name in gameKnightEventsSummary["Hosts"] == false) {
      gameKnightEventsSummary["Hosts"][playersDict[gameKnightEvent["host"]].attrib.given_name] = 0;
    }
    gameKnightEventsSummary["Hosts"][playersDict[gameKnightEvent["host"]].attrib.given_name] += 1;
  }

  // Sort sub-keys by count
  for (let [key, value] of Object.entries(gameKnightEventsSummary)) {
    if (key == "Events") continue;
    if (!includeGamesCount && key === "Games") continue;
    if (key === "Games" || key === "Hosts" || key === "Attendees") {
      (gameKnightEventsSummary[key as keyof typeof gameKnightEventsSummary] as { [key: string]: number }) =
        Object.fromEntries(Object.entries(value as { [key: string]: number }).sort(([, a], [, b]) => b - a));
    }
  }

  return (
    <>
      <Modal.Header closeButton className="text-center">
        {year} Summary
      </Modal.Header>
      <Modal.Body className="text-center">
        <div className="d-flex justify-content-center gap-4 mb-3">
          {privateIsPresent && (
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="showPrivateCheck"
                checked={showPrivate}
                onChange={(e) => setShowPrivate(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="showPrivateCheck">
                Show Private Events
              </label>
            </div>
          )}
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="showThursdayCheck"
              checked={showThursdayOnly}
              onChange={(e) => setShowThursdayOnly(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="showThursdayCheck">
              Show Thursday Events Only
            </label>
          </div>
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="includeGamesCountCheck"
              checked={includeGamesCount}
              onChange={(e) => setIncludeGamesCount(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="includeGamesCountCheck">
              Include Games Count
            </label>
          </div>
        </div>
        <pre className="text-start">{yaml.dump(gameKnightEventsSummary, { indent: 2 })}</pre>{" "}
      </Modal.Body>
    </>
  );
}
