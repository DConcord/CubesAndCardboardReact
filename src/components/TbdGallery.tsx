import { tbd_pics } from "../types/Events";
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";

import { useNavigate } from "react-router-dom";

export default function TbdGallery() {
  const navigate = useNavigate();
  return (
    <div className="margin-top-65">
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
        <Row xs={1} sm={1} md={2} lg={2} xl={3} xxl={4} className="g-4 justify-content-center">
          {tbd_pics.map((tbd_pic, index) => (
            <Col className="d-flex justify-content-center" key={index}>
              <Card style={{ minWidth: "20rem", maxWidth: "35rem", height: "100%" }}>
                <Card.Img variant="top" src={"/" + tbd_pic} />
                <Card.Body>{tbd_pic}</Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </div>
  );
}

{
  /* <Col key={index}>
<Card style={{ minWidth: "20rem", maxWidth: "40rem", height: "100%" }}>
  <Card.Body></Card.Body>
</Card>
</Col>; */
}
