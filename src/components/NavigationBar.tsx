import { useState } from "react";
import Container from "react-bootstrap/Container";
import Navbar from "react-bootstrap/Navbar";
import Offcanvas from "react-bootstrap/Offcanvas";
import Nav from "react-bootstrap/Nav";
import NavDropdown from "react-bootstrap/NavDropdown";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { usePasswordless } from "amazon-cognito-passwordless-auth/react";
import LoginModal from "./LoginModal";

import { THEME, initTheme, setTheme, resetTheme } from "./Theme";

initTheme();
import Icon from "@mdi/react";
import { mdiThemeLightDark, mdiWeatherNight, mdiBrightnessAuto, mdiWeatherSunny } from "@mdi/js";

export default function NavigationBar() {
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const {
    signInStatus,
    signingInStatus,
    signOut,
    showAuthenticatorManager,
    toggleShowAuthenticatorManager,
    tokensParsed,
  } = usePasswordless();

  // if (signInStatus === "SIGNED_IN") handleClose(); //setShow(false);
  const expand = "md";
  return (
    <>
      <Navbar key={expand} expand={expand} className="bg-body-tertiary mb-3">
        <Container fluid>
          <Navbar.Brand href="https://cubesandcardboard.net/">Cubes & Cardboard</Navbar.Brand>
          <Navbar.Toggle aria-controls={`offcanvasNavbar-expand-${expand}`} />
          <Navbar.Offcanvas
            id={`offcanvasNavbar-expand-${expand}`}
            aria-labelledby={`offcanvasNavbarLabel-expand-${expand}`}
            placement="end"
          >
            <Offcanvas.Header closeButton>
              <Offcanvas.Title id={`offcanvasNavbarLabel-expand-${expand}`}>Menu</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              <Nav className="justify-content-end flex-grow-1 pe-3 gap-2">
                {signInStatus !== "SIGNED_IN" ? (
                  <>
                    {signingInStatus === "SIGNING_IN_WITH_LINK" ? (
                      <div className="passwordless-flex">
                        <div className="passwordless-loading-spinner"></div>
                        <div>Checking the sign-in link...</div>
                      </div>
                    ) : signingInStatus === "SIGNING_OUT" ? (
                      <div className="passwordless-flex">
                        <div className="passwordless-loading-spinner"></div>
                        <div>Signing out, please wait...</div>
                      </div>
                    ) : (
                      !show &&
                      signingInStatus === "SIGNIN_LINK_EXPIRED" && (
                        <div className="passwordless-flex passwordless-flex-align-start">
                          <svg
                            width="24px"
                            height="24px"
                            viewBox="0 0 24 24"
                            version="1.1"
                            xmlns="http://www.w3.org/2000/svg"
                            className="rotate-45"
                          >
                            <path d="M18,11.1 L12.9,11.1 L12.9,6 L11.1,6 L11.1,11.1 L6,11.1 L6,12.9 L11.1,12.9 L11.1,17.9988281 L12.9,17.9988281 L12.9,12.9 L18,12.9 L18,11.1 Z M12,24 C5.38359372,24 0,18.6164063 0,12 C0,5.38300776 5.38359372,0 12,0 C18.6164063,0 24,5.38300776 24,12 C24,18.6164063 18.6164063,24 12,24 Z M12,1.8 C6.37617192,1.8 1.8,6.37558596 1.8,12 C1.8,17.6238281 6.37617192,22.2 12,22.2 C17.6238281,22.2 22.2,17.6238281 22.2,12 C22.2,6.37558596 17.6238281,1.8 12,1.8 Z"></path>
                          </svg>
                          <div>
                            <div className="passwordless-text-left">
                              <strong>Authentication error.</strong>
                              <div>The sign-in link you tried to use is no longer valid</div>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                    {/* <Nav.Link onClick={handleShow} style={{ textDecoration: "none", color: "unset" }}> */}
                    <Button className="passwordless-link" onClick={handleShow} style={{ textDecoration: "none" }}>
                      Admin
                    </Button>
                    {/* <Button variant="link" onClick={handleShow} style={{ textDecoration: "none", color: "unset" }}>
                      Admin
                    </Button> */}
                  </>
                ) : (
                  <>
                    {tokensParsed && <Navbar.Text>Hello, {String(tokensParsed?.idToken.given_name)}</Navbar.Text>}
                    <Button size="sm" variant="primary" onClick={signOut}>
                      Sign Out
                    </Button>
                    <div />
                    <Button
                      variant="secondary"
                      onClick={toggleShowAuthenticatorManager}
                      disabled={showAuthenticatorManager}
                      size="sm"
                    >
                      Manage Credentials
                    </Button>
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
                  <a className="dropdown-item gap-2" onClick={() => setTheme(THEME.LIGHT)}>
                    <Icon path={mdiWeatherSunny} size={1} />
                    Light
                  </a>
                  <a className="dropdown-item" onClick={() => setTheme(THEME.DARK)}>
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

      <Modal show={show} onHide={handleClose} backdrop="static" keyboard={false}>
        <Modal.Body className="text-center">
          <LoginModal onLogin={() => setShow(false)}></LoginModal>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
