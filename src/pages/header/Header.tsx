import { Container, Navbar} from "react-bootstrap";
import { useNavigate } from "react-router-dom";


const Header: React.FC = () => {
  const navigate = useNavigate();

  // const handleLogout = () => {
  //   localStorage.removeItem('token');
  //   navigate('/');
  // };

  return (
    <Navbar bg="primary" variant="dark" expand="lg">
      <Container className="header-container">
        {/* <Nav className="hearder">
          <Nav.Link as={NavLink} to="/employee" className="navbar-link">Post User</Nav.Link>
          <Nav.Link as={NavLink} to="/get-employee" className="navbar-link">User List</Nav.Link>
          <Nav.Link as={NavLink} to="/chat" className="navbar-link">Chat</Nav.Link>
          <Button variant="outline-light" size="sm" onClick={handleLogout} className="logout-btn">
            Logout
          </Button>
        </Nav> */}
      </Container>
    </Navbar>
  );
};

export default Header;
