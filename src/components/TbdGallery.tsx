import { tbd_pics } from "./EventManagement";
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";

import { useNavigate } from "react-router-dom";

export default function TbdGallery() {
  const navigate = useNavigate();
  return (
    <>
      <Container fluid>
        <Row>
          <Col>
            <h2>TBD Image Gallery</h2>
          </Col>
          <Col style={{ textAlign: "right" }}>
            <Button size="sm" variant="secondary" onClick={() => navigate("/")}>
              Close Gallery
            </Button>
          </Col>
        </Row>
      </Container>

      <Container fluid>
        <Row xs={1} sm={2} md={2} lg={3} xl={4} xxl={4} className="g-4 justify-content-center">
          {tbd_pics.map((tbd_pic, index) => (
            <Col key={index}>
              <Card style={{ minWidth: "20rem", maxWidth: "40rem", height: "100%" }}>
                <Card.Img variant="top" src={"/" + tbd_pic} />
                <Card.Body>{tbd_pic}</Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </>
  );
}

{
  /* <Col key={index}>
<Card style={{ minWidth: "20rem", maxWidth: "40rem", height: "100%" }}>
  <Card.Body></Card.Body>
</Card>
</Col>; */
}
