import { Link, useLocation } from "react-router-dom";
import { useKeycloak } from "../auth/KeycloakProvider";

export default function NavBar() {
    const location = useLocation();
    const { userName, logout } = useKeycloak();

    const links = [
        { path: "/analog", label: "Analog Monitoring" },
        { path: "/analog/detail", label: "Analog Detail" },
        { path: "/analog/compare", label: "Compare Analog" }
    ];

    return (
        <header className="navbar-container">
            <nav className="navbar navbar-main">
                <div className="navbar-brand">NE1 SCADA Analog Monitoring</div>

                <div className="navbar-user">
                    <span className="navbar-username">{userName}</span>
                    <button type="button" className="navbar-logout" onClick={logout}>
                        Logout
                    </button>
                </div>
            </nav>

            <nav className="navbar navbar-pages">
                <div className="navbar-links">
                    {links.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={location.pathname === link.path ? "navbar-link active" : "navbar-link"}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            </nav>
        </header>
    );
}
