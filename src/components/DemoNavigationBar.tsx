import React, { useState } from "react";

import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import Offcanvas from "react-bootstrap/Offcanvas";

import { usePasswordless } from "./DemoContext";

import {
  THEME,
  initTheme,
  // getPreferredTheme,
  // storedTheme,
  setTheme,
  resetTheme,
} from "./Theme";

initTheme();
import Icon from "@mdi/react";
import {
  mdiThemeLightDark,
  mdiWeatherNight,
  mdiBrightnessAuto,
  mdiWeatherSunny,
} from "@mdi/js";

export default function NavigationBar() {
  const { signInStatus, signOut, signIn, tokensParsed } = usePasswordless();
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  // Custom wrapper for Form elements
  // https://epicreact.dev/how-to-type-a-react-form-on-submit-handler/
  interface FormElements extends HTMLFormControlsCollection {
    name: HTMLInputElement;
  }
  interface UsernameFormElement extends HTMLFormElement {
    readonly elements: FormElements;
  }

  function handleSubmit(event: React.FormEvent<UsernameFormElement>) {
    event.preventDefault();
    signIn({
      first_name: event.currentTarget.elements.name.value,
      last_name: "Skywalker",
    });
    handleClose();
    // onSubmitUsername(event.currentTarget.elements.usernameInput.value)
  }

  // if (signInStatus === "SIGNED_IN") handleClose(); //setShow(false);
  const expand = "md";
  return (
    <>
      <Navbar key={expand} expand={expand} className="bg-body-tertiary mb-3">
        <Container fluid>
          <Navbar.Brand href="#">Upcoming Events</Navbar.Brand>
          <Navbar.Toggle aria-controls={`offcanvasNavbar-expand-${expand}`} />
          <Navbar.Offcanvas
            id={`offcanvasNavbar-expand-${expand}`}
            aria-labelledby={`offcanvasNavbarLabel-expand-${expand}`}
            placement="end"
          >
            <Offcanvas.Header closeButton>
              <Offcanvas.Title id={`offcanvasNavbarLabel-expand-${expand}`}>
                Menu
              </Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              <Nav className="justify-content-end flex-grow-1 pe-3 gap-2">
                {signInStatus !== "SIGNED_IN" ? (
                  <>
                    {/* <Button variant="primary" onClick={handleSignIn}> */}
                    <Button variant="primary" onClick={handleShow}>
                      Sign In
                    </Button>
                  </>
                ) : (
                  <>
                    {tokensParsed && (
                      <Navbar.Text>
                        Hello, {String(tokensParsed?.idToken.given_name)}
                      </Navbar.Text>
                    )}
                    <Button variant="primary" onClick={signOut}>
                      Sign Out
                    </Button>
                    <div />
                  </>
                )}

                <NavDropdown
                  // style={{ maxWidth: 10, minWidth: 10 }}
                  id="theme-dropdown"
                  title={<Icon path={mdiThemeLightDark} size={1} />}
                  // drop="down"
                  // align={{ sm: "end" }}
                  align="end"
                >
                  <a
                    className="dropdown-item gap-2"
                    onClick={() => setTheme(THEME.LIGHT)}
                  >
                    <Icon path={mdiWeatherSunny} size={1} />
                    Light
                  </a>
                  <a
                    className="dropdown-item"
                    onClick={() => setTheme(THEME.DARK)}
                  >
                    <Icon path={mdiWeatherNight} size={1} />
                    Dark
                  </a>
                  <a className="dropdown-item" onClick={() => resetTheme()}>
                    <Icon path={mdiBrightnessAuto} size={1} />
                    Auto
                  </a>
                </NavDropdown>
              </Nav>
            </Offcanvas.Body>
          </Navbar.Offcanvas>
        </Container>
      </Navbar>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header>
          DEMO! In the final state, users must be populated by an administrator
          (Luke, Garret, Colten, etc) and will be given a passwordless signin
          option. "Name" will be extracted from the authenticated user's idtoken
          attribute.
        </Modal.Header>
        <Modal.Body className="text-center">
          <Form onSubmit={handleSubmit}>
            <Form.Label htmlFor="name">First Name</Form.Label>
            <Form.Control type="name" id="name" />
            <Button variant="primary" type="submit">
              Sign In
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
}
