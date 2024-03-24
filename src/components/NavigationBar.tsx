import { useState, lazy, Suspense } from "react";
import Container from "react-bootstrap/Container";
import Navbar from "react-bootstrap/Navbar";
import Offcanvas from "react-bootstrap/Offcanvas";
import Nav from "react-bootstrap/Nav";
import NavDropdown from "react-bootstrap/NavDropdown";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { usePasswordless } from "amazon-cognito-passwordless-auth/react";

import { NavLink, Outlet } from "react-router-dom";

import { THEME, initTheme, setTheme, resetTheme } from "./Theme";
import LoginModal from "./LoginModal";
import Authenticated, { authenticated } from "./Authenticated";
import { PlayerModifySelf } from "../types/Players";
const ManagePlayerModal = lazy(() => import("./Players").then((module) => ({ default: module.ManagePlayerModal })));

initTheme();
import Icon from "@mdi/react";
import { mdiThemeLightDark, mdiWeatherNight, mdiBrightnessAuto, mdiWeatherSunny, mdiAccount } from "@mdi/js";

import { useLocation } from "react-router-dom";

export default function NavigationBar() {
  const [showLogin, setShowLogin] = useState(false);
  const handleCloseLogin = () => setShowLogin(false);
  const handleShowLogin = () => setShowLogin(true);

  const [showMenu, setShowMenu] = useState(false);
  const handleCloseMenu = () => setShowMenu(false);
  const handleShowMenu = () => setShowMenu(true);
  const toggleMenu = () => setShowMenu(!showMenu);

  const {
    signInStatus,
    signingInStatus,
    signOut,
    showAuthenticatorManager,
    toggleShowAuthenticatorManager,
    tokensParsed,
    tokens,
  } = usePasswordless();

  var player: PlayerModifySelf;
  if (tokensParsed && tokens) {
    player = {
      given_name: tokensParsed.idToken.given_name,
      family_name: tokensParsed.idToken.family_name,
      email: tokensParsed.idToken.email,
      phone_number: tokensParsed.idToken.phone_number,
      user_id: tokensParsed.idToken.sub,
      groups: tokensParsed.idToken["cognito:groups"],
      accessToken: tokens.accessToken,
    } as PlayerModifySelf;
  }
  const [showManagePlayer, setShowManagePlayer] = useState(false);
  const handleCloseManagePlayer = () => setShowManagePlayer(false);

  // If Login Modal is open and user changes to "signed in", close the modal
  if (signInStatus === "SIGNED_IN" && tokensParsed && showLogin) setShowLogin(false);

  const handleManageCredentials = () => {
    setShowMenu(false);
    toggleShowAuthenticatorManager();
  };

  let expand = "";
  if (authenticated({ signInStatus, tokensParsed, group: ["admin"] })) {
    expand = "md";
  } else if (authenticated({ signInStatus, tokensParsed })) {
    expand = "md";
  }
  const location = useLocation();
  return (
    <>
      {/* <h2>{location.pathname}</h2>
      <h2>{pathMap[location.pathname].title}</h2> */}
      <Navbar
        fixed="top"
        expand={expand ? expand : true}
        onSelect={handleCloseMenu}
        className="bg-body-tertiary mb-3"
        style={{ minHeight: "58px" }}
      >
        {/* collapseOnSelect */}
        <Container fluid>
          <Navbar.Brand href="https://cubesandcardboard.net/">Cubes & Cardboard</Navbar.Brand>
          <Navbar.Toggle className="order-3" aria-controls={`offcanvasNavbar-expand-${expand}`} onClick={toggleMenu} />
          <Navbar.Offcanvas
            id={`offcanvasNavbar-expand-${expand}`}
            aria-labelledby={`offcanvasNavbarLabel-expand-${expand}`}
            placement="end"
            show={showMenu}
            onHide={handleCloseMenu}
            // onShow={handleShowMenu}
          >
            <Offcanvas.Header closeButton>
              <Offcanvas.Title id={`offcanvasNavbarLabel-expand-${expand}`}>Menu</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              {/* <h2 className="d-block d-lg-none">XS to LG</h2>
              <h2 className="d-none d-lg-block">LG+</h2> */}
              <Authenticated group={["admin"]}>
                {/* XL+ */}
                <div className="d-block d-md-none d-lg-block">
                  <Nav className="order-0 navbar-nav-left-side flex-grow-1">
                    <Nav.Link eventKey="/" as={NavLink} to="/" className="navLink">
                      Events
                    </Nav.Link>
                    <Nav.Link eventKey="/players" as={NavLink} to="/players" className="navLink">
                      Players
                    </Nav.Link>
                    <Nav.Link eventKey="/logs" as={NavLink} to="/logs" className="navLink">
                      Logs
                    </Nav.Link>
                    <Nav.Link eventKey="/tbd" as={NavLink} to="/tbd" className="navLink">
                      TBD Gallery
                    </Nav.Link>
                  </Nav>
                </div>
                {/* <div className="d-block d-lg-none"> */}
                <div className="d-none d-md-block d-lg-none">
                  <Nav className="order-0 navbar-nav-left-side flex-grow-1">
                    <NavDropdown
                      title={pathMap[location.pathname as keyof typeof pathMap].title}
                      id="basic-nav-dropdown"
                    >
                      {/* <NavDropdown.Item href="#action/3.1">Action</NavDropdown.Item> */}
                      <NavDropdown.Item as={NavLink} to="/" className="navLink">
                        Events
                      </NavDropdown.Item>
                      <NavDropdown.Item as={NavLink} to="/players" className="navLink">
                        Players
                      </NavDropdown.Item>
                      <NavDropdown.Item as={NavLink} to="/logs" className="navLink">
                        Logs
                      </NavDropdown.Item>
                      <NavDropdown.Item as={NavLink} to="tbd" className="navLink">
                        TBD Gallery
                      </NavDropdown.Item>
                    </NavDropdown>
                  </Nav>
                </div>
              </Authenticated>
              {/* <Nav className="justify-content-end flex-grow-1 pe-3 gap-2 order-1"> */}
              {/* <Nav className="navbar-nav-right-side"> */}
              <Nav className="justify-content-end flex-grow-1">
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
                      !showLogin &&
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
                    {/* <Nav.Link onClick={handleShowLogin} eventKey="Admin">
                      Admin
                    </Nav.Link> */}
                    <Button onClick={handleShowLogin}>Sign In</Button>
                  </>
                ) : (
                  <>
                    {tokensParsed && (
                      <Nav.Link eventKey="Profile" onClick={() => setShowManagePlayer(true)}>
                        Hello, {String(tokensParsed.idToken.given_name)}
                        <Icon className="align-top" path={mdiAccount} size={1} />
                      </Nav.Link>
                    )}
                    <Nav.Link eventKey="SignOut" onClick={signOut}>
                      Sign Out
                    </Nav.Link>
                    <Nav.Link
                      onClick={handleManageCredentials}
                      eventKey="ManageCreds"
                      disabled={showAuthenticatorManager}
                    >
                      Manage Credentials
                    </Nav.Link>
                    {/* <Authenticated group={["admin"]}>
                      <Nav.Link eventKey="TBDGallery" onClick={() => navigate("/tbd")}>
                        TBD Gallery
                      </Nav.Link>
                    </Authenticated> */}
                  </>
                )}
                <NavDropdown
                  style={{ maxWidth: "min-content" }}
                  id="theme-dropdown"
                  title={<Icon path={mdiThemeLightDark} size={1} />}
                  // drop="down"
                  // align={{ sm: "end" }}
                  align="end"
                >
                  <a className="dropdown-item gap-2" onClick={() => setTheme(THEME.LIGHT)}>
                    <Row>
                      <Col style={{ maxWidth: "2rem" }}>
                        <Icon path={mdiWeatherSunny} size={1} />
                      </Col>
                      <Col>Light</Col>
                    </Row>
                  </a>
                  <a className="dropdown-item" onClick={() => setTheme(THEME.DARK)}>
                    <Row>
                      <Col style={{ maxWidth: "2rem" }}>
                        <Icon path={mdiWeatherNight} size={1} />
                      </Col>
                      <Col>Dark</Col>
                    </Row>
                  </a>
                  <a className="dropdown-item" onClick={() => resetTheme()}>
                    <Row>
                      <Col style={{ maxWidth: "2rem" }}>
                        <Icon path={mdiBrightnessAuto} size={1} />
                      </Col>
                      <Col>Auto</Col>
                    </Row>
                  </a>
                </NavDropdown>
              </Nav>
            </Offcanvas.Body>
          </Navbar.Offcanvas>
        </Container>
      </Navbar>

      <Modal show={showLogin} onHide={handleCloseLogin} backdrop="static" keyboard={false}>
        <Modal.Body className="text-center">
          <LoginModal onLogin={() => setShowLogin(false)}></LoginModal>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseLogin}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {tokensParsed && (
        <Modal show={showManagePlayer} onHide={handleCloseManagePlayer} backdrop="static" keyboard={false}>
          <Suspense fallback={<>...</>}>
            <ManagePlayerModal close={handleCloseManagePlayer} task="ModifySelf" player={player!} />
          </Suspense>
        </Modal>
      )}
      <Outlet />
    </>
  );
}

const pathMap = {
  "/": { title: "Events" },
  "/players": { title: "Players" },
  "/logs": { title: "Logs" },
  "/tbd": { title: "TBD Gallery" },
};
